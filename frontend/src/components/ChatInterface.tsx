import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import VoiceInterface from './VoiceInterface';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatInterfaceProps {
  conversationId: string;
  onUpdateConversation: (id: string, title: string, messages: Message[]) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ conversationId, onUpdateConversation }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hey there, sports fan! 🏆 I'm your AI sports companion. Whether you want to talk about the latest games, analyze player stats, discuss trade rumors, or dive deep into sports strategy, I'm here for it all. What's on your mind today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputValue;
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    // Simulate bot response with sports-themed replies
    setTimeout(() => {
      const botResponses = [
        "That's an interesting point about sports! What specific aspect would you like to explore further?",
        "Great question! In sports, there are always multiple perspectives to consider. Here's my take...",
        "I love discussing sports strategy! That reminds me of a similar situation in recent games...",
        "Sports analytics can be fascinating! Let me break down what the numbers might tell us...",
        "That's a hot topic in the sports world right now! Here's what I think about the situation...",
        "Classic sports debate! Both sides have valid arguments. Let me share some insights..."
      ];

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponses[Math.floor(Math.random() * botResponses.length)],
        sender: 'bot',
        timestamp: new Date()
      };

      const updatedMessages = [...newMessages, botMessage];
      setMessages(updatedMessages);
      setIsLoading(false);

      // Update conversation in sidebar
      const title = userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : '');
      onUpdateConversation(conversationId, title, updatedMessages);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="border-b border-border bg-card/80 px-6 py-2">
        <div>
          <h3 className="text-lg font-semibold text-foreground">+++ Sports Talk AI</h3>
          <p className="text-xs text-muted-foreground">+++++ Your intelligent sports discussion companion</p>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4">
        <div className="max-w-4xl mx-auto py-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 mb-6 ${message.sender === 'user' ? 'justify-end' : ''}`}
            >
              {message.sender === 'bot' && (
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Bot size={16} className="text-primary-foreground" />
                </div>
              )}
              
              <div
                className={`max-w-[70%] ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-card text-card-foreground'
                } rounded-2xl px-4 py-3 shadow-sm`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {message.sender === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <User size={16} className="text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 mb-6">
              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Bot size={16} className="text-primary-foreground" />
              </div>
              <div className="bg-card rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-card/30 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about sports, players, games, stats..."
                className="min-h-[48px] resize-none bg-background border-border text-foreground placeholder:text-muted-foreground"
                disabled={isLoading}
              />
            </div>
            <VoiceInterface onSendMessage={handleSendMessage} />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
