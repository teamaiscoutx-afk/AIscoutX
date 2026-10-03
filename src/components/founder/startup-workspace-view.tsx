"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  ChevronsUpDown,
  Radio,
  MoreHorizontal,
  Pencil,
  Pin,
} from "lucide-react";
import { fetchNotifications } from "@/app/actions/notifications";
import type { StartupWorkspace } from "@/lib/founder/types";
import {
  buildStartupRadar,
  mapWatchtowerUpdate,
  type StartupRadarUpdate,
} from "@/lib/founder/startup-radar";
import {
  clearActiveWorkspace,
  persistActiveWorkspace,
  persistWorkspaceChats,
  readWorkspaceChats,
} from "@/lib/workspace/active-workspace";
import { markWorkspaceActiveSession } from "@/app/actions/active-workspace";
import { signOut } from "@/app/actions/auth";
import {
  loadWorkspaceChats,
  saveWorkspaceChats,
} from "@/app/actions/workspace-chats";
import { StartupRadarPanel } from "@/components/founder/startup-radar-panel";
import { WorkspaceSkeleton } from "@/components/founder/workspace-skeleton";

type StartupWorkspaceViewProps = {
  initialWorkspace: StartupWorkspace;
  initialTasks: any[];
  initialChats?: ChatSession[];
  initialActiveChatId?: string;
  viewerName: string;
  viewerEmail: string;
  viewerInitials: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: { role: "assistant" | "user"; content: string }[];
  isDeleted?: boolean;
  isPinned?: boolean;
};

function resolveStartupName(workspace: StartupWorkspace): string {
  return workspace.opportunityName?.trim() || "VoiceCraft";
}

const PLACEHOLDER_CHAT_IDS = new Set(["chat-1", "chat-2"]);
const PLACEHOLDER_CHAT_TITLES = new Set([
  "Initial Strategy & Target Audience",
  "Pricing & Unit Economics",
]);

function isPlaceholderChat(chat: ChatSession): boolean {
  const empty = chat.messages.length === 0;
  return empty && (PLACEHOLDER_CHAT_IDS.has(chat.id) || PLACEHOLDER_CHAT_TITLES.has(chat.title));
}

const GPU = { willChange: "transform, opacity" } as const;

const sidebarSpring = { type: "spring" as const, duration: 0.4, bounce: 0.18 };

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.12 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, x: -10 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

const heroContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.18 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const iconTap = { scale: 0.95 };
const iconHover = { scale: 1.05 };

const QUICK_PROMPTS = [
  {
    label: "🚀 Map Launch Timeline",
    prompt: "Map a concrete 30-day launch timeline for this startup.",
  },
  {
    label: "💡 Refine Value Proposition",
    prompt: "Refine the value proposition so a customer understands it in one sentence.",
  },
  {
    label: "📊 Revenue Model Check",
    prompt: "Pressure-test the revenue model, pricing, and gross margin.",
  },
  {
    label: "🎯 First 10 Customers",
    prompt: "Give me a first-10-customers plan I can execute this week.",
  },
] as const;

const glassButton =
  "border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl";

function StaggerWords({
  text,
  className,
  reduceMotion,
  delay = 0.16,
}: {
  text: string;
  className?: string;
  reduceMotion: boolean | null;
  delay?: number;
}) {
  const words = text.split(" ");
  return (
    <span>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className={`inline-block ${className ?? ""}`}
          style={GPU}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: delay + index * 0.045, ease: [0.22, 1, 0.36, 1] }}
        >
          {word}
          {index < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </span>
  );
}

