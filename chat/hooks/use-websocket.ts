"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useLectureStore } from "@/store/lecture-store";
import { toast } from "sonner";

interface TranscriptSegmentData {
    id: string;
    text: string;
    timestamp: number;
    is_question: boolean;
    confidence: number;
    is_final: boolean;
}

interface QuestionData {
    id: string;
    text: string;
    timestamp: number;
    is_answered?: boolean;
}

interface WebSocketMessage {
    type: string;
    [key: string]: unknown;
}

export function useWebSocket() {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [mode, setMode] = useState<"real" | "demo" | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const clientIdRef = useRef<string>(`client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

    const {
        setConnected,
        setTranscribing,
        addTranscriptSegment,
        updateTranscriptSegment,
        addQuestion,
        answerQuestion,
        transcript
    } = useLectureStore();

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

        try {
            const ws = new WebSocket(`${wsUrl}/ws/${clientIdRef.current}`);

            ws.onopen = () => {
                console.log("✅ WebSocket connected");
                setIsConnected(true);
                setConnected(true);
                toast.success("Connected to ClassPilot AI backend");

                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
            };

            ws.onclose = (event) => {
                console.log("WebSocket disconnected", event.code);
                setIsConnected(false);
                setConnected(false);
                setMode(null);

                // Auto-reconnect after 3 seconds
                if (!reconnectTimeoutRef.current) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log("Attempting to reconnect...");
                        connect();
                    }, 3000);
                }
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
            };

            ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    handleMessage(message);
                } catch (error) {
                    console.error("Failed to parse WebSocket message:", error);
                }
            };

            wsRef.current = ws;
        } catch (error) {
            console.error("Failed to create WebSocket:", error);
        }
    }, [setConnected]);

    const handleMessage = useCallback((message: WebSocketMessage) => {
        switch (message.type) {
            case "status":
                if (message.status === "transcribing") {
                    setTranscribing(true);
                    if (message.mode) {
                        setMode(message.mode as "real" | "demo");
                        toast.info(`Transcription started (${message.mode} mode)`);
                    }
                } else if (message.status === "stopped") {
                    setTranscribing(false);
                    toast.info("Transcription stopped");
                }
                break;

            case "transcript_update":
                const segment = message.segment as TranscriptSegmentData;
                if (segment) {
                    // Check if segment already exists
                    const existingSegment = transcript.find(s => s.id === segment.id);

                    if (segment.is_final) {
                        if (existingSegment) {
                            updateTranscriptSegment(segment.id, {
                                text: segment.text,
                                isQuestion: segment.is_question,
                                confidence: segment.confidence,
                                isFinal: true
                            });
                        } else {
                            addTranscriptSegment({
                                id: segment.id,
                                text: segment.text,
                                timestamp: segment.timestamp,
                                isQuestion: segment.is_question,
                                confidence: segment.confidence,
                                isFinal: true
                            });
                        }
                    } else {
                        // Streaming partial update
                        if (existingSegment) {
                            updateTranscriptSegment(segment.id, {
                                text: segment.text,
                                confidence: segment.confidence
                            });
                        } else {
                            addTranscriptSegment({
                                id: segment.id,
                                text: segment.text,
                                timestamp: segment.timestamp,
                                isQuestion: false,
                                confidence: segment.confidence,
                                isFinal: false
                            });
                        }
                    }
                }
                break;

            case "question_detected":
                const question = message.question as QuestionData;
                if (question) {
                    addQuestion({
                        id: question.id,
                        text: question.text,
                        timestamp: question.timestamp,
                        isAnswered: false
                    });
                    toast("Question Detected", {
                        description: question.text.substring(0, 50) + "...",
                        icon: "❓"
                    });
                }
                break;

            case "question_received":
                const receivedQuestion = message.question as QuestionData;
                if (receivedQuestion) {
                    addQuestion({
                        id: receivedQuestion.id,
                        text: receivedQuestion.text,
                        timestamp: receivedQuestion.timestamp,
                        isAnswered: false
                    });
                }
                break;

            case "answer_generated":
                const questionId = message.question_id as string;
                const answer = message.answer as string;
                const sources = message.sources as string[];
                if (questionId && answer) {
                    answerQuestion(questionId, answer, sources || []);
                    toast.success("Answer generated", {
                        description: "Check the question overlay for details"
                    });
                }
                break;

            case "material_processed":
                toast.success(message.message as string);
                break;

            case "error":
                toast.error(message.message as string || "An error occurred");
                break;

            case "pong":
                // Keep-alive response
                break;

            default:
                console.log("Unknown message type:", message.type, message);
        }
    }, [addTranscriptSegment, updateTranscriptSegment, addQuestion, answerQuestion, setTranscribing, transcript]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    const send = useCallback((data: object) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
            return true;
        }
        return false;
    }, []);

    const startTranscription = useCallback(() => {
        if (send({ action: "start_transcription" })) {
            useLectureStore.getState().clearTranscript();
        } else {
            toast.error("Not connected to backend. Click 'Connect' to retry.");
        }
    }, [send]);

    const stopTranscription = useCallback(() => {
        send({ action: "stop_transcription" });
    }, [send]);

    const askQuestion = useCallback((question: string) => {
        if (!send({ action: "ask_question", question })) {
            toast.error("Not connected to backend");
        }
    }, [send]);

    const uploadMaterial = useCallback((content: string, source: string) => {
        send({ action: "upload_material", content, source });
    }, [send]);

    useEffect(() => {
        // Connect on mount
        connect();

        // Keep-alive ping every 30 seconds
        const pingInterval = setInterval(() => {
            send({ action: "ping" });
        }, 30000);

        return () => {
            clearInterval(pingInterval);
            disconnect();
        };
    }, [connect, disconnect, send]);

    return {
        isConnected,
        mode,
        connect,
        disconnect,
        startTranscription,
        stopTranscription,
        askQuestion,
        uploadMaterial,
        send
    };
}
