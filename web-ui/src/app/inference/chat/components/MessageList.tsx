"use client";

import * as React from "react";
import { useRef } from "react";
import { Bot } from "lucide-react";
import ChatMessageItem from "./ChatMessageItem";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: number;
  chatId?: string;
  isVerified?: boolean | null;
  isVerifying?: boolean;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  verifyResponse: (message: Message, originalIndex: number) => void;
  messagesContainerRef?: React.RefObject<HTMLDivElement | null>;
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
}

// Avatar component for loading state
function LoadingAvatar() {
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <Bot className="w-4 h-4 text-white" />
    </div>
  );
}

export function MessageList({
  messages,
  isLoading,
  isStreaming,
  verifyResponse,
  messagesContainerRef: externalContainerRef,
  messagesEndRef: externalEndRef,
}: MessageListProps) {
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const internalEndRef = useRef<HTMLDivElement>(null);

  const containerRef = externalContainerRef || internalContainerRef;
  const endRef = externalEndRef || internalEndRef;

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 space-y-3 sm:space-y-4">
      {messages
        .map((message, originalIndex) => ({ message, originalIndex }))
        .filter(({ message }) => message.role !== "system")
        .map(({ message, originalIndex }) => (
          <ChatMessageItem
            key={message.timestamp || originalIndex}
            message={message}
            originalIndex={originalIndex}
            isLoading={isLoading}
            isStreaming={isStreaming}
            onVerify={verifyResponse}
          />
        ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="flex items-start gap-3">
            <LoadingAvatar />
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invisible element for auto-scroll */}
      <div ref={endRef} />
    </div>
  );
}
