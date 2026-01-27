# ClassPilot AI - Complete Upgrade Guide

> **Analysis Date:** January 27, 2026  
> **Status:** Critical Issues Identified - Action Required

---

## 📋 Executive Summary

This document provides a **complete analysis** of the ClassPilot AI application, identifying all issues, improvements needed, and a step-by-step guide to make everything work correctly.

### Current State
| Area | Status | Issues |
|------|--------|--------|
| **Frontend UI** | ✅ Functional | Minor polish needed |
| **WebSocket Connection** | ⚠️ Partial | Connects but no audio streaming |
| **Voice Transcription** | ❌ Broken | No browser audio capture |
| **Backend ASR** | ⚠️ Demo Only | RealtimeSTT incompatible with browser |
| **RAG System** | ⚠️ Mock | Not connected to real embeddings |
| **Folder Structure** | ⚠️ Inconsistent | Uses `chat/` and `services/` |

---

## 🔴 Critical Issues

### Issue 1: No Browser Audio Capture (CRITICAL)

**Problem:** The frontend has no code to capture microphone audio from the browser. The `RecordingControls` component only sends a `start_transcription` WebSocket message but never streams audio data.

**Current Code (`recording-controls.tsx`):**
```tsx
const handleStartRecording = () => {
    clearTranscript();
    startRecording();
    startTranscription();  // Only sends { action: "start_transcription" }
};
```

**Missing:** `navigator.mediaDevices.getUserMedia()` + Audio streaming via WebSocket.

---

### Issue 2: RealtimeSTT Architecture Mismatch (CRITICAL)

**Problem:** The backend uses `RealtimeSTT` library which captures audio from the **system microphone** directly. It cannot receive audio from a WebSocket stream.

**Current Code (`app.py` line 280-285):**
```python
recorder = AudioToTextRecorder(
    model=settings.whisper_model,
    compute_type=settings.whisper_compute_type,
    on_realtime_transcription_stabilized=on_text,
    silero_sensitivity=settings.vad_threshold,
)
```

**Fix Required:** Replace with `faster-whisper` directly to process audio chunks sent via WebSocket.

---

### Issue 3: Demo Mode Only Works

**Problem:** The app falls back to demo mode with pre-recorded transcripts because:
1. `HAS_REALTIME_STT` requires pyAudio/portAudio system dependencies
2. Even if installed, RealtimeSTT uses local mic, not browser audio

**Current Flow:**
```
User clicks "Start Recording" 
  → WebSocket sends { action: "start_transcription" }
  → Backend checks HAS_REALTIME_STT (usually False)
  → Backend runs demo_transcription() with fake data
```

---

### Issue 4: Missing Python Package Initialization

**Problem:** Several Python module directories lack `__init__.py` files:
- `services/question_detector/__init__.py` ❌
- `services/rag/__init__.py` ❌
- `services/notes_generator/__init__.py` ❌
- `services/material_processor/__init__.py` ❌

---

### Issue 5: Folder Structure Inconsistency

**Current Structure:**
```
classpilotAi/
├── chat/           # Frontend (should be "client")
├── services/       # Backend (should be "server")
```

**Desired Structure:**
```
classpilotAi/
├── client/         # Frontend (Next.js)
├── server/         # Backend (FastAPI)
```

---

## 🟡 Moderate Issues

### Issue 6: No Audio Level Visualization

**Problem:** The audio level bars in `RecordingControls` use random values instead of real audio levels:
```tsx
height: isPaused ? "4px" : `${Math.max(4, Math.random() * 20)}px`
```

**Fix:** Compute actual audio levels from `AnalyserNode` in Web Audio API.

---

### Issue 7: No Persistence Layer

**Problem:** All data (transcripts, notes, questions) are stored only in Zustand memory. Refreshing the page loses everything.

**Fix:** Add localStorage persistence or backend database.

---

### Issue 8: Environment Configuration Issues

**Problem:** Environment files have hardcoded values and don't match expected ports.

**Frontend `.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

**Backend expects these but also needs CORS properly configured.**

---

### Issue 9: Missing Type Safety Between Frontend/Backend

**Problem:** Frontend TypeScript types (`lib/types.ts`) use camelCase but backend Python sends snake_case:
- Frontend: `isQuestion`, `isFinal`
- Backend: `is_question`, `is_final`

The WebSocket hook does translation, but it's fragile.

---

### Issue 10: No Error Boundaries

**Problem:** React components lack error boundaries. A single crash can break the entire UI.

---

## 🟢 Minor Issues / Improvements

| Issue | Description | Priority |
|-------|-------------|----------|
| No loading states | Components don't show skeletons during load | Low |
| No keyboard shortcuts | Listed but not implemented | Low |
| Search not integrated | SearchPanel exists but not in main layout | Medium |
| Flashcards hidden | FlashcardView exists but not accessible | Medium |
| No export functionality | Export buttons are placeholders | Medium |
| Mobile responsive gaps | Some spacing issues on mobile | Low |

---

## 🛠️ Step-by-Step Fix Guide

### Phase 1: Folder Restructure (30 min)

```bash
# 1. Create new folder structure
cd /Users/kammatiaditya/Downloads/classpilotAi

