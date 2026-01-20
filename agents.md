# 🤖 ClassPilot AI - Agent Assignment Matrix

> **Version 1.0** - Strategic Agent-to-Task Mapping for Complete App Development

---

## 📋 Project Overview

**ClassPilot AI** is a real-time multimodal AI classroom assistant requiring:
- Real-time audio transcription (≤2s latency)
- Question detection & silent answer overlay
- Multimodal content ingestion (PDF, PPT, images)
- Auto-generated notes with timestamps
- Organized folder structure (Semester → Subject → Lecture)

---

## 🎯 Master Agent Orchestration Strategy

```
                    ┌─────────────────────────┐
                    │      ORCHESTRATOR       │
                    │  (Master Coordinator)   │
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│PROJECT-PLANNER│     │EXPLORER-AGENT │     │  DEBUGGER     │
│(Phase Planning)│    │(Codebase Map) │     │(Issue Fixing) │
└───────────────┘     └───────────────┘     └───────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                    SPECIALIST AGENTS                         │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│  FRONTEND   │  BACKEND    │  DATABASE   │     DEVOPS        │
│ SPECIALIST  │ SPECIALIST  │  ARCHITECT  │    ENGINEER       │
└─────────────┴─────────────┴─────────────┴───────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│TEST-ENGINEER  │     │SECURITY-AUDITOR│    │PERFORMANCE-   │
│(Quality)      │     │(Security)      │     │OPTIMIZER      │
└───────────────┘     └───────────────┘     └───────────────┘
```

---

## 📊 Phase-by-Phase Agent Assignment

### Phase 0: Project Initialization & Planning

| Task | Primary Agent | Supporting Agent | Skills Used |
|------|---------------|------------------|-------------|
| Requirements Analysis | `project-planner` | `orchestrator` | brainstorming, plan-writing |
| Codebase Survey | `explorer-agent` | - | - |
| Architecture Design | `project-planner` | `backend-specialist` | architecture, app-builder |
| Task Breakdown | `project-planner` | - | plan-writing |
| Tech Stack Finalization | `orchestrator` | All specialists | - |

---

### Phase 1: Foundation & Infrastructure

| Task | Primary Agent | Supporting Agent | Skills Used |
|------|---------------|------------------|-------------|
| **Project Scaffolding** | `devops-engineer` | `frontend-specialist` | deployment-procedures, bash-linux |
| Next.js Project Setup | `frontend-specialist` | - | nextjs-best-practices, tailwind-patterns |
| Python Backend Setup | `backend-specialist` | - | python-patterns, api-patterns |
| Database Schema Design | `database-architect` | `backend-specialist` | database-design, prisma-expert |
| Environment Configuration | `devops-engineer` | - | deployment-procedures |
| Git Repository Setup | `devops-engineer` | - | bash-linux |

---

### Phase 2: Audio Pipeline (Core Feature)

| Task | Primary Agent | Supporting Agent | Skills Used |
|------|---------------|------------------|-------------|
| **RealtimeSTT Integration** | `backend-specialist` | - | python-patterns, nodejs-best-practices |
| Audio Capture Service | `backend-specialist` | - | api-patterns |
| Faster-Whisper Setup | `backend-specialist` | - | python-patterns |
| WebSocket Streaming | `backend-specialist` | - | api-patterns |
| Transcript Buffer | `backend-specialist` | - | nodejs-best-practices |
| Audio Chunking (300ms) | `backend-specialist` | - | performance-profiling |
| VAD (Voice Activity Detection) | `backend-specialist` | - | python-patterns |
| **Unit Tests** | `test-engineer` | - | testing-patterns, tdd-workflow |

---

### Phase 3: Question Detection Engine

| Task | Primary Agent | Supporting Agent | Skills Used |
|------|---------------|------------------|-------------|
| **NLP Processing Pipeline** | `backend-specialist` | - | python-patterns |
| Interrogative Pattern Detection | `backend-specialist` | - | python-patterns |
| Confidence Scoring System | `backend-specialist` | - | api-patterns |
| Context Validation | `backend-specialist` | - | python-patterns |
| Question Event Emitter | `backend-specialist` | - | api-patterns |
| **Integration Tests** | `test-engineer` | - | testing-patterns |

