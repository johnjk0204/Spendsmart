"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { chatApi } from "@/lib/api";
import { Send, Loader2, Sparkles, User, Bot } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "Where did I spend most this month?",
  "How can I reduce food expenses?",
  "What subscriptions should I cancel?",
  "Show me my impulse purchases",
  "Am I on track with savings?",
  "Compare this month vs last month",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm FinBot, your AI finance assistant 👋\n\nI can help you understand your spending patterns, find savings opportunities, and answer any questions about your finances. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const { data } = await chatApi.send(text, history);
      const botMsg: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      toast.error("FinBot is unavailable. Please try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="FinBot Chat" subtitle="AI-powered financial assistant" />

      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden p-6">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-hide">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-violet-500 to-indigo-600"
                      : "bg-gradient-to-br from-slate-600 to-slate-700"
                  )}>
                    {msg.role === "assistant" ? (
                      <Sparkles className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={cn(
                      "max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                      msg.role === "assistant"
                        ? "bg-card border border-border rounded-tl-sm"
                        : "bg-violet-600 text-white rounded-tr-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="relative">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your finances..."
              disabled={loading}
              className="w-full pl-4 pr-14 py-3.5 rounded-2xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Suggestions sidebar */}
        <div className="hidden lg:flex flex-col w-64 border-l border-border p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Quick Questions</p>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              disabled={loading}
              className="text-left px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all leading-snug"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