export function StartupWorkspaceView({
  initialWorkspace,
  initialChats = [],
  viewerName,
  viewerEmail,
  viewerInitials,
}: StartupWorkspaceViewProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [workspace] = useState(initialWorkspace);
  const startupName = resolveStartupName(workspace);

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [chatsReady, setChatsReady] = useState(false);
  const [canSyncChats, setCanSyncChats] = useState(false);
  const [canvas, setCanvas] = useState<"chat" | "radar">("chat");
  const [liveUpdates, setLiveUpdates] = useState<StartupRadarUpdate[]>([]);
  const [radarLoading, setRadarLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Blueprint, Context & Settings State
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [chatMenu, setChatMenu] = useState<{
    id: string;
    top: number;
    left: number;
  } | null>(null);
  const [settingsTab, setSettingsTab] = useState<"account" | "trash">("account");

  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeChats = chats
    .filter((c) => !c.isDeleted)
    .sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));
  const binChats = chats.filter((c) => c.isDeleted);
  const activeChat = chats.find((c) => c.id === activeChatId) || activeChats[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  useEffect(() => {
    const closeMenu = () => setChatMenu(null);
    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    persistActiveWorkspace({ id: workspace.id, name: startupName });
    void markWorkspaceActiveSession(workspace.id);

    void loadWorkspaceChats(workspace.id).then((snapshot) => {
      if (cancelled) return;

      const remote = (snapshot.ok ? snapshot.chats : initialChats).filter(
        (chat) => !isPlaceholderChat(chat)
      );
      const stored = readWorkspaceChats(workspace.id);
      const local = (stored?.chats ?? []).filter((chat) => !isPlaceholderChat(chat));

      if (snapshot.ok && remote.length) {
        setChats(remote);
        const nextId = remote.some((chat) => chat.id === snapshot.activeChatId && !chat.isDeleted)
          ? snapshot.activeChatId
          : remote.find((chat) => !chat.isDeleted)?.id ?? "";
        setActiveChatId(nextId);
        setCanSyncChats(true);
      } else if (snapshot.ok && local.length) {
        const nextId = local.some((chat) => chat.id === stored?.activeChatId && !chat.isDeleted)
          ? stored?.activeChatId ?? ""
          : local.find((chat) => !chat.isDeleted)?.id ?? "";
        setChats(local);
        setActiveChatId(nextId);
        setCanSyncChats(true);
        void saveWorkspaceChats(workspace.id, local, nextId);
      } else if (snapshot.ok) {
        setChats([]);
        setActiveChatId("");
        setCanSyncChats(true);
      } else if (local.length) {
        setChats(local);
        setActiveChatId(stored?.activeChatId ?? local[0]?.id ?? "");
        setCanSyncChats(false);
      } else {
        setChats([]);
        setActiveChatId("");
        setCanSyncChats(false);
      }
      setChatsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [workspace.id, startupName, initialChats]);

  useEffect(() => {
    if (!chatsReady || !canSyncChats) return;
    persistWorkspaceChats(workspace.id, { chats, activeChatId });
    const timer = window.setTimeout(() => {
      void saveWorkspaceChats(workspace.id, chats, activeChatId);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [workspace.id, chats, activeChatId, chatsReady, canSyncChats]);

  const blueprintUpdates = useMemo(() => buildStartupRadar(workspace), [workspace]);
  const radarUpdates = liveUpdates.length
    ? [...liveUpdates, ...blueprintUpdates]
    : blueprintUpdates;

  useEffect(() => {
    if (canvas !== "radar") return;
    let cancelled = false;
    setRadarLoading(true);
    void fetchNotifications()
      .then((rows) => {
        if (cancelled) return;
        const relevant = rows.filter((row) => {
          if (row.workspaceId && row.workspaceId === workspace.id) return true;
          if (workspace.nicheFocus && row.nicheFocus === workspace.nicheFocus) return true;
          return false;
        });
        setLiveUpdates(relevant.map(mapWatchtowerUpdate));
      })
      .catch(() => {
        if (!cancelled) setLiveUpdates([]);
      })
      .finally(() => {
        if (!cancelled) setRadarLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canvas, workspace.id, workspace.nicheFocus]);

  const handleNewChat = () => {
    const newChatId = `chat-${Date.now()}`;
    const newChat: ChatSession = {
      id: newChatId,
      title: "New Conversation",
      messages: [],
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChatId);
    setCanvas("chat");
  };

  const openChatMenu = (event: React.MouseEvent<HTMLButtonElement>, chatId: string) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setChatMenu((current) =>
      current?.id === chatId
        ? null
        : { id: chatId, top: rect.bottom + 6, left: Math.max(8, rect.right - 176) }
    );
  };

  const startRename = (chat: ChatSession) => {
    setRenameTitle(chat.title);
    setRenamingChatId(chat.id);
    setChatMenu(null);
  };

  const togglePin = (chatId: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, isPinned: !chat.isPinned } : chat
      )
    );
    setChatMenu(null);
  };

  const softDeleteChat = (chatId: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, isDeleted: true } : chat
      )
    );
    if (activeChatId === chatId) {
      const next = chats.find((chat) => chat.id !== chatId && !chat.isDeleted);
      setActiveChatId(next?.id ?? "");
    }
    setChatMenu(null);
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
    clearActiveWorkspace();
    void signOut().finally(() => {
      window.location.href = "/";
    });
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

  const insertPrompt = (prompt: string) => {
    setCanvas("chat");
    setInputMessage(prompt);
    requestAnimationFrame(() => composerRef.current?.focus());
  };

  const discussUpdate = (update: StartupRadarUpdate) => {
    const existing = chats.find((chat) => chat.id === activeChatId && !chat.isDeleted);
    if (!existing) {
      const newChatId = `chat-${Date.now()}`;
      setChats((prev) => [
        { id: newChatId, title: "New Conversation", messages: [] },
        ...prev,
      ]);
      setActiveChatId(newChatId);
    }
    insertPrompt(
      `How can we capitalize on ${update.title} for ${startupName}?`
    );
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() && !selectedImage) return;

    const userContent = selectedImage
      ? `[Screenshot Attached]\n${inputMessage}`
      : inputMessage;
    const draft = inputMessage.trim();
    let chatId = chats.some((chat) => chat.id === activeChatId && !chat.isDeleted)
      ? activeChatId
      : "";
    if (!chatId) {
      chatId = `chat-${Date.now()}`;
      setActiveChatId(chatId);
    }

    setChats((prev) => {
      const current = prev.find((chat) => chat.id === chatId);
      const base: ChatSession = current ?? {
        id: chatId,
        title: "New Conversation",
        messages: [],
      };
      const updatedTitle =
        base.title === "New Conversation" && draft.length > 0
          ? `${draft.slice(0, 25)}...`
          : base.title;
      const next: ChatSession = {
        ...base,
        title: updatedTitle,
        messages: [...base.messages, { role: "user", content: userContent }],
      };
      if (!current) return [next, ...prev];
      return prev.map((chat) => (chat.id === chatId ? next : chat));
    });

    setInputMessage("");
    setSelectedImage(null);

    setTimeout(() => {
      const aiReply = `Samajh gaya ${viewerName.split(" ")[0] || "there"}! **${startupName}** ke context me strategy execute karte hain.`;
      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === chatId
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

  if (!chatsReady) {
    return <WorkspaceSkeleton />;
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex h-screen w-screen origin-center overflow-hidden bg-[#09090B] font-sans tracking-tight text-white"
      style={GPU}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      
      {/* SIDEBAR */}
      <motion.aside
        className="hidden w-64 shrink-0 flex-col justify-between border-r border-white/[0.06] bg-[#18181B] p-3 md:flex"
        style={GPU}
        initial={reduceMotion ? false : { x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={sidebarSpring}
      >
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

          <div className="px-1 pt-0.5">
            <p className="truncate px-1 text-[11px] font-semibold text-white">{startupName}</p>
            <button
              type="button"
              onClick={() => router.push("/dashboard/discover?intent=discover")}
              className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-zinc-300 backdrop-blur-xl transition-all duration-150 hover:border-[#A3E635]/40 hover:bg-[#A3E635]/10 hover:text-white"
            >
              <ChevronsUpDown className="h-3 w-3 text-[#A3E635]" />
              Switch Startup
            </button>
          </div>

          <button
            onClick={handleNewChat}
            className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-all duration-150 hover:border-[#A3E635]/25 hover:bg-white/[0.06] ${glassButton}`}
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#A3E635]" /> New Chat
            </span>
            <span className="text-[10px] text-zinc-400">⌘N</span>
          </button>

          <button
            onClick={() => setShowBlueprintModal(true)}
            className={`group flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-white transition-all duration-200 hover:border-[#A3E635]/45 hover:bg-white/[0.06] hover:shadow-[0_0_28px_rgba(163,230,53,0.14)] ${glassButton}`}
          >
            <span className="flex items-center gap-2 truncate">
              <FileDown className="h-4 w-4 shrink-0 text-[#A3E635]" />
              <span className="truncate">Full Founder Blueprint</span>
            </span>
            <ExternalLink className="h-3 w-3 shrink-0 text-zinc-500 opacity-70 transition-colors group-hover:text-[#A3E635] group-hover:opacity-100" />
          </button>

          <motion.div
            className="space-y-0.5 pt-1"
            variants={staggerContainer}
            initial={reduceMotion ? false : "hidden"}
            animate="show"
          >
            <span className="block px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">OS Modules</span>
            <motion.div variants={staggerItem} style={GPU}>
            <Link href="/dashboard/analyze" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 transition-all duration-150 hover:bg-zinc-800 hover:text-white">
              <BarChart3 className="h-3.5 w-3.5 text-[#A3E635]" /> Market Analysis
            </Link>
            </motion.div>
            <motion.div variants={staggerItem} style={GPU}>
            <Link href="/dashboard/launch" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 transition-all duration-150 hover:bg-zinc-800 hover:text-white">
              <Rocket className="h-3.5 w-3.5 text-[#84CC16]" /> Launch Plan
            </Link>
            </motion.div>
            <motion.div variants={staggerItem} style={GPU}>
            <Link href="/dashboard/gps" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 transition-all duration-150 hover:bg-zinc-800 hover:text-white">
              <Compass className="h-3.5 w-3.5 text-[#D9F99D]" /> Founder GPS
            </Link>
            </motion.div>
            <motion.div variants={staggerItem} style={GPU}>
            <button
              type="button"
              onClick={() => setCanvas("radar")}
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all duration-150 ${
                canvas === "radar"
                  ? "border border-white/[0.06] border-l-2 border-l-[#A3E635] bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <Radio className={`h-3.5 w-3.5 ${canvas === "radar" ? "text-[#A3E635]" : "text-[#84CC16]"}`} />
              Live Startup Updates
            </button>
            </motion.div>
          </motion.div>

          <div className="space-y-1 border-t border-white/[0.06] pt-1">
            <span className="block px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Recent Chats</span>
            <motion.div
              className="max-h-[calc(100vh-470px)] space-y-1 overflow-y-auto"
              variants={staggerContainer}
              initial={reduceMotion ? false : "hidden"}
              animate="show"
            >
              {activeChats.length === 0 ? (
                <p className="px-3 py-2 text-[11px] leading-5 text-zinc-500">Start a conversation</p>
              ) : null}
              {activeChats.map((chat) => (
                <motion.div
                  key={chat.id}
                  variants={staggerItem}
                  style={GPU}
                  className="group relative"
                >
                  {renamingChatId === chat.id ? (
                    <input
                      type="text"
                      value={renameTitle}
                      onChange={(e) => setRenameTitle(e.target.value)}
                      onBlur={() => handleSaveRename(chat.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename(chat.id);
                        if (e.key === "Escape") setRenamingChatId(null);
                      }}
                      autoFocus
                      className="w-full rounded-lg border border-[#A3E635]/50 bg-black/60 px-2 py-1.5 text-xs text-white outline-none ring-1 ring-[#A3E635]/20"
                    />
                  ) : (
                    <div
                      className={`flex items-center rounded-xl pr-1 transition-all duration-150 ${
                        activeChatId === chat.id
                          ? "border border-white/[0.06] border-l-2 border-l-[#A3E635] bg-zinc-800 text-white shadow-[inset_0_0_18px_rgba(163,230,53,0.08)]"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveChatId(chat.id);
                          setCanvas("chat");
                          setChatMenu(null);
                        }}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 truncate px-3 py-2 text-left text-xs font-medium"
                      >
                        {chat.isPinned ? (
                          <Pin className="h-3 w-3 shrink-0 text-[#A3E635]" />
                        ) : (
                          <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${activeChatId === chat.id ? "text-[#A3E635]" : ""}`} />
                        )}
                        <span className="flex-1 truncate">{chat.title}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Chat actions for ${chat.title}`}
                        onClick={(event) => openChatMenu(event, chat.id)}
                        className={`cursor-pointer rounded-lg p-1 text-zinc-400 transition hover:bg-white/10 hover:text-white ${
                          chatMenu?.id === chat.id
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        }`}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* BOTTOM LEFT USER PROFILE & SETTINGS BAR */}
        <div className="relative border-t border-white/[0.06] bg-[#18181B] p-2">
          {showSettingsPopover && (
            <div className="absolute bottom-16 left-2 right-2 z-50 animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-white/10 bg-zinc-900 p-1.5 shadow-2xl">
              <div className="grid grid-cols-2 gap-1 p-1">
                <button
                  type="button"
                  onClick={() => setSettingsTab("account")}
                  className={`cursor-pointer rounded-lg px-2 py-1.5 text-[11px] font-semibold ${
                    settingsTab === "account"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Account
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab("trash")}
                  className={`flex cursor-pointer items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold ${
                    settingsTab === "trash"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Trash Bin
                  {binChats.length > 0 && (
                    <span className="rounded-full bg-rose-500/20 px-1.5 text-[10px] font-bold text-rose-300">
                      {binChats.length}
                    </span>
                  )}
                </button>
              </div>

              {settingsTab === "account" ? (
                <>
                  <div className="border-b border-white/[0.06] px-3 py-2">
                    <p className="truncate text-xs font-bold text-white">{viewerName}</p>
                    <p className="truncate text-[10px] text-zinc-400">{viewerEmail}</p>
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
                  </div>
                  <div className="mt-1 border-t border-white/[0.06] pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Log Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="max-h-64 space-y-1.5 overflow-y-auto px-1 py-2">
                  {binChats.length === 0 ? (
                    <p className="px-2 py-6 text-center text-[11px] text-zinc-500">
                      No deleted chats.
                    </p>
                  ) : (
                    binChats.map((chat) => (
                      <div
                        key={chat.id}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-2"
                      >
                        <p className="truncate text-xs font-medium text-zinc-200">{chat.title}</p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRestoreFromBin(chat.id)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/10"
                          >
                            <RotateCcw className="h-3 w-3" /> Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePermanentDelete(chat.id)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-rose-300 hover:bg-rose-500/10"
                          >
                            <X className="h-3 w-3" /> Delete Permanently
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#A3E635]/30 bg-zinc-800 text-xs font-extrabold text-[#A3E635] shadow-[0_0_12px_rgba(163,230,53,0.12)]">
                {viewerInitials}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-xs font-bold text-white">{viewerName}</p>
                <p className="truncate text-[10px] text-zinc-400">{viewerEmail}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setSettingsTab("account");
                setShowSettingsPopover(!showSettingsPopover);
              }}
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
      </motion.aside>

      {/* CHAT CANVAS */}
      <div className="relative flex flex-1 flex-col overflow-hidden bg-[#09090B]">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute left-1/2 top-[18%] h-[460px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(132,204,22,0.16)_0%,transparent_68%)] blur-3xl"
            style={GPU}
            animate={reduceMotion ? undefined : { x: [0, 28, -18, 0], y: [0, -16, 10, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute left-[18%] top-[36%] h-[380px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(51,65,85,0.55)_0%,transparent_70%)] blur-3xl"
            style={GPU}
            animate={reduceMotion ? undefined : { x: [0, -22, 16, 0], y: [0, 18, -8, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
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

        <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3 md:hidden">
          <p className="truncate text-xs font-semibold text-white">{startupName}</p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/discover?intent=discover")}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-zinc-300"
            >
              <ChevronsUpDown className="h-3 w-3 text-[#A3E635]" />
              Switch
            </button>
            <button
              type="button"
              onClick={() => setCanvas(canvas === "radar" ? "chat" : "radar")}
              className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                canvas === "radar"
                  ? "border-[#A3E635]/40 bg-[#A3E635]/10 text-[#D9F99D]"
                  : "border-white/[0.08] bg-white/[0.04] text-zinc-300"
              }`}
            >
              <Radio className="h-3 w-3" />
              Radar
            </button>
          </div>
        </div>

        <div className={`flex flex-1 flex-col overflow-y-auto p-4 md:p-8 ${canvas === "radar" ? "justify-start" : "justify-center"}`}>
          <AnimatePresence mode="wait">
          {canvas === "radar" ? (
            <StartupRadarPanel
              key="radar"
              startupName={startupName}
              niche={workspace.nicheFocus}
              updates={radarUpdates}
              loadingLive={radarLoading}
              reduceMotion={reduceMotion}
              onDiscuss={discussUpdate}
              onClose={() => setCanvas("chat")}
            />
          ) : !activeChat?.messages.length ? (
            <motion.div
              key="empty"
              className="relative z-10 my-auto mx-auto max-w-2xl space-y-5 text-center"
              variants={heroContainer}
              initial={reduceMotion ? false : "hidden"}
              animate="show"
            >
              <motion.div
                className="relative mx-auto flex h-16 w-16 items-center justify-center"
                variants={heroItem}
                initial={reduceMotion ? false : { scale: 0.8, opacity: 0, y: 15, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={GPU}
              >
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-[-28%] rounded-[32px] shadow-[0_0_50px_rgba(132,204,22,0.25)]"
                  animate={
                    reduceMotion
                      ? { opacity: 0.55 }
                      : { opacity: [0.35, 0.85, 0.35], scale: [0.94, 1.1, 0.94] }
                  }
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  style={GPU}
                />
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/[0.08] bg-zinc-900/80 text-[#A3E635] shadow-[0_0_50px_rgba(132,204,22,0.25)] backdrop-blur-xl">
                  <Sparkles className="h-8 w-8" strokeWidth={1.75} />
                </div>
              </motion.div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                <StaggerWords text={`Hey ${viewerName.split(" ")[0] || "there"}! I am your`} reduceMotion={reduceMotion} />{" "}
                <StaggerWords
                  text="AI Mentor & Co-Founder."
                  reduceMotion={reduceMotion}
                  delay={0.42}
                  className="bg-gradient-to-r from-[#A3E635] to-[#84CC16] bg-clip-text text-transparent"
                />
              </h1>
              <motion.p
                className="mx-auto max-w-lg text-[15px] leading-7 text-zinc-400"
                variants={heroItem}
                style={GPU}
              >
                Let&apos;s start now. Ask me about your product strategy, tech architecture, pricing, or outreach roadmap for{" "}
                <strong className="font-semibold text-white">{startupName}</strong>.
              </motion.p>
              <motion.div
                className="flex flex-wrap items-center justify-center gap-2 pt-1"
                variants={heroItem}
                style={GPU}
              >
                {QUICK_PROMPTS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => insertPrompt(chip.prompt)}
                    className="cursor-pointer rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-200 backdrop-blur-xl transition-all duration-200 hover:border-[#A3E635]/40 hover:bg-white/[0.08] hover:text-white hover:shadow-[0_0_24px_rgba(132,204,22,0.16)]"
                  >
                    {chip.label}
                  </button>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="thread"
              className="relative z-10 my-auto mx-auto w-full max-w-3xl space-y-5"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              style={GPU}
            >
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
                      {viewerInitials}
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* INPUT BAR */}
        {canvas === "chat" && (
        <motion.div
          className="relative z-10 shrink-0 px-4 pb-5 pt-2 md:px-6"
          style={GPU}
          initial={
            reduceMotion
              ? false
              : { y: 20, opacity: 0, filter: "blur(10px)" }
          }
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.45, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mx-auto flex h-[60px] max-w-3xl items-center gap-2 rounded-[28px] border border-white/[0.08] bg-zinc-950/70 p-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-[box-shadow,border-color] duration-200 focus-within:border-[#A3E635]/55 focus-within:shadow-[0_0_0_1px_rgba(163,230,53,0.35),0_0_40px_rgba(132,204,22,0.18)]">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-xl p-2.5 text-zinc-400 hover:bg-zinc-800 hover:text-[#A3E635]"
              title="Attach Screenshot"
              style={GPU}
              whileHover={iconHover}
              whileTap={iconTap}
              transition={{ type: "spring", duration: 0.25, bounce: 0.35 }}
            >
              <Paperclip className="h-4 w-4" />
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setIsVoiceActive(!isVoiceActive)}
              className={`cursor-pointer rounded-xl p-2.5 ${
                isVoiceActive
                  ? "bg-[#A3E635] text-zinc-950 shadow-[0_0_12px_rgba(163,230,53,0.45)]"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-[#A3E635]"
              }`}
              style={GPU}
              whileHover={iconHover}
              whileTap={iconTap}
              transition={{ type: "spring", duration: 0.25, bounce: 0.35 }}
            >
              {isVoiceActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </motion.button>

            <input
              ref={composerRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask Mentor anything or attach a screenshot…"
              className="flex-1 bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            />

            <motion.button
              type="button"
              onClick={handleSendMessage}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-[#A3E635] text-zinc-950 hover:bg-[#84CC16] hover:shadow-[0_0_20px_rgba(163,230,53,0.35)]"
              style={GPU}
              whileHover={iconHover}
              whileTap={iconTap}
              transition={{ type: "spring", duration: 0.25, bounce: 0.35 }}
            >
              <Send className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.div>
        )}
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

      <AnimatePresence>
        {chatMenu && (
          <motion.div
            key={chatMenu.id}
            role="menu"
            className="fixed z-[80] w-44 rounded-xl border border-white/[0.08] bg-zinc-900/95 p-1 shadow-2xl backdrop-blur-xl"
            style={{ top: chatMenu.top, left: chatMenu.left, willChange: "transform, opacity" }}
            initial={reduceMotion ? false : { opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                const chat = chats.find((item) => item.id === chatMenu.id);
                if (chat) startRename(chat);
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800"
            >
              <Pencil className="h-3.5 w-3.5 text-[#A3E635]" /> Rename
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => togglePin(chatMenu.id)}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800"
            >
              <Pin className="h-3.5 w-3.5 text-[#D9F99D]" />
              {chats.find((item) => item.id === chatMenu.id)?.isPinned ? "Unpin" : "Pin"}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => softDeleteChat(chatMenu.id)}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-rose-300 hover:bg-rose-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}