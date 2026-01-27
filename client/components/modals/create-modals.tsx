"use client";

import { useState } from "react";
import { X, Plus, Palette, GraduationCap, BookOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLectureStore } from "@/store/lecture-store";
import { SUBJECT_COLORS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Semester Modal
export function CreateSemesterModal({ isOpen, onClose }: ModalProps) {
    const [name, setName] = useState("");
    const [year, setYear] = useState(new Date().getFullYear());
    const { createSemester } = useLectureStore();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            createSemester(name.trim(), year);
            setName("");
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <ModalWrapper onClose={onClose}>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                    <GraduationCap className="size-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Create Semester</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-muted-foreground">
                        Semester Name
                    </label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Semester 6"
                        className="mt-1"
                        autoFocus
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-muted-foreground">
                        Year
                    </label>
                    <Input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                        className="mt-1"
                    />
                </div>

                <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={!name.trim()}>
                        Create
                    </Button>
                </div>
            </form>
        </ModalWrapper>
    );
}

// Subject Modal
interface CreateSubjectModalProps extends ModalProps {
    semesterId: string;
}

export function CreateSubjectModal({ isOpen, onClose, semesterId }: CreateSubjectModalProps) {
    const [name, setName] = useState("");
    const [selectedColor, setSelectedColor] = useState(SUBJECT_COLORS[0]);
    const { createSubject } = useLectureStore();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && semesterId) {
            createSubject(semesterId, name.trim(), selectedColor);
            setName("");
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <ModalWrapper onClose={onClose}>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                    <BookOpen className="size-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Create Subject</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-muted-foreground">
                        Subject Name
                    </label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Machine Learning"
                        className="mt-1"
                        autoFocus
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Palette className="size-4" />
                        Color
                    </label>
                    <div className="flex gap-2 mt-2 flex-wrap">
                        {SUBJECT_COLORS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setSelectedColor(color)}
                                className={cn(
                                    "size-8 rounded-full transition-all",
                                    selectedColor === color && "ring-2 ring-offset-2 ring-primary"
                                )}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={!name.trim()}>
                        Create
                    </Button>
                </div>
            </form>
        </ModalWrapper>
    );
}

// Lecture Modal
interface CreateLectureModalProps extends ModalProps {
    subjectId: string;
}

export function CreateLectureModal({ isOpen, onClose, subjectId }: CreateLectureModalProps) {
    const [title, setTitle] = useState("");
    const { createLecture } = useLectureStore();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && subjectId) {
            createLecture(subjectId, title.trim());
            setTitle("");
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <ModalWrapper onClose={onClose}>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="size-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Create Lecture</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-muted-foreground">
                        Lecture Title
                    </label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Introduction to Neural Networks"
                        className="mt-1"
                        autoFocus
                    />
                </div>

                <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={!title.trim()}>
                        Create & Start
                    </Button>
                </div>
            </form>
        </ModalWrapper>
    );
}

// Modal Wrapper
function ModalWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={cn(
                "relative w-full max-w-md mx-4 p-6",
                "bg-card border border-border rounded-2xl shadow-2xl",
                "animate-in fade-in zoom-in-95 duration-200"
            )}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
                >
                    <X className="size-5 text-muted-foreground" />
                </button>
                {children}
            </div>
        </div>
    );
}
