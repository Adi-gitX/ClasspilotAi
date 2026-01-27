"use client";

import { useRef, useEffect } from "react";
import { useLectureStore } from "@/store/lecture-store";
import { cn } from "@/lib/utils";

export function TranscriptView() {
    const textRef = useRef<HTMLDivElement>(null);
    const { transcript, recording } = useLectureStore();
    const { isRecording } = recording;

    // Combine all transcript segments into continuous text
    const fullTranscript = transcript
        .filter(seg => seg.isFinal || seg.text.length > 0)
        .map(seg => seg.text)
        .join(" ");

    // Get the current streaming segment (non-final)
    const streamingSegment = transcript.find(seg => !seg.isFinal);

    // Auto-scroll to bottom when new content arrives
    useEffect(() => {
        if (textRef.current) {
            textRef.current.scrollTop = textRef.current.scrollHeight;
        }
    }, [fullTranscript, streamingSegment]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-medium text-muted-foreground">
                    Live Transcript
                </h3>
                {isRecording && (
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-destructive animate-pulse" />
                        <span className="text-xs text-muted-foreground">Recording</span>
                    </div>
                )}
            </div>

            {/* Main Transcript Area - Single Large Text Box */}
            <div
                ref={textRef}
                className={cn(
                    "flex-1 overflow-y-auto p-6 font-sans text-base leading-relaxed",
                    "bg-background selection:bg-primary/20"
                )}
            >
                {transcript.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <div className="text-4xl mb-4">🎙️</div>
                        <p className="text-lg font-medium">No transcript yet</p>
                        <p className="text-sm mt-2">
                            Click "Start Recording" to begin capturing the lecture
                        </p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto">
                        {/* Continuous transcript text */}
                        <p className="text-foreground whitespace-pre-wrap">
                            {fullTranscript}
                            {/* Show streaming text in different style */}
                            {streamingSegment && (
                                <span className="text-muted-foreground animate-pulse">
                                    {" "}{streamingSegment.text}
                                </span>
                            )}
                            {/* Blinking cursor when recording */}
                            {isRecording && (
                                <span className="inline-block w-0.5 h-5 bg-primary ml-1 animate-pulse" />
                            )}
                        </p>
                    </div>
                )}
            </div>

            {/* Word count footer */}
            {transcript.length > 0 && (
                <div className="px-4 py-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                        {fullTranscript.split(/\s+/).filter(Boolean).length} words
                    </span>
                </div>
            )}
        </div>
    );
}
