import { useReducer, useEffect, useCallback } from 'react';
import { dbManager, type ChatMessage, type ChatSession } from '../lib/database';

export interface UseChatHistoryOptions {
  walletAddress: string;
  providerAddress?: string;
  autoSave?: boolean;
}

export interface UseChatHistoryReturn {
  // Current session
  currentSessionId: string | null;
  messages: ChatMessage[];

  // Session management
  sessions: ChatSession[];
  createNewSession: (title?: string) => Promise<string>;
  loadSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;

  // Message management
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<string | null>;
  updateMessage: (index: number, updates: Partial<ChatMessage>) => void;
  clearCurrentSession: () => Promise<void>;

  // Search and history
  searchMessages: (query: string) => Promise<ChatMessage[]>;

  // State
  isLoading: boolean;
  error: string | null;
}

// State type
interface ChatHistoryState {
  currentSessionId: string | null;
  messages: ChatMessage[];
  sessions: ChatSession[];
  isLoading: boolean;
  error: string | null;
}

// Action types
type ChatHistoryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_SESSIONS_SUCCESS'; payload: ChatSession[] }
  | { type: 'CREATE_SESSION_SUCCESS'; payload: { sessionId: string; sessions: ChatSession[] } }
  | { type: 'LOAD_SESSION_SUCCESS'; payload: { sessionId: string; messages: ChatMessage[] } }
  | { type: 'DELETE_SESSION_SUCCESS'; payload: { sessionId: string; sessions: ChatSession[]; wasCurrentSession: boolean } }
  | { type: 'UPDATE_SESSION_TITLE_SUCCESS'; payload: ChatSession[] }
  | { type: 'ADD_MESSAGE_SUCCESS'; payload: { sessionId: string; sessions?: ChatSession[] } }
  | { type: 'UPDATE_MESSAGE'; payload: { index: number; updates: Partial<ChatMessage> } }
  | { type: 'CLEAR_SESSION_SUCCESS' }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] };

// Initial state
const initialState: ChatHistoryState = {
  currentSessionId: null,
  messages: [],
  sessions: [],
  isLoading: false,
  error: null,
};

// Reducer function
function chatHistoryReducer(state: ChatHistoryState, action: ChatHistoryAction): ChatHistoryState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'LOAD_SESSIONS_SUCCESS':
      return { ...state, sessions: action.payload, error: null };

    case 'CREATE_SESSION_SUCCESS':
      return {
        ...state,
        currentSessionId: action.payload.sessionId,
        sessions: action.payload.sessions,
        messages: [],
        error: null,
      };

    case 'LOAD_SESSION_SUCCESS':
      return {
        ...state,
        currentSessionId: action.payload.sessionId,
        messages: action.payload.messages,
        isLoading: false,
        error: null,
      };

    case 'DELETE_SESSION_SUCCESS':
      return {
        ...state,
        sessions: action.payload.sessions,
        currentSessionId: action.payload.wasCurrentSession ? null : state.currentSessionId,
        messages: action.payload.wasCurrentSession ? [] : state.messages,
        error: null,
      };

    case 'UPDATE_SESSION_TITLE_SUCCESS':
      return { ...state, sessions: action.payload, error: null };

    case 'ADD_MESSAGE_SUCCESS':
      return {
        ...state,
        currentSessionId: action.payload.sessionId,
        sessions: action.payload.sessions || state.sessions,
        error: null,
      };

    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg, index) =>
          index === action.payload.index
            ? { ...msg, ...action.payload.updates }
            : msg
        ),
      };

    case 'CLEAR_SESSION_SUCCESS':
      return { ...state, messages: [], error: null };

    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };

    default:
      return state;
  }
}

