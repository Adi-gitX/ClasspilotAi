# ClassPilot AI - App Overview

> **Last Updated:** January 27, 2026  
> **Version:** 1.0.0

---

## Table of Contents

1. [Project Description](#project-description)
2. [Architecture Overview](#architecture-overview)
3. [Component Status](#component-status)
4. [Feature Audit](#feature-audit)
5. [Tech Stack](#tech-stack)
6. [API Reference](#api-reference)

---

## Project Description

ClassPilot AI is an intelligent classroom copilot for real-time transcription, question detection, and smart note-taking. It's designed for students to capture lecture content automatically and get AI-powered assistance during class.

### Core Value Proposition

- **Real-time Transcription:** Capture lectures using Whisper ASR
- **Question Detection:** Automatically identify professor questions
- **Emergency AI Answers:** Get instant AI help when you don't understand
- **Smart Notes:** Take timestamped notes during lectures
- **Material Context:** Upload slides/PDFs for better AI answers

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js 16)                       │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │   Sidebar    │  │  LectureView │  │   Dashboard  │               │
│  │  - Semesters │  │  - Transcript│  │  - Stats     │               │
│  │  - Subjects  │  │  - Timeline  │  │  - Actions   │               │
│  │  - Lectures  │  │  - Notes     │  │  - Recent    │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                              │                                       │
│                    ┌─────────┴─────────┐                            │
│                    │  Zustand Store    │                            │
│                    │  (lecture-store)  │                            │
│                    └─────────┬─────────┘                            │
│                              │                                       │
│               ┌──────────────┴──────────────┐                       │
│               │  WebSocket + Audio Capture  │                       │
│               └──────────────┬──────────────┘                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │  WebSocket API      │
                    └──────────┬──────────┘
                               │
┌──────────────────────────────┴───────────────────────────────────────┐
│                         BACKEND (FastAPI)                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │     ASR      │  │Question Det. │  │     RAG      │               │
│  │ (Whisper)    │  │ (Regex-based)│  │ (AI Answers) │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                              │                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ Notes Gen.   │  │  Material    │  │   Config     │               │
│  │ (AI-powered) │  │  Processor   │  │   (Pydantic) │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Status

### Frontend Components

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| **Sidebar** | `classpilot-sidebar.tsx` | ✅ Complete | CRUD ops, context menus, empty states |
| **Lecture View** | `lecture-view.tsx` | ✅ Complete | 5 tabs: Transcript, Timeline, Notes, Flashcards, Search |
| **Transcript View** | `transcript-view.tsx` | ✅ Complete | Continuous text, streaming |
| **Recording Controls** | `recording-controls.tsx` | ✅ Complete | Start/stop, emergency question |
| **Answer Modal** | `answer-modal.tsx` | ✅ Complete | AI answer display |
| **Notes Panel** | `notes-panel.tsx` | ✅ Complete | Add/edit/delete, Auto-Summarize works |
| **Timeline View** | `timeline-view.tsx` | ✅ Complete | Events display |
| **Material Upload** | `material-upload.tsx` | ✅ Complete | Sends files to backend API |
| **Dashboard** | `dashboard.tsx` | ✅ Complete | All quick actions work |
| **Flashcard View** | `flashcard-view.tsx` | ✅ Complete | AI-generated from transcript |
| **Search Panel** | `search-panel.tsx` | ✅ Complete | Searches transcript, questions, notes |
| **Chat Main** | `chat-main.tsx` | ✅ Complete | Real AI with conversation history |
| **Chat Welcome** | `chat-welcome-screen.tsx` | ✅ Complete | ClassPilot branding |
| **Chat Input** | `chat-input-box.tsx` | ✅ Complete | Loading states, Send button |

### Backend Components

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| **ASR App** | `asr/app.py` | ✅ Works | Demo mode if Whisper missing |
| **RAG Engine** | `rag/engine.py` | ✅ Complete | Ollama/OpenAI/fallback |
| **Question Detector** | `question_detector/detector.py` | ✅ Complete | Regex-based detection |
| **Notes Generator** | `notes_generator/generator.py` | ✅ Complete | AI-powered summaries & flashcards |
| **Config** | `shared/config.py` | ✅ Complete | Pydantic settings |

### Hooks

| Hook | File | Status | Notes |
|------|------|--------|-------|
| **useWebSocket** | `use-websocket.ts` | ✅ Complete | Full WS handling |
| **useAudioCapture** | `use-audio-capture.ts` | ✅ Complete | Mic capture + levels |

### Store

| Store | File | Status | Notes |
|-------|------|--------|-------|
| **LectureStore** | `lecture-store.ts` | ✅ Complete | Full CRUD, persistence |

---

## Feature Audit

### ✅ Fully Working Features

| Feature | Description |
|---------|-------------|
| **Create Semester** | Click + in sidebar to create |
| **Create Subject** | Right-click semester → Add Subject |
| **Create Lecture** | Right-click subject → Add Lecture |
| **Delete Items** | Context menu → Delete |
| **Start Recording** | Works, connects to backend |
| **Live Transcript** | Streams in real-time |
| **Emergency Question** | Opens modal with AI answer |
| **Add Notes** | Click "New Note" in Notes tab |
| **Auto-Summarize** | Generates AI summary as note |
| **Export Transcript** | Downloads as markdown |
| **Export Notes** | Downloads as markdown |
| **Generate Summary** | AI-powered summary download |
| **Theme Toggle** | Dark/light mode works |
| **WebSocket Connection** | Auto-connects, auto-reconnects |
| **Material Upload** | Files sent to backend |
| **Dashboard Quick Actions** | All 4 buttons work |
| **AI Chat** | Real AI responses |
| **Flashcards** | AI-generated from transcript |
| **Search** | Searches across all content |
| **Keyboard Shortcuts** | Space, Esc, D, L keys work |

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React framework |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Zustand | 5.x | State management |
| shadcn/ui | Latest | UI components |
| Sonner | Latest | Toasts |
| Lucide | Latest | Icons |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | Runtime |
| FastAPI | 0.100+ | API framework |
| faster-whisper | Latest | ASR (optional) |
| Ollama | Latest | Local LLM (optional) |
| OpenAI | Latest | Cloud LLM (optional) |
| Pydantic | 2.x | Settings/validation |

---

## API Reference

### WebSocket Endpoints

**Connect:** `ws://localhost:8000/ws/{client_id}`

#### Client → Server Actions

| Action | Payload | Description |
|--------|---------|-------------|
| `start_transcription` | `{}` | Begin ASR |
| `stop_transcription` | `{}` | Stop ASR |
| `audio_chunk` | `{data: base64, sample_rate: 16000}` | Send audio |
| `ask_question` | `{question: string}` | Ask AI |
| `upload_material` | `{content: string, source: string}` | Add context |
| `ping` | `{}` | Keep-alive |

#### Server → Client Messages

| Type | Payload | Description |
|------|---------|-------------|
| `status` | `{status: "transcribing"|"stopped", mode: "real"|"demo"}` | Status update |
| `transcript_update` | `{segment: TranscriptSegment}` | New transcript |
| `question_detected` | `{question: QuestionData}` | Auto-detected Q |
| `answer_generated` | `{question_id, answer, sources}` | AI answer |
| `error` | `{message: string}` | Error occurred |

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/questions/ask` | Ask question with context |
| POST | `/api/materials/upload` | Upload file for processing |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start/Pause recording |
| `Esc` | Stop recording |
| `D` | Go to Dashboard |
| `L` | Go to Lecture view |
| `/` | Focus search (coming soon) |

---

## Environment Variables

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Backend (`.env`)

```env
# ASR
WHISPER_MODEL=small.en
WHISPER_DEVICE=cpu

# LLM
OLLAMA_HOST=http://localhost:11434
LLM_MODEL=llama3.2
OPENAI_API_KEY=sk-...  # Optional

# Server
HOST=0.0.0.0
PORT=8000
```

---

## Running the App

### Quick Start

```bash
# Terminal 1: Frontend
cd client
npm install
npm run dev

# Terminal 2: Backend
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd asr && python app.py
```

### With Real AI (Recommended)

```bash
# Install Ollama
brew install ollama
ollama pull llama3.2

# Install Whisper
pip install faster-whisper
```

---

## File Structure

```
classpilotAi/
├── client/                     # Next.js frontend
│   ├── app/                    # App router pages
│   ├── components/             # React components
│   │   ├── chat/               # Chat interface
│   │   ├── dashboard/          # Dashboard view
│   │   ├── flashcards/         # Flashcard component
│   │   ├── lecture/            # Lecture view components
│   │   ├── materials/          # Material upload
│   │   ├── modals/             # Create modals
│   │   ├── notes/              # Notes panel
│   │   ├── search/             # Search panel
│   │   ├── sidebar/            # Navigation sidebar
│   │   ├── timeline/           # Timeline view
│   │   └── ui/                 # shadcn/ui components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and types
│   ├── providers/              # Context providers
│   └── store/                  # Zustand store
│
├── server/                     # Python backend
│   ├── asr/                    # ASR service (Whisper)
│   ├── material_processor/     # File processing
│   ├── notes_generator/        # Notes generation
│   ├── question_detector/      # Question detection
│   ├── rag/                    # AI answer generation
│   └── shared/                 # Shared config
```
