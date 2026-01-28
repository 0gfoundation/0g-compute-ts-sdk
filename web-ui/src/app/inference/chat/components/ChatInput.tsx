"use client";

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { Square, Info } from 'lucide-react';
import { estimateMessageCost, formatCost, estimateTokens } from '../../../../shared/utils/tokenEstimation';

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  isProcessing: boolean;
  isStreaming?: boolean;
  onSendMessage: () => void;
  onStopGeneration?: () => void;
  // Optional pricing info for cost estimation
  inputPrice?: number;
  outputPrice?: number;
}

export function ChatInput({
  inputMessage,
  setInputMessage,
  isProcessing,
  isStreaming = false,
  onSendMessage,
  onStopGeneration,
  inputPrice,
  outputPrice,
}: ChatInputProps) {
  // Force client-side rendering to prevent hydration issues
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check if mobile for placeholder text
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Estimate cost based on current input
  const estimatedCost = useMemo(() => {
    if (!inputMessage.trim() || (inputPrice === undefined && outputPrice === undefined)) {
      return null;
    }
    return estimateMessageCost(inputMessage, inputPrice, outputPrice);
  }, [inputMessage, inputPrice, outputPrice]);

  const tokenCount = useMemo(() => {
    return estimateTokens(inputMessage);
  }, [inputMessage]);

  // Memoize the textarea change handler with debouncing for resize
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputMessage(value);

    // Debounce the resize operation using requestAnimationFrame
    requestAnimationFrame(() => {
      const textarea = e.target as HTMLTextAreaElement;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    });
  }, [setInputMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputMessage.trim() && !isProcessing) {
        onSendMessage();
      }
    }
  }, [inputMessage, isProcessing, onSendMessage]);

  const handleButtonClick = useCallback(() => {
    if (isStreaming && onStopGeneration) {
      onStopGeneration();
    } else if (inputMessage.trim() && !isProcessing) {
      onSendMessage();
    }
  }, [isStreaming, onStopGeneration, inputMessage, isProcessing, onSendMessage]);

  // Show loading state until client-side hydration
  if (!isClient) {
    return (
      <div className="p-3 sm:p-4 border-t border-border bg-card">
        <div className="flex space-x-2 sm:space-x-3 items-end">
          <div className="flex-1 h-11 bg-muted rounded-xl animate-pulse" />
          <div className="w-16 sm:w-20 h-11 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 border-t border-border bg-card/50 backdrop-blur-sm">
      {/* Cost estimation */}
      {estimatedCost !== null && inputMessage.trim().length > 0 && !isProcessing && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 px-1">
          <Info className="h-3 w-3" />
          <span>
            Est. cost: <span className="font-mono font-medium text-foreground">~{formatCost(estimatedCost)} 0G</span>
            <span className="text-muted-foreground/70 ml-2">({tokenCount} tokens)</span>
          </span>
        </div>
      )}
      <div className="flex space-x-2 sm:space-x-3 items-end">
        <textarea
          value={inputMessage}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={isProcessing ? "AI is responding..." : (isMobile ? "Type your message..." : "Type your message... (Shift+Enter for new line)")}
          className="flex-1 px-4 py-3 border border-border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none overflow-y-auto disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed bg-background text-foreground transition-all duration-200"
          style={{ minHeight: '44px', maxHeight: '120px' }}
          rows={1}
          disabled={isProcessing && !isStreaming}
        />
        <button
          onClick={handleButtonClick}
          disabled={!isStreaming && (!inputMessage.trim() || isProcessing)}
          className={`px-3 sm:px-5 rounded-xl font-medium flex items-center justify-center space-x-1 sm:space-x-2 cursor-pointer transition-all duration-200 text-sm h-11 shadow-md ${
            isStreaming
              ? 'bg-destructive hover:bg-destructive/90 text-white'
              : 'bg-gradient-brand hover:shadow-glow disabled:opacity-50 text-white'
          }`}
          title={isStreaming ? "Stop generation" : (isProcessing ? "Loading..." : "Send message")}
        >
          {isStreaming ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span className="hidden sm:inline">Stop</span>
            </>
          ) : isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span className="hidden sm:inline">Send</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              <span className="hidden sm:inline">Send</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
