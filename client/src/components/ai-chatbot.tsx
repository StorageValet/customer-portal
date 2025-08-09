import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Sparkles,
  ChevronDown,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
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

export default function AIChatbot({ userContext }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm your Storage Valet concierge. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Prevent body scroll when chat is open on mobile
  useEffect(() => {
    if (isMobile && isOpen && !isMinimized) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobile, isOpen, isMinimized]);

  // Get current page name from location
  const getCurrentPage = () => {
    const path = location;
    const pageMap: Record<string, string> = {
      "/dashboard": "Dashboard",
      "/inventory": "Inventory",
      "/appointments": "Appointments",
      "/schedule-pickup": "Schedule Pickup",
      "/schedule-delivery": "Schedule Delivery",
      "/request-delivery": "Request Delivery",
      "/analytics": "Analytics",
      "/subscription": "Subscription",
    };
    return pageMap[path] || "Dashboard";
  };

  const suggestions = isMobile
    ? ["Schedule a pickup", "View my plan", "Add items", "Get help"]
    : [
        "How do I schedule a pickup?",
        "What's included in my plan?",
        "How can I add new items?",
        "When is my next appointment?",
        "How does pricing work?",
        "What's my insurance coverage?",
      ];

  const getSystemContext = () => {
    const currentPage = getCurrentPage();
    const context = {
      user: {
        name: user?.firstName + " " + user?.lastName,
        email: user?.email,
        plan: user?.plan || "Starter",
        setupFeePaid: user?.setupFeePaid,
      },
      currentPage,
      ...userContext,
    };

    return `You are a helpful AI assistant for Storage Valet. Current context: Customer ${context.user.name} on ${currentPage} page.`;
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
      context: {
        page: getCurrentPage(),
        ...userContext,
      },
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const response = await apiRequest("POST", "/api/ai-chat", {
        message: content.trim(),
        currentPage: getCurrentPage(),
        systemContext: getSystemContext(),
      });

      const data = await response.json();

      if (data.response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (isMinimized) {
          setHasUnread(true);
        }
      } else {
        throw new Error("No response from AI");
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Chat Error",
        description: "Sorry, I'm having trouble responding right now.",
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize for the technical difficulty. Please try again or contact support.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
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

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      setHasUnread(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  // Mobile-specific positioning
  const getPositionClasses = () => {
    if (!isOpen) {
      return isMobile
        ? "fixed bottom-20 right-4 z-40" // Higher on mobile to avoid nav bars
        : "fixed bottom-4 right-4 z-40";
    }

    if (isMinimized) {
      return isMobile
        ? "fixed bottom-0 left-0 right-0 z-40" // Full width on mobile
        : "fixed bottom-0 right-4 z-40 w-80";
    }

    // Full chat
    return isMobile
      ? "fixed inset-0 z-50" // Full screen on mobile
      : "fixed bottom-4 right-4 z-40 w-96 max-w-[calc(100vw-2rem)]";
  };

  // Different UI states for the chat widget
  const renderChatWidget = () => {
    if (!isOpen) {
      // Floating Action Button
      return (
        <div className={getPositionClasses()}>
          <div className="relative">
            <Button
              onClick={() => {
                setIsOpen(true);
                setIsMinimized(false);
                setHasUnread(false);
              }}
              className={cn(
                "rounded-full bg-teal hover:bg-teal-medium text-white shadow-lg hover:shadow-xl transition-all duration-300 group",
                isMobile ? "h-12 w-12" : "h-14 w-14"
              )}
              size="icon"
            >
              <MessageCircle
                className={cn(
                  "group-hover:scale-110 transition-transform",
                  isMobile ? "h-5 w-5" : "h-6 w-6"
                )}
              />
              <span className="sr-only">Open AI Assistant</span>
            </Button>

            {/* Pulse animation - less intrusive on mobile */}
            {!isMobile && (
              <div className="absolute inset-0 rounded-full bg-teal animate-ping opacity-25"></div>
            )}

            {/* Help tooltip - desktop only */}
            {!isMobile && (
              <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                  Need help? Ask me anything!
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (isMinimized) {
      // Minimized state
      return (
        <div className={getPositionClasses()}>
          <Card
            className={cn(
              "shadow-lg border-0 bg-navy text-white",
              isMobile && "rounded-t-xl rounded-b-none"
            )}
          >
            <div
              className="flex items-center justify-between p-3 cursor-pointer"
              onClick={toggleMinimize}
            >
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Sparkles className="h-5 w-5 text-teal" />
                  {hasUnread && (
                    <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <span className={cn("font-medium", isMobile && "text-sm")}>
                  Storage Valet Assistant
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <ChevronDown className="h-4 w-4 rotate-180" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="h-6 w-6 p-0 hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    // Full chat interface
    return (
      <div className={getPositionClasses()}>
        <Card
          ref={chatRef}
          className={cn(
            "shadow-2xl border-0 overflow-hidden flex flex-col",
            isMobile ? "h-full rounded-none" : "rounded-xl"
          )}
          style={!isMobile ? { height: "600px", maxHeight: "calc(100vh - 2rem)" } : {}}
        >
          {/* Header */}
          <CardHeader
            className={cn(
              "bg-navy text-white flex-shrink-0",
              isMobile ? "p-3 safe-area-top" : "p-4"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isMobile && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClose}
                    className="h-8 w-8 p-0 hover:bg-white/10 mr-2"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <div className="flex items-center justify-center w-8 h-8 bg-teal rounded-full">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className={cn("text-white", isMobile ? "text-base" : "text-lg")}>
                    Storage Valet Assistant
                  </CardTitle>
                  <p className="text-xs text-blue-100">Here to help 24/7</p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {!isMobile && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleMinimize}
                    className="h-8 w-8 p-0 hover:bg-white/10"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                )}
                {!isMobile && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClose}
                    className="h-8 w-8 p-0 hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1">
            <div className={cn("space-y-4", isMobile ? "p-3" : "p-4")}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={cn(
                      "flex items-start space-x-2",
                      isMobile ? "max-w-[85%]" : "max-w-[80%]"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div
                        className={cn(
                          "flex-shrink-0 rounded-full bg-teal/10 flex items-center justify-center",
                          isMobile ? "w-6 h-6" : "w-7 h-7"
                        )}
                      >
                        <Bot className={cn("text-teal", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-lg",
                        message.role === "user"
                          ? "bg-teal text-white px-3 py-2"
                          : "bg-gray-100 text-gray-900 px-3 py-2"
                      )}
                    >
                      <p className={cn("whitespace-pre-wrap", isMobile ? "text-sm" : "text-sm")}>
                        {message.content}
                      </p>
                      <p className={cn("opacity-70 mt-1", isMobile ? "text-xs" : "text-xs")}>
                        {format(message.timestamp, "HH:mm")}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div
                        className={cn(
                          "flex-shrink-0 rounded-full bg-teal/10 flex items-center justify-center",
                          isMobile ? "w-6 h-6" : "w-7 h-7"
                        )}
                      >
                        <User className={cn("text-teal", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div
                    className={cn(
                      "flex items-start space-x-2",
                      isMobile ? "max-w-[85%]" : "max-w-[80%]"
                    )}
                  >
                    <div
                      className={cn(
                        "flex-shrink-0 rounded-full bg-teal/10 flex items-center justify-center",
                        isMobile ? "w-6 h-6" : "w-7 h-7"
                      )}
                    >
                      <Bot
                        className={cn("text-teal animate-pulse", isMobile ? "h-3 w-3" : "h-4 w-4")}
                      />
                    </div>
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-3 w-3 animate-spin text-teal" />
                        <span className={cn("text-gray-600", isMobile ? "text-sm" : "text-sm")}>
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showSuggestions && messages.length === 1 && (
                <div className="space-y-2">
                  <p className={cn("text-gray-500 text-center", isMobile ? "text-xs" : "text-xs")}>
                    Quick questions:
                  </p>
                  <div
                    className={cn("gap-1.5", isMobile ? "grid grid-cols-2" : "grid grid-cols-1")}
                  >
                    {suggestions.slice(0, isMobile ? 4 : 4).map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={cn(
                          "text-left h-auto hover:bg-teal/10 justify-start",
                          isMobile ? "p-2 text-xs" : "p-2 text-xs"
                        )}
                      >
                        <HelpCircle
                          className={cn(
                            "mr-2 text-teal flex-shrink-0",
                            isMobile ? "h-3 w-3" : "h-3 w-3"
                          )}
                        />
                        <span className="text-gray-700 truncate">{suggestion}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input Area */}
          <div
            className={cn(
              "border-t bg-white flex-shrink-0",
              isMobile ? "p-3 safe-area-bottom" : "p-4"
            )}
          >
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isMobile ? "Type here..." : "Type your message..."}
                disabled={isLoading}
                className={cn("flex-1", isMobile ? "text-base" : "text-sm")}
                autoFocus={!isMobile}
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="bg-teal text-white hover:bg-teal-medium"
                size={isMobile ? "default" : "sm"}
              >
                <Send className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
              </Button>
            </form>

            <div className="flex items-center justify-between mt-2">
              <Badge variant="secondary" className={cn(isMobile ? "text-xs" : "text-xs")}>
                {getCurrentPage()}
              </Badge>
              <p className={cn("text-gray-500", isMobile ? "text-xs" : "text-xs")}>Powered by AI</p>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return renderChatWidget();
}
