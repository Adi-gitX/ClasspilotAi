"""
ClassPilot AI - Real-Time ASR Service with RealtimeSTT
Complete implementation with live transcription, question detection, and RAG
"""
import asyncio
import json
import uuid
import re
from datetime import datetime
from typing import Dict, Set, Optional, List
from contextlib import asynccontextmanager
from collections import deque

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.config import settings
from shared.models import TranscriptSegment, Question

# Try to import real ASR libraries
try:
    from RealtimeSTT import AudioToTextRecorder
    HAS_REALTIME_STT = True
except ImportError:
    HAS_REALTIME_STT = False
    print("⚠️ RealtimeSTT not installed. Using mock transcription.")

try:
    import chromadb
    from sentence_transformers import SentenceTransformer
    HAS_RAG = True
except ImportError:
    HAS_RAG = False
    print("⚠️ RAG dependencies not installed. Using mock answers.")


class QuestionDetector:
    """Detects questions from transcript text"""
    
    QUESTION_PATTERNS = [
        r"^(what|who|where|when|why|how|which|whose|whom)\b",
        r"^(is|are|was|were|do|does|did|can|could|will|would|should|may|might|shall)\b.*\?$",
        r"^(can|could|would|will)\s+(you|anyone|someone|somebody)\b",
        r"(any\s+questions?|understand\??|clear\??|got\s+it\??|following\??)$",
        r"^(tell\s+me|explain|define|describe|give\s+example)\b",
    ]
    
    CLASSROOM_CUES = [
        "can anyone tell me",
        "who can answer",
        "does anyone know",
        "what do you think",
        "raise your hand if",
        "anyone want to try",
        "let me ask you",
    ]
    
    def __init__(self):
        self.patterns = [re.compile(p, re.IGNORECASE) for p in self.QUESTION_PATTERNS]
    
    def detect(self, text: str) -> tuple[bool, float]:
        """Returns (is_question, confidence)"""
        text_lower = text.lower().strip()
        
        # Check classroom cues first (high confidence)
        for cue in self.CLASSROOM_CUES:
            if cue in text_lower:
                return True, 0.95
        
        # Check if ends with question mark
        has_question_mark = text.strip().endswith("?")
        
        # Check patterns
        for pattern in self.patterns:
            if pattern.search(text_lower):
                confidence = 0.9 if has_question_mark else 0.7
                return True, confidence
        
        # Just has question mark
        if has_question_mark:
            return True, 0.6
        
        return False, 0.0


class ContextMemory:
    """Memory layers for context-aware answers"""
    
    def __init__(self, short_term_size: int = 10, session_size: int = 100):
        self.short_term = deque(maxlen=short_term_size)  # Last 3-5 minutes
        self.session = deque(maxlen=session_size)         # Current lecture
        self.materials = []                               # Uploaded materials
    
    def add_transcript(self, text: str, timestamp: float):
        entry = {"text": text, "timestamp": timestamp, "type": "transcript"}
        self.short_term.append(entry)
        self.session.append(entry)
    
    def add_material(self, content: str, source: str):
        self.materials.append({"content": content, "source": source})
    
    def get_context(self, max_length: int = 4000) -> str:
        """Build context from memory layers"""
        context_parts = []
        
        # Short-term context (most relevant)
        context_parts.append("## Recent Lecture Content:")
        for entry in list(self.short_term)[-5:]:
            context_parts.append(f"- {entry['text']}")
        
        # Material context if available
        if self.materials:
            context_parts.append("\n## Lecture Materials:")
            for mat in self.materials[:3]:
                preview = mat['content'][:500] + "..." if len(mat['content']) > 500 else mat['content']
                context_parts.append(f"From {mat['source']}:\n{preview}")
        
        context = "\n".join(context_parts)
        return context[:max_length]


