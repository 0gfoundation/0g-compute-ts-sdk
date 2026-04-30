import { useRef, useCallback } from 'react';
import type { ZGComputeNetworkBroker } from '@0gfoundation/0g-compute-ts-sdk';
import type { Message } from '../types/broker';

interface ServiceMetadata {
  endpoint: string;
  model: string;
}

interface Provider {
  address: string;
  name: string;
}

interface ChatHistory {
  addMessage: (message: {
    role: "system" | "user" | "assistant";
    content: string;
    chat_id?: string;
    is_verified?: boolean | null;
    is_verifying?: boolean;
  }) => Promise<string | null>;
}

interface MessageHandlingConfig {
  broker: ZGComputeNetworkBroker | null;
  selectedProvider: Provider | null;
  serviceMetadata: ServiceMetadata | null;
  chatHistory: ChatHistory;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  inputMessage: string;
  setInputMessage: (message: string) => void;
  setIsLoading: (loading: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  setErrorWithTimeout: (error: string | null) => void;
  isUserScrollingRef: React.RefObject<boolean>;
  openConnectModal?: () => void;
  requestDeposit?: () => Promise<void>;
}

export function useMessageHandling(config: MessageHandlingConfig) {
  const {
    broker,
    selectedProvider,
    serviceMetadata,
    chatHistory,
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    setIsLoading,
    setIsStreaming,
    setErrorWithTimeout,
    isUserScrollingRef,
    openConnectModal,
    requestDeposit,
  } = config;

  // AbortController for stopping generation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Stop generation function
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [setIsLoading, setIsStreaming]);

  const ensureReady = useCallback(async (): Promise<boolean> => {
    if (!broker) {
      if (openConnectModal) openConnectModal();
      return false;
    }
    if (requestDeposit) {
      try {
        await requestDeposit();
      } catch {
        return false;
      }
    }
    return true;
  }, [broker, openConnectModal, requestDeposit]);

