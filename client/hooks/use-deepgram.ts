"use client";

import { useCallback, useRef, useState } from "react";

interface DeepgramOptions {
    onTranscript: (text: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
    apiKey: string;
    language?: string;
}

interface UseDeepgramReturn {
    startListening: () => Promise<void>;
    stopListening: () => void;
    isListening: boolean;
    error: string | null;
}

export function useDeepgram({
    onTranscript,
    onError,
    apiKey,
    language = "en"
}: DeepgramOptions): UseDeepgramReturn {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startListening = useCallback(async () => {
        if (!apiKey) {
            const err = "Deepgram API key required. Add it in Settings.";
            setError(err);
            onError?.(err);
            return;
        }

        setError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            streamRef.current = stream;

            const socket = new WebSocket(
                `wss://api.deepgram.com/v1/listen?` +
                `model=nova-2&` +
                `language=${language}&` +
                `smart_format=true&` +
                `punctuate=true&` +
                `interim_results=true&` +
                `encoding=linear16&` +
                `sample_rate=16000`,
                ["token", apiKey]
            );

            socket.onopen = () => {
                console.log("✅ Deepgram connected");
                setIsListening(true);

                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: "audio/webm;codecs=opus"
                });

                mediaRecorder.ondataavailable = async (event) => {
                    if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
                        const arrayBuffer = await event.data.arrayBuffer();
                        socket.send(arrayBuffer);
                    }
                };

                mediaRecorder.start(250);
                mediaRecorderRef.current = mediaRecorder;
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.channel?.alternatives?.[0]) {
                        const transcript = data.channel.alternatives[0].transcript;
                        const isFinal = data.is_final;
                        if (transcript) {
                            onTranscript(transcript, isFinal);
                        }
                    }
                } catch (e) {
                    console.error("Deepgram parse error:", e);
                }
            };

            socket.onerror = (event) => {
                console.error("Deepgram error:", event);
                setError("Connection error");
                onError?.("Deepgram connection error");
            };

            socket.onclose = () => {
                console.log("Deepgram disconnected");
                setIsListening(false);
            };

            socketRef.current = socket;

        } catch (err: any) {
            const errMsg = err.message || "Failed to start microphone";
            setError(errMsg);
            onError?.(errMsg);
        }
    }, [apiKey, language, onTranscript, onError]);

    const stopListening = useCallback(() => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

        setIsListening(false);
    }, []);

    return {
        startListening,
        stopListening,
        isListening,
        error
    };
}
