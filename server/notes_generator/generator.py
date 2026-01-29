
from typing import List, Dict
import os

# Try to import LLM clients
try:
    import ollama
    HAS_OLLAMA = True
except ImportError:
    HAS_OLLAMA = False

try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False


class NotesGenerator:
    """Generates structured notes from lecture transcripts using AI"""
    
    def __init__(self):
        self.model = os.getenv("LLM_MODEL", "llama3.2")
        self.openai_key = os.getenv("OPENAI_API_KEY", "")
    
    def _call_llm(self, prompt: str) -> str:
        """Call LLM with prompt, trying Ollama first, then OpenAI, then fallback"""
        
        # Try Ollama
        if HAS_OLLAMA:
            try:
                response = ollama.chat(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}]
                )
                return response['message']['content']
            except Exception as e:
                print(f"Ollama error: {e}")
        
        # Try OpenAI
        if HAS_OPENAI and self.openai_key:
            try:
                client = openai.OpenAI(api_key=self.openai_key)
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=500
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"OpenAI error: {e}")
        
        return ""
        
    def generate_summary(self, transcript_segments: List[Dict]) -> str:
        """Generate a summary of the lecture so far"""
        if not transcript_segments:
            return "No content to summarize yet."
            
        text = " ".join([seg['text'] for seg in transcript_segments])
        
        if len(text) < 50:
            return "Not enough content to summarize yet."
        
        prompt = f"""Summarize the following lecture transcript in 3-5 bullet points. 
Be concise but capture the key concepts:

{text[:3000]}

Summary:"""
        
        result = self._call_llm(prompt)
        
        if result:
            return result
        
        # Fallback: basic summary
        word_count = len(text.split())
        return f"This lecture segment covers approximately {word_count} words. Please enable Ollama or OpenAI for AI-generated summaries."

    def extract_topics(self, transcript_segments: List[Dict]) -> List[str]:
        """Extract key topics from transcript"""
        if not transcript_segments:
            return []
            
        text = " ".join([seg['text'] for seg in transcript_segments])
        
        if len(text) < 50:
            return []
        
        prompt = f"""Extract 3-6 key topics or concepts from this lecture transcript.
Return only the topic names, one per line:

{text[:2000]}

Topics:"""
        
        result = self._call_llm(prompt)
        
        if result:
            topics = [line.strip().lstrip("•-").strip() for line in result.split("\n") if line.strip()]
            return topics[:6]
        
        # Fallback: return empty list
        return []

    def generate_flashcards(self, transcript_text: str) -> List[Dict]:
        """Generate flashcards from text"""
        if len(transcript_text) < 100:
            return []
        
        prompt = f"""Generate 5 flashcards from this lecture content.
Format each as:
Q: [question]
A: [answer]

Lecture content:
{transcript_text[:2500]}

Flashcards:"""
        
        result = self._call_llm(prompt)
        
        if result:
            flashcards = []
            lines = result.split("\n")
            current_q = ""
            
            for line in lines:
                line = line.strip()
                if line.startswith("Q:"):
                    current_q = line[2:].strip()
                elif line.startswith("A:") and current_q:
                    flashcards.append({
                        "q": current_q,
                        "a": line[2:].strip()
                    })
                    current_q = ""
            
            return flashcards[:5]
        
        # Fallback: empty list
        return []
    
    def generate_study_questions(self, transcript_text: str) -> List[str]:
        """Generate study/review questions from transcript"""
        if len(transcript_text) < 100:
            return []
        
        prompt = f"""Generate 5 review questions that a student could use to test their understanding of this lecture:

{transcript_text[:2500]}

Questions (one per line):"""
        
        result = self._call_llm(prompt)
        
        if result:
            questions = [
                line.strip().lstrip("0123456789.-)").strip() 
                for line in result.split("\n") 
                if line.strip() and "?" in line
            ]
            return questions[:5]
        
        return []
