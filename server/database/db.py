"""
Database connection and utilities for ClassPilot AI
MySQL database integration with connection pooling and fallback
"""

import os
import uuid
from typing import Optional, List, Dict, Any
from contextlib import contextmanager
from datetime import datetime

# Try to import MySQL connector
try:
    import mysql.connector
    from mysql.connector import pooling
    HAS_MYSQL = True
except ImportError:
    HAS_MYSQL = False
    print("⚠️ mysql-connector-python not installed. Database features disabled.")

# Import settings
try:
    from shared.config import settings
except ImportError:
    settings = None


# Database configuration from environment or settings
def get_db_config():
    """Get database configuration"""
    if settings:
        return {
            "host": settings.db_host,
            "port": settings.db_port,
            "user": settings.db_user,
            "password": settings.db_password,
            "database": settings.db_name,
        }
    return {
        "host": os.getenv("DB_HOST", "sql304.infinityfree.com"),
        "port": int(os.getenv("DB_PORT", 3306)),
        "user": os.getenv("DB_USER", "if0_41003574"),
        "password": os.getenv("DB_PASSWORD", "K2Qcs8z6nhRMT"),
        "database": os.getenv("DB_NAME", "if0_41003574_classpilot"),
    }


# Connection pool
connection_pool: Optional["pooling.MySQLConnectionPool"] = None
pool_initialized = False


def init_connection_pool(pool_size: int = 3):
    """Initialize the database connection pool"""
    global connection_pool, pool_initialized
    
    if not HAS_MYSQL:
        print("⚠️ MySQL connector not available")
        return False
    
    if pool_initialized:
        return True
    
    try:
        config = get_db_config()
        connection_pool = pooling.MySQLConnectionPool(
            pool_name="classpilot_pool",
            pool_size=pool_size,
            pool_reset_session=True,
            connect_timeout=10,
            **config
        )
        pool_initialized = True
        print(f"✓ Database pool initialized ({pool_size} connections)")
        return True
    except Exception as e:
        print(f"✗ Database pool init failed: {e}")
        return False


def get_single_connection():
    """Get a single connection (fallback when pool fails)"""
    if not HAS_MYSQL:
        return None
    
    config = get_db_config()
    try:
        return mysql.connector.connect(**config, connect_timeout=10)
    except Exception as e:
        print(f"Database connection error: {e}")
        return None


@contextmanager
def get_connection():
    """Get a connection from pool or create single connection"""
    global connection_pool, pool_initialized
    
    conn = None
    try:
        if pool_initialized and connection_pool:
            conn = connection_pool.get_connection()
        else:
            conn = get_single_connection()
        yield conn
    finally:
        if conn and conn.is_connected():
            conn.close()


@contextmanager
def get_cursor(dictionary: bool = True):
    """Get a cursor with automatic connection handling"""
    with get_connection() as conn:
        if conn is None:
            yield None
            return
        
        cursor = conn.cursor(dictionary=dictionary)
        try:
            yield cursor
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()


def generate_id():
    """Generate a unique ID"""
    return str(uuid.uuid4())


