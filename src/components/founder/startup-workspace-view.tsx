"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Code2,
  FolderTree,
  Terminal,
  Play,
  Send,
  Bot,
  User,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  FileCode,
  Globe,
  LayoutDashboard,
  CreditCard,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Maximize2,
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
  const startupName = workspace?.summary?.name || "VoiceCraft";

  // Studio Panes Collapse Control
  const [showLeftSidebar, setShowLeftSidebar] = useState(false); // Collapsed by default for maximum preview area
  const [showRightChat, setShowRightChat] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [previewPage, setPreviewPage] = useState<"app" | "landing" | "pricing">("app");

  // SaaS Preview State
  const [inputText, setInputText] = useState("Welcome to VoiceCraft! Generate studio-quality voices in seconds.");
  const [selectedVoice, setSelectedVoice] = useState("Sarah - Natural US Female");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState(false);

  // AI Chat
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Karan sir, workspace ab full-screen mode me active hai! 🚀\n\nPreview canvas ko maximum space di gayi hai. Aap live workbench, landing page, aur pricing view test kar sakte hain.`,
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
          content: `Got it! Changes live preview canvas me update kar diye gaye hain.`,
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
    <div className="flex h-screen w-screen flex-col bg-[#050509] text-white overflow-hidden font-sans">
      
      {/* Top Main Navigation */}
      <div className="flex h-13 w-full items-center justify-between border-b border-white/10 bg-[#090910] px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/discover"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
          
          <div className="h-4 w-[1px] bg-white/10" />

          {/* Toggle Explorer */}
          <button
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
              showLeftSidebar 
                ? "bg-[#deff9a]/10 border-[#deff9a]/30 text-[#deff9a]" 
                : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            {showLeftSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            File Explorer
          </button>

          <div className="flex items-center gap-2 ml-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold tracking-wide text-white">{startupName}</span>
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
              Studio Active
            </span>
          </div>
        </div>

        {/* Center Mode Switcher */}
        <div className="flex items-center gap-1 bg-black/80 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "preview"
                ? "bg-[#deff9a] text-black shadow-[0_0_20px_rgba(222,255,154,0.3)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Globe className="h-3.5 w-3.5" /> Live Web App
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "code"
                ? "bg-[#deff9a] text-black shadow-[0_0_20px_rgba(222,255,154,0.3)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" /> Source Code
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRightChat(!showRightChat)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
              showRightChat 
                ? "bg-[#deff9a]/10 border-[#deff9a]/30 text-[#deff9a]" 
                : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            {showRightChat ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            AI Co-Founder
          </button>

          <button className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all">
            <ExternalLink className="h-3.5 w-3.5" /> Deploy
          </button>
        </div>
      </div>

      {/* Main Studio Workspace Body */}
      <div className="flex flex-1 overflow-hidden w-full relative">
        
        {/* Left Drawer File Explorer */}
        {showLeftSidebar && (
          <div className="w-64 border-r border-white/10 bg-[#08080f] flex flex-col shrink-0 animate-in slide-in-from-left duration-200">
            <div className="p-3 border-b border-white/10 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Project Explorer
            </div>
            <div className="p-3 space-y-2 text-xs font-mono">
              <div className="text-amber-400 font-bold">📁 src</div>
              <div className="pl-4 space-y-1.5 text-zinc-300">
                <div className="flex items-center gap-1.5 hover:text-white cursor-pointer"><FileCode className="h-3.5 w-3.5 text-cyan-400" /> page.tsx</div>
                <div className="flex items-center gap-1.5 hover:text-white cursor-pointer"><FileCode className="h-3.5 w-3.5 text-cyan-400" /> AudioStudio.tsx</div>
                <div className="flex items-center gap-1.5 hover:text-white cursor-pointer"><FileCode className="h-3.5 w-3.5 text-cyan-400" /> PricingModal.tsx</div>
              </div>
              <div className="text-zinc-400 pt-2">📄 package.json</div>
              <div className="text-zinc-400">📄 tailwind.config.js</div>
            </div>
          </div>
        )}

        {/* Center Spacious Canvas (Maximum Focus Area) */}
        <div className="flex-1 bg-[#030306] flex flex-col overflow-hidden relative">
          
          {/* Browser Bar */}
          <div className="flex items-center justify-between border-b border-white/10 bg-[#0a0a12] px-4 py-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 mr-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
              
              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/10 text-xs">
                <button
                  onClick={() => setPreviewPage("app")}
                  className={`px-3 py-1 rounded-md font-bold transition-all ${
                    previewPage === "app" ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5 inline mr-1.5" /> App Studio
                </button>
                <button
                  onClick={() => setPreviewPage("landing")}
                  className={`px-3 py-1 rounded-md font-bold transition-all ${
                    previewPage === "landing" ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5 inline mr-1.5" /> Landing Page
                </button>
                <button
                  onClick={() => setPreviewPage("pricing")}
                  className={`px-3 py-1 rounded-md font-bold transition-all ${
                    previewPage === "pricing" ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5 inline mr-1.5" /> Pricing
                </button>
              </div>
            </div>

            <div className="flex-1 max-w-md mx-6 bg-black/80 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-400 flex items-center justify-between font-mono">
              <span className="truncate">https://{startupName.toLowerCase()}.aiscoutx.app/{previewPage}</span>
              <RefreshCw className="h-3.5 w-3.5 text-zinc-500 hover:text-white cursor-pointer" />
            </div>
          </div>

          {/* SaaS Full Canvas Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-[#06060c]">
            {activeTab === "preview" ? (
              <div className="max-w-5xl mx-auto w-full space-y-8">
                
                {/* Header */}
                <header className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center font-bold text-white text-lg shadow-lg">
                      {startupName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-extrabold text-lg text-white block">{startupName}</span>
                      <span className="text-xs text-zinc-400">AI Voice Synthesis Engine</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <button onClick={() => setPreviewPage("landing")} className="text-zinc-400 hover:text-white">Features</button>
                    <button onClick={() => setPreviewPage("pricing")} className="text-zinc-400 hover:text-white">Pricing</button>
                    <button className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-white shadow-md font-bold">
                      Launch App
                    </button>
                  </div>
                </header>

                {/* View 1: Main SaaS Dashboard Workbench */}
                {previewPage === "app" && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 space-y-6 backdrop-blur-2xl shadow-2xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-white">Voice Generation Studio</h2>
                          <p className="text-xs text-zinc-400 mt-1">Convert raw text scripts into studio-grade voice overs with AI actors.</p>
                        </div>
                        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 text-xs font-bold text-emerald-400">
                          100 Credits Active
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-300">Select Voice Actor</label>
                        <select 
                          value={selectedVoice}
                          onChange={(e) => setSelectedVoice(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/80 p-3.5 text-xs text-white focus:outline-none focus:border-amber-400"
                        >
                          <option>Sarah - Natural US Female (Studio)</option>
                          <option>Michael - Deep Authoritative Male</option>
                          <option>Emma - Casual British Accent</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-300">Script Content</label>
                        <textarea
                          rows={5}
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/80 p-3.5 text-xs text-white focus:outline-none focus:border-amber-400 leading-relaxed"
                        />
                      </div>

                      <button
                        onClick={handleGenerateVoice}
                        disabled={isGenerating}
                        className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-4 text-xs font-bold text-white shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" /> Rendering Studio Voiceover...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 fill-white" /> Generate Studio Audio (1 Credit)
                          </>
                        )}
                      </button>

                      {generatedAudio && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" /> Studio Voiceover Rendered (.MP3)
                            </span>
                            <span className="text-xs text-zinc-400">0:14s • 320kbps</span>
                          </div>
                          <div className="h-2 rounded-full bg-black/60 overflow-hidden">
                            <div className="h-full bg-emerald-400 w-full animate-pulse" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* View 2: Landing Page View */}
                {previewPage === "landing" && (
                  <div className="py-16 text-center space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-amber-400 font-bold">
                      <Sparkles className="h-4 w-4" /> Next-Gen AI Voice Engine
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white max-w-3xl mx-auto leading-tight">
                      Turn Any Text Into Studio Audio In Seconds
                    </h1>
                    <p className="text-sm text-zinc-400 max-w-xl mx-auto">
                      Save thousands on voice actors. Generate professional audio for YouTube, podcasts, and digital ads with 1-click.
                    </p>
                  </div>
                )}

                {/* View 3: Pricing View */}
                {previewPage === "pricing" && (
                  <div className="py-8 space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-white">Simple Pricing for Creators</h2>
                      <p className="text-xs text-zinc-400 mt-1">Choose the plan that fits your production volume.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 space-y-4">
                        <h3 className="font-bold text-xl text-white">Starter Plan</h3>
                        <div className="text-3xl font-bold text-white">$29 <span className="text-xs text-zinc-400 font-normal">/month</span></div>
                        <ul className="text-xs text-zinc-300 space-y-2.5">
                          <li>✓ 100 Studio Audio Credits</li>
                          <li>✓ 15 AI Voice Actors</li>
                          <li>✓ Commercial License</li>
                        </ul>
                      </div>

                      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/[0.04] p-8 space-y-4 relative">
                        <span className="absolute top-4 right-4 text-[10px] font-bold bg-amber-500 text-black px-2.5 py-0.5 rounded-md">
                          RECOMMENDED
                        </span>
                        <h3 className="font-bold text-xl text-white">Pro Creator</h3>
                        <div className="text-3xl font-bold text-white">$79 <span className="text-xs text-zinc-400 font-normal">/month</span></div>
                        <ul className="text-xs text-zinc-300 space-y-2.5">
                          <li>✓ Unlimited Audio Credits</li>
                          <li>✓ All 50+ Custom AI Voices</li>
                          <li>✓ API Access</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="font-mono text-xs text-zinc-300 space-y-2 leading-relaxed bg-black/80 p-6 rounded-2xl border border-white/10 max-w-4xl mx-auto">
                <div className="text-amber-400">// src/app/page.tsx</div>
                <div>export default function Page() &#123;</div>
                <div className="pl-4 text-cyan-400">return &lt;AudioStudioComponent name="{startupName}" /&gt;;</div>
                <div>&#125;</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Drawer AI Co-Founder Chatbot */}
        {showRightChat && (
          <div className="w-80 md:w-96 border-l border-white/10 bg-[#08080f] flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-white/10 bg-[#0a0a14] flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-[#deff9a] flex items-center justify-center shadow-lg">
                <Bot className="h-4 w-4 text-black" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  AI Co-Founder <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] text-zinc-400">Full-Screen Studio Assistant</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed max-w-[88%] ${
                    msg.role === "user" ? "bg-[#deff9a] text-black font-semibold" : "bg-white/5 border border-white/10 text-zinc-200 whitespace-pre-line"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t border-white/10 bg-[#0a0a14]">
              <div className="flex items-center gap-2 bg-black/80 border border-white/10 rounded-xl p-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask AI Co-Founder..."
                  className="flex-1 bg-transparent px-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  className="h-7 w-7 rounded-lg bg-[#deff9a] flex items-center justify-center text-black font-bold"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}