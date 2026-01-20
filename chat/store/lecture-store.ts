import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
    TranscriptSegment,
    Question,
    RecordingState,
    Lecture,
    Subject,
    Semester,
    Note,
    Material
} from "@/lib/types";
import { mockSemesters, mockTranscript } from "@/lib/types";

interface LectureState {
    semesters: Semester[];
    currentSemesterId: string | null;
    currentSubjectId: string | null;
    currentLectureId: string | null;

    transcript: TranscriptSegment[];
    questions: Question[];
    notes: Note[];

    recording: RecordingState;

    isConnected: boolean;
    isTranscribing: boolean;

    setSemesters: (semesters: Semester[]) => void;
    setCurrentSemester: (id: string) => void;
    setCurrentSubject: (id: string) => void;
    setCurrentLecture: (id: string) => void;

    addTranscriptSegment: (segment: TranscriptSegment) => void;
    updateTranscriptSegment: (id: string, updates: Partial<TranscriptSegment>) => void;
    clearTranscript: () => void;

    addQuestion: (question: Question) => void;
    answerQuestion: (id: string, answer: string, sources?: string[]) => void;

    addNote: (note: Note) => void;
    updateNote: (id: string, content: string) => void;
    deleteNote: (id: string) => void;

    startRecording: () => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    stopRecording: () => void;
    updateAudioLevel: (level: number) => void;
    updateDuration: (duration: number) => void;

    setConnected: (connected: boolean) => void;
    setTranscribing: (transcribing: boolean) => void;

    getCurrentLecture: () => Lecture | null;
    getCurrentSubject: () => Subject | null;
    getCurrentSemester: () => Semester | null;
}

export const useLectureStore = create<LectureState>()(
    immer((set, get) => ({
        semesters: mockSemesters,
        currentSemesterId: "sem-1",
        currentSubjectId: "sub-1",
        currentLectureId: "lec-2",

        transcript: mockTranscript,
        questions: [
            {
                id: "q-1",
                text: "Can anyone tell me what is the basic unit of a neural network?",
                timestamp: 28,
                answer: "The basic unit of a neural network is called a **neuron** or **perceptron**. It takes inputs, applies weights, sums them up, and passes through an activation function to produce an output.",
                answerSources: ["Lecture slides", "Previous lecture notes"],
                isAnswered: true
            }
        ],
        notes: [],

        recording: {
            isRecording: false,
            isPaused: false,
            duration: 0,
            audioLevel: 0
        },

        isConnected: false,
        isTranscribing: false,

        setSemesters: (semesters) => set({ semesters }),

        setCurrentSemester: (id) => set({ currentSemesterId: id }),
        setCurrentSubject: (id) => set({ currentSubjectId: id }),
        setCurrentLecture: (id) => set({ currentLectureId: id }),

        addTranscriptSegment: (segment) => set((state) => {
            state.transcript.push(segment);
        }),

        updateTranscriptSegment: (id, updates) => set((state) => {
            const index = state.transcript.findIndex(s => s.id === id);
            if (index !== -1) {
                Object.assign(state.transcript[index], updates);
            }
        }),

        clearTranscript: () => set({ transcript: [] }),

        addQuestion: (question) => set((state) => {
            state.questions.push(question);
        }),

        answerQuestion: (id, answer, sources) => set((state) => {
            const question = state.questions.find(q => q.id === id);
            if (question) {
                question.answer = answer;
                question.answerSources = sources;
                question.isAnswered = true;
            }
        }),

        addNote: (note) => set((state) => {
            state.notes.push(note);
        }),

        updateNote: (id, content) => set((state) => {
            const note = state.notes.find(n => n.id === id);
            if (note) {
                note.content = content;
            }
        }),

        deleteNote: (id) => set((state) => {
            state.notes = state.notes.filter(n => n.id !== id);
        }),

        startRecording: () => set((state) => {
            state.recording.isRecording = true;
            state.recording.isPaused = false;
            state.recording.duration = 0;
        }),

        pauseRecording: () => set((state) => {
            state.recording.isPaused = true;
        }),

        resumeRecording: () => set((state) => {
            state.recording.isPaused = false;
        }),

        stopRecording: () => set((state) => {
            state.recording.isRecording = false;
            state.recording.isPaused = false;
        }),

        updateAudioLevel: (level) => set((state) => {
            state.recording.audioLevel = level;
        }),

        updateDuration: (duration) => set((state) => {
            state.recording.duration = duration;
        }),

        setConnected: (connected) => set({ isConnected: connected }),
        setTranscribing: (transcribing) => set({ isTranscribing: transcribing }),

        getCurrentLecture: () => {
            const state = get();
            for (const semester of state.semesters) {
                for (const subject of semester.subjects) {
                    const lecture = subject.lectures.find(l => l.id === state.currentLectureId);
                    if (lecture) return lecture;
                }
            }
            return null;
        },

        getCurrentSubject: () => {
            const state = get();
            for (const semester of state.semesters) {
                const subject = semester.subjects.find(s => s.id === state.currentSubjectId);
                if (subject) return subject;
            }
            return null;
        },

        getCurrentSemester: () => {
            const state = get();
            return state.semesters.find(s => s.id === state.currentSemesterId) || null;
        }
    }))
);
