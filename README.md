# ClassPilot AI 🚀

**AI-Powered Classroom Assistant & Intelligent Note-Taker**

ClassPilot AI is a next-generation educational tool designed to revolutionize the learning experience. By combining real-time transcription, intelligent question detection, and context-aware RAG (Retrieval-Augmented Generation), ClassPilot empowers students and educators to focus on understanding rather than just recording.

## 🌟 Features

- **Real-time Transcription (ASR):** High-accuracy speech-to-text for lectures and meetings.
- **Smart Question Detection:** Automatically identifies and highlights key questions asked during sessions.
- **Context-Aware Answers (RAG):** Provides instant, accurate answers to queries using course materials as context.
- **Automated Note Generation:** Summarizes sessions into structured, easy-to-review study notes.
- **Interactive Dashboard:** A modern, intuitive interface for managing classes and materials.

## 🛠️ Tech Stack

- **Frontend:** Next.js, Tailwind CSS, TypeScript
- **Backend:** Python (FastAPI/Flask), PyTorch/MLX
- **AI/ML:** RealtimeSTT, RAG Pipeline
- **Orchestration:** Antigravity Kit (Agents)

## 📂 Project Structure

```
classpilotAi/
├── agents.md           # Agentic behavior definitions
├── chat/               # Next.js Frontend Application
├── services/           # Python Backend Services
│   ├── asr/            # Speech Recognition Service
│   ├── rag/            # RAG & Vector Database
│   └── shared/         # Shared Utilities
└── setup.sh            # Automated Setup Script
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vudovn/classpilotAi.git
   cd classpilotAi
   ```

2. **Run the setup script:**
   ```bash
   ./setup.sh
   ```
   This script installs dependencies for both the frontend and backend.

3. **Start the application:**
   ```bash
   ./start.sh
   ```
   This will launch the frontend on `http://localhost:3000` and backend services.

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- **Agents Framework:** Built using [Antigravity Kit](https://github.com/vudovn/antigravity-kit).
- **UI Design:** Enhanced with [UI/UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill).
