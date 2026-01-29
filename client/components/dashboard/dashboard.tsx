"use client";

import { useLectureStore } from "@/store/lecture-store";
import { Button } from "@/components/ui/button";
import { ClassPilotLogo } from "@/components/ui/classpilot-logo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MaterialUpload } from "@/components/materials/material-upload";
import { toast } from "sonner";
import {
    MicIcon,
    BookOpenIcon,
    FolderIcon,
    SparklesIcon,
    ClockIcon,
    TrendingUpIcon,
    FileTextIcon,
    HelpCircleIcon,
    Loader2Icon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface DashboardProps {
    onStartLecture: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function Dashboard({ onStartLecture }: DashboardProps) {
    const { semesters, questions, notes, transcript, getCurrentLecture } = useLectureStore();
    const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

    const totalLectures = semesters.reduce(
        (acc, sem) => acc + sem.subjects.reduce((a, s) => a + s.lectures.length, 0),
        0
    );
    const totalSubjects = semesters.reduce((acc, sem) => acc + sem.subjects.length, 0);

    const handleViewNotes = () => {
        const lecture = getCurrentLecture();
        if (!lecture) {
            toast.info("Select a lecture first to view notes");
            return;
        }
        onStartLecture();
        // The lecture view will show the notes tab
        toast.info("Switch to the Notes tab in the lecture view");
    };

    const handleAISummary = async () => {
        const lecture = getCurrentLecture();
        if (!lecture) {
            toast.info("Select a lecture first to generate a summary");
            return;
        }

        if (transcript.length === 0) {
            toast.info("No transcript content to summarize. Start recording first.");
            return;
        }

        setIsGeneratingSummary(true);
        toast.loading("Generating AI summary...", { id: "summary" });

        try {
            const transcriptText = transcript
                .filter(s => s.isFinal)
                .map(s => s.text)
                .join(" ");

            const response = await fetch(`${API_URL}/api/questions/ask`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: `Generate a comprehensive summary of this lecture:\n\n${transcriptText.slice(0, 3000)}`
                })
            });

            const data = await response.json();
            const summary = data.answer || "Could not generate summary.";

            // Download as markdown
            const blob = new Blob([`# ${lecture.title} - Summary\n\n${summary}`], { type: "text/markdown" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${lecture.title.replace(/\s+/g, "_")}_summary.md`;
            a.click();
            URL.revokeObjectURL(url);

            toast.success("Summary generated and downloaded!", { id: "summary" });
        } catch (error) {
            console.error("Summary error:", error);
            toast.error("Failed to generate summary", { id: "summary" });
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const quickActions = [
        {
            icon: MicIcon,
            label: "Start Recording",
            description: "Begin a new lecture session",
            color: "bg-destructive/10 text-destructive",
            onClick: onStartLecture
        },
        {
            icon: BookOpenIcon,
            label: "View Notes",
            description: "Browse all your notes",
            color: "bg-primary/10 text-primary",
            onClick: handleViewNotes
        },
        {
            icon: FolderIcon,
            label: "Materials",
            description: "Upload lecture materials",
            color: "bg-warning/10 text-warning",
            onClick: () => setIsMaterialsOpen(true)
        },
        {
            icon: isGeneratingSummary ? Loader2Icon : SparklesIcon,
            label: isGeneratingSummary ? "Generating..." : "AI Summary",
            description: "Generate lecture summaries",
            color: "bg-success/10 text-success",
            onClick: handleAISummary,
            disabled: isGeneratingSummary
        }
    ];

    const stats = [
        { label: "Lectures", value: totalLectures, icon: ClockIcon },
        { label: "Subjects", value: totalSubjects, icon: FolderIcon },
        { label: "Questions", value: questions.length, icon: HelpCircleIcon },
        { label: "Notes", value: notes.length, icon: FileTextIcon }
    ];

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-[900px] mx-auto px-4 md:px-8 py-12">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center mb-6">
                        <ClassPilotLogo className="scale-150" />
                    </div>
                    <h1 className="text-3xl font-bold mb-3">Welcome to ClassPilot AI</h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Your intelligent classroom copilot for real-time transcription,
                        question detection, and smart note-taking.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-xl border border-border bg-card p-4 text-center"
                        >
                            <stat.icon className="size-5 text-muted-foreground mx-auto mb-2" />
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {quickActions.map((action) => (
                        <button
                            key={action.label}
                            onClick={action.onClick}
                            disabled={action.disabled}
                            className={cn(
                                "flex items-start gap-4 p-4 rounded-xl border border-border bg-card",
                                "hover:border-primary/50 hover:bg-muted/30 transition-all text-left",
                                "group disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            <div className={cn(
                                "size-12 rounded-xl flex items-center justify-center",
                                action.color
                            )}>
                                <action.icon className={cn(
                                    "size-6",
                                    action.disabled && "animate-spin"
                                )} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold group-hover:text-primary transition-colors">
                                    {action.label}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {action.description}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <h2 className="font-semibold flex items-center gap-2">
                            <ClockIcon className="size-4" />
                            Recent Lectures
                        </h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                if (totalLectures === 0) {
                                    toast.info("No lectures yet. Create one from the sidebar!");
                                } else {
                                    onStartLecture();
                                }
                            }}
                        >
                            View All
                        </Button>
                    </div>
                    <div className="divide-y divide-border">
                        {semesters.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <p>No lectures yet. Create a semester from the sidebar to get started!</p>
                            </div>
                        ) : (
                            semesters[0]?.subjects.slice(0, 2).map((subject) =>
                                subject.lectures.slice(0, 2).map((lecture) => (
                                    <div
                                        key={lecture.id}
                                        className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                                        onClick={() => {
                                            const store = useLectureStore.getState();
                                            store.setCurrentSemester(semesters[0].id);
                                            store.setCurrentSubject(subject.id);
                                            store.setCurrentLecture(lecture.id);
                                            onStartLecture();
                                        }}
                                    >
                                        <div
                                            className="size-3 rounded-full"
                                            style={{ backgroundColor: subject.color }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{lecture.title}</p>
                                            <p className="text-sm text-muted-foreground">{subject.name}</p>
                                        </div>
                                        <div className="text-right text-sm text-muted-foreground">
                                            {lecture.isActive ? (
                                                <span className="flex items-center gap-1 text-destructive">
                                                    <span className="size-2 rounded-full bg-destructive animate-pulse" />
                                                    Live
                                                </span>
                                            ) : (
                                                <span>{lecture.duration ? `${lecture.duration}m` : '--'}</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>

                <div className="mt-8 p-4 rounded-xl border border-primary/20 bg-primary/5">
                    <div className="flex items-start gap-3">
                        <div className="size-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <TrendingUpIcon className="size-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-medium">Pro Tip</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Upload your lecture slides before class for better question detection
                                and more accurate AI-generated answers.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Materials Upload Sheet */}
            <Sheet open={isMaterialsOpen} onOpenChange={setIsMaterialsOpen}>
                <SheetContent side="right" className="w-[400px] sm:w-[500px]">
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold">Upload Materials</h2>
                            <p className="text-sm text-muted-foreground">
                                Upload lecture slides, PDFs, or images for better AI context.
                            </p>
                        </div>
                        <MaterialUpload />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
