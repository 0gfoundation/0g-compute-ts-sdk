"use client";

import React, { useState, useCallback, memo, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, User, Bot, ShieldCheck, ShieldAlert, Shield, Clock, Pencil, RefreshCw, X, Send } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: number;
  chatId?: string;
  isVerified?: boolean | null;
  isVerifying?: boolean;
}

interface ChatMessageItemProps {
  message: Message;
  originalIndex: number;
  isLoading: boolean;
  isStreaming: boolean;
  onVerify: (message: Message, originalIndex: number) => void;
  onEdit?: (originalIndex: number, newContent: string) => void;
  onRegenerate?: (originalIndex: number) => void;
}

// Code block component with syntax highlighting and copy button
function CodeBlock({
  children,
  className,
  inline
}: {
  children: React.ReactNode;
  className?: string;
  inline?: boolean
}) {
  const [copied, setCopied] = useState(false);

  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const codeContent = String(children).replace(/\n$/, "");

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(codeContent);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [codeContent]);

  if (inline) {
    return (
      <code className="bg-secondary text-primary px-1.5 py-0.5 rounded text-xs font-mono">
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-3 max-w-full">
      <div className="absolute top-0 right-0 flex items-center gap-2 px-2 py-1 rounded-bl-md rounded-tr-md bg-gray-800 text-gray-400 text-xs z-10">
        {language && <span className="uppercase font-medium">{language}</span>}
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language || "text"}
        PreTag="div"
        wrapLongLines={true}
        customStyle={{
          margin: 0,
          borderRadius: "0.375rem",
          padding: "1rem",
          paddingTop: "2rem",
          fontSize: "0.75rem",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
        codeTagProps={{
          style: {
            fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          },
        }}
      >
        {codeContent}
      </SyntaxHighlighter>
    </div>
  );
}

// Avatar component
function Avatar({ role }: { role: "user" | "assistant" }) {
  if (role === "user") {
    return (
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border">
        <User className="w-4 h-4 text-primary" />
      </div>
    );
  }
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center shadow-glow">
      <Bot className="w-4 h-4 text-white" />
    </div>
  );
}

