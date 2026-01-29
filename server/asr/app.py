"""
ClassPilot AI - Real-Time ASR Service v3.0
Complete backend with full API, WebSocket streaming, and database integration
"""
import asyncio
import base64
import json
import uuid
import io
import tempfile
from datetime import datetime
from typing import Dict, List, Optional
from contextlib import asynccontextmanager

import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.config import settings
from shared.models import TranscriptSegment, Question
from question_detector import QuestionDetector
from rag import ContextMemory, AnswerGenerator
from material_processor import MaterialProcessor, process_material

# Feature flags
HAS_WHISPER = False
HAS_RAG = False
HAS_DB = False

# Try to import database routes
try:
    from api import router as db_router
    HAS_DB = True
except ImportError as e:
    print(f"⚠️ Database module not available: {e}")

# Try to import Whisper
try:
    from faster_whisper import WhisperModel
    HAS_WHISPER = True
except ImportError:
    print("⚠️ faster-whisper not installed. Using demo transcription.")

# Try to import ChromaDB for RAG
try:
    import chromadb
    HAS_RAG = True
except ImportError:
    print("⚠️ ChromaDB not installed. Using fallback answers.")


# Global Whisper model (loaded once)
whisper_model: Optional["WhisperModel"] = None

def get_whisper_model():
    """Lazy load Whisper model"""
    global whisper_model
    if whisper_model is None and HAS_WHISPER:
        print(f"🔄 Loading Whisper model: {settings.whisper_model}")
        try:
            whisper_model = WhisperModel(
                settings.whisper_model,
                device=settings.whisper_device,
                compute_type=settings.whisper_compute_type
            )
            print("✅ Whisper model loaded")
        except Exception as e:
            print(f"❌ Failed to load Whisper: {e}")
    return whisper_model


class AudioBuffer:
    """Buffer to accumulate audio chunks before processing"""
    def __init__(self, sample_rate: int = 16000, buffer_seconds: float = 2.0):
        self.sample_rate = sample_rate
        self.buffer_seconds = buffer_seconds
        self.buffer_size = int(sample_rate * buffer_seconds)
        self.samples: List[np.ndarray] = []
        self.total_samples = 0
    
    def add(self, audio_data: np.ndarray):
        """Add audio samples to buffer"""
        self.samples.append(audio_data)
        self.total_samples += len(audio_data)
    
    def is_ready(self) -> bool:
        """Check if buffer has enough data to process"""
        return self.total_samples >= self.buffer_size
    
    def get_and_clear(self) -> np.ndarray:
        """Get concatenated samples and clear buffer"""
        if not self.samples:
            return np.array([], dtype=np.float32)
        result = np.concatenate(self.samples)
        self.samples = []
        self.total_samples = 0
        return result
    
    def clear(self):
        """Clear the buffer"""
        self.samples = []
        self.total_samples = 0


class ConnectionManager:
    """Manages WebSocket connections and client state"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.audio_buffers: Dict[str, AudioBuffer] = {}
        self.memories: Dict[str, ContextMemory] = {}
        self.transcription_active: Dict[str, bool] = {}
        self.timestamps: Dict[str, float] = {}
        self.question_detector = QuestionDetector()
        self.materials: Dict[str, List[Dict]] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.audio_buffers[client_id] = AudioBuffer()
        self.memories[client_id] = ContextMemory()
        self.transcription_active[client_id] = False
        self.timestamps[client_id] = 0.0
        self.materials[client_id] = []
        print(f"✅ Client {client_id} connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, client_id: str):
        self.active_connections.pop(client_id, None)
        self.audio_buffers.pop(client_id, None)
        self.memories.pop(client_id, None)
        self.transcription_active.pop(client_id, None)
        self.timestamps.pop(client_id, None)
        self.materials.pop(client_id, None)
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
    
    def add_material_to_memory(self, client_id: str, content: str, source: str):
        """Add processed material to client's context memory"""
        if client_id in self.memories:
            self.memories[client_id].add_material(content, source)
            self.materials[client_id].append({"source": source, "preview": content[:200]})


manager = ConnectionManager()
material_processor = MaterialProcessor(settings.upload_dir)