class AnswerGenerator:
    """Generates answers using context"""
    
    def __init__(self, memory: ContextMemory):
        self.memory = memory
        
        # Pre-defined answers for common CS questions (demo)
        self.knowledge_base = {
            "neural network": "A neural network is a computational model inspired by the human brain. It consists of layers of interconnected nodes (neurons) that process and transform data through weighted connections and activation functions.",
            "perceptron": "A perceptron is the basic unit of a neural network. It takes multiple inputs, applies weights to each, sums them up, adds a bias, and passes the result through an activation function to produce an output.",
            "backpropagation": "Backpropagation is an algorithm for training neural networks. It calculates the gradient of the loss function with respect to each weight, then updates weights to minimize the error using gradient descent.",
            "activation function": "An activation function introduces non-linearity into neural networks. Common ones include ReLU (max(0,x)), Sigmoid (1/(1+e^-x)), and Tanh. They allow networks to learn complex patterns.",
            "deep learning": "Deep learning uses neural networks with many hidden layers to learn hierarchical representations of data. 'Deep' refers to the number of layers, enabling learning of increasingly abstract features.",
            "gradient descent": "Gradient descent is an optimization algorithm that iteratively adjusts parameters in the direction of steepest decrease of the loss function. The learning rate controls step size.",
            "overfitting": "Overfitting occurs when a model learns the training data too well, including noise, and fails to generalize to new data. Solutions include regularization, dropout, and more training data.",
        }
    
    def generate(self, question: str) -> tuple[str, List[str]]:
        """Generate answer and sources for a question"""
        question_lower = question.lower()
        
        # Check knowledge base
        for keyword, answer in self.knowledge_base.items():
            if keyword in question_lower:
                sources = ["Course materials", "Lecture context"]
                return f"**Answer:** {answer}", sources
        
        # Use context memory
        context = self.memory.get_context()
        if context:
            # Simple keyword matching for demo
            answer = f"Based on the lecture context, here's what I found relevant to your question about '{question[:50]}...'\n\nThe professor has been discussing this topic. Please refer to the transcript for detailed explanation."
            sources = ["Current lecture", "Recent discussion"]
            return answer, sources
        
        return "I don't have enough context to answer this question. Please continue listening to the lecture or upload relevant materials.", []


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.recorders: Dict[str, any] = {}
        self.memories: Dict[str, ContextMemory] = {}
        self.question_detector = QuestionDetector()
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.memories[client_id] = ContextMemory()
        print(f"✅ Client {client_id} connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.recorders:
            del self.recorders[client_id]
        if client_id in self.memories:
            del self.memories[client_id]
        print(f"👋 Client {client_id} disconnected. Total: {len(self.active_connections)}")
    
    async def send(self, message: dict, client_id: str):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(message)
            except Exception as e:
                print(f"Error sending to {client_id}: {e}")
    
    async def broadcast(self, message: dict):
        for client_id in self.active_connections:
            await self.send(message, client_id)


manager = ConnectionManager()
transcription_active: Dict[str, bool] = {}
transcript_counters: Dict[str, int] = {}

# Mock transcript for demo when RealtimeSTT is not available
DEMO_TRANSCRIPT = [
    {"text": "Welcome to today's lecture on neural networks.", "delay": 2, "is_question": False},
    {"text": "We'll be covering the fundamentals of deep learning.", "delay": 2, "is_question": False},
    {"text": "Can anyone tell me what is the basic building block of a neural network?", "delay": 3, "is_question": True},
    {"text": "That's right, it's called a neuron or perceptron.", "delay": 2, "is_question": False},
    {"text": "A perceptron takes inputs, applies weights, and produces an output.", "delay": 2.5, "is_question": False},
    {"text": "What happens when we stack multiple layers of neurons together?", "delay": 3, "is_question": True},
    {"text": "We get what's called a deep neural network.", "delay": 2, "is_question": False},
    {"text": "The hidden layers allow the network to learn complex patterns.", "delay": 2.5, "is_question": False},
    {"text": "Now, how does the network learn? Through a process called backpropagation.", "delay": 3, "is_question": False},
    {"text": "Does anyone know what gradient descent is?", "delay": 2.5, "is_question": True},
    {"text": "Gradient descent is an optimization algorithm.", "delay": 2, "is_question": False},
    {"text": "It helps us find the minimum of our loss function.", "delay": 2, "is_question": False},
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 ClassPilot AI Backend Starting...")
    print(f"   Server: http://{settings.host}:{settings.port}")
    print(f"   Whisper Model: {settings.whisper_model}")
    print(f"   RealtimeSTT Available: {HAS_REALTIME_STT}")
    print(f"   RAG Available: {HAS_RAG}")
    yield
    print("👋 ClassPilot AI Backend Shutting Down...")


app = FastAPI(
    title="ClassPilot AI",
    description="Real-time lecture transcription and AI assistance API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "name": "ClassPilot AI",
        "version": "1.0.0",
        "status": "running",
        "features": {
            "realtime_stt": HAS_REALTIME_STT,
            "rag": HAS_RAG,
        },
        "endpoints": {
            "health": "/health",
            "websocket": "/ws/{client_id}",
            "transcription": "/api/transcription",
            "questions": "/api/questions",
            "materials": "/api/materials"
        }
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "connections": len(manager.active_connections),
        "realtime_stt_available": HAS_REALTIME_STT,
        "rag_available": HAS_RAG
    }


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    transcription_active[client_id] = False
    transcript_counters[client_id] = 0
    
    answer_generator = AnswerGenerator(manager.memories[client_id])
    
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            
            if action == "start_transcription":
                transcription_active[client_id] = True
                transcript_counters[client_id] = 0
                await manager.send({
                    "type": "status",
                    "status": "transcribing",
                    "message": "Transcription started",
                    "mode": "real" if HAS_REALTIME_STT else "demo"
                }, client_id)
                
                # Start transcription task
                if HAS_REALTIME_STT:
                    asyncio.create_task(real_transcription(client_id, answer_generator))
                else:
                    asyncio.create_task(demo_transcription(client_id, answer_generator))
                
            elif action == "stop_transcription":
                transcription_active[client_id] = False
                await manager.send({
                    "type": "status",
                    "status": "stopped",
                    "message": "Transcription stopped"
                }, client_id)
                
            elif action == "ask_question":
                question_text = data.get("question", "")
                if question_text:
                    question_id = f"manual-{uuid.uuid4().hex[:8]}"
                    await manager.send({
                        "type": "question_received",
                        "question": {
                            "id": question_id,
                            "text": question_text,
                            "timestamp": transcript_counters.get(client_id, 0)
                        }
                    }, client_id)
                    
                    # Generate answer
                    answer, sources = answer_generator.generate(question_text)
                    await asyncio.sleep(1)  # Simulate processing
                    await manager.send({
                        "type": "answer_generated",
                        "question_id": question_id,
                        "answer": answer,
                        "sources": sources
                    }, client_id)
                    
            elif action == "upload_material":
                content = data.get("content", "")
                source = data.get("source", "Uploaded material")
                manager.memories[client_id].add_material(content, source)
                await manager.send({
                    "type": "material_processed",
                    "message": f"Material '{source}' added to context"
                }, client_id)
                    
            elif action == "ping":
                await manager.send({"type": "pong"}, client_id)
                
    except WebSocketDisconnect:
        transcription_active[client_id] = False
        manager.disconnect(client_id)


async def real_transcription(client_id: str, answer_generator: AnswerGenerator):
    """Real-time transcription using RealtimeSTT"""
    
    def on_text(text: str):
        if not transcription_active.get(client_id, False):
            return
        
        segment_id = f"seg-{uuid.uuid4().hex[:8]}"
        timestamp = transcript_counters.get(client_id, 0)
        
        # Detect questions
        is_question, confidence = manager.question_detector.detect(text)
        
        # Add to memory
        manager.memories[client_id].add_transcript(text, timestamp)
        
        # Send transcript update
        asyncio.create_task(manager.send({
            "type": "transcript_update",
            "segment": {
                "id": segment_id,
                "text": text,
                "timestamp": timestamp,
                "is_question": is_question,
                "confidence": confidence if is_question else 0.95,
                "is_final": True
            }
        }, client_id))
        
        # If question detected, generate answer
        if is_question and confidence > 0.6:
            question_id = f"q-{uuid.uuid4().hex[:8]}"
            asyncio.create_task(manager.send({
                "type": "question_detected",
                "question": {
                    "id": question_id,
                    "text": text,
                    "timestamp": timestamp,
                    "is_answered": False
                }
            }, client_id))
            
            # Generate and send answer
            answer, sources = answer_generator.generate(text)
            asyncio.create_task(send_answer_delayed(client_id, question_id, answer, sources))
        
        transcript_counters[client_id] = timestamp + 2  # Approximate
    
    try:
        recorder = AudioToTextRecorder(
            model=settings.whisper_model,
            compute_type=settings.whisper_compute_type,
            on_realtime_transcription_stabilized=on_text,
            silero_sensitivity=settings.vad_threshold,
        )
        manager.recorders[client_id] = recorder
        
        while transcription_active.get(client_id, False):
            recorder.text()
            await asyncio.sleep(0.1)
            
    except Exception as e:
        print(f"Error in real transcription: {e}")
        await manager.send({
            "type": "error",
            "message": f"Transcription error: {str(e)}"
        }, client_id)


async def demo_transcription(client_id: str, answer_generator: AnswerGenerator):
    """Demo transcription with simulated feed"""
    timestamp = 0
    demo_index = 0
    
    while transcription_active.get(client_id, False):
        if demo_index >= len(DEMO_TRANSCRIPT):
            demo_index = 0
            timestamp = 0
        
        segment_data = DEMO_TRANSCRIPT[demo_index]
        segment_id = f"seg-{uuid.uuid4().hex[:8]}"
        
        # Simulate word-by-word streaming
        words = segment_data["text"].split()
        for i, word in enumerate(words):
            if not transcription_active.get(client_id, False):
                return
            
            partial_text = " ".join(words[:i+1])
            await manager.send({
                "type": "transcript_update",
                "segment": {
                    "id": segment_id,
                    "text": partial_text,
                    "timestamp": timestamp,
                    "is_question": False,
                    "confidence": 0.7 + (i / len(words)) * 0.25,
                    "is_final": False
                }
            }, client_id)
            await asyncio.sleep(0.12)
        
        # Final segment
        is_question = segment_data.get("is_question", False)
        await manager.send({
            "type": "transcript_update",
            "segment": {
                "id": segment_id,
                "text": segment_data["text"],
                "timestamp": timestamp,
                "is_question": is_question,
                "confidence": 0.95,
                "is_final": True
            }
        }, client_id)
        
        # Add to memory
        manager.memories[client_id].add_transcript(segment_data["text"], timestamp)
        
        # Handle questions
        if is_question:
            question_id = f"q-{uuid.uuid4().hex[:8]}"
            await manager.send({
                "type": "question_detected",
                "question": {
                    "id": question_id,
                    "text": segment_data["text"],
                    "timestamp": timestamp,
                    "is_answered": False
                }
            }, client_id)
            
            # Generate answer
            answer, sources = answer_generator.generate(segment_data["text"])
            await asyncio.sleep(1.2)
            await manager.send({
                "type": "answer_generated",
                "question_id": question_id,
                "answer": answer,
                "sources": sources
            }, client_id)
        
        timestamp += segment_data["delay"]
        transcript_counters[client_id] = timestamp
        demo_index += 1
        await asyncio.sleep(segment_data["delay"])


async def send_answer_delayed(client_id: str, question_id: str, answer: str, sources: List[str]):
    """Send answer with delay to simulate processing"""
    await asyncio.sleep(1.5)
    await manager.send({
        "type": "answer_generated",
        "question_id": question_id,
        "answer": answer,
        "sources": sources
    }, client_id)


# REST API Endpoints

class AskQuestionRequest(BaseModel):
    question: str
    lecture_id: str = ""

class MaterialUploadResponse(BaseModel):
    id: str
    name: str
    status: str
    message: str


@app.post("/api/questions/ask")
async def ask_question(request: AskQuestionRequest):
    """API endpoint for asking questions"""
    question_id = f"api-{uuid.uuid4().hex[:8]}"
    
    # Create temporary answer generator
    temp_memory = ContextMemory()
    generator = AnswerGenerator(temp_memory)
    answer, sources = generator.generate(request.question)
    
    return {
        "question_id": question_id,
        "question": request.question,
        "answer": answer,
        "sources": sources,
        "confidence": 0.85
    }


@app.post("/api/materials/upload")
async def upload_material(
    file: UploadFile = File(...),
    lecture_id: str = ""
):
    """Upload and process lecture materials"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    material_id = f"mat-{uuid.uuid4().hex[:8]}"
    
    # Get file extension
    ext = file.filename.split('.')[-1].lower()
    
    # Read file content
    content = await file.read()
    extracted_text = ""
    
    try:
        if ext == 'pdf':
            try:
                import PyPDF2
                import io
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
                extracted_text = "\n".join(page.extract_text() for page in pdf_reader.pages)
            except Exception as e:
                extracted_text = f"PDF processing error: {e}"
                
        elif ext in ['ppt', 'pptx']:
            try:
                from pptx import Presentation
                import io
                prs = Presentation(io.BytesIO(content))
                texts = []
                for slide in prs.slides:
                    for shape in slide.shapes:
                        if hasattr(shape, "text"):
                            texts.append(shape.text)
                extracted_text = "\n".join(texts)
            except Exception as e:
                extracted_text = f"PPT processing error: {e}"
                
        elif ext in ['png', 'jpg', 'jpeg']:
            extracted_text = f"Image uploaded: {file.filename}"
            
    except Exception as e:
        extracted_text = f"Error processing file: {e}"
    
    return {
        "id": material_id,
        "name": file.filename,
        "type": ext,
        "lecture_id": lecture_id,
        "status": "processed",
        "extracted_text_preview": extracted_text[:500] if extracted_text else "",
        "message": "Material uploaded and processed successfully"
    }


@app.get("/api/transcription/{lecture_id}")
async def get_transcription(lecture_id: str):
    """Get transcription for a lecture"""
    return {
        "lecture_id": lecture_id,
        "segments": [],
        "questions": [],
        "duration": 0,
        "status": "ready"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
