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
  Maximize2,
  Minimize2,
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Layers,
  ChevronRight,
  Lock,
} from "lucide-react";
import type { StartupWorkspace } from "@/lib/founder/types";

type StartupWorkspaceViewProps = {
  initialWorkspace: StartupWorkspace;
  initialTasks: any[];
};

type FileNode = {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
};

export function StartupWorkspaceView({
  initialWorkspace,
}: StartupWorkspaceViewProps) {
  const [workspace] = useState(initialWorkspace);
  const startupName = workspace?.summary?.name || "VoiceCraft";
  const category = workspace?.summary?.category || "AI Voice Cloning for Creators";

  // Studio Layout States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [activeSidebarTab, setActiveSidebarTab] = useState<"files" | "terminal">("files");
  const [previewPage, setPreviewPage] = useState<"app" | "landing" | "pricing" | "auth">("app");

  // SaaS Live App State Simulation
  const [inputText, setInputText] = useState("Welcome to VoiceCraft! Generate studio-quality voices in seconds.");
  const [selectedVoice, setSelectedVoice] = useState("Sarah - Natural US Female");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState(false);

  // Dynamic Visual Customization via AI Prompting
  const [primaryColor, setPrimaryColor] = useState("from-amber-500 to-amber-600");
  const [heroTitle, setHeroTitle] = useState(`${startupName} — AI Voice Engine`);

  // Chatbot Messages & Auto-scroll
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello Karan sir! 🚀 Main aapka AI Co-Founder hoon. Maine **${startupName}** (${category}) ka production-ready SaaS MVP ready kar diya hai.

Aap left pane me live app ko interact karke check kar sakte hain:
• **Interactive SaaS Studio Workbench**
• **Landing Page & Pricing Tier**
• **Auth Modal UI**

Kuch bhi change karwana ho ya domain/Stripe connect karne ki guidance chahiye ho, mujhe bataiye!`,
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
      let aiResponse = `Understood Karan sir! Maine "${userMsg}" ke hisaab se live preview update kar diya hai.`;
      
      const lower = userMsg.toLowerCase();
      if (lower.includes("blue") || lower.includes("color") || lower.includes("theme")) {
        setPrimaryColor("from-blue-600 to-cyan-500");
        aiResponse = `Got it Karan sir! Theme accent color ko Neon Blue Gradient par switch kar diya gaya hai. Check live preview!`;
      } else if (lower.includes("stripe") || lower.includes("payment")) {
        setPreviewPage("pricing");
        aiResponse = `Stripe Integration Guide for ${startupName}:\n\n1. Stripe Dashboard se **Publishable Key** aur **Secret Key** copy karein.\n2. Vercel Environment Variables me \`NEXT_PUBLIC_STRIPE_KEY\` add karein.\n3. Pricing tier modal ab live test mode me ready hai!`;
      } else if (lower.includes("domain")) {
        aiResponse = `Custom Domain Setup for ${startupName}:\n\n1. Namecheap/GoDaddy par CNAME Record update karein:\n   • **Type**: CNAME\n   • **Name**: @\n   • **Value**: cname.vercel-dns.com\n2. 5 minutes me SSL certificate auto-activate ho jayega!`;
      } else if (lower.includes("landing")) {
        setPreviewPage("landing");
        aiResponse = `Landing page preview view open kar diya hai Karan sir!`;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }]);
    }, 900);
  };

  const handleGenerateVoice = () => {
    setIsGenerating(true);
    setGeneratedAudio(false);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedAudio(true);
    }, 1400);
  };

  const fileTree: FileNode[] = [
    {
      name: "src",
      type: "folder",
      children: [
        {
          name: "app",
          type: "folder",
          children: [
            { name: "page.tsx", type: "file" },
            { name: "layout.tsx", type: "file" },
            { name: "globals.css", type: "file" },
          ],
        },
        {
          name: "components",
          type: "folder",
          children: [
            { name: "AudioStudio.tsx", type: "file" },
            { name: "VoiceSelector.tsx", type: "file" },
            { name: "PricingModal.tsx", type: "file" },
            { name: "AuthModal.tsx", type: "file" },
          ],
        },
        {
          name: "lib",
          type: "folder",
          children: [{ name: "elevenlabs.ts", type: "file" }, { name: "stripe.ts", type: "file" }],
        },
      ],
    },
    { name: "package.json", type: "file" },
    { name: "tailwind.config.js", type: "file" },
  ];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full flex-col bg-[#040407] text-white overflow-hidden font-sans">
      
      {/* Top IDE Workspace Toolbar */}
      <div className="flex h-12 w-full items-center justify-between border-b border-white/[0.08] bg-[#08080e] px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/discover"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Discover
          </Link>
          <div className="h-4 w-[1px] bg-white/10" />
          
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white px-2 py-1 rounded bg-white/[0.03] border border-white/10 transition-all"
          >
            <FolderTree className="h-3.5 w-3.5" />
            {isSidebarOpen ? "Hide Explorer" : "Show Explorer"}
          </button>

          <div className="flex items-center gap-2 ml-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wide text-white">{startupName} Studio</span>
            <span className="rounded-md bg-[#deff9a]/10 px-2 py-0.5 text-[10px] font-bold text-[#deff9a] border border-[#deff9a]/20">
              v1.0 Production MVP
            </span>
          </div>
        </div>

        {/* Center Canvas Mode Selector */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "preview"
                ? "bg-[#deff9a] text-black font-bold shadow-[0_0_15px_rgba(222,255,154,0.25)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Globe className="h-3.5 w-3.5" /> Interactive App
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "code"
                ? "bg-[#deff9a] text-black font-bold shadow-[0_0_15px_rgba(222,255,154,0.25)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" /> Source Code
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all">
            <ExternalLink className="h-3.5 w-3.5" /> Deploy Vercel
          </button>
        </div>
      </div>

      {/* Main 3-Pane Studio Layout */}
      <div className="flex flex-1 overflow-hidden w-full relative">
        
        {/* PANE 1: Collapsible Left File Explorer / Console */}
        {isSidebarOpen && (
          <div className="w-60 border-r border-white/[0.08] bg-[#07070d] flex flex-col shrink-0 animate-in slide-in-from-left duration-200">
            <div className="flex border-b border-white/[0.08] bg-[#0a0a12]">
              <button
                onClick={() => setActiveSidebarTab("files")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                  activeSidebarTab === "files"
                    ? "border-[#deff9a] text-[#deff9a] bg-white/[0.02]"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <FolderTree className="h-3.5 w-3.5" /> Files
              </button>
              <button
                onClick={() => setActiveSidebarTab("terminal")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                  activeSidebarTab === "terminal"
                    ? "border-[#deff9a] text-[#deff9a] bg-white/[0.02]"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <Terminal className="h-3.5 w-3.5" /> Console
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 text-xs">
              {activeSidebarTab === "files" ? (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Project Tree
                  </div>
                  {fileTree.map((node, i) => (
                    <div key={i} className="pl-1">
                      <div className="flex items-center gap-1.5 text-zinc-300 py-1 hover:text-white cursor-pointer rounded px-1.5 hover:bg-white/[0.04]">
                        {node.type === "folder" ? (
                          <>
                            <ChevronDown className="h-3 w-3 text-zinc-500" />
                            <span className="font-semibold text-amber-400">{node.name}</span>
                          </>
                        ) : (
                          <>
                            <FileCode className="h-3 w-3 text-cyan-400 ml-4" />
                            <span>{node.name}</span>
                          </>
                        )}
                      </div>
                      {node.children && (
                        <div className="pl-3 border-l border-white/10 ml-2 space-y-0.5 my-1">
                          {node.children.map((child, j) => (
                            <div key={j} className="flex items-center gap-1.5 text-zinc-400 hover:text-white py-1 cursor-pointer rounded px-1.5 hover:bg-white/[0.04]">
                              {child.type === "folder" ? (
                                <span className="font-semibold text-amber-300">{child.name}</span>
                              ) : (
                                <>
                                  <FileCode className="h-3 w-3 text-cyan-400" />
                                  <span>{child.name}</span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="font-mono text-[11px] space-y-2 text-emerald-400/90 leading-relaxed">
                  <div className="text-zinc-500">$ next dev --turbo</div>
                  <div>✓ Ready in 850ms</div>
                  <div>✓ Compiled / app in 120ms</div>
                  <div className="text-amber-400">[ElevenLabs API] Endpoint Mounted</div>
                  <div className="text-cyan-400">[Supabase] Realtime listener active</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANE 2: Center Spacious Live SaaS Canvas */}
        <div className="flex-1 bg-[#0a0a12] flex flex-col overflow-hidden relative">
          
          {/* Simulated Web Browser Navigation Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0d0d16] px-4 py-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 mr-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              </div>
              
              {/* Internal Page Tabs */}
              <div className="flex items-center gap-1 bg-black/50 p-0.5 rounded-lg border border-white/10 text-[11px]">
                <button
                  onClick={() => setPreviewPage("app")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    previewPage === "app" ? "bg-white/10 text-white font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <LayoutDashboard className="h-3 w-3 inline mr-1" /> App Workbench
                </button>
                <button
                  onClick={() => setPreviewPage("landing")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    previewPage === "landing" ? "bg-white/10 text-white font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Globe className="h-3 w-3 inline mr-1" /> Landing Page
                </button>
                <button
                  onClick={() => setPreviewPage("pricing")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    previewPage === "pricing" ? "bg-white/10 text-white font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <CreditCard className="h-3 w-3 inline mr-1" /> Pricing
                </button>
              </div>
            </div>

            <div className="flex-1 max-w-sm mx-4 bg-black/60 border border-white/10 rounded-lg px-3 py-1 text-[11px] text-zinc-400 flex items-center justify-between">
              <span className="truncate">https://{startupName.toLowerCase().replace(/\s+/g, '')}.aiscoutx.app/{previewPage === "app" ? "dashboard" : previewPage}</span>
              <RefreshCw className="h-3 w-3 text-zinc-500 hover:text-white cursor-pointer" />
            </div>
          </div>

          {/* SaaS Full Canvas Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#06060a]">
            {activeTab === "preview" ? (
              <div className="max-w-4xl mx-auto w-full space-y-6">
                
                {/* Header Navbar */}
                <header className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-9 w-9 rounded-xl bg-gradient-to-r ${primaryColor} flex items-center justify-center font-bold text-white shadow-lg`}>
                      {startupName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-base text-white block">{heroTitle}</span>
                      <span className="text-[10px] text-zinc-400">AI Voice Synthesis Engine</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPreviewPage("landing")} className="text-xs text-zinc-400 hover:text-white">Features</button>
                    <button onClick={() => setPreviewPage("pricing")} className="text-xs text-zinc-400 hover:text-white">Pricing</button>
                    <button 
                      onClick={() => setPreviewPage("auth")}
                      className={`rounded-xl bg-gradient-to-r ${primaryColor} px-4 py-2 text-xs font-semibold text-white shadow-md hover:opacity-90 transition-all`}
                    >
                      Sign In
                    </button>
                  </div>
                </header>

                {/* PAGE 1: Main SaaS Dashboard Workbench */}
                {previewPage === "app" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5 backdrop-blur-xl shadow-2xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-bold text-white">Voice Generation Studio</h2>
                          <p className="text-xs text-zinc-400 mt-1">Convert raw text scripts into studio-grade voice overs with AI actors.</p>
                        </div>
                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
                          100 Credits Left
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-300">Select Voice Actor</label>
                        <select 
                          value={selectedVoice}
                          onChange={(e) => setSelectedVoice(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/60 p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                        >
                          <option>Sarah - Natural US Female (Studio)</option>
                          <option>Michael - Deep Authoritative Male</option>
                          <option>Emma - Casual British Accent</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-300">Script Text</label>
                        <textarea
                          rows={4}
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/60 p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <button
                        onClick={handleGenerateVoice}
                        disabled={isGenerating}
                        className={`w-full rounded-xl bg-gradient-to-r ${primaryColor} py-3.5 text-xs font-bold text-white shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-2`}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" /> Rendering Studio Audio...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 fill-white" /> Generate Studio Audio
                          </>
                        )}
                      </button>

                      {generatedAudio && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" /> Studio Voiceover Rendered (.MP3)
                            </span>
                            <span className="text-[10px] text-zinc-400">0:14s • 320kbps</span>
                          </div>
                          <div className="h-2 rounded-full bg-black/60 overflow-hidden">
                            <div className="h-full bg-emerald-400 w-full animate-pulse" />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold">
                              Download MP3
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PAGE 2: Landing Page View */}
                {previewPage === "landing" && (
                  <div className="py-12 text-center space-y-6 animate-in fade-in duration-200">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-amber-400">
                      <Sparkles className="h-3.5 w-3.5" /> Next-Gen AI Voice Cloning Platform
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white max-w-2xl mx-auto leading-tight">
                      Turn Any Text Into Studio Audio In Seconds
                    </h1>
                    <p className="text-sm text-zinc-400 max-w-xl mx-auto">
                      Save thousands on voice actors. Generate professional audio for YouTube, podcasts, and digital ads with 1-click.
                    </p>
                    <div className="flex justify-center gap-3 pt-2">
                      <button 
                        onClick={() => setPreviewPage("app")}
                        className={`rounded-xl bg-gradient-to-r ${primaryColor} px-6 py-3 text-xs font-bold text-white shadow-lg`}
                      >
                        Try Studio Free
                      </button>
                    </div>
                  </div>
                )}

                {/* PAGE 3: Pricing View */}
                {previewPage === "pricing" && (
                  <div className="py-6 space-y-6 animate-in fade-in duration-200">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-white">Simple Pricing for Creators</h2>
                      <p className="text-xs text-zinc-400 mt-1">Choose the plan that fits your production volume.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
                        <h3 className="font-bold text-lg text-white">Starter Plan</h3>
                        <div className="text-2xl font-bold text-white">$29 <span className="text-xs text-zinc-400 font-normal">/month</span></div>
                        <ul className="text-xs text-zinc-300 space-y-2">
                          <li>✓ 100 Studio Audio Credits</li>
                          <li>✓ 15 AI Voice Actors</li>
                          <li>✓ Commercial License</li>
                        </ul>
                        <button className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white">
                          Subscribe Starter
                        </button>
                      </div>

                      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/[0.04] p-6 space-y-4 relative">
                        <span className="absolute top-3 right-3 text-[10px] font-bold bg-amber-500 text-black px-2 py-0.5 rounded-md">
                          POPULAR
                        </span>
                        <h3 className="font-bold text-lg text-white">Pro Creator</h3>
                        <div className="text-2xl font-bold text-white">$79 <span className="text-xs text-zinc-400 font-normal">/month</span></div>
                        <ul className="text-xs text-zinc-300 space-y-2">
                          <li>✓ Unlimited Audio Credits</li>
                          <li>✓ All 50+ Custom AI Voices</li>
                          <li>✓ 4K Audio Export + API Access</li>
                        </ul>
                        <button className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${primaryColor} text-xs font-bold text-white shadow-lg`}>
                          Subscribe Pro
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* PAGE 4: Auth View */}
                {previewPage === "auth" && (
                  <div className="py-8 max-w-md mx-auto rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4 text-center animate-in fade-in duration-200">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center mx-auto text-white font-bold text-lg">
                      {startupName.charAt(0)}
                    </div>
                    <h3 className="font-bold text-lg text-white">Welcome back to {startupName}</h3>
                    <div className="space-y-3 pt-2">
                      <input 
                        type="email" 
                        placeholder="Enter your email" 
                        className="w-full rounded-xl border border-white/10 bg-black/60 p-3 text-xs text-white focus:outline-none"
                      />
                      <button className={`w-full py-3 rounded-xl bg-gradient-to-r ${primaryColor} text-xs font-bold text-white shadow-md`}>
                        Continue with Email
                      </button>
                    </div>
                  </div>
                )}

                {/* Footer Bar */}
                <footer className="flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-zinc-500">
                  <div>© 2026 {startupName} Inc. All rights reserved.</div>
                  <div className="flex gap-4">
                    <span className="hover:text-zinc-300 cursor-pointer">Privacy</span>
                    <span className="hover:text-zinc-300 cursor-pointer">Terms</span>
                  </div>
                </footer>

              </div>
            ) : (
              <div className="font-mono text-xs text-zinc-300 space-y-2 leading-relaxed bg-black/60 p-4 rounded-xl border border-white/10">
                <div className="text-amber-400">// src/app/page.tsx - Main Entrypoint</div>
                <div>export default function Page() &#123;</div>
                <div className="pl-4 text-cyan-400">return &lt;AudioStudioComponent name="{startupName}" /&gt;;</div>
                <div>&#125;</div>
              </div>
            )}
          </div>
        </div>

        {/* PANE 3: Right AI Co-Founder Chatbot */}
        <div className="w-80 md:w-96 border-l border-white/[0.08] bg-[#07070d] flex flex-col shrink-0">
          
          {/* AI Header */}
          <div className="p-3.5 border-b border-white/[0.08] bg-[#0a0a12] flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-[#deff9a] flex items-center justify-center shadow-[0_0_12px_rgba(222,255,154,0.25)]">
              <Bot className="h-4 w-4 text-black" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                AI Co-Founder <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[10px] text-zinc-400">Context Memory Active • Karan Sir</div>
            </div>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="h-6 w-6 rounded-full bg-[#deff9a] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-black" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed max-w-[88%] ${
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

          {/* Quick Prompt Quick Actions */}
          <div className="p-2 border-t border-white/5 bg-[#080810] flex gap-1.5 overflow-x-auto text-[10px]">
            <button 
              onClick={() => setInputMessage("Change theme color to blue")}
              className="px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.02] text-zinc-300 hover:border-[#deff9a]/40 shrink-0"
            >
              🎨 Change Theme
            </button>
            <button 
              onClick={() => setInputMessage("How to connect Stripe payments?")}
              className="px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.02] text-zinc-300 hover:border-[#deff9a]/40 shrink-0"
            >
              💳 Setup Stripe
            </button>
            <button 
              onClick={() => setInputMessage("How to connect custom domain?")}
              className="px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.02] text-zinc-300 hover:border-[#deff9a]/40 shrink-0"
            >
              🌐 Connect Domain
            </button>
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-white/[0.08] bg-[#090912]">
            <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl p-1.5 focus-within:border-[#deff9a]/50">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask AI Co-Founder to tweak UI, code or launch..."
                className="flex-1 bg-transparent px-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              <button
                onClick={handleSendMessage}
                className="h-7 w-7 rounded-lg bg-[#deff9a] flex items-center justify-center text-black font-bold hover:bg-[#c9f578] transition-all"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}