"""
REST API routes for ClassPilot AI database operations
Full CRUD with proper error handling and validation
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List
import uuid

# Import database
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import Database, init_connection_pool

router = APIRouter(prefix="/api/db", tags=["database"])


# ==================== PYDANTIC MODELS ====================

class SemesterCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class SemesterResponse(BaseModel):
    id: str
    name: str
    user_id: str = "default-user"
    is_current: bool = False

class SubjectCreate(BaseModel):
    semester_id: str
    name: str = Field(..., min_length=1, max_length=100)
    color: Optional[str] = "#6366f1"

class LectureCreate(BaseModel):
    subject_id: str
    title: str = Field(..., min_length=1, max_length=200)

class NoteCreate(BaseModel):
    lecture_id: str
    content: str = Field(..., min_length=1)
    timestamp: float = 0
    is_auto_generated: Optional[bool] = False
    tags: Optional[str] = ""

class NoteUpdate(BaseModel):
    content: str = Field(..., min_length=1)

class QuestionCreate(BaseModel):
    lecture_id: str
    text: str = Field(..., min_length=1)
    timestamp: float = 0
    is_auto_detected: Optional[bool] = False

class AnswerUpdate(BaseModel):
    answer: str
    sources: Optional[str] = ""

class FlashcardCreate(BaseModel):
    lecture_id: str
    question: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)

class FlashcardMastery(BaseModel):
    is_mastered: bool

class TranscriptSegmentCreate(BaseModel):
    lecture_id: str
    text: str
    timestamp: float
    is_final: bool = True

class MaterialCreate(BaseModel):
    lecture_id: str
    name: str
    type: str
    size: int = 0
    content: str = ""


# ==================== HEALTH CHECK ====================

@router.get("/health")
async def health_check():
    """Check database connection status"""
    is_connected = Database.test_connection()
    return {
        "status": "healthy" if is_connected else "degraded",
        "database": "connected" if is_connected else "fallback_mode",
        "message": "Using MySQL database" if is_connected else "Using in-memory storage"
    }


@router.get("/status")
async def get_status():
    """Get detailed database status"""
    return {
        "available": Database.is_available(),
        "connection_test": Database.test_connection(),
        "fallback_mode": not Database.is_available()
    }


# ==================== SEMESTERS ====================

@router.get("/semesters")
async def get_semesters(user_id: str = "default-user"):
    """Get all semesters for a user"""
    try:
        semesters = Database.get_all_semesters(user_id)
        return {"semesters": semesters, "count": len(semesters)}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "semesters": []}
        )


@router.post("/semesters")
async def create_semester(data: SemesterCreate, user_id: str = "default-user"):
    """Create a new semester"""
    try:
        semester_id = str(uuid.uuid4())
        result = Database.create_semester(semester_id, data.name, user_id)
        return {"success": True, "semester": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/semesters/{semester_id}")
async def delete_semester(semester_id: str):
    """Delete a semester and all related data"""
    try:
        if Database.delete_semester(semester_id):
            return {"success": True, "deleted": semester_id}
        raise HTTPException(status_code=404, detail="Semester not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SUBJECTS ====================

@router.get("/semesters/{semester_id}/subjects")
async def get_subjects(semester_id: str):
    """Get all subjects for a semester"""
    try:
        subjects = Database.get_subjects(semester_id)
        return {"subjects": subjects, "semester_id": semester_id, "count": len(subjects)}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "subjects": []}
        )


@router.post("/subjects")
async def create_subject(data: SubjectCreate):
    """Create a new subject"""
    try:
        subject_id = str(uuid.uuid4())
        result = Database.create_subject(subject_id, data.semester_id, data.name, data.color)
        return {"success": True, "subject": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str):
    """Delete a subject and all related data"""
    try:
        if Database.delete_subject(subject_id):
            return {"success": True, "deleted": subject_id}
        raise HTTPException(status_code=404, detail="Subject not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== LECTURES ====================

@router.get("/subjects/{subject_id}/lectures")
async def get_lectures(subject_id: str):
    """Get all lectures for a subject"""
    try:
        lectures = Database.get_lectures(subject_id)
        return {"lectures": lectures, "subject_id": subject_id, "count": len(lectures)}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "lectures": []}
        )


@router.post("/lectures")
async def create_lecture(data: LectureCreate):
    """Create a new lecture"""
    try:
        lecture_id = str(uuid.uuid4())
        result = Database.create_lecture(lecture_id, data.subject_id, data.title)
        return {"success": True, "lecture": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/lectures/{lecture_id}")
async def update_lecture(lecture_id: str, title: str = None, duration: int = None, is_active: bool = None):
    """Update lecture fields"""
    try:
        updates = {}
        if title is not None:
            updates["title"] = title
        if duration is not None:
            updates["duration"] = duration
        if is_active is not None:
            updates["is_active"] = is_active
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        if Database.update_lecture(lecture_id, **updates):
            return {"success": True, "updated": lecture_id}
        raise HTTPException(status_code=404, detail="Lecture not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/lectures/{lecture_id}")
async def delete_lecture(lecture_id: str):
    """Delete a lecture and all related data"""
    try:
        if Database.delete_lecture(lecture_id):
            return {"success": True, "deleted": lecture_id}
        raise HTTPException(status_code=404, detail="Lecture not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== NOTES ====================

@router.get("/lectures/{lecture_id}/notes")
async def get_notes(lecture_id: str):
    """Get all notes for a lecture"""
    try:
        notes = Database.get_notes(lecture_id)
        return {"notes": notes, "lecture_id": lecture_id, "count": len(notes)}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "notes": []}
        )


@router.post("/notes")
async def create_note(data: NoteCreate):
    """Create a new note"""
    try:
        note_id = str(uuid.uuid4())
        result = Database.save_note(
            note_id, data.lecture_id, data.content, 
            data.timestamp, data.is_auto_generated, data.tags
        )
        return {"success": True, "note": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/notes/{note_id}")
async def update_note(note_id: str, data: NoteUpdate):
    """Update a note"""
    try:
        if Database.update_note(note_id, data.content):
            return {"success": True, "updated": note_id}
        raise HTTPException(status_code=404, detail="Note not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/notes/{note_id}")
async def delete_note(note_id: str):
    """Delete a note"""
    try:
        if Database.delete_note(note_id):
            return {"success": True, "deleted": note_id}
        raise HTTPException(status_code=404, detail="Note not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== QUESTIONS ====================

@router.get("/lectures/{lecture_id}/questions")
async def get_questions(lecture_id: str):
    """Get all questions for a lecture"""
    try:
        questions = Database.get_questions(lecture_id)
        return {"questions": questions, "lecture_id": lecture_id, "count": len(questions)}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "questions": []}
        )


@router.post("/questions")
async def create_question(data: QuestionCreate):
    """Create a new question"""
    try:
        question_id = str(uuid.uuid4())
        result = Database.save_question(
            question_id, data.lecture_id, data.text, 
            data.timestamp, data.is_auto_detected
        )
        return {"success": True, "question": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/questions/{question_id}/answer")
async def answer_question(question_id: str, data: AnswerUpdate):
    """Add answer to a question"""
    try:
        if Database.update_question_answer(question_id, data.answer, data.sources):
            return {"success": True, "updated": question_id}
        raise HTTPException(status_code=404, detail="Question not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== TRANSCRIPT ====================

@router.get("/lectures/{lecture_id}/transcript")
async def get_transcript(lecture_id: str):
    """Get full transcript for a lecture"""
    try:
        transcript = Database.get_transcript(lecture_id)
        return {"transcript": transcript, "lecture_id": lecture_id, "count": len(transcript)}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "transcript": []}
        )


@router.post("/transcript")
async def save_transcript_segment(data: TranscriptSegmentCreate):
    """Save a transcript segment"""
    try:
        segment_id = str(uuid.uuid4())
        result = Database.save_transcript_segment(
            segment_id, data.lecture_id, data.text, 
            data.timestamp, data.is_final
        )
        return {"success": True, "segment": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== FLASHCARDS ====================

@router.get("/lectures/{lecture_id}/flashcards")
async def get_flashcards(lecture_id: str):
    """Get all flashcards for a lecture"""
    try:
        flashcards = Database.get_flashcards(lecture_id)
        return {"flashcards": flashcards, "lecture_id": lecture_id, "count": len(flashcards)}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "flashcards": []}
        )


@router.post("/flashcards")
async def create_flashcard(data: FlashcardCreate):
    """Create a new flashcard"""
    try:
        flashcard_id = str(uuid.uuid4())
        result = Database.save_flashcard(
            flashcard_id, data.lecture_id, data.question, data.answer
        )
        return {"success": True, "flashcard": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/flashcards/{flashcard_id}/mastery")
async def update_flashcard_mastery(flashcard_id: str, data: FlashcardMastery):
    """Update flashcard mastery status"""
    try:
        if Database.update_flashcard_mastery(flashcard_id, data.is_mastered):
            return {"success": True, "updated": flashcard_id}
        raise HTTPException(status_code=404, detail="Flashcard not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== MATERIALS ====================

@router.get("/lectures/{lecture_id}/materials")
async def get_materials(lecture_id: str):
    """Get all materials for a lecture"""
    try:
        materials = Database.get_materials(lecture_id)
        return {"materials": materials, "lecture_id": lecture_id, "count": len(materials)}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "materials": []}
        )


@router.post("/materials")
async def save_material(data: MaterialCreate):
    """Save material metadata"""
    try:
        material_id = str(uuid.uuid4())
        result = Database.save_material(
            material_id, data.lecture_id, data.name, 
            data.type, data.size, data.content
        )
        return {"success": True, "material": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== FULL DATA SYNC ====================

@router.get("/sync")
async def get_full_data(user_id: str = "default-user"):
    """Get all data for client sync - builds complete hierarchy"""
    try:
        semesters_data = Database.get_all_semesters(user_id)
        
        result = []
        for semester in semesters_data:
            semester_id = semester.get("id") or semester.get("id")
            subjects = Database.get_subjects(semester_id)
            
            semester_obj = {
                **semester,
                "subjects": []
            }
            
            for subject in subjects:
                subject_id = subject.get("id")
                lectures = Database.get_lectures(subject_id)
                
                subject_obj = {
                    **subject,
                    "lectures": []
                }
                
                for lecture in lectures:
                    lecture_id = lecture.get("id")
                    lecture_obj = {
                        **lecture,
                        "notes_count": len(Database.get_notes(lecture_id)),
                        "questions_count": len(Database.get_questions(lecture_id)),
                        "flashcards_count": len(Database.get_flashcards(lecture_id))
                    }
                    subject_obj["lectures"].append(lecture_obj)
                
                semester_obj["subjects"].append(subject_obj)
            
            result.append(semester_obj)
        
        return {
            "semesters": result,
            "count": len(result),
            "database_available": Database.is_available()
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "semesters": []}
        )


@router.get("/lecture/{lecture_id}/full")
async def get_lecture_full_data(lecture_id: str):
    """Get complete data for a single lecture"""
    try:
        return {
            "lecture_id": lecture_id,
            "transcript": Database.get_transcript(lecture_id),
            "notes": Database.get_notes(lecture_id),
            "questions": Database.get_questions(lecture_id),
            "flashcards": Database.get_flashcards(lecture_id),
            "materials": Database.get_materials(lecture_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