class Database:
    """Database operations for ClassPilot AI with fallback support"""
    
    # In-memory fallback when database is not available
    _fallback_data = {
        "semesters": [],
        "subjects": [],
        "lectures": [],
        "notes": [],
        "questions": [],
        "flashcards": [],
        "transcript_segments": [],
        "materials": []
    }
    
    @staticmethod
    def is_available() -> bool:
        """Check if database is available"""
        return HAS_MYSQL and pool_initialized
    
    @staticmethod
    def test_connection() -> bool:
        """Test database connection"""
        if not HAS_MYSQL:
            return False
        
        try:
            with get_cursor() as cursor:
                if cursor is None:
                    return False
                cursor.execute("SELECT 1")
                cursor.fetchone()
                return True
        except Exception as e:
            print(f"Database test failed: {e}")
            return False
    
    # ==================== SEMESTERS ====================
    
    @staticmethod
    def get_all_semesters(user_id: str = "default-user") -> List[Dict]:
        """Get all semesters"""
        if not Database.is_available():
            return Database._fallback_data["semesters"]
        
        try:
            with get_cursor() as cursor:
                cursor.execute("""
                    SELECT id, user_id, name, is_current, created_at, updated_at 
                    FROM semesters 
                    WHERE user_id = %s 
                    ORDER BY created_at DESC
                """, (user_id,))
                results = cursor.fetchall()
                return [dict(r) for r in results] if results else []
        except Exception as e:
            print(f"Get semesters error: {e}")
            return Database._fallback_data["semesters"]
    
    @staticmethod
    def create_semester(id: str, name: str, user_id: str = "default-user") -> Dict:
        """Create a new semester"""
        semester = {
            "id": id,
            "user_id": user_id,
            "name": name,
            "is_current": False,
            "created_at": datetime.now().isoformat()
        }
        
        if not Database.is_available():
            Database._fallback_data["semesters"].append(semester)
            return semester
        
        try:
            with get_cursor() as cursor:
                cursor.execute("""
                    INSERT INTO semesters (id, user_id, name) 
                    VALUES (%s, %s, %s)
                """, (id, user_id, name))
            return semester
        except Exception as e:
            print(f"Create semester error: {e}")
            Database._fallback_data["semesters"].append(semester)
            return semester
    
    @staticmethod
    def delete_semester(id: str) -> bool:
        """Delete a semester"""
        if not Database.is_available():
            Database._fallback_data["semesters"] = [
                s for s in Database._fallback_data["semesters"] if s["id"] != id
            ]
            return True
        
        try:
            with get_cursor() as cursor:
                cursor.execute("DELETE FROM semesters WHERE id = %s", (id,))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Delete semester error: {e}")
            return False
    
    # ==================== SUBJECTS ====================
    
    @staticmethod
    def get_subjects(semester_id: str) -> List[Dict]:
        """Get all subjects for a semester"""
        if not Database.is_available():
            return [s for s in Database._fallback_data["subjects"] if s.get("semester_id") == semester_id]
        
        try:
            with get_cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM subjects 
                    WHERE semester_id = %s 
                    ORDER BY created_at DESC
                """, (semester_id,))
                results = cursor.fetchall()
                return [dict(r) for r in results] if results else []
        except Exception as e:
            print(f"Get subjects error: {e}")
            return []
    
    @staticmethod
    def create_subject(id: str, semester_id: str, name: str, color: str = "#6366f1") -> Dict:
        """Create a new subject"""
        subject = {
            "id": id,
            "semester_id": semester_id,
            "name": name,
            "color": color,
            "created_at": datetime.now().isoformat()
        }
        
        if not Database.is_available():
            Database._fallback_data["subjects"].append(subject)
            return subject
        
        try:
            with get_cursor() as cursor:
                cursor.execute("""
                    INSERT INTO subjects (id, semester_id, name, color) 
                    VALUES (%s, %s, %s, %s)
                """, (id, semester_id, name, color))
            return subject
        except Exception as e:
            print(f"Create subject error: {e}")
            Database._fallback_data["subjects"].append(subject)
            return subject
    
    @staticmethod
    def delete_subject(id: str) -> bool:
        """Delete a subject"""
        if not Database.is_available():
            Database._fallback_data["subjects"] = [
                s for s in Database._fallback_data["subjects"] if s["id"] != id
            ]
            return True
        
        try:
            with get_cursor() as cursor:
                cursor.execute("DELETE FROM subjects WHERE id = %s", (id,))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Delete subject error: {e}")
            return False
    
    # ==================== LECTURES ====================
    
    @staticmethod
    def get_lectures(subject_id: str) -> List[Dict]:
        """Get all lectures for a subject"""
        if not Database.is_available():
            return [l for l in Database._fallback_data["lectures"] if l.get("subject_id") == subject_id]
        
        try:
            with get_cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM lectures 
                    WHERE subject_id = %s 
                    ORDER BY created_at DESC
                """, (subject_id,))
                results = cursor.fetchall()
                return [dict(r) for r in results] if results else []
        except Exception as e:
            print(f"Get lectures error: {e}")
            return []
    
    @staticmethod
    def create_lecture(id: str, subject_id: str, title: str) -> Dict:
        """Create a new lecture"""
        lecture = {
            "id": id,
            "subject_id": subject_id,
            "title": title,
            "duration": 0,
            "is_active": False,
            "created_at": datetime.now().isoformat()
        }
        
        if not Database.is_available():
            Database._fallback_data["lectures"].append(lecture)
            return lecture
        
        try:
            with get_cursor() as cursor:
                cursor.execute("""
                    INSERT INTO lectures (id, subject_id, title, date) 
                    VALUES (%s, %s, %s, CURDATE())
                """, (id, subject_id, title))
            return lecture
        except Exception as e:
            print(f"Create lecture error: {e}")
            Database._fallback_data["lectures"].append(lecture)
            return lecture
    
    @staticmethod
    def update_lecture(id: str, **kwargs) -> bool:
        """Update lecture fields"""
        allowed = ["title", "duration", "is_active"]
        updates = {k: v for k, v in kwargs.items() if k in allowed}
        if not updates:
            return False
        
        if not Database.is_available():
            for lecture in Database._fallback_data["lectures"]:
                if lecture["id"] == id:
                    lecture.update(updates)
                    return True
            return False
        
        try:
            set_clause = ", ".join([f"{k} = %s" for k in updates.keys()])
            values = list(updates.values()) + [id]
            with get_cursor() as cursor:
                cursor.execute(f"UPDATE lectures SET {set_clause} WHERE id = %s", values)
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Update lecture error: {e}")
            return False
    
    @staticmethod
    def delete_lecture(id: str) -> bool:
        """Delete a lecture"""
        if not Database.is_available():
            Database._fallback_data["lectures"] = [
                l for l in Database._fallback_data["lectures"] if l["id"] != id
            ]
            return True
        
        try:
            with get_cursor() as cursor:
                cursor.execute("DELETE FROM lectures WHERE id = %s", (id,))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Delete lecture error: {e}")
            return False
    
    # ==================== NOTES ====================
    
    @staticmethod
    def save_note(id: str, lecture_id: str, content: str, timestamp: float, 
                  is_auto_generated: bool = False, tags: str = "") -> Dict:
        """Save a note"""
        note = {
            "id": id,
            "lecture_id": lecture_id,
            "content": content,
            "timestamp": timestamp,
            "is_auto_generated": is_auto_generated,
            "tags": tags,
            "created_at": datetime.now().isoformat()
        }
        
        if not Database.is_available():
            Database._fallback_data["notes"].append(note)
            return note
        
        try:
            with get_cursor() as cursor:
                cursor.execute("""
                    INSERT INTO notes (id, lecture_id, content, timestamp, is_auto_generated, tags) 
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (id, lecture_id, content, timestamp, is_auto_generated, tags))
            return note
        except Exception as e:
            print(f"Save note error: {e}")
            Database._fallback_data["notes"].append(note)
            return note
    
    @staticmethod
    def get_notes(lecture_id: str) -> List[Dict]:
        """Get all notes for a lecture"""
        if not Database.is_available():
            return [n for n in Database._fallback_data["notes"] if n.get("lecture_id") == lecture_id]
        
        try:
            with get_cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM notes 
                    WHERE lecture_id = %s 
                    ORDER BY timestamp ASC
                """, (lecture_id,))
                results = cursor.fetchall()
                return [dict(r) for r in results] if results else []
        except Exception as e:
            print(f"Get notes error: {e}")
            return []
    
    @staticmethod
    def update_note(id: str, content: str) -> bool:
        """Update note content"""
        if not Database.is_available():
            for note in Database._fallback_data["notes"]:
                if note["id"] == id:
                    note["content"] = content
                    return True
            return False
        
        try:
            with get_cursor() as cursor:
                cursor.execute("UPDATE notes SET content = %s WHERE id = %s", (content, id))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Update note error: {e}")
            return False
    
    @staticmethod
    def delete_note(id: str) -> bool:
        """Delete a note"""
        if not Database.is_available():
            Database._fallback_data["notes"] = [
                n for n in Database._fallback_data["notes"] if n["id"] != id
            ]
            return True
        
        try:
            with get_cursor() as cursor:
                cursor.execute("DELETE FROM notes WHERE id = %s", (id,))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Delete note error: {e}")
            return False
    
    # ==================== QUESTIONS ====================
    
    @staticmethod
    def save_question(id: str, lecture_id: str, text: str, timestamp: float, 
                      is_auto_detected: bool = False) -> Dict:
        """Save a question"""
        question = {
            "id": id,
            "lecture_id": lecture_id,
            "text": text,
            "timestamp": timestamp,
            "is_auto_detected": is_auto_detected,
            "is_answered": False,
            "answer": None,
            "created_at": datetime.now().isoformat()
        }
        
        if not Database.is_available():
            Database._fallback_data["questions"].append(question)
            return question
        
        try:
            with get_cursor() as cursor:
                cursor.execute("""
                    INSERT INTO questions (id, lecture_id, text, timestamp, is_auto_detected) 
                    VALUES (%s, %s, %s, %s, %s)
                """, (id, lecture_id, text, timestamp, is_auto_detected))
            return question
        except Exception as e:
            print(f"Save question error: {e}")
            Database._fallback_data["questions"].append(question)
            return question
    
    @staticmethod
    def update_question_answer(id: str, answer: str, sources: str = "") -> bool:
        """Update question with answer"""
        if not Database.is_available():
            for question in Database._fallback_data["questions"]:
                if question["id"] == id:
                    question["answer"] = answer
                    question["is_answered"] = True
                    question["sources"] = sources
                    return True
            return False
        
        try:
            with get_cursor() as cursor:
                cursor.execute("""
                    UPDATE questions 
                    SET answer = %s, is_answered = TRUE, sources = %s 
                    WHERE id = %s
                """, (answer, sources, id))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Update question answer error: {e}")
            return False
    
    @staticmethod
    def get_questions(lecture_id: str) -> List[Dict]:
        """Get all questions for a lecture"""
        if not Database.is_available():
            return [q for q in Database._fallback_data["questions"] if q.get("lecture_id") == lecture_id]
        
        try:
            with get_cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM questions 
                    WHERE lecture_id = %s 
                    ORDER BY timestamp ASC
                """, (lecture_id,))
                results = cursor.fetchall()
                return [dict(r) for r in results] if results else []
        except Exception as e:
            print(f"Get questions error: {e}")
            return []
    
    # ==================== TRANSCRIPT ====================
    
    @staticmethod
    def save_transcript_segment(id: str, lecture_id: str, text: str, timestamp: float, 
                                 is_final: bool = True) -> Dict:
        """Save a transcript segment"""
        segment = {
            "id": id,
            "lecture_id": lecture_id,
            "text": text,
            "timestamp": timestamp,
            "is_final": is_final,
            "created_at": datetime.now().isoformat()
        }
        
        if not Database.is_available():
            Database._fallback_data["transcript_segments"].append(segment)
            return segment
        
        try:
            with get_cursor() as cursor:
                cursor.execute("""
                    INSERT INTO transcript_segments (id, lecture_id, text, timestamp, is_final) 
                    VALUES (%s, %s, %s, %s, %s)
                """, (id, lecture_id, text, timestamp, is_final))
            return segment
        except Exception as e:
            print(f"Save transcript error: {e}")
            Database._fallback_data["transcript_segments"].append(segment)
            return segment
    
    @staticmethod
    def get_transcript(lecture_id: str) -> List[Dict]:
        """Get full transcript for a lecture"""
        if not Database.is_available():
            return [t for t in Database._fallback_data["transcript_segments"] 
                    if t.get("lecture_id") == lecture_id]
        
        try:
            with get_cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM transcript_segments 
                    WHERE lecture_id = %s 
                    ORDER BY timestamp ASC
                """, (lecture_id,))
                results = cursor.fetchall()
                return [dict(r) for r in results] if results else []
        except Exception as e:
            print(f"Get transcript error: {e}")
            return []
    
    # ==================== FLASHCARDS ====================
    
    @staticmethod
    def save_flashcard(id: str, lecture_id: str, question: str, answer: str) -> Dict:
        """Save a flashcard"""
        flashcard = {
            "id": id,
            "lecture_id": lecture_id,
            "question": question,
            "answer": answer,
            "is_mastered": False,
            "review_count": 0,
            "created_at": datetime.now().isoformat()
        }
        
        if not Database.is_available():
            Database._fallback_data["flashcards"].append(flashcard)
            return flashcard
        
        try:
            with get_cursor() as cursor:
                cursor.execute("""
                    INSERT INTO flashcards (id, lecture_id, question, answer) 
                    VALUES (%s, %s, %s, %s)
                """, (id, lecture_id, question, answer))
            return flashcard
        except Exception as e:
            print(f"Save flashcard error: {e}")
            Database._fallback_data["flashcards"].append(flashcard)
            return flashcard
    
    @staticmethod
    def get_flashcards(lecture_id: str) -> List[Dict]:
        """Get all flashcards for a lecture"""
        if not Database.is_available():
            return [f for f in Database._fallback_data["flashcards"] 
                    if f.get("lecture_id") == lecture_id]
        
        try:
            with get_cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM flashcards 
                    WHERE lecture_id = %s 
                    ORDER BY created_at ASC
                """, (lecture_id,))
                results = cursor.fetchall()
                return [dict(r) for r in results] if results else []
        except Exception as e:
            print(f"Get flashcards error: {e}")
            return []
    
    @staticmethod
    def update_flashcard_mastery(id: str, is_mastered: bool) -> bool:
        """Update flashcard mastery status"""
        if not Database.is_available():
            for flashcard in Database._fallback_data["flashcards"]:
                if flashcard["id"] == id:
                    flashcard["is_mastered"] = is_mastered
                    flashcard["review_count"] = flashcard.get("review_count", 0) + 1
                    return True
            return False
        
        try:
            with get_cursor() as cursor:
                cursor.execute("""
                    UPDATE flashcards 
                    SET is_mastered = %s, review_count = review_count + 1, last_reviewed = NOW() 
                    WHERE id = %s
                """, (is_mastered, id))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Update flashcard error: {e}")
            return False
    
    # ==================== MATERIALS ====================
    
    @staticmethod
    def save_material(id: str, lecture_id: str, name: str, type: str, 
                      size: int = 0, content: str = "") -> Dict:
        """Save material metadata"""
        material = {
            "id": id,
            "lecture_id": lecture_id,
            "name": name,
            "type": type,
            "size": size,
            "content": content,
            "status": "processed",
            "created_at": datetime.now().isoformat()
        }
        
        if not Database.is_available():
            Database._fallback_data["materials"].append(material)
            return material
        
        try:
            with get_cursor() as cursor:
                cursor.execute("""
                    INSERT INTO materials (id, lecture_id, name, type, size, content, status) 
                    VALUES (%s, %s, %s, %s, %s, %s, 'processed')
                """, (id, lecture_id, name, type, size, content[:10000] if content else ""))
            return material
        except Exception as e:
            print(f"Save material error: {e}")
            Database._fallback_data["materials"].append(material)
            return material
    
    @staticmethod
    def get_materials(lecture_id: str) -> List[Dict]:
        """Get all materials for a lecture"""
        if not Database.is_available():
            return [m for m in Database._fallback_data["materials"] 
                    if m.get("lecture_id") == lecture_id]
        
        try:
            with get_cursor() as cursor:
                cursor.execute("""
                    SELECT id, lecture_id, name, type, size, status, created_at 
                    FROM materials 
                    WHERE lecture_id = %s 
                    ORDER BY created_at DESC
                """, (lecture_id,))
                results = cursor.fetchall()
                return [dict(r) for r in results] if results else []
        except Exception as e:
            print(f"Get materials error: {e}")
            return []


# Try to initialize pool on import
try:
    init_connection_pool()
except Exception as e:
    print(f"Database initialization skipped: {e}")


if __name__ == "__main__":
    if init_connection_pool():
        if Database.test_connection():
            print("✓ Database ready!")
        else:
            print("✗ Database test failed")
    else:
        print("Database not available, using in-memory fallback")
