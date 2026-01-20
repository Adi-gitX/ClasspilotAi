"use client";

import { useRef, useEffect } from "react";
import { useLectureStore } from "@/store/lecture-store";
import { cn } from "@/lib/utils";
import { HelpCircle, Clock, User, Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function TranscriptView() {
    const { transcript, recording, questions } = useLectureStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const { isRecording } = recording;

    useEffect(() => {
        if (containerRef.current && isRecording) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [transcript, isRecording]);

    const formatTimestamp = (seconds: number): string => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    if (transcript.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Clock className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Transcript Yet</h3>
                <p className="text-muted-foreground max-w-sm">
                    Start recording to begin live transcription. The transcript will appear here in real-time.
                </p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="space-y-6">
            {transcript.map((segment) => {
                const relatedQuestion = questions.find(q =>
                    q.text === segment.text && segment.isQuestion
                );

                return (
                    <div key={segment.id} className="space-y-4">
                        <div className={cn(
                            "flex gap-4",
                            segment.isQuestion && "relative"
                        )}>
                            <Avatar className="size-8 flex-shrink-0">
                                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                    <User className="size-4" />
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Professor</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatTimestamp(segment.timestamp)}
                                    </span>
                                    {segment.isQuestion && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/20 text-warning text-xs font-medium">
                                            <HelpCircle className="size-3" />
                                            Question
                                        </span>
                                    )}
                                </div>
                                <p className={cn(
                                    "text-sm leading-relaxed",
                                    !segment.isFinal && "italic text-muted-foreground"
                                )}>
                                    {segment.text}
                                    {!segment.isFinal && (
                                        <span className="inline-flex gap-0.5 ml-2">
                                            <span className="size-1 bg-primary rounded-full animate-typing" style={{ animationDelay: "0ms" }} />
                                            <span className="size-1 bg-primary rounded-full animate-typing" style={{ animationDelay: "200ms" }} />
                                            <span className="size-1 bg-primary rounded-full animate-typing" style={{ animationDelay: "400ms" }} />
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {relatedQuestion?.isAnswered && relatedQuestion.answer && (
                            <div className="flex gap-4 ml-12">
                                <Avatar className="size-8 flex-shrink-0">
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                        <Bot className="size-4" />
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">ClassPilot AI</span>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                            Silent Answer
                                        </span>
                                    </div>
                                    <div className="rounded-xl bg-muted/50 border border-border/50 p-3">
                                        <p className="text-sm leading-relaxed">
                                            {relatedQuestion.answer}
                                        </p>
                                        {relatedQuestion.answerSources && relatedQuestion.answerSources.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/50">
                                                {relatedQuestion.answerSources.map((source, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                                                    >
                                                        {source}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {isRecording && (
                <div className="flex gap-4">
                    <Avatar className="size-8 flex-shrink-0">
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            <User className="size-4" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="size-2 bg-primary rounded-full animate-pulse" />
                        <span className="text-sm italic">Listening...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
