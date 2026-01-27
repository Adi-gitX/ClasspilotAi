# ClassPilot AI

Real-time lecture assistant powered by AI. Transcribes lectures, answers questions, generates flashcards, and creates summaries—all in real-time.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-yellow)](https://python.org/)

---

## Features

- **Real-time Transcription** - Live speech-to-text using Whisper
- **AI Q&A** - Ask questions about lecture content
- **Smart Flashcards** - Auto-generate study cards
- **Summaries** - Bullet-point or paragraph summaries
- **Material Upload** - PDF, PPT, and image support
- **Offline-First** - Works without internet (local AI)
- **Token Optimization** - Response caching saves 70%+ on API costs

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- (Optional) Ollama for free local AI

### Installation

```bash
git clone https://github.com/your-repo/classpilot-ai.git
cd classpilot-ai

# Frontend
cd client
npm install
npm run dev

# Backend (new terminal)
cd server
pip install -r requirements.txt
npm run dev
```

### Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## Configuration

### Frontend (`client/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Backend (`server/.env`)

```env
# LLM
LLM_MODEL=llama3.2
OLLAMA_HOST=http://localhost:11434
OPENAI_API_KEY=sk-xxx

# ASR
WHISPER_MODEL=small.en
WHISPER_DEVICE=cpu

# Database (optional)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=classpilot
DB_USER=root
DB_PASSWORD=
```

---

## Architecture

```
classpilot-ai/
├── client/                 # Next.js 16 frontend
│   ├── app/               # App router
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities
│   ├── providers/         # Context providers
│   └── store/             # Zustand store
│
├── server/                 # FastAPI backend
│   ├── asr/               # Main app, ASR
│   ├── api/               # REST routes
│   ├── database/          # DB connection
│   ├── rag/               # AI engine, caching
│   ├── middleware/        # Rate limiting
│   └── shared/            # Config, models
```

---

## API Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/questions/ask` | Ask AI a question |
| POST | `/api/summary/generate` | Generate summary |
| POST | `/api/flashcards/generate` | Create flashcards |
| POST | `/api/materials/upload` | Upload PDF/PPT |
| GET | `/api/cache/stats` | View cache metrics |
| GET | `/health` | Server health check |

### WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/{client_id}');

// Start transcription
ws.send(JSON.stringify({ type: 'start_transcription' }));

// Send audio
ws.send(JSON.stringify({ type: 'audio_data', data: base64Audio }));
```

---

## Token Optimization

ClassPilot implements response caching to minimize API costs:

| Scenario | Without Cache | With Cache | Savings |
|----------|---------------|------------|---------|
| Repeat question | 4500 tokens | 0 tokens | 100% |
| Similar context | 4500 tokens | ~1500 tokens | 67% |
| Average session | 50K tokens | ~15K tokens | 70% |

**Monthly Cost Comparison:**
- Before: ~$3.60/month
- After: ~$0.50/month

---

## Free Local AI (Recommended)

For free, private AI with no API costs:

```bash
# Install Ollama
brew install ollama

# Start server
ollama serve &

# Pull model
ollama pull llama3.2
```

ClassPilot automatically uses Ollama when available.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start/Pause recording |
| `Esc` | Stop recording |
| `D` | Go to Dashboard |
| `L` | Go to Lecture view |

---

## Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand (State)
- Radix UI (Components)

**Backend:**
- FastAPI
- Whisper (ASR)
- Ollama / OpenAI (LLM)
- ChromaDB (RAG)
- MySQL (optional)

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

Built with ❤️ for students everywhere.
