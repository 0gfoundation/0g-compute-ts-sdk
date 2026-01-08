import { useRef, useCallback } from 'react';
import { getChatApiKey } from '@/shared/utils/apiKeyStorage';

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: number;
  chatId?: string;
  isVerified?: boolean | null;
  isVerifying?: boolean;
}

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
  broker: any;
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
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  userAddress?: string; // User's wallet address for API key lookup
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
    messagesEndRef,
    userAddress,
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

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedProvider || !broker) {
      return;
    }

    // Create user message
    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      timestamp: Date.now(),
    };

    // Add user message to UI immediately
    setMessages((prev) => [...prev, userMessage]);

    // Save user message to database and get session ID
    let currentSessionForAssistant: string | null = null;
    try {
      currentSessionForAssistant = await chatHistory.addMessage({
        role: userMessage.role,
        content: userMessage.content,
        chat_id: undefined,
        is_verified: null,
        is_verifying: false,
      });
    } catch (err) {
      // FIXED: Add error logging for debugging (still fail silently to user)
      console.warn('[ChatHistory] Failed to save user message to database:', err);
    }
    
    // Reset input and start loading
    setInputMessage("");
    setIsLoading(true);
    setIsStreaming(true);
    setErrorWithTimeout(null);
    
    // Reset textarea height
    setTimeout(() => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = '40px';
      }
    }, 0);
    
    let firstContentReceived = false;

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // Get service metadata
      let currentMetadata = serviceMetadata;
      if (!currentMetadata) {
        currentMetadata = await broker.inference.getServiceMetadata(
          selectedProvider.address
        );
        if (!currentMetadata) {
          throw new Error("Failed to get service metadata");
        }
      }

      // Prepare messages for API
      const messagesToSend = [
        ...messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role, content: m.content })),
        { role: userMessage.role, content: userMessage.content },
      ];
      
      // Get request headers
      let headers: HeadersInit;

      // Try to use stored API key first (方案 D: 使用选中的 chat key)
      const chatKey = userAddress ? getChatApiKey(selectedProvider.address, userAddress) : null;

      if (chatKey) {
        // Use stored chat API key
        console.log('[Chat] Using stored API key:', chatKey.label || chatKey.id);
        headers = {
          'Authorization': `Bearer ${chatKey.apiKey}`,
          'Content-Type': 'application/json',
        };
      } else {
        // Fallback: Use SDK auto-generated key
        console.log('[Chat] No stored API key found, using SDK auto-generated key');
        try {
          headers = await broker.inference.getRequestHeaders(
            selectedProvider.address,
            JSON.stringify(messagesToSend)
          );
        } catch (headerError) {
          throw headerError;
        }
      }
      // Send request to service
      const { endpoint, model } = currentMetadata;
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          messages: [
            ...messages
              .filter((m) => m.role !== "system")
              .map((m) => ({ role: m.role, content: m.content })),
            { role: userMessage.role, content: userMessage.content },
          ],
          model: model,
          stream: true,
        }),
        signal, // Add abort signal
      });

      if (!response.ok) {
        // Handle error response
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

      // Initialize streaming response
      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isVerified: null,
        isVerifying: false,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Process streaming response
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
                  // Hide loading indicator on first content received
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

                  // Auto-scroll during streaming
                  setTimeout(() => {
                    if (!isUserScrollingRef.current) {
                      messagesEndRef.current?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }
                  }, 50);
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
      if (completeContent.trim() && currentSessionForAssistant) {
        try {
          const { dbManager } = await import('../lib/database');
          await dbManager.saveMessage(currentSessionForAssistant, {
            role: "assistant",
            content: completeContent,
            timestamp: Date.now(),
            chat_id: chatId,
            is_verified: null,
            is_verifying: false,
            provider_address: selectedProvider?.address || '',
          });
        } catch (err) {
          // FIXED: Add error logging for debugging (still fail silently to user)
          console.warn('[ChatHistory] Failed to save assistant message to database:', err);
        }
      }

      // Ensure loading is stopped
      if (!firstContentReceived) {
        setIsLoading(false);
      }
      setIsStreaming(false);
      abortControllerRef.current = null;
    } catch (err: unknown) {
      // Check if it was aborted by user
      if (err instanceof Error && err.name === 'AbortError') {
        // User stopped generation - don't show error
        // Keep the partial message if any
        setIsLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
        return;
      }

      // Handle other errors
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

      // Remove the loading message if it exists
      setMessages((prev) =>
        prev.filter((msg) => msg.role !== "assistant" || msg.content !== "")
      );

      // Ensure loading is stopped
      if (!firstContentReceived) {
        setIsLoading(false);
      }
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const verifyResponse = async (message: Message, messageIndex: number) => {
    if (!broker || !selectedProvider || !message.chatId) {
      return;
    }

    // Set verifying state
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
      // Verify response with minimum loading time
      const [isValid] = await Promise.all([
        broker.inference.processResponse(
          selectedProvider.address,
          message.chatId,
          message.content
        ),
        new Promise((resolve) => setTimeout(resolve, 1000)), // Minimum 1 second loading
      ]);

      // Update verification result
      setMessages((prev) => {
        const updated = prev.map((msg, index) =>
          index === messageIndex
            ? { ...msg, isVerified: isValid, isVerifying: false }
            : msg
        );
        return updated;
      });
    } catch (err: unknown) {
      // Mark as verification failed
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
  };

  return {
    sendMessage,
    verifyResponse,
    stopGeneration,
  };
}