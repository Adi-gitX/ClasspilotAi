
import re

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
