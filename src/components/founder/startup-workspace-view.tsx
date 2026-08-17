"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bot,
  User,
  Send,
  Plus,
  Terminal,
  FolderTree,
  Globe,
  Maximize2,
  Minimize2,
  Columns2,
  ArrowLeft,
  Sparkles,
  Play,
  RefreshCw,
  CheckCircle2,
  X,
  Code2,
  ExternalLink,
  ChevronRight,
  FileCode,
} from "lucide-react";
import type { StartupWorkspace } from "@/lib/founder/types";

type StartupWorkspaceViewProps = {
  initialWorkspace: StartupWorkspace;
  initialTasks: any[];
};

export function StartupWorkspaceView({
  initialWorkspace,
}: StartupWorkspaceViewProps) {
  const [workspace] = useState(initialWorkspace);
  const startupName = workspace?.summary?.name || "";

  // Pane Resize / Layout Mode State
  // 'split' = 50/50, 'full-chat' = Chatbot 100%, 'full-output' = Output Canvas 100%
  const [layoutMode, setLayoutMode] = useState<"split" | "full-chat" | "full-output">("split");

  // Dynamic Cursor Tools Drawer (+ Icon toggles)
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(false);

  // Live Output App State
  const [inputText, setInputText] = useState(
    "Welcome to VoiceCraft! Paste your text script here to generate studio audio."
  );
  const [selectedVoice, setSelectedVoice] = useState("Sarah - Natural US Female");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState(false);

  // Chatbot State
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hey Karan! 🚀 Main aapka AI Builder Hoon.\n\nMaine **${startupName}** ka MVP workspace generate kar diya hai. Aapse milne wale prompts ke basis par main right-side canvas par aapka AI Tool live construct aur modify karunga.\n\nAap custom UI tweaks, new components, ya functionality add karne ke liye niche likhein!`,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMsg = inputMessage;
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInputMessage("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Understood! Maine aapke request ("${userMsg}") ke mutabiq right-side output browser update kar diya hai.`,
        },
      ]);
    }, 800);
  };

  const handleGenerateVoice = () => {
    setIsGenerating(true);
    setGeneratedAudio(false);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedAudio(true);
    }, 1200);
  };

  return (
    // Fixed Inset Overlay removes outer dashboard sidebar permanently
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col bg-[#050508] text-white font-sans overflow-hidden">
      
      {/* 🟢 TOP MINIMALIST CURSOR TOOLBAR */}
      <div className="flex h-12 w-full items-center justify-between border-b border-white/10 bg-[#08080e] px-4 shrink-0">
        
        {/* Left: Back Link & Plus (+ Icon) Cursor Tools Menu */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/discover"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>

          <div className="h-4 w-[1px] bg-white/10" />

          {/* CURSOR STYLE PLUS (+) TOOL BUTTON */}
          <div className="relative">
            <button
              onClick={() => setShowToolsMenu(!showToolsMenu)}
              className="flex items-center gap-1.5 bg-[#deff9a] text-black font-bold text-xs px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(222,255,154,0.3)] hover:bg-[#cbf775] transition-all"
            >
              <Plus className="h-4 w-4 stroke-[3]" /> Add / View Tools
            </button>

            {/* Floating Dropdown for Terminal & Files */}
            {showToolsMenu && (
              <div className="absolute left-0 mt-2 w-48 rounded-xl border border-white/15 bg-[#0e0e17] p-1.5 shadow-2xl z-50 space-y-1">
                <button
                  onClick={() => {
                    setShowFileExplorer(!showFileExplorer);
                    setShowToolsMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white"
                >
                  <FolderTree className="h-4 w-4 text-amber-400" />
                  {showFileExplorer ? "Hide File Explorer" : "Show File Explorer"}
                </button>
                <button
                  onClick={() => {
                    setShowTerminal(!showTerminal);
                    setShowToolsMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white"
                >
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  {showTerminal ? "Hide Terminal" : "Show Terminal"}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white tracking-wide">{startupName} Studio</span>
          </div>
        </div>

        {/* Center Layout Resize & View Mode Toggles */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setLayoutMode("full-chat")}
            title="Full Chatbot View"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              layoutMode === "full-chat"
                ? "bg-white/20 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Bot className="h-3.5 w-3.5" /> Full Chat
          </button>
          
          <button
            onClick={() => setLayoutMode("split")}
            title="Split 50/50 View"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              layoutMode === "split"
                ? "bg-[#deff9a] text-black shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" /> Split 50/50
          </button>

          <button
            onClick={() => setLayoutMode("full-output")}
            title="Full Output Preview"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              layoutMode === "full-output"
                ? "bg-white/20 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Globe className="h-3.5 w-3.5" /> Full Output
          </button>
        </div>

        {/* Right Action */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all">
            <ExternalLink className="h-3.5 w-3.5" /> Deploy Vercel
          </button>
        </div>
      </div>

      {/* 🔴 MAIN 2-PANE WORKSPACE (CHATBOT LEFT | OUTPUT RIGHT) */}
      <div className="flex flex-1 overflow-hidden w-full relative">
        
        {/* PANE 1: LEFT SIDEBAR CHATBOT */}
        <div
          className={`border-r border-white/10 bg-[#07070c] flex flex-col transition-all duration-300 relative ${
            layoutMode === "full-chat"
              ? "w-full"
              : layoutMode === "full-output"
              ? "w-0 hidden"
              : "w-1/2 md:w-[42%] lg:w-[38%]"
          }`}
        >
          {/* Chat Header */}
          <div className="p-3.5 border-b border-white/10 bg-[#0a0a14] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-[#deff9a] flex items-center justify-center">
                <Bot className="h-4 w-4 text-black" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">AI Builder Chatbot</span>
                <span className="text-[10px] text-zinc-400">Prompt to generate & tweak code</span>
              </div>
            </div>

            <button
              onClick={() => setLayoutMode("full-chat")}
              className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
              title="Expand Chatbot"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Optional File Explorer Drawer inside Left Pane */}
          {showFileExplorer && (
            <div className="border-b border-white/10 bg-[#040408] p-3 text-xs font-mono animate-in slide-in-from-top duration-200">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="font-bold uppercase tracking-wider text-[10px]">Project Files</span>
                <X className="h-3.5 w-3.5 cursor-pointer hover:text-white" onClick={() => setShowFileExplorer(false)} />
              </div>
              <div className="space-y-1 text-zinc-300">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold"><FolderTree className="h-3.5 w-3.5" /> src/app</div>
                <div className="pl-4 flex items-center gap-1.5 text-cyan-300"><FileCode className="h-3.5 w-3.5" /> page.tsx</div>
                <div className="pl-4 flex items-center gap-1.5 text-cyan-300"><FileCode className="h-3.5 w-3.5" /> Studio.tsx</div>
              </div>
            </div>
          )}

          {/* Chat Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="h-6 w-6 rounded-full bg-[#deff9a] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-black" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 text-xs leading-relaxed max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-[#deff9a] text-black font-semibold"
                      : "bg-white/[0.04] border border-white/10 text-zinc-200 whitespace-pre-line"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="h-6 w-6 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Optional Terminal Drawer inside Left Pane */}
          {showTerminal && (
            <div className="border-t border-white/10 bg-black/90 p-3 font-mono text-[11px] text-emerald-400 h-32 overflow-y-auto shrink-0">
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span>Terminal Output</span>
                <X className="h-3.5 w-3.5 cursor-pointer hover:text-white" onClick={() => setShowTerminal(false)} />
              </div>
              <div>$ next dev --turbo</div>
              <div className="text-zinc-400">✓ Ready in 600ms</div>
              <div>[API Route] Voice synthesis active</div>
            </div>
          )}

          {/* Chat Prompt Input */}
          <div className="p-3 border-t border-white/10 bg-[#090912]">
            <div className="flex items-center gap-2 bg-black/70 border border-white/10 rounded-xl p-1.5 focus-within:border-[#deff9a]/60">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask AI Builder to modify UI, components, code..."
                className="flex-1 bg-transparent px-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              <button
                onClick={handleSendMessage}
                className="h-8 w-8 rounded-lg bg-[#deff9a] flex items-center justify-center text-black font-bold hover:bg-[#c9f578] transition-all"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* PANE 2: RIGHT SIDE OUTPUT / BROWSER CANVAS AREA */}
        <div
          className={`bg-[#030306] flex flex-col overflow-hidden transition-all duration-300 relative ${
            layoutMode === "full-output"
              ? "w-full"
              : layoutMode === "full-chat"
              ? "w-0 hidden"
              : "flex-1"
          }`}
        >
          {/* Output Browser Top Bar */}
          <div className="flex items-center justify-between border-b border-white/10 bg-[#0a0a14] px-4 py-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 mr-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-amber-400" /> Output Live Preview
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLayoutMode("full-output")}
                className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
                title="Expand Output Canvas"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Live Output Canvas Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#06060c]">
            <div className="max-w-3xl mx-auto w-full space-y-6">
              
              {/* Generated AI Tool UI Canvas */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center font-bold text-white text-base">
                      {startupName.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">{startupName} — AI Studio</h2>
                      <p className="text-[11px] text-zinc-400">Live generated tool result</p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
                    Ready
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">Select Voice Model</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/80 p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option>Sarah - Natural US Female (Studio)</option>
                    <option>Michael - Deep Authoritative Male</option>
                    <option>Emma - Casual British Accent</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">Script Text</label>
                  <textarea
                    rows={4}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/80 p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  onClick={handleGenerateVoice}
                  disabled={isGenerating}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-xs font-bold text-white shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Rendering AI Audio...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-white" /> Run AI Tool Output
                    </>
                  )}
                </button>

                {generatedAudio && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Studio Voiceover Rendered</span>
                      <span className="text-zinc-400 text-[10px]">320kbps MP3</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}