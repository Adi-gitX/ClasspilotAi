/**
 * API Client for ClassPilot AI Backend
 * Centralized API calls with error handling
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiResponse<T> {
    data?: T;
    error?: string;
    success: boolean;
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.detail || errorData.error || `HTTP ${response.status}`,
            };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Network error",
        };
    }
}

// ==================== QUESTIONS API ====================

export interface AskQuestionRequest {
    question: string;
    context?: string;
    lecture_id?: string;
}

export interface AskQuestionResponse {
    question_id: string;
    question: string;
    answer: string;
    sources: string[];
    confidence: number;
}

export async function askQuestion(request: AskQuestionRequest): Promise<ApiResponse<AskQuestionResponse>> {
    return apiFetch<AskQuestionResponse>("/api/questions/ask", {
        method: "POST",
        body: JSON.stringify(request),
    });
}

// ==================== SUMMARY API ====================

export interface GenerateSummaryRequest {
    content: string;
    style?: "bullet" | "paragraph" | "cornell";
}

export interface GenerateSummaryResponse {
    summary: string;
    style: string;
    sources: string[];
}

export async function generateSummary(request: GenerateSummaryRequest): Promise<ApiResponse<GenerateSummaryResponse>> {
    return apiFetch<GenerateSummaryResponse>("/api/summary/generate", {
        method: "POST",
        body: JSON.stringify(request),
    });
}

// ==================== FLASHCARDS API ====================

export interface GenerateFlashcardsRequest {
    content: string;
    count?: number;
}

export interface Flashcard {
    id: string;
    question: string;
    answer: string;
}

export interface GenerateFlashcardsResponse {
    flashcards: Flashcard[];
    count: number;
}

export async function generateFlashcards(request: GenerateFlashcardsRequest): Promise<ApiResponse<GenerateFlashcardsResponse>> {
    return apiFetch<GenerateFlashcardsResponse>("/api/flashcards/generate", {
        method: "POST",
        body: JSON.stringify(request),
    });
}

// ==================== MATERIALS API ====================

export interface UploadMaterialResponse {
    id: string;
    name: string;
    type: string;
    size: number;
    status: string;
    content_preview: string;
    message: string;
}

export async function uploadMaterial(file: File, lectureId: string = ""): Promise<ApiResponse<UploadMaterialResponse>> {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("lecture_id", lectureId);

        const response = await fetch(`${API_URL}/api/materials/upload`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.detail || errorData.error || `Upload failed: ${response.status}`,
            };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Upload failed",
        };
    }
}

// ==================== DATABASE SYNC API ====================

export interface SyncDataResponse {
    semesters: unknown[];
    count: number;
    database_available: boolean;
}

export async function syncData(): Promise<ApiResponse<SyncDataResponse>> {
    return apiFetch<SyncDataResponse>("/api/db/sync");
}

// ==================== HEALTH CHECK ====================

export interface HealthResponse {
    status: string;
    timestamp: string;
    connections: number;
    features: {
        whisper: boolean;
        rag: boolean;
        database: boolean;
    };
}

export async function checkHealth(): Promise<ApiResponse<HealthResponse>> {
    return apiFetch<HealthResponse>("/health");
}

export interface FeaturesResponse {
    features: {
        whisper: { available: boolean; model?: string };
        rag: { available: boolean; embedding_model?: string };
        database: { available: boolean; host?: string };
        llm: { model: string; ollama_host: string; openai_configured: boolean };
    };
}

export async function getFeatures(): Promise<ApiResponse<FeaturesResponse>> {
    return apiFetch<FeaturesResponse>("/api/features");
}

// ==================== LECTURE DATA API ====================

export async function getLectureData(lectureId: string) {
    return apiFetch(`/api/db/lecture/${lectureId}/full`);
}

export async function saveNote(lectureId: string, content: string, timestamp: number = 0, isAutoGenerated: boolean = false) {
    return apiFetch("/api/db/notes", {
        method: "POST",
        body: JSON.stringify({
            lecture_id: lectureId,
            content,
            timestamp,
            is_auto_generated: isAutoGenerated,
        }),
    });
}

export async function saveQuestion(lectureId: string, text: string, timestamp: number = 0) {
    return apiFetch("/api/db/questions", {
        method: "POST",
        body: JSON.stringify({
            lecture_id: lectureId,
            text,
            timestamp,
        }),
    });
}

export async function saveFlashcard(lectureId: string, question: string, answer: string) {
    return apiFetch("/api/db/flashcards", {
        method: "POST",
        body: JSON.stringify({
            lecture_id: lectureId,
            question,
            answer,
        }),
    });
}

// ==================== EXPORT ====================

export const api = {
    askQuestion,
    generateSummary,
    generateFlashcards,
    uploadMaterial,
    syncData,
    checkHealth,
    getFeatures,
    getLectureData,
    saveNote,
    saveQuestion,
    saveFlashcard,
};

export default api;
