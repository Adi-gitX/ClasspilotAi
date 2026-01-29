"use client";

import { useCallback, useRef, useState, useEffect } from "react";

interface SpeechRecognitionOptions {
    onTranscript: (text: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
    language?: string;
    continuous?: boolean;
}

interface UseSpeechRecognitionReturn {
    startListening: () => void;
    stopListening: () => void;
    isListening: boolean;
    isSupported: boolean;
    error: string | null;
}

export function useSpeechRecognition({
    onTranscript,
    onError,
    language = "en-US",
    continuous = true
}: SpeechRecognitionOptions): UseSpeechRecognitionReturn {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
        setIsSupported(!!SpeechRecognition);

        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = continuous;
            recognition.interimResults = true;
            recognition.lang = language;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event: any) => {
                const results = event.results;
                for (let i = event.resultIndex; i < results.length; i++) {
                    const transcript = results[i][0].transcript;
                    const isFinal = results[i].isFinal;
                    onTranscript(transcript, isFinal);
                }
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error);
                if (event.error === "not-allowed") {
                    setError("Microphone access denied. Please allow microphone access.");
                    onError?.("Microphone access denied");
                } else if (event.error === "no-speech") {
                    // Ignore no-speech errors, just keep listening
                } else {
                    setError(`Speech recognition error: ${event.error}`);
                    onError?.(event.error);
                }
            };

            recognition.onend = () => {
                // Auto-restart if still supposed to be listening
                if (isListening && recognitionRef.current) {
                    try {
                        recognition.start();
                    } catch (e) {
                        // Already started
                    }
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [onTranscript, onError, language, continuous, isListening]);

    const startListening = useCallback(() => {
        setError(null);
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e: any) {
                if (e.message?.includes("already started")) {
                    setIsListening(true);
                } else {
                    setError("Failed to start speech recognition");
                }
            }
        } else {
            setError("Speech recognition not supported in this browser");
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    }, []);

    return {
        startListening,
        stopListening,
        isListening,
        isSupported,
        error
    };
}
