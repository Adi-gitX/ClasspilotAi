"use client";

import { useState, useRef } from "react";
import { useLectureStore } from "@/store/lecture-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    UploadIcon,
    FileTextIcon,
    ImageIcon,
    FileIcon,
    XIcon,
    CheckCircleIcon,
    Loader2Icon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadingFile {
    id: string;
    name: string;
    type: string;
    progress: number;
    status: "uploading" | "processing" | "done" | "error";
    error?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function MaterialUpload() {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { getCurrentLecture } = useLectureStore();

    const lecture = getCurrentLecture();

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            handleFiles(files);
        }
    };

    const handleFiles = (files: File[]) => {
        const validFiles = files.filter(file => {
            const ext = file.name.split('.').pop()?.toLowerCase();
            return ['pdf', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'txt', 'md'].includes(ext || '');
        });

        if (validFiles.length !== files.length) {
            toast.warning("Some files were skipped (unsupported format)");
        }

        validFiles.forEach(file => {
            uploadFile(file);
        });
    };

    const uploadFile = async (file: File) => {
        const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const uploadFile: UploadingFile = {
            id: uploadId,
            name: file.name,
            type: file.type,
            progress: 0,
            status: "uploading"
        };

        setUploadingFiles(prev => [...prev, uploadFile]);

        try {
            // Create FormData
            const formData = new FormData();
            formData.append("file", file);
            if (lecture?.id) {
                formData.append("lecture_id", lecture.id);
            }

            // Simulate progress for UX (real progress requires XHR)
            const progressInterval = setInterval(() => {
                setUploadingFiles(prev =>
                    prev.map(f =>
                        f.id === uploadId && f.progress < 80
                            ? { ...f, progress: f.progress + 10 }
                            : f
                    )
                );
            }, 200);

            // Actually upload to backend
            const response = await fetch(`${API_URL}/api/materials/upload`, {
                method: "POST",
                body: formData
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();

            // Mark as processing
            setUploadingFiles(prev =>
                prev.map(f => f.id === uploadId ? { ...f, progress: 100, status: "processing" } : f)
            );

            // Mark as done after backend processes
            setTimeout(() => {
                setUploadingFiles(prev =>
                    prev.map(f => f.id === uploadId ? { ...f, status: "done" } : f)
                );
                toast.success(`${file.name} uploaded and processed!`);
            }, 1000);

        } catch (error) {
            console.error("Upload error:", error);
            setUploadingFiles(prev =>
                prev.map(f =>
                    f.id === uploadId
                        ? { ...f, status: "error", error: (error as Error).message }
                        : f
                )
            );
            toast.error(`Failed to upload ${file.name}`);
        }
    };

    const removeFile = (fileId: string) => {
        setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return FileTextIcon;
        if (type.includes('image')) return ImageIcon;
        return FileIcon;
    };

    return (
        <div className="space-y-4">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    "relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
                    isDragging
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.md"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                        "size-12 rounded-full flex items-center justify-center transition-colors",
                        isDragging ? "bg-primary/20" : "bg-muted"
                    )}>
                        <UploadIcon className={cn(
                            "size-6",
                            isDragging ? "text-primary" : "text-muted-foreground"
                        )} />
                    </div>
                    <div>
                        <p className="font-medium">
                            {isDragging ? "Drop files here" : "Upload lecture materials"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            PDF, PPT, images, or text files (max 50MB)
                        </p>
                    </div>
                </div>
            </div>

            {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                    {uploadingFiles.map(file => {
                        const Icon = getFileIcon(file.type);
                        return (
                            <div
                                key={file.id}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border bg-card",
                                    file.status === "error" ? "border-destructive/50" : "border-border"
                                )}
                            >
                                <div className={cn(
                                    "size-10 rounded-lg flex items-center justify-center",
                                    file.status === "error" ? "bg-destructive/10" : "bg-muted"
                                )}>
                                    <Icon className={cn(
                                        "size-5",
                                        file.status === "error" ? "text-destructive" : "text-muted-foreground"
                                    )} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {file.status === "uploading" && (
                                            <>
                                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all duration-200"
                                                        style={{ width: `${file.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {Math.round(file.progress)}%
                                                </span>
                                            </>
                                        )}
                                        {file.status === "processing" && (
                                            <span className="flex items-center gap-1.5 text-xs text-primary">
                                                <Loader2Icon className="size-3 animate-spin" />
                                                Processing...
                                            </span>
                                        )}
                                        {file.status === "done" && (
                                            <span className="flex items-center gap-1.5 text-xs text-success">
                                                <CheckCircleIcon className="size-3" />
                                                Done
                                            </span>
                                        )}
                                        {file.status === "error" && (
                                            <span className="flex items-center gap-1.5 text-xs text-destructive">
                                                <XIcon className="size-3" />
                                                {file.error || "Upload failed"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="size-7"
                                    onClick={() => removeFile(file.id)}
                                >
                                    <XIcon className="size-4" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
