"use client";

import { useState } from "react";
import { useLectureStore } from "@/store/lecture-store";
import { cn } from "@/lib/utils";
import { ClassPilotLogo } from "@/components/ui/classpilot-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    CreateSemesterModal,
    CreateSubjectModal,
    CreateLectureModal
} from "@/components/modals";
import {
    SearchIcon,
    HomeIcon,
    FolderIcon,
    SettingsIcon,
    PlusIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    MicIcon,
    FileTextIcon,
    BookOpenIcon,
    Trash2Icon,
    MoreHorizontalIcon
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function ClassPilotSidebar() {
    const {
        semesters,
        currentSemesterId,
        currentSubjectId,
        currentLectureId,
        setCurrentSemester,
        setCurrentSubject,
        setCurrentLecture,
        deleteSemester,
        deleteSubject,
        deleteLecture
    } = useLectureStore();

    const [expandedSemesters, setExpandedSemesters] = useState<string[]>([currentSemesterId || ""]);
    const [expandedSubjects, setExpandedSubjects] = useState<string[]>([currentSubjectId || ""]);

    // Modal states
    const [showSemesterModal, setShowSemesterModal] = useState(false);
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [showLectureModal, setShowLectureModal] = useState(false);
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

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

    const handleAddSubject = (semesterId: string) => {
        setSelectedSemesterId(semesterId);
        setShowSubjectModal(true);
    };

    const handleAddLecture = (subjectId: string) => {
        setSelectedSubjectId(subjectId);
        setShowLectureModal(true);
    };

    return (
        <>
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
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="size-6"
                            onClick={() => setShowSemesterModal(true)}
                        >
                            <PlusIcon className="size-3" />
                        </Button>
                    </div>

                    {semesters.length === 0 ? (
                        <div className="text-center py-8 px-4">
                            <FolderIcon className="size-10 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground mb-3">No semesters yet</p>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowSemesterModal(true)}
                                className="gap-2"
                            >
                                <PlusIcon className="size-4" />
                                Create Semester
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {semesters.map((semester) => (
                                <div key={semester.id}>
                                    <div className="group flex items-center">
                                        <button
                                            onClick={() => {
                                                toggleSemester(semester.id);
                                                setCurrentSemester(semester.id);
                                            }}
                                            className={cn(
                                                "flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm transition-colors",
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
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="size-6 opacity-0 group-hover:opacity-100"
                                                >
                                                    <MoreHorizontalIcon className="size-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleAddSubject(semester.id)}>
                                                    <PlusIcon className="size-4 mr-2" />
                                                    Add Subject
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => deleteSemester(semester.id)}
                                                >
                                                    <Trash2Icon className="size-4 mr-2" />
                                                    Delete Semester
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {expandedSemesters.includes(semester.id) && (
                                        <div className="ml-4 mt-1 space-y-1">
                                            {semester.subjects.length === 0 ? (
                                                <button
                                                    onClick={() => handleAddSubject(semester.id)}
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-sidebar-accent/50"
                                                >
                                                    <PlusIcon className="size-3" />
                                                    Add first subject
                                                </button>
                                            ) : (
                                                semester.subjects.map((subject) => (
                                                    <div key={subject.id}>
                                                        <div className="group flex items-center">
                                                            <button
                                                                onClick={() => {
                                                                    toggleSubject(subject.id);
                                                                    setCurrentSubject(subject.id);
                                                                }}
                                                                className={cn(
                                                                    "flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm transition-colors",
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
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon-sm"
                                                                        className="size-6 opacity-0 group-hover:opacity-100"
                                                                    >
                                                                        <MoreHorizontalIcon className="size-3" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => handleAddLecture(subject.id)}>
                                                                        <PlusIcon className="size-4 mr-2" />
                                                                        Add Lecture
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-destructive"
                                                                        onClick={() => deleteSubject(subject.id)}
                                                                    >
                                                                        <Trash2Icon className="size-4 mr-2" />
                                                                        Delete Subject
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>

                                                        {expandedSubjects.includes(subject.id) && (
                                                            <div className="ml-6 mt-1 space-y-0.5">
                                                                {subject.lectures.length === 0 ? (
                                                                    <button
                                                                        onClick={() => handleAddLecture(subject.id)}
                                                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-sidebar-accent/50"
                                                                    >
                                                                        <PlusIcon className="size-3" />
                                                                        Add first lecture
                                                                    </button>
                                                                ) : (
                                                                    subject.lectures.map((lecture) => (
                                                                        <div key={lecture.id} className="group flex items-center">
                                                                            <button
                                                                                onClick={() => setCurrentLecture(lecture.id)}
                                                                                className={cn(
                                                                                    "flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors",
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
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon-sm"
                                                                                        className="size-5 opacity-0 group-hover:opacity-100"
                                                                                    >
                                                                                        <MoreHorizontalIcon className="size-3" />
                                                                                    </Button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="end">
                                                                                    <DropdownMenuItem
                                                                                        className="text-destructive"
                                                                                        onClick={() => deleteLecture(lecture.id)}
                                                                                    >
                                                                                        <Trash2Icon className="size-4 mr-2" />
                                                                                        Delete Lecture
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-3 border-t border-sidebar-border">
                    <Button variant="ghost" className="w-full justify-start gap-2 px-3">
                        <SettingsIcon className="size-4" />
                        <span className="text-sm">Settings</span>
                    </Button>
                </div>
            </div>

            {/* Modals */}
            <CreateSemesterModal
                isOpen={showSemesterModal}
                onClose={() => setShowSemesterModal(false)}
            />
            <CreateSubjectModal
                isOpen={showSubjectModal}
                onClose={() => setShowSubjectModal(false)}
                semesterId={selectedSemesterId}
            />
            <CreateLectureModal
                isOpen={showLectureModal}
                onClose={() => setShowLectureModal(false)}
                subjectId={selectedSubjectId}
            />
        </>
    );
}
