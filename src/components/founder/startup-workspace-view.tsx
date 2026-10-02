"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bot,
  Plus,
  MessageSquare,
  Paperclip,
  Send,
  Mic,
  MicOff,
  Volume2,
  Trash2,
  RotateCcw,
  Sparkles,
  X,
  Compass,
  BarChart3,
  Rocket,
  FileDown,
  AlertCircle,
  Users,
  Zap,
  TrendingUp,
  Cpu,
  Target,
  ExternalLink,
  Flame,
  ArrowLeft,
  DollarSign,
  Layers,
  HelpCircle,
  Skull,
  Settings,
  LogOut,
  User,
  Key,
  CreditCard,
} from "lucide-react";
import type { StartupWorkspace } from "@/lib/founder/types";

type StartupWorkspaceViewProps = {
  initialWorkspace: StartupWorkspace;
  initialTasks: any[];
};

type ChatSession = {
  id: string;
  title: string;
  messages: { role: "assistant" | "user"; content: string }[];
  isDeleted?: boolean;
};

export function StartupWorkspaceView({
  initialWorkspace,
}: StartupWorkspaceViewProps) {
  const [workspace] = useState(initialWorkspace);
  const startupName = workspace?.summary?.name || "VoiceCraft";

  // Chat History States
  const [chats, setChats] = useState<ChatSession[]>([
    {
      id: "chat-1",
      title: "Initial Strategy & Target Audience",
      messages: [],
    },
    {
      id: "chat-2",
      title: "Pricing & Unit Economics",
      messages: [
        {
          role: "assistant",
          content: "Pricing structure finalized hai: $29/mo Starter aur $79/mo Pro tier.",
        },
      ],
    },
  ]);

  const [activeChatId, setActiveChatId] = useState<string>("chat-1");
  const [inputMessage, setInputMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Blueprint, Context & Settings State
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    chatId: string;
  } | null>(null);

  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [showBinModal, setShowBinModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeChats = chats.filter((c) => !c.isDeleted);
  const binChats = chats.filter((c) => c.isDeleted);
  const activeChat = chats.find((c) => c.id === activeChatId) || activeChats[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const handleNewChat = () => {
    const newChatId = `chat-${Date.now()}`;
    const newChat: ChatSession = {
      id: newChatId,
      title: "New Conversation",
      messages: [],
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChatId);
  };

  const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, chatId });
  };

  const handleSaveRename = (chatId: string) => {
    if (renameTitle.trim()) {
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, title: renameTitle } : c))
      );
    }
    setRenamingChatId(null);
  };

  const handleRestoreFromBin = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, isDeleted: false } : c))
    );
  };

  const handlePermanentDelete = (chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedImage(URL.createObjectURL(file));
  };

  const handleLogout = () => {
    window.location.href = "/login";
  };

  const handleDownloadBlueprint = () => {
    const text = `====================================================
FULL FOUNDER BLUEPRINT: ${startupName.toUpperCase()}
====================================================

Category: Lifestyle Content Creation
AI Confidence: 100%
Stage: Breakout Stage

1. OVERVIEW & CO-FOUNDER INSIGHT
VoiceCraft allows anyone to create professional studio voiceovers by simply pasting text, saving thousands on voice actors.

2. METRICS
- Demand Score: 100/100
- Competition Density: 52/100
- Est. Monthly Revenue: $29 - $99/mo
- Time to Build MVP: 2-3 Weeks

3. MENTOR'S RISK RADAR
- Why Most Founders Fail: Underpricing API usage. Running heavy AI voice generation without usage caps will drain your margin. High churn occurs if output audio lacks natural inflection.
- Scope Freeze (What NOT to Build):
  * Skip: Custom Voice Cloning (High API complexity)
  * Skip: Multi-user Workspace Roles & Teams
  * Build Instead: Clean Text-to-Speech + 3 Core Avatars

4. THE CORE PROBLEM
- High Production & Recording Effort: Creating professional media manually requires expensive studio gear, room soundproofing, and endless re-recordings.
- Expensive Freelancer / Agency Fees: Hiring voiceover artists costs $50 to $200 per single task.
- Slow Delivery & Bottlenecks: Waiting days for freelancers delays product launches.

5. HOW YOUR STARTUP SOLVES IT
- Step 1: Paste Your Script or Input
- Step 2: AI Enhances & Renders Studio Audio
- Step 3: Instant 1-Click Export

6. WHO WILL PAY YOU
- YouTube Creators & Podcasters (3-5 videos/week)
- E-Learning & Course Creators (Consistent audio explanation)

7. FIRST 10 CUSTOMERS PLAYBOOK (0 TO 1)
- Days 1-3: Direct Outreach (Cold DM 20 mid-tier YouTube creators with pre-rendered 30s samples)
- Days 4-7: The Trial Hook (Offer 14-day free Pro access for video review)
- Days 8-14: Launch & Scale (Launch on ProductHunt & Reddit r/SaaS)

8. TECH STACK & UNIT ECONOMICS
- Recommended Tech: Next.js + Tailwind CSS, Supabase DB, OpenAI / ElevenLabs Audio API
- Margins & Pricing: $29/mo Starter & $79/mo Pro. ~75% Gross Margin.
- Breakeven Point: Just 12 paying users at $29/mo covers fixed overhead.
`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${startupName.toLowerCase()}-blueprint.txt`;
    a.click();
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() && !selectedImage) return;

    const userContent = selectedImage
      ? `[Screenshot Attached]\n${inputMessage}`
      : inputMessage;

    const updatedMessages = [
      ...activeChat.messages,
      { role: "user" as const, content: userContent },
    ];

    const updatedTitle =
      activeChat.title === "New Conversation" && inputMessage.length > 0
        ? inputMessage.slice(0, 25) + "..."
        : activeChat.title;

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, title: updatedTitle, messages: updatedMessages }
          : c
      )
    );

    setInputMessage("");
    setSelectedImage(null);

    setTimeout(() => {
      const aiReply = `Samajh gaya Karan! **${startupName}** ke context me strategy execute karte hain.`;
      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === activeChatId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { role: "assistant" as const, content: aiReply },
                ],
              }
            : c
        )
      );
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen overflow-hidden bg-[#09090B] font-sans text-white tracking-tight">
      
      {/* SIDEBAR */}
      <div className="hidden w-64 shrink-0 flex-col justify-between border-r border-white/[0.06] bg-[#18181B] p-3 md:flex">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-2 pb-2.5 pt-1">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#A3E635] text-xs font-extrabold text-zinc-950">
                AI
              </div>
              <span className="text-xs font-extrabold tracking-tight text-white">AIScoutX OS</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#A3E635]/20 bg-[#A3E635]/10 px-2 py-0.5 text-[10px] font-bold text-[#D9F99D]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#A3E635] shadow-[0_0_8px_rgba(163,230,53,0.9)]" />
              Active Startup
            </span>
          </div>

          <button
            onClick={handleNewChat}
            className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-white/10 bg-zinc-800/80 px-3 py-2 text-xs font-semibold text-white transition-all duration-150 hover:border-[#A3E635]/25 hover:bg-zinc-700/80"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#A3E635]" /> New Chat
            </span>
            <span className="text-[10px] text-zinc-400">⌘N</span>
          </button>

          <button
            onClick={() => setShowBlueprintModal(true)}
            className="group flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-all duration-200 hover:border-[#A3E635]/45 hover:bg-zinc-900 hover:shadow-[0_0_28px_rgba(163,230,53,0.14)]"
          >
            <span className="flex items-center gap-2 truncate">
              <FileDown className="h-4 w-4 shrink-0 text-[#A3E635]" />
              <span className="truncate">Full Founder Blueprint</span>
            </span>
            <ExternalLink className="h-3 w-3 shrink-0 text-zinc-500 opacity-70 transition-colors group-hover:text-[#A3E635] group-hover:opacity-100" />
          </button>

          <div className="space-y-0.5 pt-1">
            <span className="block px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">OS Modules</span>
            <Link href="/dashboard/analyze" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 transition-all duration-150 hover:bg-zinc-800 hover:text-white">
              <BarChart3 className="h-3.5 w-3.5 text-[#A3E635]" /> Market Analysis
            </Link>
            <Link href="/dashboard/launch" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 transition-all duration-150 hover:bg-zinc-800 hover:text-white">
              <Rocket className="h-3.5 w-3.5 text-[#84CC16]" /> Launch Plan
            </Link>
            <Link href="/dashboard/gps" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 transition-all duration-150 hover:bg-zinc-800 hover:text-white">
              <Compass className="h-3.5 w-3.5 text-[#D9F99D]" /> Founder GPS
            </Link>
          </div>

          <div className="space-y-1 border-t border-white/[0.06] pt-1">
            <span className="block px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Recent Chats</span>
            <div className="max-h-[calc(100vh-390px)] space-y-1 overflow-y-auto">
              {activeChats.map((chat) => (
                <div key={chat.id} onContextMenu={(e) => handleContextMenu(e, chat.id)}>
                  {renamingChatId === chat.id ? (
                    <input
                      type="text"
                      value={renameTitle}
                      onChange={(e) => setRenameTitle(e.target.value)}
                      onBlur={() => handleSaveRename(chat.id)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveRename(chat.id)}
                      autoFocus
                      className="w-full rounded-lg border border-[#A3E635]/50 bg-black/60 px-2 py-1.5 text-xs text-white outline-none ring-1 ring-[#A3E635]/20"
                    />
                  ) : (
                    <button
                      onClick={() => setActiveChatId(chat.id)}
                      className={`flex w-full cursor-pointer items-center gap-2.5 truncate rounded-xl px-3 py-2 text-left text-xs font-medium transition-all duration-150 ${
                        activeChatId === chat.id
                          ? "border border-white/[0.06] border-l-2 border-l-[#A3E635] bg-zinc-800 text-white shadow-[inset_0_0_18px_rgba(163,230,53,0.08)]"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                      }`}
                    >
                      <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${activeChatId === chat.id ? "text-[#A3E635]" : ""}`} />
                      <span className="flex-1 truncate">{chat.title}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM LEFT USER PROFILE & SETTINGS BAR */}
        <div className="relative border-t border-white/[0.06] bg-[#18181B] p-2">
          {showSettingsPopover && (
            <div className="absolute bottom-16 left-2 right-2 z-50 animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-white/10 bg-zinc-900 p-1.5 shadow-2xl">
              <div className="border-b border-white/[0.06] px-3 py-2">
                <p className="text-xs font-bold text-white">Karan (Founder)</p>
                <p className="truncate text-[10px] text-zinc-400">karan@startup.com</p>
              </div>

              <div className="space-y-0.5 py-1">
                <button className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-zinc-300 transition duration-150 hover:bg-zinc-800 hover:text-white">
                  <User className="h-3.5 w-3.5 text-[#A3E635]" /> Account Details
                </button>
                <button className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-zinc-300 transition duration-150 hover:bg-zinc-800 hover:text-white">
                  <Key className="h-3.5 w-3.5 text-zinc-400" /> API Settings
                </button>
                <button className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-zinc-300 transition duration-150 hover:bg-zinc-800 hover:text-white">
                  <CreditCard className="h-3.5 w-3.5 text-[#84CC16]" /> Pro Subscription
                </button>
                <button
                  onClick={() => {
                    setShowSettingsPopover(false);
                    setShowBinModal(true);
                  }}
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-1.5 text-xs text-zinc-300 transition duration-150 hover:bg-zinc-800 hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-3.5 w-3.5 text-zinc-400" /> Recycle Bin
                  </span>
                  {binChats.length > 0 && (
                    <span className="rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                      {binChats.length}
                    </span>
                  )}
                </button>
              </div>

              <div className="mt-1 border-t border-white/[0.06] pt-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10"
                >
                  <LogOut className="h-3.5 w-3.5" /> Log Out
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#A3E635]/30 bg-zinc-800 text-xs font-extrabold text-[#A3E635] shadow-[0_0_12px_rgba(163,230,53,0.12)]">
                K
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-xs font-bold text-white">Karan (Founder)</p>
                <p className="truncate text-[10px] text-zinc-400">karan@startup.com</p>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsPopover(!showSettingsPopover)}
              className={`cursor-pointer rounded-xl p-2 transition-all duration-150 ${
                showSettingsPopover
                  ? "border border-[#A3E635]/30 bg-[#A3E635]/10 text-[#A3E635]"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
              title="Settings & Account"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CHAT CANVAS */}
      <div className="relative flex flex-1 flex-col overflow-hidden bg-[#09090B]">
        {isVoiceActive && (
          <div className="flex shrink-0 items-center justify-between border-b border-[#A3E635]/20 bg-zinc-900 px-6 py-2.5">
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 animate-bounce text-[#A3E635]" />
              <div>
                <p className="text-xs font-bold text-white">Live Voice Call Active</p>
                <p className="text-[10px] text-zinc-400">Listening to microphone...</p>
              </div>
            </div>
            <div className="flex h-5 items-center gap-1">
              <span className="h-3 w-1 animate-pulse rounded-full bg-[#A3E635]" />
              <span className="h-5 w-1 animate-pulse rounded-full bg-[#84CC16] delay-75" />
              <span className="h-3 w-1 animate-pulse rounded-full bg-[#A3E635] delay-150" />
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col justify-center overflow-y-auto p-4 md:p-8">
          {activeChat?.messages.length === 0 ? (
            <div className="my-auto mx-auto max-w-2xl space-y-5 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900 text-[#A3E635] shadow-[0_0_32px_rgba(163,230,53,0.18)]">
                <Sparkles className="h-8 w-8" strokeWidth={1.75} />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                Hey Karan! I am your{" "}
                <span className="bg-gradient-to-r from-[#A3E635] to-[#84CC16] bg-clip-text text-transparent">
                  AI Mentor & Co-Founder
                </span>
                .
              </h1>
              <p className="mx-auto max-w-lg text-[15px] leading-7 text-zinc-400">
                Let&apos;s start now. Ask me about your product strategy, tech architecture, pricing, or outreach roadmap for{" "}
                <strong className="font-semibold text-white">{startupName}</strong>.
              </p>
            </div>
          ) : (
            <div className="my-auto mx-auto w-full max-w-3xl space-y-5">
              {activeChat?.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3.5 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#A3E635]/25 bg-zinc-900 text-[#A3E635] shadow-[0_0_12px_rgba(163,230,53,0.15)]">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-xs leading-relaxed md:text-sm ${
                      msg.role === "user"
                        ? "border border-[#A3E635]/20 bg-zinc-800 text-white shadow-md"
                        : "whitespace-pre-line border border-white/10 bg-zinc-900 text-zinc-200 shadow-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#A3E635]/30 bg-zinc-800 text-xs font-extrabold text-[#A3E635]">
                      K
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* INPUT BAR */}
        <div className="shrink-0 border-t border-white/[0.06] bg-[#18181B] p-4 md:p-6">
          <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-white/10 bg-black/70 p-2.5 shadow-2xl transition-all duration-200 focus-within:border-[#A3E635]/50 focus-within:ring-2 focus-within:ring-[#A3E635]/25">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-xl p-2.5 text-zinc-400 transition-colors duration-150 hover:bg-zinc-800 hover:text-[#A3E635]"
              title="Attach Screenshot"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <button
              onClick={() => setIsVoiceActive(!isVoiceActive)}
              className={`cursor-pointer rounded-xl p-2.5 transition-all duration-150 ${
                isVoiceActive
                  ? "bg-[#A3E635] text-zinc-950 shadow-[0_0_12px_rgba(163,230,53,0.45)]"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-[#A3E635]"
              }`}
            >
              {isVoiceActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask Mentor anything or attach a screenshot…"
              className="flex-1 bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            />

            <button
              onClick={handleSendMessage}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-[#A3E635] text-zinc-950 transition-all duration-150 hover:bg-[#84CC16] hover:shadow-[0_0_20px_rgba(163,230,53,0.35)]"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FULL FOUNDER BLUEPRINT OVERLAY MODAL */}
      {showBlueprintModal && (
        <div className="fixed inset-0 z-50 bg-[#06060a]/95 backdrop-blur-xl overflow-y-auto flex justify-center p-2 md:p-6">
          <div className="w-full max-w-5xl space-y-6 pb-20">
            
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between pt-2 pb-4 border-b border-white/10 sticky top-0 bg-[#06060a]/90 backdrop-blur-md z-30">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <button
                  onClick={() => setShowBlueprintModal(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 font-medium transition-all"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Discover
                </button>
                <span className="text-zinc-600">/</span>
                <span className="text-zinc-300 font-semibold">Full Founder Blueprint</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadBlueprint}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#A3E635] px-4 py-2 text-xs font-bold text-zinc-950 shadow-[0_0_20px_rgba(163,230,53,0.25)] transition-all hover:bg-[#84CC16]"
                >
                  <FileDown className="h-4 w-4" /> Download Blueprint
                </button>
                <button
                  onClick={() => setShowBlueprintModal(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* HEADER HERO CARD */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#0d0d14] border border-white/10 relative overflow-hidden space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full">
                  Breakout Stage
                </span>
                <span className="flex items-center gap-1 rounded-full border border-[#A3E635]/30 bg-[#A3E635]/10 px-3 py-1 text-[11px] font-semibold text-[#D9F99D]">
                  <Flame className="h-3 w-3 text-[#A3E635]" /> AI Confidence 100%
                </span>
                <span className="text-[11px] font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-full">
                  Category: Lifestyle Content Creation
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">{startupName}</h1>

              {/* Co-Founder Insight */}
              <div className="flex items-start gap-3 rounded-2xl border border-[#A3E635]/20 bg-zinc-900 p-4">
                <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#A3E635]" />
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3E635]">
                    CO-FOUNDER INSIGHT (IN SIMPLE TERMS)
                  </span>
                  <p className="text-xs md:text-sm text-zinc-300 mt-0.5">
                    VoiceCraft allows anyone to create professional studio voiceovers by simply pasting text, saving thousands on voice actors.
                  </p>
                </div>
              </div>

              {/* Hero Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">DEMAND SCORE</span>
                  <span className="text-2xl font-extrabold text-emerald-400">100/100</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">COMPETITION DENSITY</span>
                  <span className="text-2xl font-extrabold text-blue-400">52/100</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">EST. MONTHLY REVENUE</span>
                  <span className="text-2xl font-extrabold text-emerald-300">$29 - $99/mo</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">TIME TO BUILD MVP</span>
                  <span className="text-2xl font-extrabold text-[#A3E635]">2-3 Weeks</span>
                </div>
              </div>
            </div>

            {/* MENTOR'S RISK RADAR */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#140b0f] border border-rose-500/20 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 border border-rose-500/30">
                  <Skull className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">Mentor's Risk Radar</h2>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md font-semibold">
                      Reality Check
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">Why this idea might fail and what to strictly cut from V1.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-black/50 border border-rose-500/20 space-y-2">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertCircle className="h-4 w-4" /> WHY MOST FOUNDERS FAIL HERE
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Underpricing API usage. Running heavy AI voice generation without usage caps will drain your margin. High churn occurs if output audio lacks natural inflection.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/50 border border-rose-500/20 space-y-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300">
                    <X className="h-4 w-4 text-[#A3E635]" /> WHAT NOT TO BUILD IN V1 (SCOPE FREEZE)
                  </span>
                  <ul className="space-y-1 text-xs text-zinc-300">
                    <li className="flex items-center gap-1.5">
                      <span className="font-bold text-[#A3E635]">Skip:</span> Custom Voice Cloning (High API complexity)
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="font-bold text-[#A3E635]">Skip:</span> Multi-user Workspace Roles & Teams
                    </li>
                    <li className="flex items-center gap-1.5 pt-1">
                      <span className="font-bold text-emerald-400">Build Instead:</span> Clean Text-to-Speech + 3 Core Avatars
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 1. THE CORE PROBLEM */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#0e0a0d] border border-rose-500/10 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">1. The Core Problem</h2>
                  <p className="text-xs text-zinc-400">Exact real-world pain points that customers face today</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <span className="text-[11px] font-bold text-rose-400 block uppercase tracking-wider">
                    🎙️ HIGH PRODUCTION & RECORDING EFFORT
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Creating professional media or audio manually requires expensive studio gear, room soundproofing, and endless re-recordings when mistakes happen.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[#A3E635]">
                    💰 EXPENSIVE FREELANCER / AGENCY FEES
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Hiring voiceover artists or digital agencies costs $50 to $200 per single task, quickly draining small operational budgets.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <span className="text-[11px] font-bold text-rose-300 block uppercase tracking-wider">
                    ⏳ SLOW DELIVERY & BOTTLENECKS
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Waiting days for freelancers to deliver edits halts marketing schedules and delays key product launches.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. HOW YOUR STARTUP SOLVES IT */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#090d0b] border border-emerald-500/10 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">2. How Your Startup Solves It</h2>
                  <p className="text-xs text-zinc-400">Simple 3-step product workflow designed for effortless execution.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-400 block uppercase tracking-wider">
                    ✓ STEP 1: PASTE YOUR SCRIPT OR INPUT
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Paste your text script into the simple web dashboard. No technical coding, microphone, or software setup required.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-400 block uppercase tracking-wider">
                    ✓ STEP 2: AI ENHANCES & RENDERS STUDIO AUDIO
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    The AI engine selects human-like voices, removes background noise automatically, and balances speech tone instantly.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-400 block uppercase tracking-wider">
                    ✓ STEP 3: INSTANT 1-CLICK EXPORT
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Download high-definition ready-to-use audio files immediately or publish directly to your YouTube and video platforms.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. WHO WILL PAY YOU */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#090b14] border border-blue-500/10 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">3. Who Will Pay You</h2>
                  <p className="text-xs text-zinc-400">Exact customer personas desperate for this solution.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <span className="text-[11px] font-bold text-blue-400 flex items-center gap-2 uppercase tracking-wider">
                    <Target className="h-4 w-4 text-blue-400" /> YOUTUBE CREATORS & PODCASTERS
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Publishers making 3–5 videos a week who want fast voiceovers without hiring expensive talent.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <span className="text-[11px] font-bold text-blue-400 flex items-center gap-2 uppercase tracking-wider">
                    <Target className="h-4 w-4 text-blue-400" /> E-LEARNING & COURSE CREATORS
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Educators building online courses who need clean, consistent audio explanation across dozens of modules.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. FIRST 10 CUSTOMERS PLAYBOOK (0 TO 1) */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#080d0a] border border-emerald-500/10 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">4. First 10 Customers Playbook (0 to 1)</h2>
                  <p className="text-xs text-zinc-400">Exact tactical distribution plan—no fluff, pure execution.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-400 block uppercase tracking-wider">
                    DAYS 1–3: DIRECT OUTREACH
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Cold DM 20 mid-tier YouTube creators (10k-50k subs) on Twitter/X with a pre-rendered 30s sample of their recent script.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-400 block uppercase tracking-wider">
                    DAYS 4–7: THE TRIAL HOOK
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Offer 14-day free Pro access in exchange for 1 video review or tweet thread. Target 5 active video testimonials.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-400 block uppercase tracking-wider">
                    DAYS 8–14: LAUNCH & SCALE
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Launch on ProductHunt using customer video reviews as proof. Post a "How I Built This" breakdown on Reddit r/SaaS.
                  </p>
                </div>
              </div>
            </div>

            {/* 5. TECH STACK & UNIT ECONOMICS */}
            <div className="space-y-5 rounded-3xl border border-[#A3E635]/10 bg-zinc-900 p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#A3E635]/20 bg-[#A3E635]/10 text-[#A3E635]">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">5. Tech Stack & Unit Economics</h2>
                  <p className="text-xs text-zinc-400">How to build MVP and ensure healthy gross margins</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#A3E635]">
                    <Layers className="h-3.5 w-3.5" /> RECOMMENDED TECH
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Next.js + Tailwind CSS, Supabase DB, OpenAI / ElevenLabs Audio API endpoints.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <DollarSign className="h-3.5 w-3.5" /> MARGINS & PRICING
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    $29/mo Starter & $79/mo Pro. Estimated <strong className="text-white">75% Gross Margin</strong> (API cost ~$0.05/minute).
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <TrendingUp className="h-3.5 w-3.5" /> BREAKEVEN POINT
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Just <strong className="text-white">12 paying users at $29/mo</strong> covers fixed hosting, domain, and API overhead.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* RECYCLE BIN MODAL */}
      {showBinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e0e16] border border-white/15 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-rose-400" /> Recycle Bin (Deleted Chats)
              </h3>
              <button onClick={() => setShowBinModal(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {binChats.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">No deleted chats in bin.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {binChats.map((chat) => (
                  <div key={chat.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <span className="text-zinc-300 font-medium truncate flex-1 pr-2">{chat.title}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleRestoreFromBin(chat.id)} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10" title="Restore Chat">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handlePermanentDelete(chat.id)} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10" title="Delete Permanently">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}