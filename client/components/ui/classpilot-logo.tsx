"use client";

import { cn } from "@/lib/utils";

interface ClassPilotLogoProps {
    className?: string;
    showText?: boolean;
}

export function ClassPilotLogo({ className, showText = false }: ClassPilotLogoProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <svg
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="size-8"
            >
                <rect
                    width="40"
                    height="40"
                    rx="10"
                    className="fill-primary"
                />
                <path
                    d="M12 14C12 12.8954 12.8954 12 14 12H26C27.1046 12 28 12.8954 28 14V20C28 21.1046 27.1046 22 26 22H20L16 26V22H14C12.8954 22 12 21.1046 12 20V14Z"
                    className="fill-primary-foreground"
                />
                <circle cx="16" cy="17" r="1.5" className="fill-primary" />
                <circle cx="20" cy="17" r="1.5" className="fill-primary" />
                <circle cx="24" cy="17" r="1.5" className="fill-primary" />
                <path
                    d="M29 26L32 29M32 29L29 32M32 29H26"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-primary-foreground"
                />
                <path
                    d="M8 28L10 26L12 28"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-primary-foreground"
                />
            </svg>
            {showText && (
                <div className="flex flex-col">
                    <span className="text-lg font-bold leading-tight tracking-tight">ClassPilot</span>
                    <span className="text-xs text-muted-foreground leading-tight">AI Copilot</span>
                </div>
            )}
        </div>
    );
}