// Memoized message item component
const ChatMessageItem = memo(function ChatMessageItem({
  message,
  originalIndex,
  isLoading,
  isStreaming,
  onVerify,
  onEdit,
  onRegenerate,
}: ChatMessageItemProps) {
  const isExpired = message.timestamp && Date.now() - message.timestamp > 20 * 60 * 1000;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea and focus when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleStartEdit = useCallback(() => {
    setEditContent(message.content);
    setIsEditing(true);
  }, [message.content]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditContent(message.content);
  }, [message.content]);

  const handleSaveEdit = useCallback(() => {
    if (editContent.trim() && editContent !== message.content && onEdit) {
      onEdit(originalIndex, editContent.trim());
    }
    setIsEditing(false);
  }, [editContent, message.content, onEdit, originalIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  const handleRegenerate = useCallback(() => {
    if (onRegenerate) {
      onRegenerate(originalIndex);
    }
  }, [onRegenerate, originalIndex]);

  // Determine if actions should be shown
  const showUserActions = message.role === "user" && !isLoading && !isStreaming && onEdit;
  const showAssistantActions = message.role === "assistant" && !isLoading && !isStreaming && onRegenerate;

  return (
    <div
      className={`group flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex items-start gap-3 max-w-[85%] sm:max-w-[80%] min-w-0 ${
          message.role === "user" ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <Avatar role={message.role as "user" | "assistant"} />

        <div className="flex flex-col gap-1 min-w-0">
          <div
            className={`rounded-2xl px-4 py-3 break-words transition-all duration-200 overflow-hidden min-w-0 ${
              message.role === "user"
                ? "bg-gradient-brand text-white shadow-md"
                : "bg-card text-foreground border border-border"
            }`}
            style={{ overflowWrap: "break-word", wordBreak: "break-word" }}
            data-message-content={message.content.substring(0, 100)}
          >
            <div className="text-sm overflow-hidden">
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={(e) => {
                      setEditContent(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full min-h-[60px] bg-white/10 text-white placeholder-white/50 border border-white/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                    placeholder="Edit your message..."
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="h-7 px-2 text-white/80 hover:text-white hover:bg-white/10"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={!editContent.trim() || editContent === message.content}
                      className="h-7 px-2 bg-white text-purple-600 hover:bg-white/90 disabled:opacity-50"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Save & Send
                    </Button>
                  </div>
                </div>
              ) : message.role === "assistant" ? (
                <div className="prose prose-sm max-w-none overflow-hidden prose-p:mb-2 prose-p:leading-relaxed prose-headings:font-semibold prose-h1:text-xl prose-h1:mb-3 prose-h2:text-lg prose-h2:mb-2 prose-h3:text-base prose-h3:mb-2 prose-ul:mb-2 prose-ol:mb-2 prose-li:mb-1 prose-blockquote:border-purple-500 prose-blockquote:text-gray-700 prose-a:text-purple-600 prose-strong:text-gray-900 prose-pre:overflow-x-auto prose-code:break-all">
                  <ReactMarkdown
                    components={{
                      code: ({ children, className, ...props }) => {
                        const isInline = !className;
                        return (
                          <CodeBlock className={className} inline={isInline} {...props}>
                            {children}
                          </CodeBlock>
                        );
                      },
                      pre: ({ children }) => <>{children}</>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div
                  className="whitespace-pre-wrap break-words"
                  style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", maxWidth: "100%" }}
                >
                  {message.content}
                </div>
              )}
            </div>

          {message.timestamp && (
            <div
              className={`flex items-center justify-between text-xs mt-1 gap-2 ${
                message.role === "user" ? "text-purple-200" : "text-gray-500"
              }`}
            >
              <span className="whitespace-nowrap">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>

              {/* Enhanced Verification controls */}
              {message.role === "assistant" &&
                message.chatId &&
                !isLoading &&
                !isStreaming && (
                  <TooltipProvider>
                    <div className="flex items-center gap-1.5">
                      {/* Verified badge - persistent indicator */}
                      {message.isVerified === true && !message.isVerifying && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 rounded-full border border-green-200">
                              <ShieldCheck className="w-3 h-3 text-green-600" />
                              <span className="text-green-600 font-medium">TEE Verified</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-semibold">Response Verified</p>
                            <p className="text-xs text-gray-400">This response has been cryptographically verified using Trusted Execution Environment (TEE).</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Failed verification badge */}
                      {message.isVerified === false && !message.isVerifying && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 rounded-full border border-red-200">
                              <ShieldAlert className="w-3 h-3 text-red-600" />
                              <span className="text-red-600 font-medium">Invalid</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-semibold text-red-600">Verification Failed</p>
                            <p className="text-xs text-gray-400">The response signature could not be verified. Click to retry.</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Verifying indicator */}
                      {message.isVerifying && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 rounded-full border border-purple-200">
                          <div className="animate-spin rounded-full h-3 w-3 border border-purple-400 border-t-transparent"></div>
                          <span className="text-purple-600">Verifying...</span>
                        </div>
                      )}

                      {/* Verify/Re-verify button */}
                      {!message.isVerifying && (
                        <button
                          onClick={() => !isExpired && onVerify(message, originalIndex)}
                          disabled={!!isExpired}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border transition-colors ${
                            isExpired
                              ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                              : message.isVerified === true
                              ? "bg-white hover:bg-purple-50 text-gray-500 hover:text-purple-600 border-gray-200 hover:border-purple-200"
                              : message.isVerified === false
                              ? "bg-red-50 hover:bg-purple-50 text-red-600 hover:text-purple-600 border-red-200 hover:border-purple-200"
                              : "bg-purple-50 hover:bg-purple-100 text-purple-600 hover:text-purple-700 border-purple-200"
                          }`}
                          title={
                            isExpired
                              ? "Verification info expires after 20 minutes"
                              : message.isVerified === true
                              ? "Re-verify this response"
                              : message.isVerified === false
                              ? "Retry verification"
                              : "Verify response authenticity"
                          }
                        >
                          {isExpired ? (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Expired</span>
                            </>
                          ) : (
                            <>
                              <Shield className="w-3 h-3" />
                              <span>{message.isVerified !== null && message.isVerified !== undefined ? 'Re-verify' : 'Verify'}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </TooltipProvider>
                )}
            </div>
          )}
          </div>

          {/* Edit/Regenerate action buttons - appear on hover */}
          {!isEditing && (
            <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}>
              {/* Edit button for user messages */}
              {showUserActions && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleStartEdit}
                        className="p-1 rounded-md text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit message</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Regenerate button for assistant messages */}
              {showAssistantActions && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleRegenerate}
                        className="p-1 rounded-md text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Regenerate response</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo
  // Only re-render if these specific props change
  return (
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.timestamp === nextProps.message.timestamp &&
    prevProps.message.isVerified === nextProps.message.isVerified &&
    prevProps.message.isVerifying === nextProps.message.isVerifying &&
    prevProps.message.chatId === nextProps.message.chatId &&
    prevProps.originalIndex === nextProps.originalIndex &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onRegenerate === nextProps.onRegenerate
  );
});

export default ChatMessageItem;