# 2. Rename folders
mv chat client
mv services server

# 3. Update import paths in server/asr/app.py
# Change: sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Keep as-is since it's relative

# 4. Update root scripts
sed -i '' 's/chat/client/g' start.sh
sed -i '' 's/services/server/g' start.sh
sed -i '' 's/chat/client/g' setup.sh
sed -i '' 's/services/server/g' setup.sh

# 5. Update README.md paths
sed -i '' 's/chat/client/g' README.md
sed -i '' 's/services/server/g' README.md
```

---

### Phase 2: Add Missing Python Inits (5 min)

```bash
# Create __init__.py files
touch server/question_detector/__init__.py
touch server/rag/__init__.py
touch server/notes_generator/__init__.py
touch server/material_processor/__init__.py
```

---

### Phase 3: Fix Browser Audio Capture (45 min)

**Step 3.1:** Create audio capture hook in frontend.

Create file: `client/hooks/use-audio-capture.ts`

```typescript
"use client";

import { useRef, useCallback, useState } from "react";

interface AudioCaptureOptions {
  onAudioData: (data: Float32Array) => void;
  onAudioLevel: (level: number) => void;
  sampleRate?: number;
}

export function useAudioCapture(options: AudioCaptureOptions) {
  const { onAudioData, onAudioLevel, sampleRate = 16000 } = options;
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      const audioContext = new AudioContext({ sampleRate });
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      // For audio level visualization
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      // Process audio chunks
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        onAudioData(new Float32Array(inputData));
        
        // Calculate audio level
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        onAudioLevel(average / 255);
      };

      source.connect(analyser);
      analyser.connect(processor);
      processor.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      processorRef.current = processor;
      streamRef.current = stream;
      
      setIsCapturing(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to access microphone");
      console.error("Audio capture error:", err);
    }
  }, [onAudioData, onAudioLevel, sampleRate]);

  const stopCapture = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  return {
    startCapture,
    stopCapture,
    isCapturing,
    error
  };
}
```

**Step 3.2:** Update `use-websocket.ts` to stream audio.

Add to the hook:
```typescript
const sendAudioChunk = useCallback((audioData: Float32Array) => {
  if (wsRef.current?.readyState === WebSocket.OPEN) {
    // Convert Float32Array to base64
    const buffer = audioData.buffer;
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    wsRef.current.send(JSON.stringify({
      action: "audio_chunk",
      data: base64,
      sample_rate: 16000
    }));
  }
}, []);
```

---

### Phase 4: Fix Backend ASR (60 min)

**Step 4.1:** Replace RealtimeSTT with direct faster-whisper processing.

Update `server/asr/app.py`:

```python
# Add new imports
import base64
import numpy as np
from faster_whisper import WhisperModel

# Initialize Whisper model globally
whisper_model = None

def get_whisper_model():
    global whisper_model
    if whisper_model is None:
        whisper_model = WhisperModel(
            settings.whisper_model,
            device=settings.whisper_device,
            compute_type=settings.whisper_compute_type
        )
    return whisper_model

# Add audio buffer per client
audio_buffers: Dict[str, list] = {}

# In websocket_endpoint, add handler for audio_chunk:
elif action == "audio_chunk":
    audio_data = data.get("data", "")
    sample_rate = data.get("sample_rate", 16000)
    
    # Decode base64 to numpy array
    audio_bytes = base64.b64decode(audio_data)
    audio_array = np.frombuffer(audio_bytes, dtype=np.float32)
    
    # Add to buffer
    if client_id not in audio_buffers:
        audio_buffers[client_id] = []
    audio_buffers[client_id].extend(audio_array.tolist())
    
    # Process when buffer has enough data (e.g., 2 seconds)
    if len(audio_buffers[client_id]) >= sample_rate * 2:
        audio_np = np.array(audio_buffers[client_id], dtype=np.float32)
        audio_buffers[client_id] = []  # Clear buffer
        
        # Transcribe
        model = get_whisper_model()
        segments, info = model.transcribe(audio_np, beam_size=5)
        
        for segment in segments:
            # Send transcript update
            await manager.send({
                "type": "transcript_update",
                "segment": {
                    "id": f"seg-{uuid.uuid4().hex[:8]}",
                    "text": segment.text,
                    "timestamp": segment.start,
                    "is_question": manager.question_detector.detect(segment.text)[0],
                    "confidence": 0.95,
                    "is_final": True
                }
            }, client_id)
