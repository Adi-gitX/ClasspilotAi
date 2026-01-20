"use client";

import { useLectureStore } from "@/store/lecture-store";
import { Button } from "@/components/ui/button";
import { ClassPilotLogo } from "@/components/ui/classpilot-logo";
import {
    MicIcon,
    BookOpenIcon,
    FolderIcon,
    SparklesIcon,
    ClockIcon,
    TrendingUpIcon,
    FileTextIcon,
    HelpCircleIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardProps {
    onStartLecture: () => void;
}

export function Dashboard({ onStartLecture }: DashboardProps) {
    const { semesters, questions, notes } = useLectureStore();

    const totalLectures = semesters.reduce(
        (acc, sem) => acc + sem.subjects.reduce((a, s) => a + s.lectures.length, 0),
        0
    );
    const totalSubjects = semesters.reduce((acc, sem) => acc + sem.subjects.length, 0);

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
            onClick: () => { }
        },
        {
            icon: FolderIcon,
            label: "Materials",
            description: "Upload lecture materials",
            color: "bg-warning/10 text-warning",
            onClick: () => { }
        },
        {
            icon: SparklesIcon,
            label: "AI Summary",
            description: "Generate lecture summaries",
            color: "bg-success/10 text-success",
            onClick: () => { }
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
                            className={cn(
                                "flex items-start gap-4 p-4 rounded-xl border border-border bg-card",
                                "hover:border-primary/50 hover:bg-muted/30 transition-all text-left",
                                "group"
                            )}
                        >
                            <div className={cn(
                                "size-12 rounded-xl flex items-center justify-center",
                                action.color
                            )}>
                                <action.icon className="size-6" />
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
                        <Button variant="ghost" size="sm">View All</Button>
                    </div>
                    <div className="divide-y divide-border">
                        {semesters[0]?.subjects.slice(0, 2).map((subject) =>
                            subject.lectures.slice(0, 2).map((lecture) => (
                                <div
                                    key={lecture.id}
                                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
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
        </div>
    );
}
