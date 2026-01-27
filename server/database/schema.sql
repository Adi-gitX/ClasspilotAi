-- ClassPilot AI Database Schema
-- MySQL Database: if0_41003574_classpilot
-- Host: sql304.infinityfree.com

-- Drop tables if exist (for fresh start)
DROP TABLE IF EXISTS flashcards;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS transcript_segments;
DROP TABLE IF EXISTS materials;
DROP TABLE IF EXISTS lectures;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS semesters;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Semesters table
CREATE TABLE semesters (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Subjects table
CREATE TABLE subjects (
    id VARCHAR(36) PRIMARY KEY,
    semester_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
);

-- Lectures table
CREATE TABLE lectures (
    id VARCHAR(36) PRIMARY KEY,
    subject_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    date DATE,
    duration INT DEFAULT 0,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Transcript segments table
CREATE TABLE transcript_segments (
    id VARCHAR(36) PRIMARY KEY,
    lecture_id VARCHAR(36) NOT NULL,
    text TEXT NOT NULL,
    timestamp FLOAT NOT NULL,
    is_final BOOLEAN DEFAULT TRUE,
    confidence FLOAT DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

-- Questions table
CREATE TABLE questions (
    id VARCHAR(36) PRIMARY KEY,
    lecture_id VARCHAR(36) NOT NULL,
    text TEXT NOT NULL,
    answer TEXT,
    timestamp FLOAT NOT NULL,
    is_answered BOOLEAN DEFAULT FALSE,
    is_auto_detected BOOLEAN DEFAULT FALSE,
    confidence FLOAT DEFAULT 0.0,
    sources TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

-- Notes table
CREATE TABLE notes (
    id VARCHAR(36) PRIMARY KEY,
    lecture_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    timestamp FLOAT NOT NULL,
    is_auto_generated BOOLEAN DEFAULT FALSE,
    tags TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

-- Materials table
CREATE TABLE materials (
    id VARCHAR(36) PRIMARY KEY,
    lecture_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('pdf', 'ppt', 'image', 'other') NOT NULL,
    file_path TEXT,
    content TEXT,
    size INT DEFAULT 0,
    status ENUM('uploading', 'processing', 'ready', 'error') DEFAULT 'uploading',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

-- Flashcards table
CREATE TABLE flashcards (
    id VARCHAR(36) PRIMARY KEY,
    lecture_id VARCHAR(36) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_mastered BOOLEAN DEFAULT FALSE,
    review_count INT DEFAULT 0,
    last_reviewed TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_subjects_semester ON subjects(semester_id);
CREATE INDEX idx_lectures_subject ON lectures(subject_id);
CREATE INDEX idx_transcript_lecture ON transcript_segments(lecture_id);
CREATE INDEX idx_questions_lecture ON questions(lecture_id);
CREATE INDEX idx_notes_lecture ON notes(lecture_id);
CREATE INDEX idx_materials_lecture ON materials(lecture_id);
CREATE INDEX idx_flashcards_lecture ON flashcards(lecture_id);

-- Insert default user for local development
INSERT INTO users (id, email, name) VALUES 
('default-user', 'student@classpilot.ai', 'Student');