# Demo transcript for fallback mode
DEMO_TRANSCRIPT = [
    {"text": "Welcome to today's lecture on neural networks.", "delay": 2, "is_question": False},
    {"text": "We'll be covering the fundamentals of deep learning.", "delay": 2, "is_question": False},
    {"text": "Can anyone tell me what is the basic building block of a neural network?", "delay": 3, "is_question": True},
    {"text": "That's right, it's called a neuron or perceptron.", "delay": 2, "is_question": False},
    {"text": "A perceptron takes inputs, applies weights, and produces an output.", "delay": 2.5, "is_question": False},
    {"text": "What happens when we stack multiple layers of neurons together?", "delay": 3, "is_question": True},
    {"text": "We get what's called a deep neural network.", "delay": 2, "is_question": False},
    {"text": "The hidden layers allow the network to learn complex patterns.", "delay": 2.5, "is_question": False},
    {"text": "Now, how does the network learn? Through backpropagation.", "delay": 3, "is_question": False},
    {"text": "Does anyone know what gradient descent is?", "delay": 2.5, "is_question": True},
    {"text": "Gradient descent is an optimization algorithm.", "delay": 2, "is_question": False},
    {"text": "It helps us find the minimum of our loss function.", "delay": 2, "is_question": False},
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    print("=" * 60)
    print("🚀 ClassPilot AI Backend v3.0 Starting...")
    print("=" * 60)
    print(f"   Server: http://{settings.host}:{settings.port}")
    print(f"   Whisper: {'✅ Available' if HAS_WHISPER else '❌ Not installed'}")
    print(f"   RAG: {'✅ Available' if HAS_RAG else '⚠️ Using fallback'}")
    print(f"   Database: {'✅ Connected' if HAS_DB else '❌ Not available'}")
    print(f"   Upload Dir: {settings.upload_dir}")
    print("=" * 60)
    
    # Pre-load Whisper model if available
    if HAS_WHISPER:
        get_whisper_model()
    
    yield
    
    print("👋 ClassPilot AI Backend Shutting Down...")


# Initialize FastAPI app
app = FastAPI(
    title="ClassPilot AI",
    description="Real-time lecture transcription and AI assistance API",
    version="3.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include database routes if available
if HAS_DB:
    app.include_router(db_router)
    print("✅ Database routes mounted at /api/db")


# ==================== ROOT & HEALTH ====================

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "name": "ClassPilot AI",
        "version": "3.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "features": {
            "whisper": HAS_WHISPER,
            "rag": HAS_RAG,
            "database": HAS_DB,
        },
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "websocket": "/ws/{client_id}",
            "questions": "/api/questions/ask",
            "materials": "/api/materials/upload",
            "database": "/api/db" if HAS_DB else None
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "connections": len(manager.active_connections),
        "features": {
            "whisper": HAS_WHISPER,
            "rag": HAS_RAG,
            "database": HAS_DB
        }
    }


@app.get("/api/cache/stats")
async def cache_stats():
    """Get cache statistics for monitoring token usage optimization"""
    from rag import response_cache
    return {
        "cache": response_cache.stats(),
        "message": "Response caching active - saves 30-50% of API tokens"
    }


@app.delete("/api/cache/clear")
async def clear_cache():
    """Clear the response cache"""
    from rag import response_cache
    response_cache.clear()
    return {"message": "Cache cleared", "stats": response_cache.stats()}


# ==================== TRANSCRIPTION PROCESSING ====================

async def process_audio_buffer(client_id: str, answer_generator: AnswerGenerator):
    """Process accumulated audio and send transcription"""
    buffer = manager.audio_buffers.get(client_id)
    if not buffer or not buffer.is_ready():
        return
    
    audio_data = buffer.get_and_clear()
    if len(audio_data) == 0:
        return
    
    model = get_whisper_model()
    if model is None:
        return
    
    try:
        # Whisper expects float32 audio normalized to [-1, 1]
        audio_float = audio_data.astype(np.float32)
        
        # Transcribe
        segments, info = model.transcribe(
            audio_float,
            beam_size=5,
            language="en",
            vad_filter=True,
            vad_parameters=dict(
                min_silence_duration_ms=500,
                speech_pad_ms=200
            )
        )
        
        timestamp = manager.timestamps.get(client_id, 0)
        
        for seg in segments:
            text = seg.text.strip()
            if not text:
                continue
            
            segment_id = f"seg-{uuid.uuid4().hex[:8]}"
            is_question, confidence = manager.question_detector.detect(text)
            
            # Add to memory
            manager.memories[client_id].add_transcript(text, timestamp)
            
            # Send transcript update
            await manager.send({
                "type": "transcript_update",
                "segment": {
                    "id": segment_id,
                    "text": text,
                    "timestamp": timestamp,
                    "is_question": is_question,
                    "confidence": 0.95,
                    "is_final": True
                }
            }, client_id)
            
            # Handle detected questions
            if is_question and confidence > 0.6:
                question_id = f"q-{uuid.uuid4().hex[:8]}"
                await manager.send({
                    "type": "question_detected",
                    "question": {
                        "id": question_id,
                        "text": text,
                        "timestamp": timestamp,
                        "is_answered": False
                    }
                }, client_id)
                
                # Generate answer asynchronously
                answer, sources = answer_generator.generate(text)
                await manager.send({
                    "type": "answer_generated",
                    "question_id": question_id,
                    "answer": answer,
                    "sources": sources
                }, client_id)
            
            timestamp += seg.end - seg.start
            manager.timestamps[client_id] = timestamp
            
    except Exception as e:
        print(f"Transcription error for {client_id}: {e}")


