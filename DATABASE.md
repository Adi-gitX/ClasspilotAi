# ClassPilot AI - Database Setup Guide

## Connection Details

**MySQL Server:** sql304.infinityfree.com  
**Database:** if0_41003574_classpilot  
**Port:** 3306

## Quick Setup

### 1. Install MySQL Connector

```bash
cd server
pip install mysql-connector-python
```

### 2. Configure Environment

The `.env` file has been configured with your credentials:

```env
DB_HOST=sql304.infinityfree.com
DB_PORT=3306
DB_USER=if0_41003574
DB_PASSWORD=K2Qcs8z6nhRMT
DB_NAME=if0_41003574_classpilot
```

### 3. Initialize Database

Run the initialization script to create all tables:

```bash
cd server
python init_db.py
```

This will:
- Test the connection
- Create all required tables
- Set up indexes
- Create default user

### 4. Verify Setup

Test the connection:
```bash
python init_db.py --test
```

## Database Schema

### Tables Created

| Table | Description |
|-------|-------------|
| `users` | User accounts |
| `semesters` | Academic semesters |
| `subjects` | Course subjects |
| `lectures` | Individual lectures |
| `transcript_segments` | Real-time transcript |
| `questions` | Detected questions |
| `notes` | User notes |
| `materials` | Uploaded files |
| `flashcards` | Study flashcards |

### Entity Relationship

```
users
  └── semesters
       └── subjects
            └── lectures
                 ├── transcript_segments
                 ├── questions
                 ├── notes
                 ├── materials
                 └── flashcards
```

## API Endpoints

All database routes are at `/api/db/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/db/health` | Check DB connection |
| GET | `/api/db/sync` | Get all data |
| GET | `/api/db/semesters` | List semesters |
| POST | `/api/db/semesters` | Create semester |
| DELETE | `/api/db/semesters/{id}` | Delete semester |
| GET | `/api/db/semesters/{id}/subjects` | List subjects |
| POST | `/api/db/subjects` | Create subject |
| DELETE | `/api/db/subjects/{id}` | Delete subject |
| GET | `/api/db/subjects/{id}/lectures` | List lectures |
| POST | `/api/db/lectures` | Create lecture |
| DELETE | `/api/db/lectures/{id}` | Delete lecture |
| GET | `/api/db/lectures/{id}/notes` | Get notes |
| POST | `/api/db/notes` | Create note |
| PUT | `/api/db/notes/{id}` | Update note |
| DELETE | `/api/db/notes/{id}` | Delete note |
| GET | `/api/db/lectures/{id}/questions` | Get questions |
| GET | `/api/db/lectures/{id}/flashcards` | Get flashcards |
| POST | `/api/db/flashcards` | Create flashcard |

## Files Created

```
server/
├── .env                    # Database credentials
├── .env.example           # Template (safe to commit)
├── init_db.py             # Initialization script
├── database/
│   ├── __init__.py        # Module exports
│   ├── db.py              # Connection & CRUD
│   └── schema.sql         # Table definitions
└── api/
    ├── __init__.py        # Module exports
    └── routes.py          # REST endpoints
```

## Usage in Python

```python
from database import Database

# Test connection
Database.test_connection()

# CRUD operations
Database.create_semester(id, name)
Database.get_all_semesters()
Database.create_subject(id, semester_id, name, color)
Database.create_lecture(id, subject_id, title)
Database.save_note(id, lecture_id, content, timestamp)
Database.save_flashcard(id, lecture_id, question, answer)
```

## Troubleshooting

### Connection refused
- Check if InfinityFree allows external MySQL connections
- Try connecting from their web-based phpMyAdmin first

### Access denied
- Verify credentials in `.env`
- Ensure database name is correct

### Timeout
- InfinityFree has connection limits
- Reduce connection pool size if needed

---

> **Note:** InfinityFree free hosting has limitations on MySQL connections.
> For production, consider upgrading or using a dedicated database service.
