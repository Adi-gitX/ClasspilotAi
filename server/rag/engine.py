import os
from collections import deque
from typing import List, Tuple

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False


class ContextMemory:
    def __init__(self, short_term_size: int = 10, session_size: int = 100):
        self.short_term = deque(maxlen=short_term_size)
        self.session = deque(maxlen=session_size)
        self.materials = []
    
    def add_transcript(self, text: str, timestamp: float):
        entry = {"text": text, "timestamp": timestamp, "type": "transcript"}
        self.short_term.append(entry)
        self.session.append(entry)
    
    def add_material(self, content: str, source: str):
        self.materials.append({"content": content, "source": source})
    
    def get_context(self, max_length: int = 4000) -> str:
        context_parts = []
        
        context_parts.append("## Recent Lecture Content:")
        for entry in list(self.short_term)[-5:]:
            context_parts.append(f"- {entry['text']}")
        
        if len(list(self.session)) > 5:
            context_parts.append("\n## Earlier Content:")
            for entry in list(self.session)[-10:-5]:
                context_parts.append(f"- {entry['text']}")
        
        if self.materials:
            context_parts.append("\n## Lecture Materials:")
            for mat in self.materials[:3]:
                preview = mat['content'][:500] + "..." if len(mat['content']) > 500 else mat['content']
                context_parts.append(f"From {mat['source']}:\n{preview}")
        
        context = "\n".join(context_parts)
        return context[:max_length]


class AnswerGenerator:
    def __init__(self, memory: ContextMemory, api_key: str = None):
        self.memory = memory
        self.gemini_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.openai_key = os.getenv("OPENAI_API_KEY", "")
        
        from .cache import response_cache
        self.cache = response_cache
        
        if HAS_GEMINI and self.gemini_key:
            genai.configure(api_key=self.gemini_key)
            self.gemini_model = genai.GenerativeModel('gemini-2.0-flash')
        else:
            self.gemini_model = None
        
        self.fallback_kb = {
            "neural network": "A neural network is a computational model inspired by the brain. It has interconnected nodes (neurons) organized in layers that process data through weighted connections and activation functions.",
            "perceptron": "A perceptron is the basic building block of neural networks. It takes inputs, multiplies by weights, adds a bias, and passes through an activation function to produce output.",
            "backpropagation": "Backpropagation calculates gradients of the loss function with respect to weights, allowing the network to learn by updating weights to minimize error using gradient descent.",
            "activation function": "Activation functions add non-linearity to networks. Common ones: ReLU (max(0,x)), Sigmoid (1/(1+e^-x)), Tanh. They enable learning of complex patterns.",
            "gradient descent": "Gradient descent optimizes parameters by iteratively moving in the direction of steepest decrease of the loss function. Learning rate controls step size.",
            "deep learning": "Deep learning uses neural networks with many hidden layers to learn hierarchical representations. The depth allows learning increasingly abstract features.",
            "overfitting": "Overfitting happens when a model memorizes training data instead of learning patterns. Solutions: regularization, dropout, data augmentation, early stopping.",
            "epoch": "An epoch is one complete pass through the entire training dataset. Training typically requires multiple epochs for the model to converge.",
            "batch size": "Batch size is the number of samples processed before updating model weights. Smaller batches add noise (regularization), larger batches are more stable.",
            "learning rate": "Learning rate controls how much to adjust weights during training. Too high causes overshooting, too low causes slow convergence.",
        }
    
    def set_api_key(self, api_key: str):
        self.gemini_key = api_key
        if HAS_GEMINI and api_key:
            genai.configure(api_key=api_key)
            self.gemini_model = genai.GenerativeModel('gemini-2.0-flash')
    
    def generate(self, question: str) -> Tuple[str, List[str]]:
        context = self.memory.get_context()
        
        cached = self.cache.get(question, context)
        if cached:
            print(f"✅ Cache hit! Saved API tokens")
            return cached
        
        if HAS_GEMINI and self.gemini_model:
            try:
                answer, sources = self._generate_gemini(question, context)
                self.cache.set(question, context, answer, sources)
                return answer, sources
            except Exception as e:
                print(f"Gemini error: {e}")
        
        if HAS_OPENAI and self.openai_key:
            try:
                answer, sources = self._generate_openai(question, context)
                self.cache.set(question, context, answer, sources)
                return answer, sources
            except Exception as e:
                print(f"OpenAI error: {e}")
        
        return self._generate_fallback(question, context)
    
    def _generate_gemini(self, question: str, context: str) -> Tuple[str, List[str]]:
        prompt = self._build_prompt(question, context)
        
        response = self.gemini_model.generate_content(prompt)
        answer = response.text.strip()
        
        sources = ["Gemini AI"]
        if context and "Lecture" in context:
            sources.append("Lecture transcript")
        
        return answer, sources
    
    def _generate_openai(self, question: str, context: str) -> Tuple[str, List[str]]:
        prompt = self._build_prompt(question, context)
        
        client = openai.OpenAI(api_key=self.openai_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful lecture assistant. Give clear, concise explanations."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        answer = response.choices[0].message.content.strip()
        sources = ["OpenAI GPT"]
        if context and "Lecture" in context:
            sources.append("Lecture transcript")
        
        return answer, sources
    
    def _generate_fallback(self, question: str, context: str) -> Tuple[str, List[str]]:
        question_lower = question.lower()
        
        for keyword, explanation in self.fallback_kb.items():
            if keyword in question_lower:
                answer = f"**Answer:** {explanation}"
                return answer, ["Built-in knowledge base"]
        
        return (
            "I can help explain concepts from the lecture. Could you ask about a specific topic like neural networks, backpropagation, activation functions, or gradient descent?",
            ["System"]
        )
    
    def _build_prompt(self, question: str, context: str) -> str:
        if context:
            return f"""Based on this lecture content:

{context}

Question: {question}

Provide a clear, helpful answer. If the answer is in the lecture content, reference it. If not, provide general knowledge."""
        else:
            return f"""Question: {question}

Provide a clear, educational explanation suitable for a student learning this topic."""
