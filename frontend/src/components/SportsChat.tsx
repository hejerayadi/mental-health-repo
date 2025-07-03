import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Menu } from 'lucide-react';
import ConversationSidebar from './ConversationSidebar';
import ChatInterface from './ChatInterface';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

const SIDEBAR_WIDTH = 256; // 64 * 4 = 256px (w-64)

const SportsChat: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('default');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleNewConversation = () => {
    const newId = `conv-${Date.now()}`;
    const newConversation: Conversation = {
      id: newId,
      title: 'New Sports Chat',
      lastMessage: 'Start a new conversation...',
      timestamp: new Date(),
      messageCount: 0,
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newId);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId('default');
    }
  };

  const handleUpdateConversation = (id: string, title: string, messages: Message[]) => {
    setConversations(prev => {
      const existing = prev.find(conv => conv.id === id);
      const updatedConv: Conversation = {
        id,
        title,
        lastMessage: messages[messages.length - 1]?.content || 'No messages',
        timestamp: new Date(),
        messageCount: messages.length,
      };
      if (existing) {
        return prev.map(conv => conv.id === id ? updatedConv : conv);
      } else {
        return [updatedConv, ...prev];
      }
    });
  };

  return (
    <SidebarProvider>
      <div className="relative min-h-screen w-full bg-background overflow-hidden">
        {/* Sidebar - absolutely positioned, slides in/out */}
        <div
          className={`
            fixed top-0 left-0 h-full z-30
            transition-transform duration-500 ease-in-out
            bg-card border-r border-border
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            w-64
          `}
          style={{
            boxShadow: sidebarOpen ? '2px 0 8px 0 rgba(0,0,0,0.04)' : undefined,
            willChange: 'transform',
          }}
        >
          <ConversationSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        </div>

        {/* Main content - slides horizontally with sidebar */}
        <div
          className={`
            relative min-h-screen flex flex-col transition-all duration-500 ease-in-out
          `}
          style={{
            marginLeft: sidebarOpen ? SIDEBAR_WIDTH : 0,
            transition: 'margin-left 0.5s cubic-bezier(0.4,0,0.2,1)',
            willChange: 'margin-left',
          }}
        >
          {/* Global Header - fixed and always visible */}
          <header
            className="fixed top-0 left-0 right-0 z-20 h-14 flex items-center justify-between border-b border-border bg-card/30 px-4 backdrop-blur-sm transition-all duration-500"
            style={{
              left: sidebarOpen ? SIDEBAR_WIDTH : 0,
              width: `calc(100% - ${sidebarOpen ? SIDEBAR_WIDTH : 0}px)`,
              transition: 'left 0.5s cubic-bezier(0.4,0,0.2,1), width 0.5s cubic-bezier(0.4,0,0.2,1)',
              willChange: 'left, width',
            }}
          >
            <div className="flex items-center gap-3">
              <button
                className="hover:bg-accent/50 p-2 rounded-lg transition-colors"
                onClick={() => setSidebarOpen(open => !open)}
                aria-label="Toggle sidebar"
              >
                <Menu size={18} className="text-foreground" />
              </button>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-foreground">Sports Talk AI</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground hidden sm:inline">Online</span>
            </div>
          </header>

          {/* Chat Interface with top padding for fixed header */}
          <div className="flex-1 pt-14">
            <ChatInterface
              conversationId={activeConversationId}
              onUpdateConversation={handleUpdateConversation}
              sidebarOpen={sidebarOpen}
              sidebarWidth={SIDEBAR_WIDTH}
            />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SportsChat;
