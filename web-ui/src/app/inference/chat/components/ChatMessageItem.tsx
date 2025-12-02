"use client";

import React, { useState, useCallback, memo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, User, Bot } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

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
      <code className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded text-xs font-mono">
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
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <User className="w-4 h-4 text-purple-600" />
      </div>
    );
  }
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
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
}: ChatMessageItemProps) {
  const isExpired = message.timestamp && Date.now() - message.timestamp > 20 * 60 * 1000;

  return (
    <div
      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex items-start gap-3 max-w-[85%] sm:max-w-[80%] min-w-0 ${
          message.role === "user" ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <Avatar role={message.role as "user" | "assistant"} />

        <div
          className={`rounded-lg px-4 py-2 break-words transition-colors overflow-hidden min-w-0 ${
            message.role === "user"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-900"
          }`}
          style={{ overflowWrap: "break-word", wordBreak: "break-word" }}
          data-message-content={message.content.substring(0, 100)}
        >
          <div className="text-sm overflow-hidden">
            {message.role === "assistant" ? (
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
              className={`flex items-center justify-between text-xs mt-1 ${
                message.role === "user" ? "text-purple-200" : "text-gray-500"
              }`}
            >
              <span className="whitespace-nowrap">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>

              {/* Verification controls */}
              {message.role === "assistant" &&
                message.chatId &&
                !isLoading &&
                !isStreaming && (
                  <div className="flex items-center">
                    {/* Initial verification button */}
                    {!message.isVerifying &&
                      (message.isVerified === null || message.isVerified === undefined) && (
                        <button
                          onClick={() => !isExpired && onVerify(message, originalIndex)}
                          className={`px-1.5 py-0.5 rounded-full border transition-colors text-xs ${
                            isExpired
                              ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                              : "bg-purple-50 hover:bg-purple-100 text-purple-600 hover:text-purple-700 border-purple-200"
                          }`}
                          title={
                            isExpired
                              ? "Verification information is only retained for 20 minutes"
                              : "Verify response authenticity with TEE"
                          }
                          disabled={!!isExpired}
                        >
                          Verify
                        </button>
                      )}

                    {/* Verifying indicator */}
                    {message.isVerifying && (
                      <div className="inline-flex items-center px-1.5 py-0.5 bg-purple-50 rounded-full border border-purple-200">
                        <div className="animate-spin rounded-full h-2.5 w-2.5 border border-purple-400 border-t-transparent mr-1"></div>
                        <span className="text-xs text-purple-600">Verifying...</span>
                      </div>
                    )}

                    {/* Verification result */}
                    {!message.isVerifying &&
                      message.isVerified !== null &&
                      message.isVerified !== undefined && (
                        <button
                          onClick={() => !isExpired && onVerify(message, originalIndex)}
                          className={`px-1.5 py-0.5 rounded-full border transition-all duration-300 group relative text-xs ${
                            isExpired
                              ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                              : message.isVerified
                              ? "bg-green-50 hover:bg-purple-100 text-green-600 hover:text-purple-600 border-green-200 hover:border-purple-200"
                              : "bg-red-50 hover:bg-purple-100 text-red-600 hover:text-purple-600 border-red-200 hover:border-purple-200"
                          }`}
                          title={
                            isExpired
                              ? "Verification information is only retained for 20 minutes"
                              : message.isVerified
                              ? "TEE Verified - Click to verify again"
                              : "TEE Verification Failed - Click to retry"
                          }
                          disabled={!!isExpired}
                        >
                          <span className={isExpired ? "" : "group-hover:hidden"}>
                            {isExpired ? "Expired" : message.isVerified ? "Valid" : "Invalid"}
                          </span>
                          {!isExpired && (
                            <span className="hidden group-hover:inline">Verify</span>
                          )}
                        </button>
                      )}
                  </div>
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
    prevProps.isStreaming === nextProps.isStreaming
  );
});

export default ChatMessageItem;
