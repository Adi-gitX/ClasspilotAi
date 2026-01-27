"use client";

import { useState, useCallback } from "react";
import { useLectureStore } from "@/store/lecture-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    SearchIcon,
    XIcon,
    ClockIcon,
    MessageSquareIcon,
    FileTextIcon,
    HelpCircleIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
    id: string;
    type: "transcript" | "question" | "note";
    text: string;
    timestamp: number;
    highlightedText: string;
}

export function SearchPanel() {
    const { transcript, questions, notes } = useLectureStore();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const search = useCallback((searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        const queryLower = searchQuery.toLowerCase();
        const foundResults: SearchResult[] = [];

        // Search transcript
        transcript.forEach(seg => {
            if (seg.text.toLowerCase().includes(queryLower)) {
                foundResults.push({
                    id: seg.id,
                    type: "transcript",
                    text: seg.text,
                    timestamp: seg.timestamp,
                    highlightedText: highlightMatch(seg.text, searchQuery)
                });
            }
        });

        // Search questions
        questions.forEach(q => {
            if (q.text.toLowerCase().includes(queryLower) ||
                (q.answer && q.answer.toLowerCase().includes(queryLower))) {
                foundResults.push({
                    id: q.id,
                    type: "question",
                    text: q.text,
                    timestamp: q.timestamp,
                    highlightedText: highlightMatch(q.text, searchQuery)
                });
            }
        });

        // Search notes
        notes.forEach(n => {
            if (n.content.toLowerCase().includes(queryLower)) {
                foundResults.push({
                    id: n.id,
                    type: "note",
                    text: n.content,
                    timestamp: n.timestamp,
                    highlightedText: highlightMatch(n.content, searchQuery)
                });
            }
        });

        setResults(foundResults);
        setIsSearching(false);
    }, [transcript, questions, notes]);

    const highlightMatch = (text: string, query: string): string => {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark class="bg-warning/30 rounded px-0.5">$1</mark>');
    };

    const formatTimestamp = (seconds: number): string => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const getTypeIcon = (type: SearchResult["type"]) => {
        switch (type) {
            case "transcript": return MessageSquareIcon;
            case "question": return HelpCircleIcon;
            case "note": return FileTextIcon;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search lectures, questions, notes..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            search(e.target.value);
                        }}
                        className="pl-10 pr-10"
                    />
                    {query && (
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 size-7"
                            onClick={() => {
                                setQuery("");
                                setResults([]);
                            }}
                        >
                            <XIcon className="size-4" />
                        </Button>
                    )}
                </div>
                {query && (
                    <p className="text-xs text-muted-foreground mt-2">
                        {results.length} result{results.length !== 1 ? "s" : ""} found
                    </p>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {results.length === 0 && query && (
                    <div className="text-center py-8 text-muted-foreground">
                        <SearchIcon className="size-8 mx-auto mb-2 opacity-50" />
                        <p>No results found for "{query}"</p>
                    </div>
                )}

                {results.length === 0 && !query && (
                    <div className="text-center py-8 text-muted-foreground">
                        <SearchIcon className="size-8 mx-auto mb-2 opacity-50" />
                        <p>Search across all lecture content</p>
                        <p className="text-xs mt-1">Try: "neural network", "backpropagation"</p>
                    </div>
                )}

                <div className="space-y-3">
                    {results.map(result => {
                        const Icon = getTypeIcon(result.type);
                        return (
                            <div
                                key={`${result.type}-${result.id}`}
                                className="p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon className="size-4 text-muted-foreground" />
                                    <span className="text-xs font-medium capitalize text-muted-foreground">
                                        {result.type}
                                    </span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <ClockIcon className="size-3" />
                                        {formatTimestamp(result.timestamp)}
                                    </span>
                                </div>
                                <p
                                    className="text-sm line-clamp-2"
                                    dangerouslySetInnerHTML={{ __html: result.highlightedText }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
