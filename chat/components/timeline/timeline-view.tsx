"use client";

import { useLectureStore } from "@/store/lecture-store";
import { cn } from "@/lib/utils";
import {
    HelpCircleIcon,
    MessageSquareIcon,
    BookOpenIcon,
    ImageIcon,
    PlayIcon
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
            case "question": return "bg-warning/20 text-warning border-warning/30";
            case "topic": return "bg-primary/20 text-primary border-primary/30";
            case "note": return "bg-success/20 text-success border-success/30";
            case "material": return "bg-info/20 text-info border-info/30";
        }
    };

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <div className="size-14 rounded-full bg-muted flex items-center justify-center mb-4">
                    <PlayIcon className="size-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Timeline Events</h3>
                <p className="text-muted-foreground max-w-sm">
                    Timeline events will appear here as you record and interact with the lecture.
                </p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

                <div className="space-y-4">
                    {events.map((event, index) => {
                        const Icon = getEventIcon(event.type);
                        const colorClass = getEventColor(event.type);

                        return (
                            <div key={event.id} className="relative pl-10">
                                <div className={cn(
                                    "absolute left-2 size-5 rounded-full border-2 flex items-center justify-center",
                                    colorClass
                                )}>
                                    <Icon className="size-3" />
                                </div>

                                <div className="rounded-lg border border-border p-3 hover:border-primary/30 transition-colors cursor-pointer">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className={cn(
                                            "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
                                            colorClass
                                        )}>
                                            {event.type}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {formatTimestamp(event.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium">{event.title}</p>
                                    {event.description && (
                                        <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {recording.isRecording && (
                    <div className="relative pl-10 mt-4">
                        <div className="absolute left-2 size-5 rounded-full bg-destructive flex items-center justify-center animate-pulse">
                            <div className="size-2 rounded-full bg-white" />
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>Recording in progress...</span>
                            <span className="font-mono">{formatTimestamp(recording.duration)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
