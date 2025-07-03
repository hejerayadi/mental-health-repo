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
    <Sidebar className={`${isCollapsed ? 'w-14' : 'w-64'} transition-all duration-300`}>
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
            <SidebarGroupLabel className="text-sidebar-foreground px-3 py-2 font-medium">
              {!isCollapsed && 'Recent Conversations'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {conversations.length === 0 ? (
                  <div className="px-3 py-6">
                    {!isCollapsed && (
                      <div className="text-center text-sidebar-foreground/60">
                        <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No conversations yet</p>
                        <p className="text-xs mt-1">Start a new sports chat!</p>
                      </div>
                    )}
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <SidebarMenuItem key={conversation.id}>
                      <SidebarMenuButton
                        onClick={() => onSelectConversation(conversation.id)}
                        className={`group relative w-52 rounded-lg transition-all duration-200 h-20 ${
                          activeConversationId === conversation.id
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-lg border-2 border-purple-500'
                            : 'hover:bg-sidebar-accent/50 text-sidebar-foreground hover:shadow-md hover:border-2 hover:border-purple-300'
                        } border-2 border-transparent`}
                      >
                        <div className="flex items-start gap-3 w-full min-w-0 h-full py-2 px-3">
                          <MessageSquare size={16} className="flex-shrink-0 mt-1" />
                          {!isCollapsed && (
                            <div className="flex-1 min-w-0 h-full flex flex-col justify-between pr-8">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-medium text-xs truncate max-w-[100px]">
                                  {conversation.title}
                                </h3>
                                <span className="text-xs text-sidebar-foreground/60 ml-2 font-normal flex-shrink-0">
                                  {formatDate(conversation.timestamp)}
                                </span>
                              </div>
                              <p className="text-xs text-sidebar-foreground/70 truncate leading-relaxed mb-1">
                                {conversation.lastMessage}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-sidebar-foreground/50 font-normal">
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
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive border border-transparent hover:border-destructive/30"
                          >
                            <Trash2 size={12} />
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
          <div className="border-t border-sidebar-border p-4">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-sidebar-foreground mb-1">
                🏆 Sports Talk AI
              </h3>
              <p className="text-xs text-sidebar-foreground/70 leading-relaxed">
                Your ultimate sports discussion companion
              </p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default ConversationSidebar;
