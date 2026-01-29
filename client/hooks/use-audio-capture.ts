"use client";

import { useRef, useCallback, useState } from "react";

interface AudioCaptureOptions {
    onAudioData: (data: Float32Array) => void;
    onAudioLevel: (level: number) => void;
    sampleRate?: number;
}

export function useAudioCapture(options: AudioCaptureOptions) {
    const { onAudioData, onAudioLevel, sampleRate = 16000 } = options;

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const [isCapturing, setIsCapturing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [permissionDenied, setPermissionDenied] = useState(false);

    const startCapture = useCallback(async () => {
        try {
            setError(null);
            setPermissionDenied(false);

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: { ideal: sampleRate },
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });

            // Create audio context
            const audioContext = new AudioContext({ sampleRate });
            const source = audioContext.createMediaStreamSource(stream);

            // Create analyser for audio level visualization
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            // Update audio level visualization
            const updateLevel = () => {
                if (!isCapturing) return;
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                onAudioLevel(average / 255);
                animationFrameRef.current = requestAnimationFrame(updateLevel);
            };

            // Use ScriptProcessor for audio data (deprecated but widely supported)
            // AudioWorklet would be better but requires more setup
            const bufferSize = 4096;
            const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                // Clone the data since it's a reference
                onAudioData(new Float32Array(inputData));
            };

            source.connect(processor);
            // Connect to destination to keep the processor active (output is silent)
            processor.connect(audioContext.destination);

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            workletNodeRef.current = processor;
            streamRef.current = stream;

            setIsCapturing(true);

            // Start level visualization
            animationFrameRef.current = requestAnimationFrame(updateLevel);

            console.log("🎤 Audio capture started");

        } catch (err) {
            console.error("Audio capture error:", err);

            if (err instanceof DOMException) {
                if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                    setPermissionDenied(true);
                    setError("Microphone permission denied. Please allow microphone access.");
                } else if (err.name === "NotFoundError") {
                    setError("No microphone found. Please connect a microphone.");
                } else {
                    setError(`Microphone error: ${err.message}`);
                }
            } else {
                setError(err instanceof Error ? err.message : "Failed to access microphone");
            }
        }
    }, [onAudioData, onAudioLevel, sampleRate, isCapturing]);

    const stopCapture = useCallback(() => {
        console.log("🎤 Stopping audio capture...");

        // Cancel animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Disconnect and close processor
        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        // Stop all tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            streamRef.current = null;
        }

        setIsCapturing(false);
        onAudioLevel(0);
    }, [onAudioLevel]);

    // Cleanup on unmount
    const cleanup = useCallback(() => {
        if (isCapturing) {
            stopCapture();
        }
    }, [isCapturing, stopCapture]);

    return {
        startCapture,
        stopCapture,
        cleanup,
        isCapturing,
        error,
        permissionDenied
    };
}
