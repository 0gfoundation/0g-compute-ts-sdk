"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChevronDown, ChevronRight } from "lucide-react";

// Hook to detect mobile screen
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

// Helper to get date group label
type DateGroup = 'Today' | 'Yesterday' | 'Last 7 Days' | 'Last 30 Days' | 'Older';

function getDateGroup(timestamp: number): DateGroup {
  const now = new Date();
  const date = new Date(timestamp);

  // Reset to start of day for comparison
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const last7DaysStart = todayStart - 7 * 24 * 60 * 60 * 1000;
  const last30DaysStart = todayStart - 30 * 24 * 60 * 60 * 1000;

  const ts = date.getTime();

  if (ts >= todayStart) return 'Today';
  if (ts >= yesterdayStart) return 'Yesterday';
  if (ts >= last7DaysStart) return 'Last 7 Days';
  if (ts >= last30DaysStart) return 'Last 30 Days';
  return 'Older';
}

interface GroupedSessions {
  [key: string]: Session[];
}

const DATE_GROUP_ORDER: DateGroup[] = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'Older'];

interface SearchResult {
  sessionId: string;
  content: string;
  role: string;
  timestamp?: number;
}

interface Session {
  session_id: string;
  title?: string;
  updated_at: number;
}

interface ChatHistory {
  sessions: Session[];
  currentSessionId: string | null;
  deleteSession: (sessionId: string) => void;
}

interface ChatSidebarProps {
  showHistorySidebar: boolean;
  onClose: () => void;
  isProcessing: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  isSearching: boolean;
  clearSearch: () => void;
  chatHistory: ChatHistory;
  handleHistoryClick: (sessionId: string, targetMessage?: string) => Promise<void>;
}

// Shared sidebar content component
function SidebarContent({
  isProcessing,
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  clearSearch,
  chatHistory,
  handleHistoryClick,
}: Omit<ChatSidebarProps, 'showHistorySidebar' | 'onClose'>) {
  // Track collapsed state for date groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const groups: GroupedSessions = {};
    for (const session of chatHistory.sessions) {
      const group = getDateGroup(session.updated_at);
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(session);
    }
    return groups;
  }, [chatHistory.sessions]);

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  return (
    <>
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 sr-only">Chat History</h3>
          {isProcessing && (
            <div className="flex items-center text-xs text-orange-600">
              <div className="animate-spin rounded-full h-3 w-3 border border-orange-400 border-t-transparent mr-1"></div>
              <span>AI responding...</span>
            </div>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isProcessing}
            className={`w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 ${
              isProcessing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
            }`}
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search Results */}
        {searchQuery ? (
          <div className="p-2">
            {isSearching ? (
              <div className="p-4 text-center text-gray-500 text-sm flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-purple-600 mr-2"></div>
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No messages found for &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-gray-500 font-medium px-2 py-1">
                  {searchResults.length} result(s) found
                </div>
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 bg-white border border-gray-200 rounded-lg transition-colors ${
                      isProcessing
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-purple-50 hover:border-purple-200 cursor-pointer'
                    }`}
                    onClick={async () => {
                      if (result.sessionId && !isProcessing) {
                        try {
                          // Clear search first
                          clearSearch();

                          // Load the session and scroll to the specific message
                          await handleHistoryClick(result.sessionId, result.content);
                        } catch (err) {
                          // Handle error silently
                        }
                      }
                    }}
                  >
                    <div className="text-xs text-gray-500 mb-1 flex items-center justify-between">
                      <span>
                        {result.role === 'user' ? 'You' : 'Assistant'} • {' '}
                        {result.timestamp ? new Date(result.timestamp).toLocaleDateString() : 'Unknown date'}
                      </span>
                      <span className="text-purple-500 hover:text-purple-700 font-medium">
                        View →
                      </span>
                    </div>
                    <div className="text-sm text-gray-900 overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {result.content.length > 100
                        ? result.content.substring(0, 100) + '...'
                        : result.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Session List - Grouped by Date */
          chatHistory.sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No chat history yet
            </div>
          ) : (
            <div className="p-2">
              {DATE_GROUP_ORDER.map((group) => {
                const sessions = groupedSessions[group];
                if (!sessions || sessions.length === 0) return null;

                const isCollapsed = collapsedGroups[group];

                return (
                  <div key={group} className="mb-2">
                    {/* Group Header */}
                    <button
                      onClick={() => toggleGroup(group)}
                      className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        {isCollapsed ? (
                          <ChevronRight className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        <span>{group}</span>
                      </div>
                      <span className="text-gray-400">{sessions.length}</span>
                    </button>

                    {/* Group Sessions */}
                    {!isCollapsed && (
                      <div className="space-y-1 mt-1">
                        {sessions.map((session) => (
                          <div
                            key={session.session_id}
                            className={`relative group rounded-lg text-sm transition-colors ${
                              chatHistory.currentSessionId === session.session_id
                                ? 'bg-purple-50 border border-purple-200'
                                : isProcessing
                                ? 'bg-gray-100 border border-transparent'
                                : 'hover:bg-gray-50 border border-transparent'
                            }`}
                          >
                            <button
                              onClick={() => handleHistoryClick(session.session_id)}
                              disabled={isProcessing}
                              className={`w-full text-left p-3 pr-10 rounded-lg transition-colors ${
                                isProcessing
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : ''
                              }`}
                            >
                              <div className="font-medium text-gray-900 truncate">
                                {session.title || 'Untitled Chat'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(session.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {group !== 'Today' && group !== 'Yesterday' && (
                                  <span> • {new Date(session.updated_at).toLocaleDateString()}</span>
                                )}
                              </div>
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isProcessing) {
                                  chatHistory.deleteSession(session.session_id);
                                }
                              }}
                              disabled={isProcessing}
                              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 ${
                                isProcessing
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title="Delete chat history"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </>
  );
}

export function ChatSidebar({
  showHistorySidebar,
  onClose,
  isProcessing,
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  clearSearch,
  chatHistory,
  handleHistoryClick,
}: ChatSidebarProps) {
  const isMobile = useIsMobile();

  const contentProps = {
    isProcessing,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    clearSearch,
    chatHistory,
    handleHistoryClick,
  };

  return (
    <>
      {/* Desktop Sidebar - hidden on mobile */}
      {showHistorySidebar && !isMobile && (
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <SidebarContent {...contentProps} />
        </div>
      )}

      {/* Mobile Sheet - only visible on mobile */}
      {isMobile && (
        <Sheet open={showHistorySidebar} onOpenChange={(open) => !open && onClose()}>
          <SheetContent side="left" className="w-80 p-0 flex flex-col">
            <SheetHeader className="p-4 border-b border-gray-200 bg-gray-50">
              <SheetTitle>Chat History</SheetTitle>
            </SheetHeader>
            <div className="flex-1 flex flex-col overflow-hidden">
              <SidebarContent {...contentProps} />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
