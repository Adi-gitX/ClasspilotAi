"use client";

import { useEffect, useRef } from "react";
import { Mic, MicOff, Pause, Play, Square, Circle, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLectureStore } from "@/store/lecture-store";
import { useWebSocket } from "@/hooks/use-websocket";
import { cn } from "@/lib/utils";

export function RecordingControls() {
    const {
        recording,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        isConnected,
        isTranscribing,
        clearTranscript
    } = useLectureStore();

    const {
        isConnected: wsConnected,
        startTranscription,
        stopTranscription,
        connect
    } = useWebSocket();

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const { isRecording, isPaused, duration } = recording;

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

    const formatTime = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        }
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const handleStartRecording = () => {
        clearTranscript();
        startRecording();
        startTranscription();
    };

    const handlePauseResume = () => {
        if (isPaused) {
            resumeRecording();
            startTranscription();
        } else {
            pauseRecording();
            stopTranscription();
        }
    };

    const handleStopRecording = () => {
        stopRecording();
        stopTranscription();
    };

    return (
        <div className="rounded-2xl border border-border bg-secondary dark:bg-card p-1">
            <div className="rounded-xl border border-border dark:border-transparent bg-card dark:bg-secondary p-4">
                <div className="flex items-center justify-between gap-4">
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
                            >
                                <Circle className="size-4 fill-current" />
                                Start Recording
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

                    {isRecording && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-end gap-0.5 h-6">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-1 bg-primary rounded-full transition-all duration-150",
                                            isPaused ? "h-1" : "animate-wave"
                                        )}
                                        style={{
                                            animationDelay: `${i * 0.1}s`,
                                            height: isPaused ? "4px" : `${Math.max(4, Math.random() * 20)}px`
                                        }}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                                {isPaused ? "Paused" : isTranscribing ? "Transcribing..." : "Listening..."}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
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
                                <span className="text-xs hidden sm:inline">Connect</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