---

### Phase 4: RAG & Context Engine

| Task | Primary Agent | Supporting Agent | Skills Used |
|------|---------------|------------------|-------------|
| **Vector Database Setup** | `database-architect` | `backend-specialist` | database-design |
| Embedding Generation | `backend-specialist` | - | python-patterns |
| PDF/PPT Text Extraction | `backend-specialist` | - | python-patterns |
| Image OCR Processing | `backend-specialist` | - | python-patterns |
| Context Window Management | `backend-specialist` | - | api-patterns |
| Memory Layers (Short/Session/Long) | `backend-specialist` | `database-architect` | database-design |
| Answer Generation Pipeline | `backend-specialist` | - | python-patterns |
| **Integration Tests** | `test-engineer` | - | testing-patterns |

---

### Phase 5: Frontend UI (Chat Interface)

| Task | Primary Agent | Supporting Agent | Skills Used |
|------|---------------|------------------|-------------|
| **Adapt Chat UI Template** | `frontend-specialist` | - | frontend-design, react-patterns, tailwind-patterns |
| ClassPilot Branding | `frontend-specialist` | - | ui-ux-pro-max, frontend-design |
| Sidebar Navigation | `frontend-specialist` | - | react-patterns |
| Welcome Screen | `frontend-specialist` | - | frontend-design |
| Real-time Transcript View | `frontend-specialist` | - | react-patterns |
| Silent Answer Overlay | `frontend-specialist` | - | frontend-design |
| Question Detection Indicator | `frontend-specialist` | - | react-patterns |
| Notes Display Panel | `frontend-specialist` | - | frontend-design |
| Timeline View Component | `frontend-specialist` | - | react-patterns |
| Folder Navigation (Semester/Subject/Lecture) | `frontend-specialist` | - | react-patterns |
| Material Upload Interface | `frontend-specialist` | - | frontend-design |
| Dark/Light Theme | `frontend-specialist` | - | tailwind-patterns |
| **Component Tests** | `test-engineer` | - | testing-patterns, webapp-testing |

---

### Phase 6: State Management & Data Flow

| Task | Primary Agent | Supporting Agent | Skills Used |
|------|---------------|------------------|-------------|
| **Zustand Store Architecture** | `frontend-specialist` | - | react-patterns |
| Audio State Management | `frontend-specialist` | - | react-patterns |
| Transcript State | `frontend-specialist` | - | react-patterns |
| Question/Answer State | `frontend-specialist` | - | react-patterns |
| Notes State | `frontend-specialist` | - | react-patterns |
| WebSocket Connection State | `frontend-specialist` | `backend-specialist` | react-patterns, api-patterns |

---

### Phase 7: API Layer

| Task | Primary Agent | Supporting Agent | Skills Used |
|------|---------------|------------------|-------------|
| **REST API Endpoints** | `backend-specialist` | - | api-patterns, nodejs-best-practices |
| WebSocket Server | `backend-specialist` | - | api-patterns |
| File Upload API | `backend-specialist` | - | api-patterns |
| Search API | `backend-specialist` | - | api-patterns |
| Notes CRUD API | `backend-specialist` | - | api-patterns |
| Folder Structure API | `backend-specialist` | - | api-patterns |
| **API Integration Tests** | `test-engineer` | - | testing-patterns |

---

### Phase 8: Notes & Content Generation

| Task | Primary Agent | Supporting Agent | Skills Used |
|------|---------------|------------------|-------------|
| **Auto-Notes Generator** | `backend-specialist` | - | python-patterns |
| Summary Generation | `backend-specialist` | - | python-patterns |
| Topic Extraction | `backend-specialist` | - | python-patterns |
| Flashcard Generator | `backend-specialist` | - | python-patterns |
| Concept Map Generation | `backend-specialist` | - | python-patterns |

---

### Phase 9: Security & Authentication

| Task | Primary Agent | Supporting Agent | Skills Used |
|------|---------------|------------------|-------------|
| **Security Audit** | `security-auditor` | - | vulnerability-scanner |
| Local Data Encryption | `security-auditor` | `backend-specialist` | vulnerability-scanner |
| Consent Management | `security-auditor` | `frontend-specialist` | vulnerability-scanner |
| Recording Indicators | `frontend-specialist` | `security-auditor` | frontend-design |
| API Security | `security-auditor` | `backend-specialist` | vulnerability-scanner |

