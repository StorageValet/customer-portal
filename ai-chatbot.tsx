import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Minimize2, 
  Maximize2,
  X,
  Loader2,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: {
    page?: string;
    items?: number;
    movements?: number;
    plan?: string;
  };
}

interface ChatbotProps {
  currentPage?: string;
  userContext?: any;
}

export default function AIChatbot({ currentPage, userContext }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your dedicated Storage Valet AI assistant. As your storage concierge, I'm here to help you with:\n\n• Managing your digital inventory\n• Scheduling pickups and deliveries\n• Understanding your plan benefits\n• Navigating portal features\n• Answering service questions\n\nHow can I assist you with your storage needs today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const suggestions = [
    "How do I schedule a pickup?",
    "What's included in my plan?",
    "How can I add new items?",
    "When is my next appointment?",
    "How does pricing work?",
    "What's my insurance coverage?"
  ];

  const getSystemContext = () => {
    const context = {
      user: {
        name: user?.firstName + ' ' + user?.lastName,
        email: user?.email,
        plan: user?.plan || 'Starter',
        setupFeePaid: user?.setupFeePaid
      },
      currentPage,
      ...userContext
    };

    return `You are a helpful AI assistant for Storage Valet, a premium storage concierge service. You are speaking with an active Storage Valet customer through their secure customer portal.

Current customer context:
- Customer: ${context.user.name} (${context.user.email})
- Active Plan: ${context.user.plan}
- Setup Fee Status: ${context.user.setupFeePaid ? 'Paid' : 'Pending'}
- Current Portal Page: ${currentPage || 'Dashboard'}

Plan Details:
- Starter Plan: $199/month, $100 setup fee, $2,000 insurance coverage
- Medium Plan: $299/month, $150 setup fee, $3,000 insurance coverage  
- Family Plan: $359/month, $180 setup fee, $4,000 insurance coverage

Your Storage Valet Services:
- Door-to-door pickup and delivery service
- Digital inventory management with photo cataloging
- Smart scheduling system with flexible time slots
- Real-time tracking and email notifications
- Climate-controlled storage facilities
- White-glove handling and professional care
- Comprehensive insurance coverage for stored items

Communication Guidelines:
- Address the customer professionally and personally
- Provide specific, actionable guidance for their Storage Valet account
- Help with inventory management, scheduling, and portal navigation
- Explain features and benefits relevant to their plan
- For billing changes or account modifications, direct them to contact our support team
- Always maintain a helpful, knowledgeable tone as their dedicated storage concierge assistant

Remember: This customer has chosen Storage Valet for premium storage services and deserves exceptional support.`;
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      context: {
        page: currentPage,
        ...userContext
      }
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const response = await apiRequest('POST', '/api/chat', {
        messages: [
          {
            role: 'system',
            content: getSystemContext()
          },
          ...messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: 'user',
            content: content.trim()
          }
        ]
      });

      const data = await response.json();

      if (data.response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('No response from AI');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Chat Error",
        description: "Sorry, I'm having trouble responding right now. Please try again.",
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize for the technical difficulty. Please try your question again, or contact our Storage Valet support team for immediate personal assistance with your account.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Chat cleared! How can I assist you with your Storage Valet account today?",
        timestamp: new Date()
      }
    ]);
    setShowSuggestions(true);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full bg-teal hover:bg-teal-medium text-navy shadow-lg hover:shadow-xl transition-all duration-300 group"
            size="icon"
          >
            <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
            <span className="sr-only">Open AI Assistant</span>
          </Button>
        )}
      </div>

      {/* Chat Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="right" 
          className="w-full sm:w-96 p-0 flex flex-col h-full"
        >
          <SheetHeader className="p-4 border-b bg-navy text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 bg-teal rounded-full">
                  <Sparkles className="h-4 w-4 text-navy" />
                </div>
                <div>
                  <SheetTitle className="text-white">AI Assistant</SheetTitle>
                  <p className="text-xs text-blue-100">Always here to help</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="text-white hover:bg-white/10"
                >
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-teal text-navy'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.role === 'assistant' && (
                        <Bot className="h-4 w-4 mt-0.5 text-teal flex-shrink-0" />
                      )}
                      {message.role === 'user' && (
                        <User className="h-4 w-4 mt-0.5 text-navy flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {format(message.timestamp, 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-teal" />
                      <Loader2 className="h-4 w-4 animate-spin text-teal" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              {showSuggestions && messages.length === 1 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 text-center">Quick questions:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-left h-auto p-3 text-xs hover:bg-teal/10 hover:border-teal"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4 bg-white">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me about your Storage Valet account..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="bg-teal text-navy hover:bg-teal-medium"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              AI assistant powered by OpenAI • Available 24/7
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}