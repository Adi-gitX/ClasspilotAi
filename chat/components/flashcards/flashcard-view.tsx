"use client";

import { useState } from "react";
import { useLectureStore } from "@/store/lecture-store";
import { Button } from "@/components/ui/button";
import {
    SparklesIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    RotateCwIcon,
    CheckCircleIcon,
    XCircleIcon,
    ZapIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Flashcard {
    id: string;
    question: string;
    answer: string;
    source: string;
}

export function FlashcardView() {
    const { questions, transcript } = useLectureStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());

    // Generate flashcards from answered questions
    const flashcards: Flashcard[] = questions
        .filter(q => q.isAnswered && q.answer)
        .map(q => ({
            id: q.id,
            question: q.text,
            answer: q.answer || "",
            source: "Lecture Question"
        }));

    // Add some generated flashcards from transcript topics
    const additionalCards: Flashcard[] = [
        {
            id: "gen-1",
            question: "What is the basic unit of a neural network?",
            answer: "A neuron or perceptron - it takes inputs, applies weights, sums them, and passes through an activation function.",
            source: "Auto-generated"
        },
        {
            id: "gen-2",
            question: "What is backpropagation?",
            answer: "An algorithm for training neural networks by calculating gradients of the loss function and updating weights to minimize error.",
            source: "Auto-generated"
        },
        {
            id: "gen-3",
            question: "Why do we use activation functions?",
            answer: "Activation functions introduce non-linearity, allowing networks to learn complex patterns beyond linear relationships.",
            source: "Auto-generated"
        }
    ];

    const allCards = [...flashcards, ...additionalCards];
    const currentCard = allCards[currentIndex];

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % allCards.length);
        }, 150);
    };

    const prevCard = () => {
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

    if (allCards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-12">
                <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ZapIcon className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Flashcards Yet</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                    Flashcards are automatically generated from detected questions and key concepts.
                </p>
                <Button className="mt-4 gap-2">
                    <SparklesIcon className="size-4" />
                    Generate from Lecture
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
