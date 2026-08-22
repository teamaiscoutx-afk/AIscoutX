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
  ArrowLeft,
  Trash2,
  Edit2,
  RotateCcw,
  Sparkles,
  X,
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
  const startupName = workspace?.summary?.name || "Voice Search AI";

  // Chat History & Bin States
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

  // Right-Click Context Menu & Modal States
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

  // Close context menu on global click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // Handle New Chat
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

  // Right Click Context Menu Trigger
  const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, chatId });
  };

  // Context Actions
  const handleStartRename = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setRenamingChatId(chatId);
      setRenameTitle(chat.title);
    }
  };

  const handleSaveRename = (chatId: string) => {
    if (renameTitle.trim()) {
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, title: renameTitle } : c))
      );
    }
    setRenamingChatId(null);
  };

  const handleMoveToBin = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, isDeleted: true } : c))
    );
    if (activeChatId === chatId) {
      const remaining = activeChats.filter((c) => c.id !== chatId);
      if (remaining.length > 0) setActiveChatId(remaining[0].id);
    }
  };

  const handleRestoreFromBin = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, isDeleted: false } : c))
    );
  };

  const handlePermanentDelete = (chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
  };

  // Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
    }
  };

  // Send Message Logic
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
      const aiReply = `Samajh gaya Karan! **${startupName}** ke context me execution flow design karte hain.`;
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
    <div className="fixed inset-0 z-50 flex h-screen w-screen bg-[#050508] text-white font-sans overflow-hidden">
      
      {/* 🟢 LEFT SIDEBAR */}
      <div className="w-64 border-r border-white/10 bg-[#09090d] flex flex-col justify-between p-3 hidden md:flex shrink-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 pt-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold">
              Memory Active
            </span>
          </div>

          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-between gap-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-3 py-2.5 rounded-xl border border-white/10 transition-all shadow-md cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-amber-400" /> New Chat
            </span>
            <span className="text-[10px] text-zinc-400">⌘N</span>
          </button>

          <div className="px-2 py-1 border-b border-white/5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Startup Memory</span>
            <p className="text-xs font-bold text-amber-300 truncate">{startupName}</p>
          </div>

          {/* Recent Chat List */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 block">Recent Chats</span>
            <div className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto">
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
                      className="w-full bg-black/60 border border-amber-400/50 text-white text-xs px-2 py-1.5 rounded-lg outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => setActiveChatId(chat.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left truncate cursor-pointer ${
                        activeChatId === chat.id
                          ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate flex-1">{chat.title}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 🗑️ USER FOOTER WITH RECYCLE BIN */}
        <div className="p-2 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-amber-400 flex items-center justify-center font-bold text-black text-xs shrink-0">
              K
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">Karan (Founder)</p>
              <p className="text-[10px] text-zinc-400 truncate">Mentor Connected</p>
            </div>
          </div>

          <button
            onClick={() => setShowBinModal(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer relative"
            title="Recycle Bin (Deleted Chats)"
          >
            <Trash2 className="h-4 w-4" />
            {binChats.length > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* 🔴 MAIN CANVAS AREA */}
      <div className="flex-1 flex flex-col bg-[#040406] relative overflow-hidden">
        
        {/* Voice Call Active Header Overlay */}
        {isVoiceActive && (
          <div className="bg-gradient-to-r from-rose-950/90 via-purple-950/90 to-black border-b border-rose-500/30 px-6 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-rose-400 animate-bounce" />
              <div>
                <p className="text-xs font-bold text-white">Live Voice Call Active</p>
                <p className="text-[10px] text-zinc-400">Listening to microphone...</p>
              </div>
            </div>
            <div className="flex items-center gap-1 h-5">
              <span className="w-1 bg-rose-400 rounded-full h-3 animate-pulse" />
              <span className="w-1 bg-rose-400 rounded-full h-5 animate-pulse delay-75" />
              <span className="w-1 bg-rose-400 rounded-full h-3 animate-pulse delay-150" />
            </div>
          </div>
        )}

        {/* 🌟 CENTER WELCOME SCREEN OR CHAT STREAM */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col justify-center">
          {activeChat?.messages.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center space-y-4 my-auto">
              <div className="h-16 w-16 rounded-3xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-300 shadow-xl">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Hey Karan! I am your <span className="text-amber-300">AI Mentor & Co-Founder</span>.
              </h1>
              <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
                Let's start now. Ask me about your product strategy, tech architecture, pricing, or outreach roadmap for <strong className="text-white">{startupName}</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-5 max-w-3xl mx-auto w-full my-auto">
              {activeChat?.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3.5 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="h-8 w-8 rounded-xl bg-[#deff9a] flex items-center justify-center shrink-0 mt-0.5 text-black shadow-md">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-5 py-3.5 text-xs md:text-sm leading-relaxed max-w-[85%] ${
                      msg.role === "user"
                        ? "bg-zinc-800 border border-amber-400/30 text-white shadow-md"
                        : "bg-white/[0.03] border border-white/10 text-zinc-200 whitespace-pre-line shadow-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="h-8 w-8 rounded-xl bg-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-black font-bold text-xs shadow-md">
                      K
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Screenshot Upload Preview */}
        {selectedImage && (
          <div className="max-w-3xl mx-auto w-full px-6 py-2 flex items-center gap-3">
            <div className="relative rounded-xl overflow-hidden border border-amber-400/50 bg-black/60 p-1 flex items-center gap-2">
              <img src={selectedImage} alt="Upload Preview" className="h-12 w-12 object-cover rounded-lg" />
              <span className="text-xs text-zinc-300 pr-2">Screenshot attached</span>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 🟢 INPUT BAR WITH SHIFTED VOICE CALL & PAPERCLIP BUTTONS */}
        <div className="p-4 md:p-6 border-t border-white/10 bg-[#08080c] shrink-0">
          <div className="max-w-3xl mx-auto flex items-center gap-2 bg-black/80 border border-white/15 rounded-2xl p-2 focus-within:border-amber-400/60 shadow-2xl">
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Paperclip Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-zinc-400 hover:text-amber-300 hover:bg-white/5 transition-colors cursor-pointer"
              title="Attach Screenshot"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            {/* Shifted Voice Call Button */}
            <button
              onClick={() => setIsVoiceActive(!isVoiceActive)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isVoiceActive
                  ? "bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.5)]"
                  : "text-rose-400 hover:bg-rose-500/10"
              }`}
              title={isVoiceActive ? "End Voice Call" : "Start Voice Call"}
            >
              {isVoiceActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask Mentor anything or attach screenshot..."
              className="flex-1 bg-transparent px-2 text-xs md:text-sm text-white placeholder-zinc-500 focus:outline-none"
            />

            <button
              onClick={handleSendMessage}
              className="h-10 w-10 rounded-xl bg-amber-400 flex items-center justify-center text-black font-bold hover:bg-amber-300 transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      {/* 🖱️ RIGHT CLICK CONTEXT MENU */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-[#12121a] border border-white/15 rounded-xl p-1.5 shadow-2xl w-40 text-xs space-y-1"
        >
          <button
            onClick={() => handleStartRename(contextMenu.chatId)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-zinc-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5 text-amber-400" /> Rename Chat
          </button>
          <button
            onClick={() => handleMoveToBin(contextMenu.chatId)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" /> Move to Bin
          </button>
        </div>
      )}

      {/* 🗑️ RECYCLE BIN MODAL */}
      {showBinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e0e16] border border-white/15 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-rose-400" /> Recycle Bin (Deleted Chats)
              </h3>
              <button
                onClick={() => setShowBinModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {binChats.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">No deleted chats in bin.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {binChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs"
                  >
                    <span className="text-zinc-300 font-medium truncate flex-1 pr-2">{chat.title}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleRestoreFromBin(chat.id)}
                        className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10"
                        title="Restore Chat"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(chat.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
                        title="Delete Permanently"
                      >
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