"use client";

import { useState } from "react";
import { X, Sparkles, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface AnswerModalProps {
    isOpen: boolean;
    onClose: () => void;
    question: string;
    answer: string;
    sources: string[];
    isLoading: boolean;
}

export function AnswerModal({
    isOpen,
    onClose,
    question,
    answer,
    sources,
    isLoading
}: AnswerModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={cn(
                "relative w-full max-w-2xl max-h-[80vh] mx-4",
                "bg-card border border-border rounded-2xl shadow-2xl",
                "flex flex-col overflow-hidden",
                "animate-in fade-in zoom-in-95 duration-200"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Sparkles className="size-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold">AI Answer</h2>
                            <p className="text-xs text-muted-foreground">Generated from lecture context</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full"
                    >
                        <X className="size-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Question Context */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Question Context
                        </label>
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                            <p className="text-sm italic text-muted-foreground">
                                "{question}"
                            </p>
                        </div>
                    </div>

                    {/* Answer */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            AI Response
                        </label>
                        {isLoading ? (
                            <div className="flex items-center gap-3 p-6 rounded-lg bg-muted/30">
                                <Loader2 className="size-5 animate-spin text-primary" />
                                <span className="text-muted-foreground">Generating answer...</span>
                            </div>
                        ) : (
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown>{answer}</ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sources */}
                    {sources.length > 0 && !isLoading && (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                <BookOpen className="size-3" />
                                Sources
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {sources.map((source, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 text-xs rounded-full bg-muted border border-border"
                                    >
                                        {source}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/30">
                    <Button onClick={onClose} className="w-full">
                        Got it, thanks!
                    </Button>
                </div>
            </div>
        </div>
    );
}