---

### Phase 10: Performance Optimization

| Task | Primary Agent | Supporting Agent | Skills Used |
|------|---------------|------------------|-------------|
| **Latency Optimization** | `performance-optimizer` | `backend-specialist` | performance-profiling |
| Bundle Size Optimization | `performance-optimizer` | `frontend-specialist` | performance-profiling |
| Memory Management | `performance-optimizer` | - | performance-profiling |
| GPU Acceleration Tuning | `performance-optimizer` | `backend-specialist` | performance-profiling |
| Battery Optimization | `performance-optimizer` | - | performance-profiling |

---

### Phase 11: Testing & Quality Assurance

| Task | Primary Agent | Supporting Agent | Skills Used |
|------|---------------|------------------|-------------|
| **Unit Test Suite** | `test-engineer` | - | testing-patterns, tdd-workflow |
| Integration Test Suite | `test-engineer` | - | testing-patterns |
| E2E Test Suite | `test-engineer` | - | webapp-testing |
| Performance Tests | `test-engineer` | `performance-optimizer` | testing-patterns |
| Accessibility Audit | `test-engineer` | `frontend-specialist` | code-review-checklist |

---

### Phase 12: Deployment & DevOps

| Task | Primary Agent | Supporting Agent | Skills Used |
|------|---------------|------------------|-------------|
| **CI/CD Pipeline** | `devops-engineer` | - | deployment-procedures |
| Docker Configuration | `devops-engineer` | - | docker-expert |
| Production Build | `devops-engineer` | - | deployment-procedures |
| Monitoring Setup | `devops-engineer` | - | server-management |
| Rollback Procedures | `devops-engineer` | - | deployment-procedures |

---

### Phase 13: Documentation

| Task | Primary Agent | Supporting Agent | Skills Used |
|------|---------------|------------------|-------------|
| **README.md** | `documentation-writer` | - | documentation-templates |
| API Documentation | `documentation-writer` | `backend-specialist` | documentation-templates |
| User Guide | `documentation-writer` | - | documentation-templates |
| Developer Setup Guide | `documentation-writer` | `devops-engineer` | documentation-templates |

---

## 🔄 Agent Workflow Commands

### Recommended Slash Commands Per Phase

| Phase | Command | Purpose |
|-------|---------|---------|
| Planning | `/plan` | Create task breakdown |
| Discovery | `/brainstorm` | Socratic questioning |
| Development | `/orchestrate` | Multi-agent coordination |
| UI Design | `/ui-ux-pro-max` | Premium UI design |
| Testing | `/test` | Generate & run tests |
| Debugging | `/debug` | Systematic issue resolution |
| Deployment | `/deploy` | Production deployment |
| Status Check | `/status` | Progress tracking |

---

## 📈 Agent Utilization Summary

| Agent | Primary Responsibility | Est. Involvement |
|-------|----------------------|------------------|
| `orchestrator` | Coordination, synthesis | 15% |
| `project-planner` | Planning, task breakdown | 10% |
| `backend-specialist` | Audio, RAG, APIs, Python | 30% |
| `frontend-specialist` | UI, React, State | 25% |
| `database-architect` | Schema, Vector DB | 5% |
| `test-engineer` | All testing | 8% |
| `devops-engineer` | CI/CD, Docker | 3% |
| `security-auditor` | Security, privacy | 2% |
| `performance-optimizer` | Latency, optimization | 2% |

---

## ✅ Agent Assignment Rules

1. **`backend-specialist`** handles ALL audio pipeline, RAG, and Python-based ML work
2. **`frontend-specialist`** handles ALL React/Next.js UI work
3. **`test-engineer`** writes tests AFTER feature code is complete
4. **`security-auditor`** reviews AFTER feature implementation
5. **`orchestrator`** coordinates multi-agent tasks
6. **`debugger`** activates ONLY when issues arise
7. **`devops-engineer`** manages builds and deployments

---

> **Note:** This agent assignment matrix ensures efficient, non-overlapping work distribution following the GEMINI.md protocols and agent boundary enforcement rules.
