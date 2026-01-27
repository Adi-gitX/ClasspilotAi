"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Mic, MicOff, Pause, Play, Square, Circle, Wifi, WifiOff, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLectureStore } from "@/store/lecture-store";
import { useWebSocketContext } from "@/providers/websocket-provider";
import { useAudioCapture } from "@/hooks/use-audio-capture";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useDeepgram } from "@/hooks/use-deepgram";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AnswerModal } from "./answer-modal";
import { getGeminiKey, getApiUrl, getDeepgramKey } from "@/components/settings/settings-modal";

export function RecordingControls() {
    const {
        recording,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        isTranscribing,
        clearTranscript,
        updateAudioLevel,
        transcript
    } = useLectureStore();

    const {
        isConnected: wsConnected,
        startTranscription,
        stopTranscription,
        sendAudioChunk,
        askQuestion,
        connect
    } = useWebSocketContext();

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioLevelRef = useRef<number>(0);
    const { isRecording, isPaused, duration, audioLevel } = recording;

    // Answer modal state
    const [showAnswerModal, setShowAnswerModal] = useState(false);
    const [answerQuestion, setAnswerQuestion] = useState("");
    const [answerText, setAnswerText] = useState("");
    const [answerSources, setAnswerSources] = useState<string[]>([]);
    const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
    const segmentIdRef = useRef(0);
    const [useDeepgramMode, setUseDeepgramMode] = useState(false);

    // Transcript handler for both speech recognition methods
    const handleTranscript = useCallback((text: string, isFinal: boolean) => {
        if (text.trim()) {
            const segmentId = isFinal ? `final-${segmentIdRef.current++}` : `interim-${segmentIdRef.current}`;
            useLectureStore.getState().addTranscriptSegment({
                id: segmentId,
                text: text.trim(),
                timestamp: Date.now() / 1000,
                isFinal,
                isQuestion: text.includes("?"),
                confidence: isFinal ? 0.95 : 0.7
            });
        }
    }, []);

    // Deepgram (high accuracy - used when API key is available)
    const deepgramKey = getDeepgramKey();
    const {
        startListening: startDeepgram,
        stopListening: stopDeepgram,
        isListening: isDeepgramListening,
        error: deepgramError
    } = useDeepgram({
        apiKey: deepgramKey,
        onTranscript: handleTranscript,
        onError: (error) => {
            toast.error(`Deepgram: ${error}`);
        }
    });

    // Browser Speech Recognition (fallback when no Deepgram key)
    const {
        startListening: startWebSpeech,
        stopListening: stopWebSpeech,
        isListening: isWebSpeechListening,
        isSupported: speechSupported,
        error: speechError
    } = useSpeechRecognition({
        onTranscript: handleTranscript,
        onError: (error) => {
            toast.error(`Speech recognition: ${error}`);
        }
    });

    const isListening = isDeepgramListening || isWebSpeechListening;

    // Audio capture hook (for visualizer only)
    const {
        startCapture,
        stopCapture,
        isCapturing,
        error: audioError,
        permissionDenied
    } = useAudioCapture({
        onAudioData: useCallback((data: Float32Array) => {
            // Audio visualizer only
        }, []),
        onAudioLevel: useCallback((level: number) => {
            audioLevelRef.current = level;
            updateAudioLevel(level);
        }, [updateAudioLevel]),
        sampleRate: 16000
    });

    // Timer effect
    useEffect(() => {
        if (isRecording && !isPaused) {
            timerRef.current = setInterval(() => {
                useLectureStore.getState().updateDuration(
                    useLectureStore.getState().recording.duration + 1
                );
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isRecording, isPaused]);

    // Show audio error toast
    useEffect(() => {
        if (audioError) {
            toast.error(audioError);
        }
    }, [audioError]);

    const formatTime = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        }
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const handleStartRecording = async () => {
        if (!speechSupported) {
            toast.error("Speech recognition not supported in this browser. Try Chrome or Edge.");
            return;
        }

        clearTranscript();
        startRecording();
        await startCapture();

        // Use Deepgram if API key available, otherwise Web Speech API
        if (deepgramKey) {
            await startDeepgram();
            setUseDeepgramMode(true);
            toast.success("🎤 Recording with Deepgram (high accuracy)");
        } else {
            startWebSpeech();
            setUseDeepgramMode(false);
            toast.success("🎤 Recording with browser speech recognition");
        }
    };

    const handlePauseResume = async () => {
        if (isPaused) {
            resumeRecording();
            await startCapture();
            if (useDeepgramMode && deepgramKey) {
                await startDeepgram();
            } else {
                startWebSpeech();
            }
        } else {
            pauseRecording();
            stopCapture();
            if (useDeepgramMode) {
                stopDeepgram();
            } else {
                stopWebSpeech();
            }
        }
    };

    const handleStopRecording = () => {
        stopRecording();
        stopCapture();
        if (useDeepgramMode) {
            stopDeepgram();
        } else {
            stopWebSpeech();
        }
        toast.info("Recording stopped");
    };

    // EMERGENCY QUESTION - Get AI answer from recent transcript
    const handleEmergencyQuestion = async () => {
        // Get the last ~500 characters of transcript as context
        const fullText = transcript
            .filter(seg => seg.isFinal)
            .map(seg => seg.text)
            .join(" ");

        const context = fullText.slice(-500).trim();

        if (!context) {
            toast.error("No transcript available yet. Start recording first.");
            return;
        }

        setAnswerQuestion(context);
        setAnswerText("");
        setAnswerSources([]);
        setIsLoadingAnswer(true);
        setShowAnswerModal(true);

        try {
            const apiUrl = getApiUrl();
            const geminiKey = getGeminiKey();
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (geminiKey) headers["Authorization"] = `Bearer ${geminiKey}`;

            const response = await fetch(`${apiUrl}/api/questions/ask`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    question: `Based on this lecture context, what is the professor likely asking about? Context: "${context}"`
                })
            });

            const data = await response.json();
            setAnswerText(data.answer || "Could not generate an answer.");
            setAnswerSources(data.sources || ["Lecture context"]);
        } catch (error) {
            console.error("Error getting answer:", error);
            setAnswerText("Failed to get AI answer. Please check if the backend is running.");
        } finally {
            setIsLoadingAnswer(false);
        }
    };

    // Calculate audio level bar heights
    const getBarHeight = (index: number): number => {
        if (isPaused || !isRecording) return 4;
        const level = audioLevelRef.current;
        const base = level * 24;
        const variation = Math.sin((Date.now() / 200) + index) * 4;
        return Math.max(4, Math.min(24, base + variation));
    };

    return (
        <>
            <div className="rounded-2xl border border-border bg-secondary dark:bg-card p-1">
                <div className="rounded-xl border border-border dark:border-transparent bg-card dark:bg-secondary p-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left side: Recording status and controls */}
                        <div className="flex items-center gap-3">
                            {isRecording && (
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "size-3 rounded-full",
                                        isPaused ? "bg-warning" : "bg-destructive animate-pulse-recording"
                                    )} />
                                    <span className="font-mono text-sm font-medium min-w-[60px]">
                                        {formatTime(duration)}
                                    </span>
                                </div>
                            )}

                            {!isRecording ? (
                                <Button
                                    onClick={handleStartRecording}
                                    size="default"
                                    className="gap-2 bg-destructive hover:bg-destructive/90"
                                    disabled={permissionDenied}
                                >
                                    {permissionDenied ? (
                                        <>
                                            <MicOff className="size-4" />
                                            Mic Blocked
                                        </>
                                    ) : (
                                        <>
                                            <Circle className="size-4 fill-current" />
                                            Start Recording
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={handlePauseResume}
                                        variant="secondary"
                                        size="icon"
                                        className="rounded-full"
                                    >
                                        {isPaused ? (
                                            <Play className="size-4" />
                                        ) : (
                                            <Pause className="size-4" />
                                        )}
                                    </Button>
                                    <Button
                                        onClick={handleStopRecording}
                                        variant="outline"
                                        size="icon"
                                        className="rounded-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    >
                                        <Square className="size-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Center: Audio level visualization */}
                        {isRecording && (
                            <div className="flex items-center gap-2">
                                <div className="flex items-end gap-0.5 h-6">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-1 bg-primary rounded-full transition-all duration-75"
                                            style={{ height: `${getBarHeight(i)}px` }}
                                        />
                                    ))}
                                </div>
                                <span className="text-xs text-muted-foreground hidden sm:inline">
                                    {isPaused ? "Paused" : isListening ? "🎤 Listening..." : "Starting..."}
                                </span>
                            </div>
                        )}

                        {/* Right side: Emergency Question Button + Connection */}
                        <div className="flex items-center gap-3">
                            {/* EMERGENCY QUESTION BUTTON */}
                            <Button
                                onClick={handleEmergencyQuestion}
                                variant="default"
                                size="default"
                                className={cn(
                                    "gap-2 font-semibold",
                                    "bg-gradient-to-r from-amber-500 to-orange-500",
                                    "hover:from-amber-600 hover:to-orange-600",
                                    "text-white shadow-lg shadow-orange-500/25",
                                    "animate-pulse"
                                )}
                                disabled={transcript.length === 0}
                            >
                                <Zap className="size-4" />
                                <span className="hidden sm:inline">Emergency Question</span>
                                <span className="sm:hidden">❓</span>
                            </Button>

                            {/* Connection status */}
                            {audioError && (
                                <div className="flex items-center gap-1.5 text-destructive">
                                    <AlertCircle className="size-4" />
                                </div>
                            )}
                            {wsConnected ? (
                                <div className="flex items-center gap-1.5 text-success">
                                    <Wifi className="size-4" />
                                    <span className="text-xs hidden sm:inline">Connected</span>
                                </div>
                            ) : (
                                <Button
                                    onClick={connect}
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                                >
                                    <WifiOff className="size-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Answer Modal */}
            <AnswerModal
                isOpen={showAnswerModal}
                onClose={() => setShowAnswerModal(false)}
                question={answerQuestion}
                answer={answerText}
                sources={answerSources}
                isLoading={isLoadingAnswer}
            />
        </>
    );
}