export function useChatHistory({ walletAddress, providerAddress, autoSave = true }: UseChatHistoryOptions): UseChatHistoryReturn {
  const [state, dispatch] = useReducer(chatHistoryReducer, initialState);

  // Load sessions (database will initialize automatically)
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const walletSessions = await dbManager.getChatSessions(walletAddress || undefined);
        dispatch({ type: 'LOAD_SESSIONS_SUCCESS', payload: walletSessions });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Database initialization failed' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeDatabase();
  }, [walletAddress]);

  // Load sessions for current wallet (all providers)
  const loadSessions = useCallback(async (): Promise<ChatSession[]> => {
    try {
      const effectiveWalletAddress = walletAddress || undefined;
      const walletSessions = await dbManager.getChatSessions(effectiveWalletAddress);
      dispatch({ type: 'LOAD_SESSIONS_SUCCESS', payload: walletSessions });
      return walletSessions;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to load sessions' });
      return [];
    }
  }, [walletAddress]);

  // Create new session (not tied to specific provider)
  const createNewSession = useCallback(async (title?: string): Promise<string> => {
    try {
      // Use empty string for provider_address as sessions are now shared across providers
      const sessionId = await dbManager.createChatSession('', walletAddress || '', title);
      const sessions = await dbManager.getChatSessions(walletAddress || undefined);
      dispatch({ type: 'CREATE_SESSION_SUCCESS', payload: { sessionId, sessions } });
      return sessionId;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to create session' });
      throw err;
    }
  }, [walletAddress]);

  // Load existing session
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const sessionMessages = await dbManager.getMessages(sessionId);
      dispatch({ type: 'LOAD_SESSION_SUCCESS', payload: { sessionId, messages: sessionMessages } });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to load session' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Delete session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await dbManager.deleteChatSession(sessionId);
      const sessions = await dbManager.getChatSessions(walletAddress || undefined);
      const wasCurrentSession = state.currentSessionId === sessionId;
      dispatch({ type: 'DELETE_SESSION_SUCCESS', payload: { sessionId, sessions, wasCurrentSession } });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to delete session' });
    }
  }, [walletAddress, state.currentSessionId]);

  // Update session title
  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    try {
      await dbManager.updateChatSessionTitle(sessionId, title);
      const sessions = await dbManager.getChatSessions(walletAddress || undefined);
      dispatch({ type: 'UPDATE_SESSION_TITLE_SUCCESS', payload: sessions });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to update session title' });
    }
  }, [walletAddress]);

  // Generate chat title from first user message
  const generateChatTitle = useCallback((content: string): string => {
    // Take first 30 characters and add ellipsis if longer
    const maxLength = 30;
    const cleanContent = content.trim().replace(/\n/g, ' ');
    if (cleanContent.length <= maxLength) {
      return cleanContent;
    }
    return cleanContent.substring(0, maxLength).trim() + '...';
  }, []);

  // Add message to current session
  const addMessage = useCallback(async (messageData: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<string | null> => {
    try {
      // If no current session, create one
      let sessionId = state.currentSessionId;
      let newSessions: ChatSession[] | undefined;

      if (!sessionId) {
        sessionId = await dbManager.createChatSession('', walletAddress || '');
        newSessions = await dbManager.getChatSessions(walletAddress || undefined);
      }

      const message: Omit<ChatMessage, 'id'> = {
        ...messageData,
        timestamp: Date.now(),
        provider_address: providerAddress,
      };

      // Save to database if autoSave is enabled
      if (autoSave) {
        await dbManager.saveMessage(sessionId, message);

        // If this is the first user message, update session title
        if (messageData.role === 'user') {
          // Check if session already has a title by checking messages in database
          const existingMessages = await dbManager.getMessages(sessionId);
          const userMessages = existingMessages.filter(m => m.role === 'user');

          // Only set title if this is the first user message
          if (userMessages.length === 1) { // Just saved one user message
            const title = generateChatTitle(messageData.content);
            await dbManager.updateChatSessionTitle(sessionId, title);
            newSessions = await dbManager.getChatSessions(walletAddress || undefined);
          }
        }
      }

      dispatch({ type: 'ADD_MESSAGE_SUCCESS', payload: { sessionId, sessions: newSessions } });
      return sessionId;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to add message' });
      return null;
    }
  }, [state.currentSessionId, walletAddress, providerAddress, autoSave, generateChatTitle]);

  // Update message in current session
  const updateMessage = useCallback((index: number, updates: Partial<ChatMessage>) => {
    dispatch({ type: 'UPDATE_MESSAGE', payload: { index, updates } });

    // Update in database if message has ID and verification status changed
    const message = state.messages[index];
    if (message?.id && (updates.is_verified !== undefined || updates.is_verifying !== undefined)) {
      dbManager.updateMessageVerification(
        message.id,
        updates.is_verified ?? message.is_verified ?? false,
        updates.is_verifying ?? message.is_verifying ?? false
      ).catch(() => {
        // Silently handle verification update errors
      });
    }
  }, [state.messages]);

  // Clear current session messages
  const clearCurrentSession = useCallback(async () => {
    if (state.currentSessionId) {
      try {
        await dbManager.clearMessages(state.currentSessionId);
        dispatch({ type: 'CLEAR_SESSION_SUCCESS' });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to clear session' });
      }
    } else {
      dispatch({ type: 'CLEAR_SESSION_SUCCESS' });
    }
  }, [state.currentSessionId]);

  // Search messages
  const searchMessages = useCallback(async (query: string): Promise<ChatMessage[]> => {
    try {
      const effectiveWalletAddress = walletAddress || undefined;
      return await dbManager.searchMessages(query, effectiveWalletAddress, providerAddress);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to search messages' });
      return [];
    }
  }, [walletAddress, providerAddress]);

  return {
    // Current session
    currentSessionId: state.currentSessionId,
    messages: state.messages,

    // Session management
    sessions: state.sessions,
    createNewSession,
    loadSession,
    deleteSession,
    updateSessionTitle,

    // Message management
    addMessage,
    updateMessage,
    clearCurrentSession,

    // Search and history
    searchMessages,

    // State
    isLoading: state.isLoading,
    error: state.error,
  };
}
