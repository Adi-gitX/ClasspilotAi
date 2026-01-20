# 📘 ClassPilot AI - Complete Implementation Plan

> **Version 1.0** - Production-Grade Implementation Roadmap
> **Target Platform:** macOS (MacBook Pro M2)
> **Target Latency:** ≤2 seconds end-to-end

---

## 🎯 Project Vision

**ClassPilot AI** is a real-time multimodal AI assistant that:
- Listens to lectures live with ≤2s latency
- Detects professor questions instantly
- Displays silent answers using RAG
- Auto-generates structured notes
- Organizes everything by Class → Lecture → Topic

---

## 📋 Success Criteria

| Metric | Target | Priority |
|--------|--------|----------|
| Transcription latency | <600ms | P0 |
| Answer display latency | <2s total | P0 |
| Accuracy satisfaction | >90% | P0 |
| Notes usefulness | >85% | P1 |
| App crashes | <0.5% | P0 |
| Build success | 100% | P0 |

---

## 🛠 Tech Stack (Finalized)

### Frontend (UI)
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React framework |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Zustand | 5.x | State management |
| Radix UI | Latest | Accessible components |
| Lucide React | Latest | Icons |

### Backend (Services)
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | ML/AI services |
| FastAPI | Latest | REST API |
| RealtimeSTT | Latest | Speech-to-text |
| Faster-Whisper | Latest | ASR engine |
| Silero VAD | Latest | Voice activity detection |
| LangChain | Latest | RAG orchestration |

### Database & Storage
| Technology | Purpose |
|------------|---------|
| SQLite | Local data storage |
| ChromaDB / LanceDB | Vector storage |
| Local filesystem | Audio/file storage |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| WebSocket | Real-time streaming |
| Docker (optional) | Containerization |
| PM2 (optional) | Process management |

---

## 📁 Project Structure

