"use client";

import { useState, useRef, useEffect } from "react";
import { ChatWelcomeScreen } from "./chat-welcome-screen";
import { ChatConversationView } from "./chat-conversation-view";
import { toast } from "sonner";
import { getGeminiKey, getApiUrl } from "@/components/settings/settings-modal";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  isStreaming?: boolean;
}

export function ChatMain() {
  const [message, setMessage] = useState("");
  const [selectedMode, setSelectedMode] = useState("fast");
  const [selectedModel, setSelectedModel] = useState("classpilot");
  const [isConversationStarted, setIsConversationStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const conversationRef = useRef<{ question: string; answer: string }[]>([]);

  const sendToAI = async (userMessage: string) => {
    setIsLoading(true);
    const apiUrl = getApiUrl();
    const geminiKey = getGeminiKey();

    const aiMessageId = `ai-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: aiMessageId,
      content: "Thinking...",
      sender: "ai",
      timestamp: new Date(),
      isStreaming: true
    }]);

    try {
      const contextHistory = conversationRef.current
        .slice(-5)
        .map(c => `User: ${c.question}\nAssistant: ${c.answer}`)
        .join("\n\n");

      const prompt = contextHistory
        ? `Previous conversation:\n${contextHistory}\n\nUser: ${userMessage}`
        : userMessage;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (geminiKey) {
        headers["Authorization"] = `Bearer ${geminiKey}`;
      }

      const response = await fetch(`${apiUrl}/api/questions/ask`, {
        method: "POST",
        headers,
        body: JSON.stringify({ question: prompt })
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const aiResponse = data.answer || "I apologize, but I couldn't generate a response. Please try again.";

      // Store in conversation history
      conversationRef.current.push({
        question: userMessage,
        answer: aiResponse
      });

      // Update the streaming message with actual content
      setMessages(prev => prev.map(msg =>
        msg.id === aiMessageId
          ? { ...msg, content: aiResponse, isStreaming: false }
          : msg
      ));

    } catch (error) {
      console.error("AI error:", error);
      setMessages(prev => prev.map(msg =>
        msg.id === aiMessageId
          ? {
            ...msg,
            content: "I'm sorry, I couldn't connect to the AI service. Please check if the backend is running.",
            isStreaming: false
          }
          : msg
      ));
      toast.error("Failed to get AI response");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage("");
    setIsConversationStarted(true);

    // Add user message
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      content: userMessage,
      sender: "user",
      timestamp: new Date(),
    }]);

    // Get AI response
    await sendToAI(userMessage);
  };

  const handleReset = () => {
    setIsConversationStarted(false);
    setMessages([]);
    setMessage("");
    conversationRef.current = [];
  };

  const handleSendMessage = async (content: string) => {
    if (isLoading) return;

    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      content,
      sender: "user",
      timestamp: new Date(),
    }]);
    setMessage("");

    await sendToAI(content);
  };

  if (isConversationStarted) {
    return (
      <ChatConversationView
        messages={messages}
        message={message}
        onMessageChange={setMessage}
        onSend={handleSendMessage}
        onReset={handleReset}
        isLoading={isLoading}
      />
    );
  }

  return (
    <ChatWelcomeScreen
      message={message}
      onMessageChange={setMessage}
      onSend={handleSend}
      selectedMode={selectedMode}
      onModeChange={setSelectedMode}
      selectedModel={selectedModel}
      onModelChange={setSelectedModel}
      isLoading={isLoading}
    />
  );
}