```

---

### Phase 5: Add Persistence (30 min)

**Step 5.1:** Add Zustand persist middleware.

Update `client/store/lecture-store.ts`:

```typescript
import { persist } from "zustand/middleware";

export const useLectureStore = create<LectureState>()(
  persist(
    immer((set, get) => ({
      // ... existing state
    })),
    {
      name: "classpilot-storage",
      partialize: (state) => ({
        semesters: state.semesters,
        transcript: state.transcript,
        questions: state.questions,
        notes: state.notes,
      }),
    }
  )
);
```

---

### Phase 6: Add Error Boundaries (15 min)

Create `client/components/error-boundary.tsx`:

```tsx
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-destructive">
          Something went wrong. Please refresh.
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

### Phase 7: Integration Testing (30 min)

Run these commands to verify everything works:

```bash
# Terminal 1: Start backend
cd server
source venv/bin/activate
pip install -r requirements.txt
cd asr
python app.py

# Terminal 2: Start frontend
cd client
npm run dev

# Terminal 3: Test endpoints
curl http://localhost:8000/health
curl http://localhost:8000/

# Open browser
open http://localhost:3000
```

**Manual Test Checklist:**
- [ ] WebSocket connects (green indicator)
- [ ] Click "Start Recording" - should request mic permission
- [ ] Speak into microphone - should see transcript appear
- [ ] Questions detected and answered
- [ ] Click "Stop Recording" - should stop
- [ ] Notes can be added/edited
- [ ] Materials can be uploaded

---

## 📁 Final Folder Structure

After all fixes, the structure should be:

```
classpilotAi/
├── client/                          # Frontend (Next.js 16)
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── dashboard/
│   │   ├── flashcards/
│   │   ├── lecture/
│   │   ├── materials/
│   │   ├── notes/
│   │   ├── search/
│   │   ├── sidebar/
│   │   ├── timeline/
│   │   └── ui/
│   ├── hooks/
│   │   ├── use-websocket.ts
│   │   ├── use-audio-capture.ts    # NEW
│   │   └── use-mobile.ts
│   ├── providers/
│   │   └── websocket-provider.tsx
│   ├── store/
│   │   └── lecture-store.ts
│   ├── lib/
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── package.json
│   └── .env.local
│
├── server/                          # Backend (FastAPI)
│   ├── asr/
│   │   └── app.py                   # Main entry point
│   ├── question_detector/
│   │   ├── __init__.py              # NEW
│   │   └── detector.py
│   ├── rag/
│   │   ├── __init__.py              # NEW
│   │   └── engine.py
│   ├── notes_generator/
│   │   ├── __init__.py              # NEW
│   │   └── generator.py
│   ├── material_processor/
│   │   └── __init__.py              # NEW
│   ├── shared/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── models.py
│   ├── requirements.txt
│   └── .env
│
├── README.md
├── UPGRADE.md                       # This file
├── setup.sh
├── start.sh
└── .gitignore
```

---

## ⏱️ Time Estimates

| Phase | Task | Time |
|-------|------|------|
| 1 | Folder Restructure | 30 min |
| 2 | Add Python Inits | 5 min |
| 3 | Browser Audio Capture | 45 min |
| 4 | Backend ASR Fix | 60 min |
| 5 | Add Persistence | 30 min |
| 6 | Error Boundaries | 15 min |
| 7 | Integration Testing | 30 min |
| **Total** | | **~3.5 hours** |

---

## 🚀 Quick Start After Fixes

```bash
# Clone fresh or apply fixes
cd classpilotAi

# Install system dependencies (macOS)
brew install portaudio ffmpeg

# Setup backend
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Setup frontend
cd ../client
npm install

# Start both (in separate terminals)
# Terminal 1:
cd server && source venv/bin/activate && cd asr && python app.py

# Terminal 2:
cd client && npm run dev

# Open browser
open http://localhost:3000
```

---

## ✅ Success Criteria

The app is considered fully working when:

1. ✅ WebSocket connects automatically on page load
2. ✅ Microphone permission requested on "Start Recording"
3. ✅ Real-time transcription appears as user speaks
4. ✅ Questions are detected and highlighted
5. ✅ AI answers are generated for detected questions
6. ✅ Notes can be created, edited, deleted
7. ✅ Materials can be uploaded and processed
8. ✅ Data persists across page refreshes
9. ✅ App works on both desktop and mobile browsers

---

> **Next Steps:** Follow phases 1-7 sequentially. Each phase builds on the previous one.