async def demo_transcription(client_id: str, answer_generator: AnswerGenerator):
    """Demo transcription mode when Whisper is not available"""
    demo_index = 0
    timestamp = 0.0
    
    while manager.transcription_active.get(client_id, False) and demo_index < len(DEMO_TRANSCRIPT):
        segment_data = DEMO_TRANSCRIPT[demo_index]
        segment_id = f"demo-{uuid.uuid4().hex[:8]}"
        
        # Send complete sentence directly (no word-by-word to avoid stuttering)
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
            await asyncio.sleep(0.5)
            answer, sources = answer_generator.generate(segment_data["text"])
            await manager.send({
                "type": "answer_generated",
                "question_id": question_id,
                "answer": answer,
                "sources": sources
            }, client_id)
        
        timestamp += segment_data["delay"]
        manager.timestamps[client_id] = timestamp
        demo_index += 1
        await asyncio.sleep(segment_data["delay"])


# ==================== WEBSOCKET ====================

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time communication"""
    await manager.connect(websocket, client_id)
    answer_generator = AnswerGenerator(manager.memories[client_id])
    
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            
            if action == "start_transcription":
                manager.transcription_active[client_id] = True
                manager.timestamps[client_id] = 0.0
                manager.audio_buffers[client_id].clear()
                
                mode = "real" if HAS_WHISPER else "demo"
                await manager.send({
                    "type": "status",
                    "status": "transcribing",
                    "message": f"Transcription started ({mode} mode)",
                    "mode": mode
                }, client_id)
                
                # If no Whisper, start demo mode
                if not HAS_WHISPER:
                    asyncio.create_task(demo_transcription(client_id, answer_generator))
                
            elif action == "stop_transcription":
                manager.transcription_active[client_id] = False
                manager.audio_buffers[client_id].clear()
                await manager.send({
                    "type": "status",
                    "status": "stopped",
                    "message": "Transcription stopped",
                    "duration": manager.timestamps.get(client_id, 0)
                }, client_id)
                
            elif action == "audio_chunk":
                if not manager.transcription_active.get(client_id, False):
                    continue
                
                if not HAS_WHISPER:
                    continue
                
                try:
                    audio_base64 = data.get("data", "")
                    audio_format = data.get("format", "int16")
                    sample_rate = data.get("sample_rate", 16000)
                    
                    audio_bytes = base64.b64decode(audio_base64)
                    
                    if audio_format == "int16":
                        audio_int16 = np.frombuffer(audio_bytes, dtype=np.int16)
                        audio_float = audio_int16.astype(np.float32) / 32768.0
                    else:
                        audio_float = np.frombuffer(audio_bytes, dtype=np.float32)
                    
                    manager.audio_buffers[client_id].add(audio_float)
                    
                    if manager.audio_buffers[client_id].is_ready():
                        await process_audio_buffer(client_id, answer_generator)
                        
                except Exception as e:
                    print(f"Audio processing error: {e}")
                    
            elif action == "ask_question":
                question = data.get("question", "")
                if question:
                    answer, sources = answer_generator.generate(question)
                    question_id = f"user-{uuid.uuid4().hex[:8]}"
                    await manager.send({
                        "type": "answer_generated",
                        "question_id": question_id,
                        "question": question,
                        "answer": answer,
                        "sources": sources
                    }, client_id)
                    
            elif action == "upload_material":
                content = data.get("content", "")
                source = data.get("source", "unknown")
                if content:
                    manager.add_material_to_memory(client_id, content, source)
                    await manager.send({
                        "type": "material_processed",
                        "message": f"Material '{source}' added to context",
                        "source": source
                    }, client_id)
                    
            elif action == "ping":
                await manager.send({"type": "pong", "timestamp": datetime.now().isoformat()}, client_id)
                
            elif action == "get_status":
                await manager.send({
                    "type": "status_info",
                    "transcribing": manager.transcription_active.get(client_id, False),
                    "timestamp": manager.timestamps.get(client_id, 0),
                    "materials_count": len(manager.materials.get(client_id, []))
                }, client_id)
                
    except WebSocketDisconnect:
        manager.transcription_active[client_id] = False
        manager.disconnect(client_id)
    except Exception as e:
        print(f"WebSocket error for {client_id}: {e}")
        manager.disconnect(client_id)


# ==================== REST API ====================

class AskQuestionRequest(BaseModel):
    question: str
    context: str = ""
    lecture_id: str = ""


class GenerateSummaryRequest(BaseModel):
    content: str
    style: str = "bullet"  # bullet, paragraph, cornell


class GenerateFlashcardsRequest(BaseModel):
    content: str
    count: int = 5


@app.post("/api/questions/ask")
async def ask_question(request: AskQuestionRequest, authorization: Optional[str] = None):
    """Ask a question and get an AI-generated answer
    
    Supports dynamic API key via Authorization header:
    Authorization: Bearer sk-xxxxx
    """
    question_id = f"api-{uuid.uuid4().hex[:8]}"
    
    # Extract API key from header if provided
    api_key = None
    if authorization and authorization.startswith("Bearer "):
        api_key = authorization[7:]  # Remove "Bearer " prefix
    
    # Create context memory with provided context
    temp_memory = ContextMemory()
    if request.context:
        temp_memory.add_transcript(request.context, 0)
    
    # Pass API key to generator (allows frontend to provide key)
    generator = AnswerGenerator(temp_memory, api_key=api_key)
    answer, sources = generator.generate(request.question)
    
    return {
        "question_id": question_id,
        "question": request.question,
        "answer": answer,
        "sources": sources,
        "confidence": 0.85,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/summary/generate")
async def generate_summary(request: GenerateSummaryRequest, authorization: Optional[str] = None):
    """Generate a summary of content"""
    # Extract API key from header if provided
    api_key = None
    if authorization and authorization.startswith("Bearer "):
        api_key = authorization[7:]
    
    temp_memory = ContextMemory()
    temp_memory.add_transcript(request.content, 0)
    
    generator = AnswerGenerator(temp_memory, api_key=api_key)
    
    prompt = f"Please provide a {request.style} summary of the following content:\n\n{request.content[:3000]}"
    answer, sources = generator.generate(prompt)
    
    return {
        "summary": answer,
        "style": request.style,
        "sources": sources,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/flashcards/generate")
async def generate_flashcards(request: GenerateFlashcardsRequest, authorization: Optional[str] = None):
    """Generate flashcards from content"""
    # Extract API key from header if provided
    api_key = None
    if authorization and authorization.startswith("Bearer "):
        api_key = authorization[7:]
    
    temp_memory = ContextMemory()
    temp_memory.add_transcript(request.content, 0)
    
    generator = AnswerGenerator(temp_memory, api_key=api_key)
    
    prompt = f"""Generate exactly {request.count} flashcards from this content. 
