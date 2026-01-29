"use client";

import { useLectureStore } from "@/store/lecture-store";
import { cn } from "@/lib/utils";
import {
    HelpCircleIcon,
    MessageSquareIcon,
    BookOpenIcon,
    ImageIcon,
} from "lucide-react";

interface TimelineEvent {
    id: string;
    type: "question" | "topic" | "note" | "material";
    timestamp: number;
    title: string;
    description?: string;
}

export function TimelineView() {
    const { transcript, questions, notes, recording } = useLectureStore();

    const events: TimelineEvent[] = [
        ...questions.map(q => ({
            id: q.id,
            type: "question" as const,
            timestamp: q.timestamp,
            title: q.text.length > 50 ? q.text.substring(0, 50) + "..." : q.text,
            description: q.isAnswered ? "Answered" : "Pending"
        })),
        ...transcript.filter(t => t.isQuestion).map(t => ({
            id: `t-${t.id}`,
            type: "topic" as const,
            timestamp: t.timestamp,
            title: "Topic discussed",
            description: t.text.substring(0, 50) + "..."
        })),
        ...notes.map(n => ({
            id: n.id,
            type: "note" as const,
            timestamp: n.timestamp,
            title: "Note added",
            description: n.content.substring(0, 50) + "..."
        }))
    ].sort((a, b) => a.timestamp - b.timestamp);

    const formatTimestamp = (seconds: number): string => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const getEventIcon = (type: TimelineEvent["type"]) => {
        switch (type) {
            case "question": return HelpCircleIcon;
            case "topic": return MessageSquareIcon;
            case "note": return BookOpenIcon;
            case "material": return ImageIcon;
        }
    };

    const getEventColor = (type: TimelineEvent["type"]) => {
        switch (type) {
            case "question": return "bg-warning/10 text-warning";
            case "topic": return "bg-primary/10 text-primary";
            case "note": return "bg-success/10 text-success";
            case "material": return "bg-blue-500/10 text-blue-500";
        }
    };

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <div className="size-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                    <span className="font-mono text-xl text-muted-foreground">00:00</span>
                </div>
                <h3 className="text-lg font-medium mb-1">Timeline Empty</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                    Events will appear here as the lecture progresses.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pl-4 py-4 relative">
            {/* Subtle vertical line */}
            <div className="absolute left-[27px] top-6 bottom-6 w-px bg-border/40" />

            {events.map((event, index) => {
                const Icon = getEventIcon(event.type);
                const colorClass = getEventColor(event.type);

                return (
                    <div key={event.id} className="relative pl-12 group">
                        <div className={cn(
                            "absolute left-2 top-0 size-8 rounded-full flex items-center justify-center border border-background ring-4 ring-background transition-colors",
                            colorClass
                        )}>
                            <Icon className="size-3.5" />
                        </div>

                        <div className="flex flex-col gap-1 items-start">
                            <div className="inline-flex items-center gap-2">
                                <span className="font-mono text-xs text-muted-foreground">
                                    {formatTimestamp(event.timestamp)}
                                </span>
                                <span className="text-sm font-medium text-foreground">{event.title}</span>
                            </div>
                            {event.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                    {event.description}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}

            {recording.isRecording && (
                <div className="relative pl-12 pt-4">
                    <div className="absolute left-2 size-8 rounded-full bg-background flex items-center justify-center ring-4 ring-background z-10">
                        <div className="size-2.5 bg-red-500 rounded-full animate-pulse" />
                    </div>
                    <div className="text-sm text-muted-foreground pt-1.5 pl-1 italic">
                        Current time: {formatTimestamp(recording.duration)}
                    </div>
                </div>
            )}
        </div>
    );
}