  // Shared streaming request logic used by both sendMessage and resendMessage
  const executeStreamingRequest = useCallback(async (
    activeBroker: ZGComputeNetworkBroker,
    provider: Provider,
    messagesToSend: Array<{ role: string; content: string }>,
    sessionId: string | null,
  ) => {
    let firstContentReceived = false;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      let currentMetadata = serviceMetadata;
      if (!currentMetadata) {
        currentMetadata = await activeBroker.inference.getServiceMetadata(
          provider.address
        );
        if (!currentMetadata) {
          throw new Error("Failed to get service metadata");
        }
      }

      const headers = await activeBroker.inference.getRequestHeaders(
        provider.address,
        JSON.stringify(messagesToSend)
      );

      const { endpoint, model } = currentMetadata;
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          messages: messagesToSend,
          model: model,
          stream: true,
        }),
        signal,
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorBody = await response.text();
          if (errorBody) {
            try {
              const errorJson = JSON.parse(errorBody);
              errorMessage = JSON.stringify(errorJson, null, 2);
            } catch {
              errorMessage = errorBody;
            }
          }
        } catch {
          // Keep original message if can't read body
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isVerified: null,
        isVerifying: false,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const decoder = new TextDecoder();
      let buffer = "";
      let chatId = response.headers.get("ZG-Res-Key") || "";
      let completeContent = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (!chatId && parsed.id) {
                  chatId = parsed.id;
                }

                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  if (!firstContentReceived) {
                    setIsLoading(false);
                    firstContentReceived = true;
                  }

                  completeContent += content;
                  setMessages((prev) =>
                    prev.map((msg, index) =>
                      index === prev.length - 1
                        ? {
                            ...msg,
                            content: completeContent,
                            chatId,
                            isVerified: msg.isVerified,
                            isVerifying: msg.isVerifying,
                          }
                        : msg
                    )
                  );

                  // Auto-scroll is handled by the useEffect in OptimizedChatPage
                  // that watches messages state changes.
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Update final message
      setMessages((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1
            ? {
                ...msg,
                content: completeContent,
                chatId,
                isVerified: msg.isVerified || null,
                isVerifying: msg.isVerifying || false,
              }
            : msg
        )
      );

      // Save assistant message to database
      if (completeContent.trim() && sessionId) {
        try {
          const { dbManager } = await import('../lib/database');
          await dbManager.saveMessage(sessionId, {
            role: "assistant",
            content: completeContent,
            timestamp: Date.now(),
            chat_id: chatId,
            is_verified: null,
            is_verifying: false,
            provider_address: provider.address,
          });
        } catch {
          // Silent fail for database operations
        }
      }

      if (!firstContentReceived) {
        setIsLoading(false);
      }
      setIsStreaming(false);
      abortControllerRef.current = null;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setIsLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
        return;
      }

      let errorMessage = "Failed to send message. Please try again.";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        try {
          errorMessage = JSON.stringify(err, null, 2);
        } catch {
          errorMessage = String(err);
        }
      }

      setErrorWithTimeout(`Chat error: ${errorMessage}`);

      setMessages((prev) =>
        prev.filter((msg) => msg.role !== "assistant" || msg.content !== "")
      );

      if (!firstContentReceived) {
        setIsLoading(false);
      }
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [serviceMetadata, setMessages, setIsLoading, setIsStreaming,
    setErrorWithTimeout, isUserScrollingRef]);

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !selectedProvider) return;
    if (!(await ensureReady())) return;
    if (!broker) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);

    let sessionId: string | null = null;
    try {
      sessionId = await chatHistory.addMessage({
        role: userMessage.role,
        content: userMessage.content,
        chat_id: undefined,
        is_verified: null,
        is_verifying: false,
      });
    } catch {
      // Silent fail for database operations
    }

    setInputMessage("");
    setIsLoading(true);
    setIsStreaming(true);
    setErrorWithTimeout(null);

    // TODO: Move textarea height reset to the ChatInput component via callback/ref
    // instead of querying the DOM directly from a data hook
    setTimeout(() => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = '40px';
      }
    }, 0);

    const messagesToSend = [
      ...messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content })),
      { role: userMessage.role, content: userMessage.content },
    ];

    await executeStreamingRequest(broker, selectedProvider, messagesToSend, sessionId);
  }, [messages, inputMessage, ensureReady, selectedProvider, broker, chatHistory,
    setMessages, setInputMessage, setIsLoading, setIsStreaming, setErrorWithTimeout,
    executeStreamingRequest]);

  const verifyResponse = useCallback(async (message: Message, messageIndex: number) => {
    if (!broker || !selectedProvider || !message.chatId) {
      return;
    }

    setMessages((prev) => {
      const updated = prev.map((msg, index) =>
        index === messageIndex
          ? { ...msg, isVerifying: true, isVerified: null }
          : msg
      );
      return updated;
    });

    // Force a re-render to ensure state change is visible
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const [isValid] = await Promise.all([
        broker.inference.processResponse(
          selectedProvider.address,
          message.chatId,
          message.content
        ),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);

      setMessages((prev) => {
        const updated = prev.map((msg, index) =>
          index === messageIndex
            ? { ...msg, isVerified: isValid, isVerifying: false }
            : msg
        );
        return updated;
      });
    } catch (err: unknown) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessages((prev) => {
        const updated = prev.map((msg, index) =>
          index === messageIndex
            ? { ...msg, isVerified: false, isVerifying: false }
            : msg
        );
        return updated;
      });
    }
  }, [broker, selectedProvider, setMessages]);

  // Resend a message with given content and context (for edit/regenerate)
  const resendMessage = useCallback(async (content: string, contextMessages: Message[]) => {
    if (!content.trim() || !selectedProvider) return;
    if (!(await ensureReady())) return;
    if (!broker) return;

    const userMessage: Message = {
      role: "user",
      content: content,
      timestamp: Date.now(),
    };

    setMessages([...contextMessages, userMessage]);

    let sessionId: string | null = null;
    try {
      sessionId = await chatHistory.addMessage({
        role: userMessage.role,
        content: userMessage.content,
        chat_id: undefined,
        is_verified: null,
        is_verifying: false,
      });
    } catch {
      // Silent fail for database operations
    }

    setIsLoading(true);
    setIsStreaming(true);
    setErrorWithTimeout(null);

    const messagesToSend = [
      ...contextMessages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content })),
      { role: userMessage.role, content: userMessage.content },
    ];

    await executeStreamingRequest(broker, selectedProvider, messagesToSend, sessionId);
  }, [ensureReady, broker, selectedProvider, chatHistory, setMessages,
    setIsLoading, setIsStreaming, setErrorWithTimeout, executeStreamingRequest]);

  return {
    sendMessage,
    verifyResponse,
    stopGeneration,
    resendMessage,
  };
}
