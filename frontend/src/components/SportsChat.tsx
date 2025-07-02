import React, { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
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

const SportsChat: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('default');

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
      <div className="min-h-screen flex w-full bg-background">
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
        />
        
        <div className="flex-1 flex flex-col">
          {/* Global Header */}
          <header className="h-14 flex items-center justify-between border-b border-border bg-card/30 px-4 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="hover:bg-accent/50 p-2 rounded-lg transition-colors">
                <Menu size={18} className="text-foreground" />
              </SidebarTrigger>
              {/* <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-foreground pl+100">| Sports Talk AI</h1>
              </div> */}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground hidden sm:inline">Online</span>
            </div>
          </header>

          {/* Chat Interface */}
          <div className="flex-1">
            <ChatInterface
              conversationId={activeConversationId}
              onUpdateConversation={handleUpdateConversation}
            />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SportsChat;