```
classpilot-ai/
├── 📁 app/                          # Next.js App Router
│   ├── 📁 (dashboard)/              # Dashboard layout group
│   │   ├── 📁 lecture/[id]/         # Live lecture view
│   │   ├── 📁 notes/[id]/           # Notes view
│   │   ├── 📁 materials/            # Material management
│   │   └── layout.tsx               # Dashboard layout
│   ├── 📁 api/                      # API routes
│   │   ├── 📁 audio/                # Audio endpoints
│   │   ├── 📁 materials/            # Material upload
│   │   ├── 📁 notes/                # Notes CRUD
│   │   └── 📁 search/               # Search API
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Home/welcome
│
├── 📁 components/                   # React components
│   ├── 📁 chat/                     # Chat UI (from template)
│   │   ├── chat-conversation-view.tsx
│   │   ├── chat-input-box.tsx
│   │   ├── chat-main.tsx
│   │   ├── chat-message.tsx
│   │   ├── chat-sidebar.tsx
│   │   └── chat-welcome-screen.tsx
│   ├── 📁 lecture/                  # Lecture components
│   │   ├── audio-controls.tsx
│   │   ├── question-overlay.tsx
│   │   ├── transcript-view.tsx
│   │   └── recording-indicator.tsx
│   ├── 📁 notes/                    # Notes components
│   │   ├── notes-editor.tsx
│   │   ├── notes-list.tsx
│   │   └── notes-summary.tsx
│   ├── 📁 materials/                # Material components
│   │   ├── material-upload.tsx
│   │   ├── pdf-viewer.tsx
│   │   └── image-viewer.tsx
│   ├── 📁 sidebar/                  # Navigation
│   │   ├── folder-tree.tsx
│   │   └── sidebar-nav.tsx
│   ├── 📁 timeline/                 # Timeline view
│   │   └── timeline-view.tsx
│   └── 📁 ui/                       # Base UI components
│       ├── avatar.tsx
│       ├── button.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── logo.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
│
├── 📁 hooks/                        # Custom React hooks
│   ├── use-audio-recorder.ts
│   ├── use-transcript.ts
│   ├── use-question-detector.ts
│   ├── use-websocket.ts
│   └── use-notes.ts
│
├── 📁 store/                        # Zustand stores
│   ├── lecture-store.ts
│   ├── transcript-store.ts
│   ├── notes-store.ts
│   ├── materials-store.ts
│   └── folder-store.ts
│
├── 📁 lib/                          # Utilities
│   ├── utils.ts
│   ├── api-client.ts
│   └── websocket-client.ts
│
├── 📁 services/                     # Python backend services
│   ├── 📁 asr/                      # Audio service
│   │   ├── app.py                   # FastAPI app
│   │   ├── realtime_stt.py          # RealtimeSTT wrapper
│   │   ├── audio_processor.py       # Audio chunking
│   │   └── requirements.txt
│   ├── 📁 question_detector/        # Question detection
│   │   ├── detector.py
│   │   ├── patterns.py
│   │   └── confidence.py
│   ├── 📁 rag/                      # RAG engine
│   │   ├── context_builder.py
│   │   ├── embedding_service.py
│   │   ├── retriever.py
│   │   └── answer_generator.py
│   ├── 📁 notes_generator/          # Notes generation
│   │   ├── summarizer.py
│   │   ├── topic_extractor.py
│   │   └── flashcard_generator.py
│   ├── 📁 material_processor/       # Material ingestion
│   │   ├── pdf_extractor.py
│   │   ├── ppt_extractor.py
│   │   ├── ocr_service.py
│   │   └── image_captioner.py
│   └── 📁 shared/                   # Shared utilities
│       ├── models.py
│       ├── config.py
│       └── logger.py
│
├── 📁 data/                         # Local data storage
│   ├── 📁 semesters/                # Folder structure
│   ├── 📁 vectors/                  # Vector DB
│   └── 📁 cache/                    # Temp files
│
├── 📁 public/                       # Static assets
│   ├── logo.svg
│   └── favicon.ico
│
├── 📁 tests/                        # Test suites
│   ├── 📁 unit/
│   ├── 📁 integration/
│   └── 📁 e2e/
│
├── .env.local                       # Environment variables
├── .gitignore
├── docker-compose.yml               # Docker setup
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

---

## 📊 Implementation Phases

### Phase 1: Project Foundation (Week 1)
**Goal:** Set up project structure and development environment

| # | Task | Agent | Priority | Est. Time |
|---|------|-------|----------|-----------|
| 1.1 | Initialize Next.js project with TypeScript | `frontend-specialist` | P0 | 1h |
| 1.2 | Configure Tailwind CSS 4 | `frontend-specialist` | P0 | 30m |
| 1.3 | Set up folder structure | `devops-engineer` | P0 | 30m |
| 1.4 | Migrate chat template components | `frontend-specialist` | P0 | 2h |
| 1.5 | Set up Python virtual environment | `backend-specialist` | P0 | 30m |
| 1.6 | Install core Python dependencies | `backend-specialist` | P0 | 30m |
| 1.7 | Configure ESLint & Prettier | `frontend-specialist` | P1 | 30m |
| 1.8 | Initialize Git repository | `devops-engineer` | P0 | 15m |

**Verification:**
- [ ] `npm run dev` starts without errors
- [ ] Chat template renders correctly
- [ ] Python virtual environment activates
- [ ] All linting passes

---

### Phase 2: Audio Pipeline (Week 1-2)
**Goal:** Real-time speech-to-text with <600ms latency

| # | Task | Agent | Priority | Est. Time |
|---|------|-------|----------|-----------|
| 2.1 | Install RealtimeSTT | `backend-specialist` | P0 | 1h |
| 2.2 | Install Faster-Whisper | `backend-specialist` | P0 | 30m |
| 2.3 | Configure small.en model | `backend-specialist` | P0 | 30m |
| 2.4 | Set up audio chunking (300ms) | `backend-specialist` | P0 | 2h |
| 2.5 | Configure VAD (Silero) | `backend-specialist` | P0 | 1h |
| 2.6 | Create FastAPI WebSocket server | `backend-specialist` | P0 | 3h |
| 2.7 | Implement transcript buffer (3-min ring) | `backend-specialist` | P0 | 2h |
| 2.8 | Create audio recording hook | `frontend-specialist` | P0 | 2h |
| 2.9 | Implement WebSocket client | `frontend-specialist` | P0 | 2h |
| 2.10 | Create live transcript component | `frontend-specialist` | P0 | 3h |
| 2.11 | Write unit tests | `test-engineer` | P1 | 2h |

**Verification:**
```bash
# Start ASR service
cd services/asr && python app.py

