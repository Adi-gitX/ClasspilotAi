import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
    TranscriptSegment,
    Question,
    RecordingState,
    Lecture,
    Subject,
    Semester,
    Note,
} from "@/lib/types";
import { generateId, getRandomColor } from "@/lib/types";

interface LectureState {
    // Data
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

    // Navigation setters
    setCurrentSemester: (id: string | null) => void;
    setCurrentSubject: (id: string | null) => void;
    setCurrentLecture: (id: string | null) => void;

    // CRUD: Semesters
    createSemester: (name: string, year: number) => string;
    updateSemester: (id: string, updates: Partial<Pick<Semester, "name" | "year">>) => void;
    deleteSemester: (id: string) => void;

    // CRUD: Subjects
    createSubject: (semesterId: string, name: string, color?: string) => string;
    updateSubject: (id: string, updates: Partial<Pick<Subject, "name" | "color">>) => void;
    deleteSubject: (id: string) => void;

    // CRUD: Lectures
    createLecture: (subjectId: string, title: string) => string;
    updateLecture: (id: string, updates: Partial<Pick<Lecture, "title" | "summary">>) => void;
    deleteLecture: (id: string) => void;

    // Transcript operations
    addTranscriptSegment: (segment: TranscriptSegment) => void;
    updateTranscriptSegment: (id: string, updates: Partial<TranscriptSegment>) => void;
    clearTranscript: () => void;

    // Question operations
    addQuestion: (question: Question) => void;
    answerQuestion: (id: string, answer: string, sources?: string[]) => void;

    // Note operations
    addNote: (note: Note) => void;
    updateNote: (id: string, content: string) => void;
    deleteNote: (id: string) => void;

    // Recording operations
    startRecording: () => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    stopRecording: () => void;
    updateAudioLevel: (level: number) => void;
    updateDuration: (duration: number) => void;

    // Connection state
    setConnected: (connected: boolean) => void;
    setTranscribing: (transcribing: boolean) => void;

    // Getters
    getCurrentLecture: () => Lecture | null;
    getCurrentSubject: () => Subject | null;
    getCurrentSemester: () => Semester | null;
}

export const useLectureStore = create<LectureState>()(
    persist(
        immer((set, get) => ({
            // Start with empty state
            semesters: [],
            currentSemesterId: null,
            currentSubjectId: null,
            currentLectureId: null,

            transcript: [],
            questions: [],
            notes: [],

            recording: {
                isRecording: false,
                isPaused: false,
                duration: 0,
                audioLevel: 0
            },

            isConnected: false,
            isTranscribing: false,

            // Navigation
            setCurrentSemester: (id) => set({ currentSemesterId: id }),
            setCurrentSubject: (id) => set({ currentSubjectId: id }),
            setCurrentLecture: (id) => set({ currentLectureId: id }),

            // CRUD: Semesters
            createSemester: (name, year) => {
                const id = generateId("sem");
                set((state) => {
                    state.semesters.push({
                        id,
                        name,
                        year,
                        isActive: true,
                        subjects: []
                    });
                    state.currentSemesterId = id;
                });
                return id;
            },

            updateSemester: (id, updates) => set((state) => {
                const semester = state.semesters.find(s => s.id === id);
                if (semester) {
                    Object.assign(semester, updates);
                }
            }),

            deleteSemester: (id) => set((state) => {
                state.semesters = state.semesters.filter(s => s.id !== id);
                if (state.currentSemesterId === id) {
                    state.currentSemesterId = state.semesters[0]?.id || null;
                    state.currentSubjectId = null;
                    state.currentLectureId = null;
                }
            }),

            // CRUD: Subjects
            createSubject: (semesterId, name, color) => {
                const id = generateId("sub");
                set((state) => {
                    const semester = state.semesters.find(s => s.id === semesterId);
                    if (semester) {
                        semester.subjects.push({
                            id,
                            name,
                            semesterId,
                            color: color || getRandomColor(),
                            icon: "book",
                            lectures: []
                        });
                        state.currentSubjectId = id;
                    }
                });
                return id;
            },

            updateSubject: (id, updates) => set((state) => {
                for (const semester of state.semesters) {
                    const subject = semester.subjects.find(s => s.id === id);
                    if (subject) {
                        Object.assign(subject, updates);
                        break;
                    }
                }
            }),

            deleteSubject: (id) => set((state) => {
                for (const semester of state.semesters) {
                    semester.subjects = semester.subjects.filter(s => s.id !== id);
                }
                if (state.currentSubjectId === id) {
                    state.currentSubjectId = null;
                    state.currentLectureId = null;
                }
            }),

            // CRUD: Lectures
            createLecture: (subjectId, title) => {
                const id = generateId("lec");
                set((state) => {
                    for (const semester of state.semesters) {
                        const subject = semester.subjects.find(s => s.id === subjectId);
                        if (subject) {
                            subject.lectures.push({
                                id,
                                title,
                                subjectId,
                                startedAt: new Date(),
                                isActive: true,
                                transcript: [],
                                questions: [],
                                notes: [],
                                materials: []
                            });
                            state.currentLectureId = id;
                            break;
                        }
                    }
                });
                return id;
            },

            updateLecture: (id, updates) => set((state) => {
                for (const semester of state.semesters) {
                    for (const subject of semester.subjects) {
                        const lecture = subject.lectures.find(l => l.id === id);
                        if (lecture) {
                            Object.assign(lecture, updates);
                            return;
                        }
                    }
                }
            }),

            deleteLecture: (id) => set((state) => {
                for (const semester of state.semesters) {
                    for (const subject of semester.subjects) {
                        subject.lectures = subject.lectures.filter(l => l.id !== id);
                    }
                }
                if (state.currentLectureId === id) {
                    state.currentLectureId = null;
                }
            }),

            // Transcript
            addTranscriptSegment: (segment) => set((state) => {
                state.transcript.push(segment);
            }),

            updateTranscriptSegment: (id, updates) => set((state) => {
                const index = state.transcript.findIndex(s => s.id === id);
                if (index !== -1) {
                    Object.assign(state.transcript[index], updates);
                }
            }),

            clearTranscript: () => set({ transcript: [], questions: [] }),

            // Questions
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

            // Notes
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

            // Recording
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

            // Connection
            setConnected: (connected) => set({ isConnected: connected }),
            setTranscribing: (transcribing) => set({ isTranscribing: transcribing }),

            // Getters
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
        })),
        {
            name: "classpilot-storage",
            partialize: (state) => ({
                semesters: state.semesters,
                currentSemesterId: state.currentSemesterId,
                currentSubjectId: state.currentSubjectId,
                currentLectureId: state.currentLectureId,
                transcript: state.transcript,
                questions: state.questions,
                notes: state.notes
            }),
        }
    )
);
