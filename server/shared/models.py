"""
ClassPilot AI - Shared Data Models
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TranscriptSegment(BaseModel):
    id: str
    text: str
    timestamp: float
    is_question: bool = False
    confidence: float = 0.0
    is_final: bool = True

class Question(BaseModel):
    id: str
    text: str
    timestamp: float
    answer: Optional[str] = None
    answer_sources: Optional[List[str]] = None
    is_answered: bool = False

class Note(BaseModel):
    id: str
    content: str
    timestamp: float
    lecture_id: str
    is_auto_generated: bool = True
    tags: List[str] = []

class MaterialType(str, Enum):
    PDF = "pdf"
    PPT = "ppt"
    IMAGE = "image"
    SCREENSHOT = "screenshot"

class Material(BaseModel):
    id: str
    name: str
    type: MaterialType
    path: str
    lecture_id: str
    uploaded_at: datetime
    extracted_text: Optional[str] = None

class Lecture(BaseModel):
    id: str
    title: str
    subject_id: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    is_active: bool = True

class WebSocketMessage(BaseModel):
    type: str
    payload: dict

class TranscriptUpdate(BaseModel):
    type: str = "transcript_update"
    segment: TranscriptSegment

class QuestionDetected(BaseModel):
    type: str = "question_detected"
    question: Question

class AnswerGenerated(BaseModel):
    type: str = "answer_generated"
    question_id: str
    answer: str
    sources: List[str]