# Expected output:
# - Words appearing while speaking
# - Latency <600ms
# - Final transcript after pause
```

---

### Phase 3: Question Detection (Week 2)
**Goal:** Detect professor questions with >90% accuracy

| # | Task | Agent | Priority | Est. Time |
|---|------|-------|----------|-----------|
| 3.1 | Create interrogative pattern matcher | `backend-specialist` | P0 | 2h |
| 3.2 | Implement confidence scoring | `backend-specialist` | P0 | 2h |
| 3.3 | Add context validation | `backend-specialist` | P0 | 2h |
| 3.4 | Create question event emitter | `backend-specialist` | P0 | 1h |
| 3.5 | Build question detection hook | `frontend-specialist` | P0 | 2h |
| 3.6 | Create question overlay component | `frontend-specialist` | P0 | 3h |
| 3.7 | Write integration tests | `test-engineer` | P1 | 2h |

**Detection Triggers:**
- Interrogative phrasing ("What is...", "How does...")
- Rising intonation patterns
- Classroom cues ("Can anyone tell me...")
- Direct address ("You in the back...")

**Verification:**
- [ ] Questions detected within 200ms of completion
- [ ] Confidence threshold filters false positives
- [ ] Question displayed in overlay

---

### Phase 4: Material Ingestion (Week 2-3)
**Goal:** Process PDFs, PPTs, and images for context

| # | Task | Agent | Priority | Est. Time |
|---|------|-------|----------|-----------|
| 4.1 | Create PDF text extractor | `backend-specialist` | P0 | 2h |
| 4.2 | Create PPT slide extractor | `backend-specialist` | P0 | 2h |
| 4.3 | Implement OCR service (pytesseract) | `backend-specialist` | P0 | 3h |
| 4.4 | Create image captioning (optional) | `backend-specialist` | P2 | 3h |
| 4.5 | Build file upload API | `backend-specialist` | P0 | 2h |
| 4.6 | Create material upload UI | `frontend-specialist` | P0 | 3h |
| 4.7 | Implement PDF viewer | `frontend-specialist` | P1 | 2h |
| 4.8 | Write tests | `test-engineer` | P1 | 2h |

**Supported Formats:**
| Type | Processing |
|------|------------|
| PDF | Text + structure extraction |
| PPT/PPTX | Slide-wise indexing |
| Images | OCR + diagram captioning |
| Screenshots | Board recognition |

---

### Phase 5: RAG Engine (Week 3)
**Goal:** Context-aware answer generation with <700ms

| # | Task | Agent | Priority | Est. Time |
|---|------|-------|----------|-----------|
| 5.1 | Set up vector database (ChromaDB) | `database-architect` | P0 | 2h |
| 5.2 | Create embedding service | `backend-specialist` | P0 | 3h |
| 5.3 | Implement context builder | `backend-specialist` | P0 | 3h |
| 5.4 | Create retriever with filters | `backend-specialist` | P0 | 3h |
| 5.5 | Build answer generator | `backend-specialist` | P0 | 4h |
| 5.6 | Implement memory layers | `backend-specialist` | P0 | 3h |
| 5.7 | Create answer display component | `frontend-specialist` | P0 | 2h |
| 5.8 | Write integration tests | `test-engineer` | P1 | 3h |

**Memory Layers:**
| Layer | Scope | TTL |
|-------|-------|-----|
| Short-term | Last 3-5 minutes | Session |
| Session | Current lecture | End of lecture |
| Long-term | Entire subject | Persistent |

**Answer Style:**
- 2-4 bullet points
- Concept-level, not verbose
- Source-linked to materials

---

### Phase 6: Notes Generation (Week 3-4)
**Goal:** Auto-generate structured notes with timestamps

| # | Task | Agent | Priority | Est. Time |
|---|------|-------|----------|-----------|
| 6.1 | Create summarizer service | `backend-specialist` | P0 | 3h |
| 6.2 | Implement topic extraction | `backend-specialist` | P0 | 2h |
| 6.3 | Build notes formatter | `backend-specialist` | P0 | 2h |
| 6.4 | Create flashcard generator | `backend-specialist` | P2 | 3h |
| 6.5 | Build notes API | `backend-specialist` | P0 | 2h |
| 6.6 | Create notes editor component | `frontend-specialist` | P0 | 4h |
| 6.7 | Implement notes list view | `frontend-specialist` | P0 | 2h |
| 6.8 | Write tests | `test-engineer` | P1 | 2h |

**Notes Format:**
```markdown
# Lecture: [Title]
## Topic 1 [00:05:23]
- Key point 1
- Key point 2
  - Sub-detail

