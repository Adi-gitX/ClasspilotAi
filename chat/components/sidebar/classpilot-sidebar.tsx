"use client";

import { useState } from "react";
import { useLectureStore } from "@/store/lecture-store";
import { cn } from "@/lib/utils";
import { ClassPilotLogo } from "@/components/ui/classpilot-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    SearchIcon,
    HomeIcon,
    BookOpenIcon,
    FolderIcon,
    SettingsIcon,
    PlusIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    MicIcon,
    FileTextIcon,
    BrainIcon,
    DatabaseIcon,
    NetworkIcon
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
    brain: BrainIcon,
    database: DatabaseIcon,
    network: NetworkIcon,
    default: BookOpenIcon
};

export function ClassPilotSidebar() {
    const {
        semesters,
        currentSemesterId,
        currentSubjectId,
        currentLectureId,
        setCurrentSemester,
        setCurrentSubject,
        setCurrentLecture
    } = useLectureStore();

    const [expandedSemesters, setExpandedSemesters] = useState<string[]>([currentSemesterId || ""]);
    const [expandedSubjects, setExpandedSubjects] = useState<string[]>([currentSubjectId || ""]);

    const toggleSemester = (id: string) => {
        setExpandedSemesters(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const toggleSubject = (id: string) => {
        setExpandedSubjects(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    return (
        <div className="flex h-full w-full flex-col bg-sidebar border-r border-sidebar-border">
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                <ClassPilotLogo showText />
            </div>

            <div className="p-3">
                <div className="relative flex items-center">
                    <SearchIcon className="absolute left-3 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search lectures..."
                        className="pl-9 pr-4 h-9 bg-muted/50"
                    />
                </div>
            </div>

            <div className="p-3 space-y-1">
                <Button variant="ghost" className="w-full justify-start gap-2 px-3">
                    <HomeIcon className="size-4" />
                    <span className="text-sm">Dashboard</span>
                </Button>
                <Button variant="secondary" className="w-full justify-start gap-2 px-3">
                    <MicIcon className="size-4" />
                    <span className="text-sm">Live Lecture</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2 px-3">
                    <FileTextIcon className="size-4" />
                    <span className="text-sm">All Notes</span>
                </Button>
            </div>

            <Separator />

            <div className="flex-1 overflow-y-auto no-scrollbar p-3">
                <div className="flex items-center justify-between px-2 py-1.5 mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Classes
                    </p>
                    <Button variant="ghost" size="icon-sm" className="size-6">
                        <PlusIcon className="size-3" />
                    </Button>
                </div>

                <div className="space-y-1">
                    {semesters.map((semester) => (
                        <div key={semester.id}>
                            <button
                                onClick={() => {
                                    toggleSemester(semester.id);
                                    setCurrentSemester(semester.id);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm transition-colors",
                                    currentSemesterId === semester.id
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : "hover:bg-sidebar-accent/50"
                                )}
                            >
                                {expandedSemesters.includes(semester.id) ? (
                                    <ChevronDownIcon className="size-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRightIcon className="size-4 text-muted-foreground" />
                                )}
                                <FolderIcon className="size-4" />
                                <span className="flex-1 truncate">{semester.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    {semester.subjects.length}
                                </span>
                            </button>

                            {expandedSemesters.includes(semester.id) && (
                                <div className="ml-4 mt-1 space-y-1">
                                    {semester.subjects.map((subject) => {
                                        const SubjectIcon = iconMap[subject.icon] || iconMap.default;
                                        return (
                                            <div key={subject.id}>
                                                <button
                                                    onClick={() => {
                                                        toggleSubject(subject.id);
                                                        setCurrentSubject(subject.id);
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm transition-colors",
                                                        currentSubjectId === subject.id
                                                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                                            : "hover:bg-sidebar-accent/50"
                                                    )}
                                                >
                                                    {expandedSubjects.includes(subject.id) ? (
                                                        <ChevronDownIcon className="size-3 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronRightIcon className="size-3 text-muted-foreground" />
                                                    )}
                                                    <div
                                                        className="size-3 rounded-full"
                                                        style={{ backgroundColor: subject.color }}
                                                    />
                                                    <span className="flex-1 truncate">{subject.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {subject.lectures.length}
                                                    </span>
                                                </button>

                                                {expandedSubjects.includes(subject.id) && subject.lectures.length > 0 && (
                                                    <div className="ml-6 mt-1 space-y-0.5">
                                                        {subject.lectures.map((lecture) => (
                                                            <button
                                                                key={lecture.id}
                                                                onClick={() => setCurrentLecture(lecture.id)}
                                                                className={cn(
                                                                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors",
                                                                    currentLectureId === lecture.id
                                                                        ? "bg-primary text-primary-foreground"
                                                                        : "hover:bg-sidebar-accent/50 text-muted-foreground"
                                                                )}
                                                            >
                                                                {lecture.isActive ? (
                                                                    <div className="size-2 rounded-full bg-destructive animate-pulse" />
                                                                ) : (
                                                                    <div className="size-2 rounded-full bg-muted-foreground/30" />
                                                                )}
                                                                <span className="flex-1 truncate">{lecture.title}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-3 border-t border-sidebar-border">
                <Button variant="ghost" className="w-full justify-start gap-2 px-3">
                    <SettingsIcon className="size-4" />
                    <span className="text-sm">Settings</span>
                </Button>
            </div>
        </div>
    );
}
