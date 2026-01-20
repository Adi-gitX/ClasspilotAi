"use client";

import { useState } from "react";
import { useLectureStore } from "@/store/lecture-store";
import { RecordingControls } from "./recording-controls";
import { TranscriptView } from "./transcript-view";
import { QuestionOverlay } from "./question-overlay";
import { TimelineView } from "@/components/timeline/timeline-view";
import { NotesPanel } from "@/components/notes/notes-panel";
import { MaterialUpload } from "@/components/materials/material-upload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    FileTextIcon,
    UploadIcon,
    ClockIcon,
    BookOpenIcon,
    MoreVerticalIcon,
    SendIcon,
    SparklesIcon,
    ListIcon,
    MessageSquareIcon
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Tab = "transcript" | "timeline" | "notes";

export function LectureView() {
    const { getCurrentLecture, getCurrentSubject, recording, addQuestion, answerQuestion } = useLectureStore();
    const [askInput, setAskInput] = useState("");
    const [activeTab, setActiveTab] = useState<Tab>("transcript");
    const [uploadOpen, setUploadOpen] = useState(false);

    const lecture = getCurrentLecture();
    const subject = getCurrentSubject();
    const { isRecording } = recording;

    const handleAskQuestion = () => {
        if (!askInput.trim()) return;

        const questionId = `manual-${Date.now()}`;
        addQuestion({
            id: questionId,
            text: askInput,
            timestamp: recording.duration,
            isAnswered: false
        });

        setTimeout(() => {
            answerQuestion(
                questionId,
                "Based on the lecture context and your uploaded materials, here's what I found relevant to your question. The answer incorporates information from the current lecture transcript and any previously uploaded materials.",
                ["Current lecture", "Uploaded materials"]
            );
        }, 1500);

        setAskInput("");
    };

    const tabs = [
        { id: "transcript" as Tab, label: "Transcript", icon: MessageSquareIcon },
        { id: "timeline" as Tab, label: "Timeline", icon: ClockIcon },
        { id: "notes" as Tab, label: "Notes", icon: FileTextIcon },
    ];

    if (!lecture) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <BookOpenIcon className="size-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No Lecture Selected</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    Select a lecture from the sidebar or start a new recording session.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                    {subject && (
                        <div
                            className="size-3 rounded-full"
                            style={{ backgroundColor: subject.color }}
                        />
                    )}
                    <div>
                        <h1 className="text-lg font-semibold">{lecture.title}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {subject && <span>{subject.name}</span>}
                            {lecture.isActive && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-destructive">
                                        <span className="size-2 rounded-full bg-destructive animate-pulse" />
                                        Live
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setUploadOpen(true)}
                    >
                        <UploadIcon className="size-4" />
                        <span className="hidden sm:inline">Upload</span>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                                <MoreVerticalIcon className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Export Transcript</DropdownMenuItem>
                            <DropdownMenuItem>Export Notes</DropdownMenuItem>
                            <DropdownMenuItem>Generate Summary</DropdownMenuItem>
                            <DropdownMenuItem>Create Flashcards</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/30">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                            activeTab === tab.id
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        <tab.icon className="size-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
                <div className="max-w-[800px] mx-auto">
                    {activeTab === "transcript" && <TranscriptView />}
                    {activeTab === "timeline" && <TimelineView />}
                    {activeTab === "notes" && <NotesPanel />}
                </div>
            </div>

            <div className="border-t border-border px-4 md:px-8 py-4">
                <div className="max-w-[800px] mx-auto space-y-4">
                    <div className="rounded-2xl border border-border bg-secondary dark:bg-card p-1">
                        <div className="rounded-xl border border-border dark:border-transparent bg-card dark:bg-secondary">
                            <Textarea
                                placeholder="Ask a question about the lecture..."
                                value={askInput}
                                onChange={(e) => setAskInput(e.target.value)}
                                className="min-h-[60px] resize-none border-0 bg-transparent px-4 py-3 text-base placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAskQuestion();
                                    }
                                }}
                            />
                            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-1.5 h-7 text-muted-foreground hover:text-foreground"
                                    >
                                        <SparklesIcon className="size-4" />
                                        <span className="text-xs">AI Assist</span>
                                    </Button>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={handleAskQuestion}
                                    disabled={!askInput.trim()}
                                    className="h-7 px-4 gap-2"
                                >
                                    <SendIcon className="size-3" />
                                    Ask
                                </Button>
                            </div>
                        </div>
                    </div>

                    <RecordingControls />
                </div>
            </div>

            <QuestionOverlay />

            <Sheet open={uploadOpen} onOpenChange={setUploadOpen}>
                <SheetContent side="right" className="w-[400px]">
                    <SheetHeader>
                        <SheetTitle>Upload Materials</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                        <MaterialUpload />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
