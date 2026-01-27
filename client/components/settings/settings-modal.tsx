"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Settings,
    Key,
    Server,
    Check,
    X,
    Eye,
    EyeOff,
    RefreshCw,
    Zap,
    Sparkles,
    Mic
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsData {
    geminiKey: string;
    deepgramKey: string;
    openaiKey: string;
    backendUrl: string;
    wsUrl: string;
}

const DEFAULT_SETTINGS: SettingsData = {
    geminiKey: "",
    deepgramKey: "",
    openaiKey: "",
    backendUrl: "http://localhost:8000",
    wsUrl: "ws://localhost:8000",
};

const STORAGE_KEY = "classpilot_settings";

export function SettingsModal() {
    const [open, setOpen] = useState(false);
    const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
    const [showGeminiKey, setShowGeminiKey] = useState(false);
    const [showDeepgramKey, setShowDeepgramKey] = useState(false);
    const [showOpenaiKey, setShowOpenaiKey] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "error">("unknown");

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSettings({ ...DEFAULT_SETTINGS, ...parsed });
            } catch (e) {
                console.error("Failed to load settings:", e);
            }
        }
    }, []);

    const saveSettings = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

        if (typeof window !== "undefined") {
            (window as any).__CLASSPILOT_API_URL = settings.backendUrl;
            (window as any).__CLASSPILOT_WS_URL = settings.wsUrl;
            (window as any).__CLASSPILOT_GEMINI_KEY = settings.geminiKey;
            (window as any).__CLASSPILOT_DEEPGRAM_KEY = settings.deepgramKey;
            (window as any).__CLASSPILOT_OPENAI_KEY = settings.openaiKey;
        }

        toast.success("Settings saved!");
        setOpen(false);
    };

    const testConnection = async () => {
        setIsTesting(true);
        setConnectionStatus("unknown");

        try {
            const response = await fetch(`${settings.backendUrl}/health`, {
                method: "GET",
                headers: settings.geminiKey ? {
                    "Authorization": `Bearer ${settings.geminiKey}`
                } : {}
            });

            if (response.ok) {
                const data = await response.json();
                setConnectionStatus("connected");
                toast.success(`Connected! Server running.`);
            } else {
                setConnectionStatus("error");
                toast.error(`Connection failed: ${response.status}`);
            }
        } catch (error) {
            setConnectionStatus("error");
            toast.error("Cannot reach backend server");
        } finally {
            setIsTesting(false);
        }
    };

    const resetToDefaults = () => {
        setSettings(DEFAULT_SETTINGS);
        toast.info("Reset to default settings");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Settings className="size-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="size-5" />
                        ClassPilot Settings
                    </DialogTitle>
                    <DialogDescription>
                        Configure API keys for AI features. Your keys are stored locally.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Gemini API Key (Primary) */}
                    <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="geminiKey" className="flex items-center gap-2">
                                <Sparkles className="size-4 text-blue-500" />
                                Gemini API Key
                                <span className="text-xs bg-blue-500/20 text-blue-600 px-2 py-0.5 rounded-full">Primary</span>
                            </Label>
                        </div>
                        <div className="relative">
                            <Input
                                id="geminiKey"
                                type={showGeminiKey ? "text" : "password"}
                                placeholder="AIza..."
                                value={settings.geminiKey}
                                onChange={(e) => setSettings({ ...settings, geminiKey: e.target.value })}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowGeminiKey(!showGeminiKey)}
                            >
                                {showGeminiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Get your free API key from{" "}
                            <a
                                href="https://aistudio.google.com/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline font-medium"
                            >
                                Google AI Studio
                            </a>
                        </p>
                    </div>

                    {/* Deepgram API Key (Speech-to-Text) */}
                    <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="deepgramKey" className="flex items-center gap-2">
                                <Mic className="size-4 text-green-500" />
                                Deepgram API Key
                                <span className="text-xs bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full">Speech</span>
                            </Label>
                        </div>
                        <div className="relative">
                            <Input
                                id="deepgramKey"
                                type={showDeepgramKey ? "text" : "password"}
                                placeholder="Enter Deepgram key..."
                                value={settings.deepgramKey}
                                onChange={(e) => setSettings({ ...settings, deepgramKey: e.target.value })}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowDeepgramKey(!showDeepgramKey)}
                            >
                                {showDeepgramKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Get 12,000 free minutes from{" "}
                            <a
                                href="https://console.deepgram.com/signup"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-500 hover:underline font-medium"
                            >
                                Deepgram Console
                            </a>
                            {" "}for high-accuracy transcription
                        </p>
                    </div>

                    {/* OpenAI API Key (Fallback) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="openaiKey" className="flex items-center gap-2">
                                <Key className="size-4" />
                                OpenAI API Key
                                <span className="text-xs text-muted-foreground">(Fallback)</span>
                            </Label>
                        </div>
                        <div className="relative">
                            <Input
                                id="openaiKey"
                                type={showOpenaiKey ? "text" : "password"}
                                placeholder="sk-..."
                                value={settings.openaiKey}
                                onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                            >
                                {showOpenaiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Backend URL */}
                    <div className="space-y-3">
                        <Label htmlFor="backendUrl" className="flex items-center gap-2">
                            <Server className="size-4" />
                            Backend Server URL
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="backendUrl"
                                type="url"
                                placeholder="http://localhost:8000"
                                value={settings.backendUrl}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    backendUrl: e.target.value,
                                    wsUrl: e.target.value.replace("http", "ws")
                                })}
                                className="flex-1"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={testConnection}
                                disabled={isTesting}
                            >
                                {isTesting ? (
                                    <RefreshCw className="size-4 animate-spin" />
                                ) : connectionStatus === "connected" ? (
                                    <Check className="size-4 text-green-500" />
                                ) : connectionStatus === "error" ? (
                                    <X className="size-4 text-red-500" />
                                ) : (
                                    <Zap className="size-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Connection Status */}
                    {connectionStatus !== "unknown" && (
                        <div className={cn(
                            "p-3 rounded-lg text-sm",
                            connectionStatus === "connected"
                                ? "bg-green-500/10 text-green-600 border border-green-500/20"
                                : "bg-red-500/10 text-red-600 border border-red-500/20"
                        )}>
                            {connectionStatus === "connected"
                                ? "✅ Connected to backend server"
                                : "❌ Cannot connect. Is the backend running?"
                            }
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-between">
                    <Button variant="ghost" onClick={resetToDefaults}>
                        Reset
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveSettings}>
                            Save Settings
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function getSettings(): SettingsData {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        } catch {
            return DEFAULT_SETTINGS;
        }
    }
    return DEFAULT_SETTINGS;
}

export function getApiUrl(): string {
    if (typeof window !== "undefined" && (window as any).__CLASSPILOT_API_URL) {
        return (window as any).__CLASSPILOT_API_URL;
    }
    const settings = getSettings();
    return settings.backendUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export function getWsUrl(): string {
    if (typeof window !== "undefined" && (window as any).__CLASSPILOT_WS_URL) {
        return (window as any).__CLASSPILOT_WS_URL;
    }
    const settings = getSettings();
    return settings.wsUrl || process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
}

export function getGeminiKey(): string {
    if (typeof window !== "undefined" && (window as any).__CLASSPILOT_GEMINI_KEY) {
        return (window as any).__CLASSPILOT_GEMINI_KEY;
    }
    const settings = getSettings();
    return settings.geminiKey || "";
}

export function getDeepgramKey(): string {
    if (typeof window !== "undefined" && (window as any).__CLASSPILOT_DEEPGRAM_KEY) {
        return (window as any).__CLASSPILOT_DEEPGRAM_KEY;
    }
    const settings = getSettings();
    return settings.deepgramKey || "";
}

export function getOpenAIKey(): string {
    if (typeof window !== "undefined" && (window as any).__CLASSPILOT_OPENAI_KEY) {
        return (window as any).__CLASSPILOT_OPENAI_KEY;
    }
    const settings = getSettings();
    return settings.openaiKey || "";
}
