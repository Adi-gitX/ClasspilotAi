"use client";

import { useState } from "react";
import { useLectureStore } from "@/store/lecture-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    SparklesIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    RotateCwIcon,
    CheckCircleIcon,
    XCircleIcon,
    ZapIcon,
    Loader2Icon,
    RefreshCwIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Flashcard {
    id: string;
    question: string;
    answer: string;
    source: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function FlashcardView() {
    const { questions, transcript } = useLectureStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedCards, setGeneratedCards] = useState<Flashcard[]>([]);

    // Generate flashcards from answered questions
    const questionCards: Flashcard[] = questions
        .filter(q => q.isAnswered && q.answer)
        .map(q => ({
            id: q.id,
            question: q.text,
            answer: q.answer || "",
            source: "Lecture Question"
        }));

    const allCards = [...questionCards, ...generatedCards];
    const currentCard = allCards[currentIndex];

    const generateFlashcards = async () => {
        if (transcript.length === 0) {
            toast.error("No transcript content to generate flashcards from");
            return;
        }

        setIsGenerating(true);

        try {
            const transcriptText = transcript
                .filter(s => s.isFinal)
                .map(s => s.text)
                .join(" ");

            // Use dedicated flashcard generation endpoint
            const response = await fetch(`${API_URL}/api/flashcards/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: transcriptText.slice(0, 3000),
                    count: 5
                })
            });

            const data = await response.json();

            // Check if we got flashcards from the new endpoint
            if (data.flashcards && Array.isArray(data.flashcards)) {
                const newCards: Flashcard[] = data.flashcards.map((fc: { id?: string; question: string; answer: string }) => ({
                    id: fc.id || `gen-${Date.now()}-${Math.random()}`,
                    question: fc.question,
                    answer: fc.answer,
                    source: "AI Generated"
                }));

                setGeneratedCards(prev => [...prev, ...newCards]);
                toast.success(`Generated ${newCards.length} flashcards!`);
            } else {
                // Fallback: parse from answer text
                const answerText = data.answer || data.summary || "";
                const cardMatches = answerText.match(/Q:\s*(.+?)\s*\n\s*A:\s*([\s\S]+?)(?=\n\nQ:|$)/g);

                if (cardMatches) {
                    const newCards: Flashcard[] = cardMatches.map((match: string, index: number) => {
                        const qMatch = match.match(/Q:\s*(.+?)\s*\n/);
                        const aMatch = match.match(/A:\s*([\s\S]+?)$/);
                        return {
                            id: `gen-${Date.now()}-${index}`,
                            question: qMatch?.[1]?.trim() || "Question",
                            answer: aMatch?.[1]?.trim() || "Answer",
                            source: "AI Generated"
                        };
                    });
                    setGeneratedCards(prev => [...prev, ...newCards]);
                    toast.success(`Generated ${newCards.length} flashcards!`);
                } else {
                    // Last fallback
                    setGeneratedCards(prev => [...prev, {
                        id: `gen-${Date.now()}`,
                        question: "What are the key concepts from this lecture?",
                        answer: answerText.slice(0, 500) || "Summary not available",
                        source: "AI Generated"
                    }]);
                    toast.success("Generated summary flashcard");
                }
            }
        } catch (error) {
            console.error("Generation error:", error);
            toast.error("Failed to generate flashcards");
        } finally {
            setIsGenerating(false);
        }
    };

    const nextCard = () => {
        if (allCards.length === 0) return;
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % allCards.length);
        }, 150);
    };

    const prevCard = () => {
        if (allCards.length === 0) return;
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + allCards.length) % allCards.length);
        }, 150);
    };

    const markMastered = () => {
        if (currentCard) {
            setMasteredCards(prev => new Set(prev).add(currentCard.id));
            nextCard();
        }
    };

    const markNeedsReview = () => {
        if (currentCard) {
            setMasteredCards(prev => {
                const newSet = new Set(prev);
                newSet.delete(currentCard.id);
                return newSet;
            });
            nextCard();
        }
    };

    const clearGenerated = () => {
        setGeneratedCards([]);
        setCurrentIndex(0);
        toast.info("Cleared generated flashcards");
    };

    if (allCards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-12">
                <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ZapIcon className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Flashcards Yet</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-4">
                    Flashcards are generated from answered questions and lecture content.
                </p>
                <Button
                    onClick={generateFlashcards}
                    disabled={isGenerating}
                    className="gap-2"
                >
                    {isGenerating ? (
                        <>
                            <Loader2Icon className="size-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="size-4" />
                            Generate from Lecture
                        </>
                    )}
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="font-semibold flex items-center gap-2">
                        <ZapIcon className="size-5 text-warning" />
                        Flashcards
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {masteredCards.size} of {allCards.length} mastered
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={generateFlashcards}
                        disabled={isGenerating}
                        className="gap-1"
                    >
                        {isGenerating ? (
                            <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                            <SparklesIcon className="size-4" />
                        )}
                        <span className="hidden sm:inline">Generate More</span>
                    </Button>
                    {generatedCards.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearGenerated}
                            className="gap-1"
                        >
                            <RefreshCwIcon className="size-4" />
                        </Button>
                    )}
                    <span className="text-sm text-muted-foreground">
                        {currentIndex + 1} / {allCards.length}
                    </span>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className={cn(
                        "relative w-full max-w-md h-64 cursor-pointer perspective-1000",
                        "transition-transform duration-500 transform-style-3d",
                        isFlipped && "rotate-y-180"
                    )}
                    style={{ perspective: "1000px" }}
                >
                    <div
                        className={cn(
                            "absolute inset-0 rounded-2xl border-2 p-6 backface-hidden",
                            "flex flex-col items-center justify-center text-center",
                            isFlipped ? "opacity-0" : "opacity-100",
                            masteredCards.has(currentCard?.id || "")
                                ? "border-success bg-success/5"
                                : "border-border bg-card"
                        )}
                    >
                        <span className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                            Question
                        </span>
                        <p className="text-lg font-medium">{currentCard?.question}</p>
                        <span className="text-xs text-muted-foreground mt-4">
                            Click to reveal answer
                        </span>
                    </div>

                    <div
                        className={cn(
                            "absolute inset-0 rounded-2xl border-2 border-primary/50 bg-primary/5 p-6 backface-hidden",
                            "flex flex-col items-center justify-center text-center",
                            isFlipped ? "opacity-100" : "opacity-0"
                        )}
                        style={{ transform: "rotateY(180deg)" }}
                    >
                        <span className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                            Answer
                        </span>
                        <p className="text-sm leading-relaxed">{currentCard?.answer}</p>
                        <span className="text-xs text-muted-foreground mt-4">
                            {currentCard?.source}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-4 mt-8">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={prevCard}
                    >
                        <ChevronLeftIcon className="size-5" />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        <RotateCwIcon className="size-5" />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={nextCard}
                    >
                        <ChevronRightIcon className="size-5" />
                    </Button>
                </div>

                <div className="flex items-center justify-center gap-4 mt-4">
                    <Button
                        variant="outline"
                        onClick={markNeedsReview}
                        className="gap-2 text-destructive hover:text-destructive"
                    >
                        <XCircleIcon className="size-4" />
                        Needs Review
                    </Button>
                    <Button
                        onClick={markMastered}
                        className="gap-2 bg-success hover:bg-success/90"
                    >
                        <CheckCircleIcon className="size-4" />
                        Mastered
                    </Button>
                </div>
            </div>

            <div className="flex justify-center gap-1 mt-4">
                {allCards.map((card, index) => (
                    <button
                        key={card.id}
                        onClick={() => {
                            setIsFlipped(false);
                            setCurrentIndex(index);
                        }}
                        className={cn(
                            "size-2 rounded-full transition-colors",
                            index === currentIndex
                                ? "bg-primary"
                                : masteredCards.has(card.id)
                                    ? "bg-success/50"
                                    : "bg-muted-foreground/30"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
