"use client";

import { useState } from "react";
import { useLectureStore } from "@/store/lecture-store";
import { RecordingControls } from "./recording-controls";
import { TranscriptView } from "./transcript-view";
import { TimelineView } from "@/components/timeline/timeline-view";
import { NotesPanel } from "@/components/notes/notes-panel";
import { MaterialUpload } from "@/components/materials/material-upload";
import { SearchPanel } from "@/components/search/search-panel";
import { FlashcardView } from "@/components/flashcards/flashcard-view";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    FileTextIcon,
    UploadIcon,
    ClockIcon,
    BookOpenIcon,
    MoreVerticalIcon,
    MessageSquareIcon,
    DownloadIcon,
    SparklesIcon,
    PlusIcon,
    SearchIcon,
    ZapIcon
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Tab = "transcript" | "timeline" | "notes" | "search" | "flashcards";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function LectureView() {
    const { getCurrentLecture, getCurrentSubject, recording, transcript, notes, semesters } = useLectureStore();
    const [activeTab, setActiveTab] = useState<Tab>("transcript");
    const [uploadOpen, setUploadOpen] = useState(false);

    const lecture = getCurrentLecture();
    const subject = getCurrentSubject();
    const { isRecording } = recording;

    // Export transcript as markdown file
    const handleExportTranscript = () => {
        if (transcript.length === 0) {
            toast.error("No transcript to export");
            return;
        }

        const fullText = transcript
            .filter(seg => seg.isFinal)
            .map(seg => {
                const minutes = Math.floor(seg.timestamp / 60);
                const seconds = Math.floor(seg.timestamp % 60);
                return `[${minutes}:${seconds.toString().padStart(2, '0')}] ${seg.text}`;
            })
            .join("\n\n");

        const content = `# ${lecture?.title || "Lecture Transcript"}\n\n**Date:** ${new Date().toLocaleDateString()}\n**Duration:** ${Math.floor(recording.duration / 60)}m ${Math.floor(recording.duration % 60)}s\n\n---\n\n${fullText}`;

        const blob = new Blob([content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${lecture?.title || "transcript"}.md`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success("Transcript exported successfully!");
    };

    // Export notes as markdown
    const handleExportNotes = () => {
        if (notes.length === 0) {
            toast.error("No notes to export");
            return;
        }

        const content = notes
            .map(note => `- ${note.content}`)
            .join("\n");

        const fullContent = `# Notes: ${lecture?.title || "Lecture Notes"}\n\n${content}`;

        const blob = new Blob([fullContent], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${lecture?.title || "notes"}-notes.md`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success("Notes exported successfully!");
    };

    // Generate summary using AI
    const handleGenerateSummary = async () => {
        if (transcript.length === 0) {
            toast.error("No transcript to summarize");
            return;
        }

        toast.loading("Generating summary...", { id: "summary" });

        try {
            const fullText = transcript
                .filter(seg => seg.isFinal)
                .map(seg => seg.text)
                .join(" ");

            const response = await fetch(`${API_URL}/api/questions/ask`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: `Please provide a concise summary of this lecture content in bullet points:\n\n${fullText.slice(0, 3000)}`
                })
            });

            const data = await response.json();

            // Download as file
            const content = `# Summary: ${lecture?.title || "Lecture"}\n\n${data.answer}`;
            const blob = new Blob([content], { type: "text/markdown" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${lecture?.title || "summary"}-summary.md`;
            a.click();
            URL.revokeObjectURL(url);

            toast.success("Summary generated and downloaded!", { id: "summary" });
        } catch (error) {
            console.error("Summary error:", error);
            toast.error("Failed to generate summary", { id: "summary" });
        }
    };

    const tabs = [
        { id: "transcript" as Tab, label: "Transcript", icon: MessageSquareIcon },
        { id: "timeline" as Tab, label: "Timeline", icon: ClockIcon },
        { id: "notes" as Tab, label: "Notes", icon: FileTextIcon },
        { id: "flashcards" as Tab, label: "Flashcards", icon: ZapIcon },
        { id: "search" as Tab, label: "Search", icon: SearchIcon },
    ];

    // Empty state when no lecture selected
    if (!lecture) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <BookOpenIcon className="size-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">
                    {semesters.length === 0 ? "Welcome to ClassPilot!" : "No Lecture Selected"}
                </h2>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                    {semesters.length === 0
                        ? "Get started by creating a semester in the sidebar, then add subjects and lectures to begin recording."
                        : "Select a lecture from the sidebar or create a new one to start recording."}
                </p>
                {semesters.length === 0 && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted">
                            <PlusIcon className="size-3" />
                        </span>
                        Click the + button in the sidebar to create a semester
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
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
                            {(lecture.isActive || isRecording) && (
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
                            <DropdownMenuItem onClick={handleExportTranscript}>
                                <DownloadIcon className="size-4 mr-2" />
                                Export Transcript
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportNotes}>
                                <FileTextIcon className="size-4 mr-2" />
                                Export Notes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleGenerateSummary}>
                                <SparklesIcon className="size-4 mr-2" />
                                Generate Summary
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/30 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
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

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden">
                {activeTab === "transcript" && <TranscriptView />}
                {activeTab === "timeline" && (
                    <div className="h-full overflow-y-auto px-4 md:px-8 py-6">
                        <div className="max-w-[800px] mx-auto">
                            <TimelineView />
                        </div>
                    </div>
                )}
                {activeTab === "notes" && (
                    <div className="h-full overflow-y-auto px-4 md:px-8 py-6">
                        <div className="max-w-[800px] mx-auto">
                            <NotesPanel />
                        </div>
                    </div>
                )}
                {activeTab === "flashcards" && (
                    <div className="h-full overflow-y-auto">
                        <FlashcardView />
                    </div>
                )}
                {activeTab === "search" && (
                    <div className="h-full">
                        <SearchPanel />
                    </div>
                )}
            </div>

            {/* Recording Controls */}
            <div className="border-t border-border px-4 md:px-8 py-4 bg-background">
                <div className="max-w-[800px] mx-auto">
                    <RecordingControls />
                </div>
            </div>

            {/* Upload Sheet */}
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
