"use client";

import React, { useCallback, useState, useEffect } from 'react';
import { Square } from 'lucide-react';

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  isProcessing: boolean;
  isStreaming?: boolean;
  onSendMessage: () => void;
  onStopGeneration?: () => void;
}

export function ChatInput({
  inputMessage,
  setInputMessage,
  isProcessing,
  isStreaming = false,
  onSendMessage,
  onStopGeneration,
}: ChatInputProps) {
  // Force client-side rendering to prevent hydration issues
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-3 items-end">
          <div className="flex-1 h-10 bg-gray-100 rounded-md animate-pulse" />
          <div className="w-20 h-10 bg-gray-100 rounded-md animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="flex space-x-3 items-end">
        <textarea
          value={inputMessage}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={isProcessing ? "AI is responding..." : "Type your message... (Shift+Enter for new line)"}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 resize-none overflow-y-auto disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          style={{ minHeight: '40px', maxHeight: '120px' }}
          rows={1}
          disabled={isProcessing && !isStreaming}
        />
        <button
          onClick={handleButtonClick}
          disabled={!isStreaming && (!inputMessage.trim() || isProcessing)}
          className={`px-4 py-2 rounded-md font-medium flex items-center space-x-2 cursor-pointer transition-colors ${
            isStreaming
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white'
          }`}
          title={isStreaming ? "Stop generation" : (isProcessing ? "Loading..." : "Send message")}
        >
          {isStreaming ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>Stop</span>
            </>
          ) : isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Send</span>
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
              <span>Send</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
