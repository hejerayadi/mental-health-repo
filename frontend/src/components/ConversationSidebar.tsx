import React from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <Sidebar className={`${isCollapsed ? 'w-14' : 'w-80'} transition-all duration-300`}>
      <SidebarContent className="bg-sidebar-background border-r border-sidebar-border">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <Button
            onClick={onNewConversation}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            <Plus size={18} />
            {!isCollapsed && <span className="ml-2">New Sports Chat</span>}
          </Button>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground px-5 py-4 font-bold text-lg mb-2">
              {!isCollapsed && 'Recent Conversations'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {conversations.length === 0 ? (
                  <div className="px-5 py-10 mb-6 rounded-lg bg-sidebar-accent/10">
                    {!isCollapsed && (
                      <div className="text-center text-sidebar-foreground/80">
                        <MessageSquare size={40} className="mx-auto mb-3 opacity-60" />
                        <p className="text-base font-semibold">No conversations yet</p>
                        <p className="text-sm mt-2">Start a new sports chat!</p>
                      </div>
                    )}
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <SidebarMenuItem key={conversation.id} className="mb-6 last:mb-0">
                      <SidebarMenuButton
                        onClick={() => onSelectConversation(conversation.id)}
                        className={`group relative w-full px-10 py-7 rounded-lg transition-all duration-200 min-h-[80px] ${
                          activeConversationId === conversation.id
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md border-2 border-violet-600'
                            : 'hover:bg-sidebar-accent/50 text-sidebar-foreground hover:shadow-sm border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3 w-full min-w-0">
                          <MessageSquare size={18} className="flex-shrink-0 mt-1" />
                          {!isCollapsed && (
                            <div className="flex-1 min-w-0 ml-2">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm truncate">
                                  {conversation.title}
                                </h3>
                                <span className="text-xs text-sidebar-foreground/60 ml-2 font-medium">
                                  {formatDate(conversation.timestamp)}
                                </span>
                              </div>
                              <p className="text-xs text-sidebar-foreground/70 truncate mt-1 leading-relaxed">
                                {conversation.lastMessage}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-sidebar-foreground/50 font-medium">
                                  {conversation.messageCount} messages
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {!isCollapsed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(conversation.id);
                            }}
                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive border border-transparent hover:border-destructive/30"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>

        {/* Footer */}
        {!isCollapsed && (
          <div className="border-t border-sidebar-border p-4 px-8 sticky bottom-0 bg-sidebar-background z-10">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-sidebar-foreground mb-1">
                🏆 Sports Talk AI
              </h3>
              <p className="text-xs text-sidebar-foreground/70 leading-relaxed">
                Your ultimate sports discussion companionssssss
              </p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default ConversationSidebar;
