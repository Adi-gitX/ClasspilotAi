"use client";

import { useState, useRef } from "react";
import { useLectureStore } from "@/store/lecture-store";
import { Button } from "@/components/ui/button";
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
}

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
            return ['pdf', 'ppt', 'pptx', 'png', 'jpg', 'jpeg'].includes(ext || '');
        });

        validFiles.forEach(file => {
            const uploadFile: UploadingFile = {
                id: `upload-${Date.now()}-${Math.random()}`,
                name: file.name,
                type: file.type,
                progress: 0,
                status: "uploading"
            };

            setUploadingFiles(prev => [...prev, uploadFile]);
            simulateUpload(uploadFile.id);
        });
    };

    const simulateUpload = (fileId: string) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setUploadingFiles(prev =>
                    prev.map(f => f.id === fileId ? { ...f, progress: 100, status: "processing" } : f)
                );

                setTimeout(() => {
                    setUploadingFiles(prev =>
                        prev.map(f => f.id === fileId ? { ...f, status: "done" } : f)
                    );
                }, 1500);
            } else {
                setUploadingFiles(prev =>
                    prev.map(f => f.id === fileId ? { ...f, progress } : f)
                );
            }
        }, 200);
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
                    accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg"
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
                            PDF, PPT, or images (max 50MB)
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
                                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                            >
                                <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                                    <Icon className="size-5 text-muted-foreground" />
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
