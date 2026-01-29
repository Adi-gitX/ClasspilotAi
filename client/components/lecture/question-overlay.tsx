"use client";

import { useState } from "react";
import { useLectureStore } from "@/store/lecture-store";
import { cn } from "@/lib/utils";
import {
    Lightbulb,
    ChevronDown,
    ChevronUp,
    BookOpen,
    ExternalLink,
    Check,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

export function QuestionOverlay() {
    const { questions } = useLectureStore();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    const latestUnanswered = questions.filter(q => !q.isAnswered);
    const latestAnswered = questions.filter(q => q.isAnswered).slice(-3);

    const formatTimestamp = (seconds: number): string => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    if (questions.length === 0) {
        return null;
    }

    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <Button
                    onClick={() => setIsMinimized(false)}
                    className="gap-2 shadow-lg"
                    size="sm"
                >
                    <Lightbulb className="size-4" />
                    {latestUnanswered.length > 0 ? (
                        <span>{latestUnanswered.length} Question{latestUnanswered.length > 1 ? "s" : ""}</span>
                    ) : (
                        <span>Questions</span>
                    )}
                </Button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-[400px] max-h-[60vh] overflow-hidden glass-effect rounded-xl shadow-2xl">
            <div className="flex items-center justify-between p-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-warning/20 flex items-center justify-center">
                        <Lightbulb className="size-4 text-warning" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Question Detected</h3>
                        <p className="text-xs text-muted-foreground">
                            {questions.length} question{questions.length > 1 ? "s" : ""} in this lecture
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setIsMinimized(true)}
                >
                    <X className="size-4" />
                </Button>
            </div>

            <div className="overflow-y-auto max-h-[calc(60vh-60px)] p-3 space-y-3">
                {latestAnswered.map((question) => (
                    <div
                        key={question.id}
                        className={cn(
                            "rounded-lg border border-border/50 overflow-hidden transition-all",
                            expandedId === question.id ? "bg-muted/30" : "bg-card/50"
                        )}
                    >
                        <button
                            onClick={() => setExpandedId(expandedId === question.id ? null : question.id)}
                            className="w-full text-left p-3 hover:bg-muted/30 transition-colors"
                        >
                            <div className="flex items-start gap-2">
                                <div className="size-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Check className="size-3 text-success" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium line-clamp-2">{question.text}</p>
                                    <span className="text-xs text-muted-foreground">
                                        at {formatTimestamp(question.timestamp)}
                                    </span>
                                </div>
                                {expandedId === question.id ? (
                                    <ChevronUp className="size-4 text-muted-foreground flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="size-4 text-muted-foreground flex-shrink-0" />
                                )}
                            </div>
                        </button>

                        {expandedId === question.id && question.answer && (
                            <div className="px-3 pb-3 pt-0">
                                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown>{question.answer}</ReactMarkdown>
                                    </div>
                                    {question.answerSources && question.answerSources.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-border/50">
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                                <BookOpen className="size-3" />
                                                <span>Sources:</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {question.answerSources.map((source, i) => (
                                                    <span
                                                        key={i}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs"
                                                    >
                                                        {source}
                                                        <ExternalLink className="size-3" />
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {latestUnanswered.map((question) => (
                    <div
                        key={question.id}
                        className="rounded-lg border border-warning/50 bg-warning/5 p-3"
                    >
                        <div className="flex items-start gap-2">
                            <div className="size-5 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse">
                                <Lightbulb className="size-3 text-warning" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">{question.text}</p>
                                <span className="text-xs text-muted-foreground">
                                    at {formatTimestamp(question.timestamp)}
                                </span>
                                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <span className="size-1.5 bg-primary rounded-full animate-pulse" />
                                        Finding answer...
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