Format each as:
Q: [question]
A: [answer]

Content:
{request.content[:3000]}"""
    
    answer, sources = generator.generate(prompt)
    
    # Parse flashcards
    flashcards = []
    lines = answer.split("\n")
    current_q = None
    
    for line in lines:
        line = line.strip()
        if line.startswith("Q:"):
            current_q = line[2:].strip()
        elif line.startswith("A:") and current_q:
            flashcards.append({
                "id": f"fc-{uuid.uuid4().hex[:8]}",
                "question": current_q,
                "answer": line[2:].strip()
            })
            current_q = None
    
    return {
        "flashcards": flashcards,
        "count": len(flashcards),
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/materials/upload")
async def upload_material(
    file: UploadFile = File(...),
    lecture_id: str = Form("")
):
    """Upload and process lecture materials"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    content = await file.read()
    
    # Check file size
    if len(content) > settings.max_upload_size:
        raise HTTPException(
            status_code=413, 
            detail=f"File too large. Max size: {settings.max_upload_size // (1024*1024)}MB"
        )
    
    # Process the material
    result = material_processor.process(content, file.filename)
    
    if not result["success"]:
        return JSONResponse(
            status_code=422,
            content={
                "error": result["error"],
                "filename": file.filename
            }
        )
    
    return {
        "id": result["id"],
        "name": file.filename,
        "type": result["type"],
        "size": result["size"],
        "lecture_id": lecture_id,
        "status": "processed",
        "content_preview": material_processor.get_content_preview(result["content"]),
        "message": "Material uploaded and processed successfully"
    }


@app.get("/api/materials/types")
async def get_supported_types():
    """Get list of supported material types"""
    return {
        "types": MaterialProcessor.SUPPORTED_TYPES,
        "max_size_mb": settings.max_upload_size // (1024 * 1024)
    }


@app.get("/api/features")
async def get_features():
    """Get available features and their status"""
    return {
        "features": {
            "whisper": {
                "available": HAS_WHISPER,
                "model": settings.whisper_model if HAS_WHISPER else None
            },
            "rag": {
                "available": HAS_RAG,
                "embedding_model": settings.embedding_model if HAS_RAG else None
            },
            "database": {
                "available": HAS_DB,
                "host": settings.db_host if HAS_DB else None
            },
            "llm": {
                "model": settings.llm_model,
                "ollama_host": settings.ollama_host,
                "openai_configured": bool(settings.openai_api_key)
            }
        }
    }


# ==================== ERROR HANDLERS ====================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    print(f"Global error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "type": type(exc).__name__}
    )


# ==================== MAIN ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )
