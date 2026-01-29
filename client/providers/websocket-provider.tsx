"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useWebSocket } from "@/hooks/use-websocket";

interface WebSocketContextType {
    isConnected: boolean;
    mode: "real" | "demo" | null;
    connect: () => void;
    disconnect: () => void;
    startTranscription: () => void;
    stopTranscription: () => void;
    askQuestion: (question: string) => void;
    uploadMaterial: (content: string, source: string) => void;
    sendAudioChunk: (audioData: Float32Array) => void;
    send: (data: object) => boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
    const ws = useWebSocket();

    return (
        <WebSocketContext.Provider value={ws}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocketContext() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error("useWebSocketContext must be used within a WebSocketProvider");
    }
    return context;
}
