import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, Quote } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getAuthState } from "@/lib/auth";
import { toast } from "@/components/ui/use-toast";

interface FounderMessage {
  id: string;
  message: string;
}

interface FounderMessageBarProps {
  onToggleSettings?: () => void;
}

const ROTATION_INTERVAL = 25000; // 25 seconds
const FADE_DURATION = 0.3; // 300ms

export function FounderMessageBar({ onToggleSettings }: FounderMessageBarProps) {
  const [messages, setMessages] = useState<FounderMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentUsername = getAuthState().username || "";

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Fetch messages and user preference
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user preference
        const prefRes = await apiFetch<{ showFounderMessages: boolean }>("/api/founder-messages/preference");
        setEnabled(prefRes.showFounderMessages !== false);
        
        if (prefRes.showFounderMessages === false) {
          setIsLoading(false);
          return;
        }
        
        // Fetch random messages
        const res = await apiFetch<{ items: FounderMessage[]; enabled: boolean }>("/api/founder-messages/random");
        
        if (res.items && res.items.length > 0) {
          setMessages(res.items);
          setCurrentIndex(0);
        }
      } catch (err) {
        console.error("Failed to fetch founder messages:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Rotate messages
  const rotateMessage = useCallback(() => {
    setCurrentIndex((prev) => {
      if (messages.length === 0) return 0;
      return (prev + 1) % messages.length;
    });
  }, [messages.length]);

  // Set up rotation interval
  useEffect(() => {
    if (!enabled || messages.length <= 1 || !isVisible) {
      return;
    }

    intervalRef.current = setInterval(rotateMessage, ROTATION_INTERVAL);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, messages.length, isVisible, rotateMessage]);

  // Handle dismiss
  const handleDismiss = () => {
    setIsVisible(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Toggle enabled state
  const handleToggle = async () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    
    try {
      await apiFetch("/api/founder-messages/preference", {
        method: "PUT",
        body: JSON.stringify({ showFounderMessages: newEnabled }),
      });
      
      toast({
        title: newEnabled ? "Founder messages enabled" : "Founder messages disabled",
        description: newEnabled 
          ? "Motivational messages will now appear on your dashboard."
          : "You won't see founder messages anymore.",
      });
      
      if (!newEnabled) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
        // Refresh messages
        const res = await apiFetch<{ items: FounderMessage[] }>("/api/founder-messages/random");
        if (res.items && res.items.length > 0) {
          setMessages(res.items);
          setCurrentIndex(0);
        }
      }
    } catch (err) {
      console.error("Failed to update preference:", err);
      setEnabled(!newEnabled); // Revert on error
      toast({
        title: "Failed to update preference",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-10 bg-gradient-to-r from-primary/5 to-primary/10 animate-pulse rounded-md" />
    );
  }

  if (!enabled || !isVisible || messages.length === 0) {
    return null;
  }

  const currentMessage = messages[currentIndex];

  return (
    <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10 sm:h-11">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Quote className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
            <div className="flex-1 min-w-0 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentMessage?.id || currentIndex}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, y: -5 }}
                  transition={{ duration: prefersReducedMotion ? 0 : FADE_DURATION }}
                  className="text-xs sm:text-sm text-foreground/80 font-medium truncate"
                >
                  {currentMessage?.message}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
            {/* Message counter - dots */}
            <div className="hidden sm:flex items-center gap-1">
              {messages.slice(0, 5).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1 h-1 rounded-full transition-colors ${
                    idx === currentIndex % 5
                      ? "bg-primary"
                      : "bg-primary/30"
                  }`}
                />
              ))}
            </div>
            
            {/* Settings button */}
            <button
              onClick={onToggleSettings || handleToggle}
              className="p-1.5 rounded-full hover:bg-primary/10 transition-colors"
              title="Toggle founder messages"
            >
              <Settings className="h-3.5 w-3.5 text-primary/60" />
            </button>
            
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-full hover:bg-primary/10 transition-colors"
              title="Dismiss for now"
            >
              <X className="h-3.5 w-3.5 text-primary/60" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for using founder messages
export function useFounderMessages() {
  const [enabled, setEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = async () => {
    setIsLoading(true);
    try {
      const newEnabled = !enabled;
      await apiFetch("/api/founder-messages/preference", {
        method: "PUT",
        body: JSON.stringify({ showFounderMessages: newEnabled }),
      });
      setEnabled(newEnabled);
      return newEnabled;
    } catch (err) {
      console.error("Failed to toggle founder messages:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial preference
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const res = await apiFetch<{ showFounderMessages: boolean }>("/api/founder-messages/preference");
        setEnabled(res.showFounderMessages !== false);
      } catch (err) {
        console.error("Failed to load preference:", err);
      }
    };
    loadPreference();
  }, []);

  return { enabled, toggle, isLoading };
}