## Topic 2 [00:12:45]
- Explanation
- Example: [formula/diagram]
```

---

### Phase 7: Folder & Navigation System (Week 4)
**Goal:** Organized folder structure with easy navigation

| # | Task | Agent | Priority | Est. Time |
|---|------|-------|----------|-----------|
| 7.1 | Design folder database schema | `database-architect` | P0 | 1h |
| 7.2 | Create folder CRUD API | `backend-specialist` | P0 | 2h |
| 7.3 | Build folder tree component | `frontend-specialist` | P0 | 3h |
| 7.4 | Create sidebar navigation | `frontend-specialist` | P0 | 2h |
| 7.5 | Implement breadcrumb navigation | `frontend-specialist` | P1 | 1h |
| 7.6 | Add drag-and-drop organization | `frontend-specialist` | P2 | 3h |
| 7.7 | Write tests | `test-engineer` | P1 | 2h |

**Folder Structure:**
```
📁 Semester 6
 └── 📁 Machine Learning
     └── 📁 Lecture 5 - Neural Networks
         ├── 🎙 Audio recording
         ├── 📝 Transcript
         ├── 📄 Lecture slides.pdf
         ├── 🖼 Board photos (3)
         ├── ❓ Questions (5)
         ├── 📘 Auto-notes
         └── ⏱ Timeline
```

---

### Phase 8: Timeline View (Week 4)
**Goal:** Visual timeline of lecture events

| # | Task | Agent | Priority | Est. Time |
|---|------|-------|----------|-----------|
| 8.1 | Create timeline data model | `database-architect` | P0 | 1h |
| 8.2 | Build timeline API | `backend-specialist` | P0 | 2h |
| 8.3 | Create timeline component | `frontend-specialist` | P0 | 4h |
| 8.4 | Add event markers (questions, topics) | `frontend-specialist` | P0 | 2h |
| 8.5 | Implement seek-to-timestamp | `frontend-specialist` | P1 | 2h |
| 8.6 | Write tests | `test-engineer` | P1 | 1h |

**Timeline Events:**
- Topic changes
- Questions asked
- Slides referenced
- Board screenshots
- Important moments

---

### Phase 9: Search & Recall (Week 4-5)
**Goal:** Natural language search across all content

| # | Task | Agent | Priority | Est. Time |
|---|------|-------|----------|-----------|
| 9.1 | Create search index | `database-architect` | P0 | 2h |
| 9.2 | Build search API | `backend-specialist` | P0 | 3h |
| 9.3 | Implement semantic search | `backend-specialist` | P0 | 3h |
| 9.4 | Create search UI | `frontend-specialist` | P0 | 3h |
| 9.5 | Add search result highlighting | `frontend-specialist` | P1 | 2h |
| 9.6 | Write tests | `test-engineer` | P1 | 2h |

**Example Queries:**
- "Explain today's graph theory example"
- "Where did sir talk about Bayes rule?"
- "Give revision notes for Lecture 5"

---

### Phase 10: UI Polish & Branding (Week 5)
**Goal:** Premium, ClassPilot-branded interface

| # | Task | Agent | Priority | Est. Time |
|---|------|-------|----------|-----------|
| 10.1 | Create ClassPilot logo | `frontend-specialist` | P0 | 1h |
| 10.2 | Design color palette | `frontend-specialist` | P0 | 1h |
| 10.3 | Update all components branding | `frontend-specialist` | P0 | 3h |
| 10.4 | Implement dark/light theme | `frontend-specialist` | P0 | 2h |
| 10.5 | Add animations & transitions | `frontend-specialist` | P1 | 3h |
| 10.6 | Create loading states | `frontend-specialist` | P0 | 2h |
| 10.7 | Implement error states | `frontend-specialist` | P0 | 2h |
| 10.8 | Responsive design audit | `frontend-specialist` | P1 | 2h |

**Design Style (from UI-UX-Pro-Max):**
- **Style:** AI-Native UI (#43) + Soft UI Evolution (#19)
- **Colors:** Deep Blue #003366, Accent Teal #20B2AA, Success Green #22C55E
- **Typography:** Inter (body), Space Grotesk (headings)
- **Effects:** Subtle shadows, smooth 300ms transitions

---

### Phase 11: Security & Privacy (Week 5)
**Goal:** Privacy-first, consent-based recording

| # | Task | Agent | Priority | Est. Time |
|---|------|-------|----------|-----------|
| 11.1 | Security audit | `security-auditor` | P0 | 3h |
| 11.2 | Implement local encryption | `backend-specialist` | P0 | 3h |
| 11.3 | Create consent management UI | `frontend-specialist` | P0 | 2h |
| 11.4 | Add recording indicator | `frontend-specialist` | P0 | 1h |
| 11.5 | Implement manual recording toggle | `frontend-specialist` | P0 | 1h |
| 11.6 | Audit API security | `security-auditor` | P0 | 2h |

**Privacy Features:**
- [ ] Local-first processing (no cloud by default)
- [ ] Encrypted storage
- [ ] Clear consent indicator
- [ ] Manual recording toggle
- [ ] No auto cloud sync

---

### Phase 12: Performance Optimization (Week 5-6)
**Goal:** Meet ≤2s latency budget

| # | Task | Agent | Priority | Est. Time |
|---|------|-------|----------|-----------|
| 12.1 | Profile end-to-end latency | `performance-optimizer` | P0 | 2h |
| 12.2 | Optimize audio chunking | `backend-specialist` | P0 | 2h |
| 12.3 | Tune Whisper parameters | `backend-specialist` | P0 | 2h |
| 12.4 | Optimize RAG retrieval | `backend-specialist` | P0 | 2h |
| 12.5 | Bundle size optimization | `frontend-specialist` | P1 | 2h |
| 12.6 | Memory leak audit | `performance-optimizer` | P0 | 2h |
| 12.7 | Battery optimization | `performance-optimizer` | P1 | 2h |

**Latency Budget:**
| Component | Max Time |
|-----------|----------|
| Audio chunk | 300ms |
| ASR | 600ms |
| NLP | 100ms |
| Retrieval | 300ms |
| Generation | 700ms |
| UI render | 50ms |
| **Total** | **≤2s** |

---

### Phase 13: Testing & QA (Week 6)
**Goal:** Comprehensive test coverage with >80%

| # | Task | Agent | Priority | Est. Time |
|---|------|-------|----------|-----------|
| 13.1 | Write unit tests (80% coverage) | `test-engineer` | P0 | 6h |
| 13.2 | Write integration tests | `test-engineer` | P0 | 4h |
| 13.3 | Write E2E tests (Playwright) | `test-engineer` | P0 | 4h |
| 13.4 | Accessibility audit | `test-engineer` | P1 | 2h |
| 13.5 | Performance tests | `test-engineer` | P1 | 2h |
| 13.6 | Security tests | `security-auditor` | P0 | 2h |

**Test Commands:**
```bash
# Unit tests
npm run test

# E2E tests
npx playwright test

# Python tests
pytest services/
```

---

### Phase 14: Deployment & Documentation (Week 6)
**Goal:** Production-ready with comprehensive docs

| # | Task | Agent | Priority | Est. Time |
|---|------|-------|----------|-----------|
| 14.1 | Create build scripts | `devops-engineer` | P0 | 2h |
| 14.2 | Docker configuration | `devops-engineer` | P1 | 3h |
| 14.3 | Write README.md | `documentation-writer` | P0 | 2h |
| 14.4 | Write developer guide | `documentation-writer` | P1 | 2h |
| 14.5 | Write user guide | `documentation-writer` | P1 | 2h |
| 14.6 | Create demo video | - | P2 | 2h |

---

## ⏱ Timeline Summary

| Week | Phases | Milestone |
|------|--------|-----------|
| Week 1 | 1, 2 | Audio pipeline working |
| Week 2 | 2, 3, 4 | Question detection + material ingestion |
| Week 3 | 5, 6 | RAG engine + notes generation |
| Week 4 | 7, 8, 9 | Folder system + timeline + search |
| Week 5 | 10, 11, 12 | UI polish + security + optimization |
| Week 6 | 13, 14 | Testing + deployment |

---

## 🔴 Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Legal recording issues | Medium | High | Manual consent, clear indicators |
| Hallucination in answers | Medium | High | Strict RAG, confidence thresholds |
| High battery usage | Medium | Medium | Adaptive sampling, optimization |
| GPU dependency | Low | Medium | Cloud fallback option |
| Latency exceeds budget | Medium | High | Aggressive optimization, caching |

---

## 📦 MVP vs Advanced Features

### MVP (Phase 1-6) - Must Build First
- [x] Live transcription
- [x] Question detection
- [x] Silent answer overlay
- [x] Notes generation
- [x] Folder system
- [x] PDF/PPT ingestion

### Advanced (Post-MVP)
- [ ] Board OCR
- [ ] Diagram understanding
- [ ] Flashcard mode
- [ ] Exam mode
- [ ] Offline GPU mode
- [ ] Mobile companion app

---

## ✅ Verification Checklist (Phase X)

```bash
# Run all verifications
python scripts/verify_all.py . --url http://localhost:3000

# Individual checks
npm run lint && npx tsc --noEmit        # P0: Lint
python security_scan.py .                # P0: Security
python ux_audit.py .                     # P1: UX
npm run build                            # P0: Build
python lighthouse_audit.py localhost:3000 # P3: Performance
npx playwright test                      # P4: E2E
```

---

## ✅ Definition of Done

A feature is complete when:
- [ ] Code written and reviewed
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Accessibility verified
- [ ] Documentation updated
- [ ] Performance within budget

---

> **This plan is ready to execute.** Follow the phases sequentially, use the assigned agents, and verify each milestone before proceeding.
