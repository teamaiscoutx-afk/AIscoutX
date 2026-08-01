"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Code2,
  FolderTree,
  Terminal,
  Play,
  Send,
  Sparkles,
  Bot,
  User,
  ExternalLink,
  RefreshCw,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ChevronRight,
  ChevronDown,
  FileCode,
  Globe,
  Settings,
  HelpCircle,
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
  content?: string;
};

export function StartupWorkspaceView({
  initialWorkspace,
}: StartupWorkspaceViewProps) {
  const [workspace] = useState(initialWorkspace);
  const startupName = workspace?.summary?.name || "VoiceCraft";
  const category = workspace?.summary?.category || "AI Voice Cloning for Creators";

  // Navigation & View states
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [activeSidebar, setActiveSidebar] = useState<"files" | "terminal">("files");
  
  // Custom Live SaaS App Simulation State
  const [inputText, setInputText] = useState("Welcome to VoiceCraft! Generate studio-quality voices in seconds.");
  const [selectedVoice, setSelectedVoice] = useState("Sarah - Natural US Female");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState(false);
  
  // Customization Tweak States (Manipulated via Prompts)
  const [primaryColor, setPrimaryColor] = useState("from-amber-500 to-amber-600");
  const [heroTitle, setHeroTitle] = useState(`${startupName} — AI Voice Engine`);

  // Chatbot State
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello Karan sir! 🚀 I've built the complete studio-ready SaaS MVP for **${startupName}** (${category}). 

You can interact with your live app in the preview window on the left. 

What we have generated A to Z:
• High-converting Landing Page & Audio Studio Dashboard
• Interactive Voice Generation Workbench
• Authentication Modals & Legal Pages

Feel free to request any UI/UX changes or ask me how to set up your domain, Supabase Auth, or Stripe payments!`,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulated AI Chat Prompt Handler
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMsg = inputMessage;
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInputMessage("");

    setTimeout(() => {
      let aiResponse = `Understood Karan sir! I am updating the code structure for "${userMsg}". Check the live preview now!`;
      
      const lower = userMsg.toLowerCase();
      if (lower.includes("blue") || lower.includes("color")) {
        setPrimaryColor("from-blue-600 to-cyan-500");
        aiResponse = `Got it Karan sir! I updated the theme accent color to Neon Blue across all dashboard components.`;
      } else if (lower.includes("title") || lower.includes("name")) {
        setHeroTitle(`${startupName} Pro Studio`);
        aiResponse = `Updated the main studio header title to "${startupName} Pro Studio".`;
      } else if (lower.includes("stripe") || lower.includes("payment")) {
        aiResponse = `Here is your step-by-step guide to connect Stripe for ${startupName}:\n\n1. Go to stripe.com and create an account.\n2. Copy your API Keys (Publishable Key & Secret Key).\n3. Paste them into your Vercel Environment Variables as \`NEXT_PUBLIC_STRIPE_KEY\`.\n4. Click 'Sync Webhooks' in your dashboard. Ready for payments!`;
      } else if (lower.includes("domain")) {
        aiResponse = `To attach your custom domain for ${startupName}:\n\n1. Buy your domain from Namecheap / GoDaddy.\n2. In Vercel Project Settings -> Domains, add your domain name.\n3. Add the DNS CNAME record \`cname.vercel-dns.com\` in your domain provider portal.\n4. SSL certificate will activate automatically in 5 minutes!`;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }]);
    }, 1000);
  };

  const handleGenerateVoice = () => {
    setIsGenerating(true);
    setGeneratedAudio(false);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedAudio(true);
    }, 1500);
  };

  // Mocked File Tree Structure
  const fileTree: FileNode[] = [
    {
      name: "src",
      type: "folder",
      children: [
        {
          name: "app",
          type: "folder",
          children: [
            { name: "page.tsx", type: "file", content: "// Main SaaS Landing & Studio" },
            { name: "layout.tsx", type: "file", content: "// Root Layout & Theme Providers" },
          ],
        },
        {
          name: "components",
          type: "folder",
          children: [
            { name: "AudioStudio.tsx", type: "file" },
            { name: "VoiceSelector.tsx", type: "file" },
            { name: "PricingModal.tsx", type: "file" },
          ],
        },
        {
          name: "lib",
          type: "folder",
          children: [{ name: "elevenlabs.ts", type: "file" }],
        },
      ],
    },
    { name: "package.json", type: "file" },
    { name: "tailwind.config.js", type: "file" },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-[#050508] text-white overflow-hidden">
      {/* Top IDE Header Bar */}
      <div className="flex h-12 items-center justify-between border-b border-white/10 bg-[#0a0a10] px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/discover"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-white">{startupName} MVP</span>
            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
              Live AI Workspace
            </span>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
              activeTab === "preview"
                ? "bg-[#deff9a] text-black font-bold shadow-[0_0_12px_rgba(222,255,154,0.3)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Globe className="h-3.5 w-3.5" /> Live Preview
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
              activeTab === "code"
                ? "bg-[#deff9a] text-black font-bold shadow-[0_0_12px_rgba(222,255,154,0.3)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" /> Code & Files
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all">
            <ExternalLink className="h-3.5 w-3.5" /> Open in New Tab
          </button>
        </div>
      </div>

      {/* Main 3-Pane Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* PANE 1: Left File Explorer & Terminal Sidebar */}
        <div className="w-64 border-r border-white/10 bg-[#08080e] flex flex-col shrink-0">
          {/* Sidebar Nav Tabs */}
          <div className="flex border-b border-white/10 bg-[#0a0a12]">
            <button
              onClick={() => setActiveSidebar("files")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeSidebar === "files"
                  ? "border-[#deff9a] text-[#deff9a] bg-white/[0.02]"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <FolderTree className="h-3.5 w-3.5" /> Files
            </button>
            <button
              onClick={() => setActiveSidebar("terminal")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeSidebar === "terminal"
                  ? "border-[#deff9a] text-[#deff9a] bg-white/[0.02]"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <Terminal className="h-3.5 w-3.5" /> Console
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-3 text-xs">
            {activeSidebar === "files" ? (
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Project Explorer
                </div>
                {fileTree.map((node, i) => (
                  <div key={i} className="pl-1">
                    <div className="flex items-center gap-1.5 text-zinc-300 py-1 hover:text-white cursor-pointer rounded px-1 hover:bg-white/[0.05]">
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
                      <div className="pl-3 border-l border-white/10 ml-2 space-y-1 my-1">
                        {node.children.map((child, j) => (
                          <div key={j} className="flex items-center gap-1.5 text-zinc-400 hover:text-white py-0.5 cursor-pointer rounded px-1 hover:bg-white/[0.05]">
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
              <div className="font-mono text-[11px] space-y-1.5 text-emerald-400/90">
                <div className="text-zinc-500">$ next dev</div>
                <div>[Ready] Compiled / in 1.2s</div>
                <div>[AI Engine] Loaded Voice Synthesis API</div>
                <div>[Auth] Supabase Session Listening...</div>
                <div className="text-amber-400">[Watcher] Hot Module Reloading Active</div>
              </div>
            )}
          </div>
        </div>

        {/* PANE 2: Center Live Interactive SaaS Web App Preview */}
        <div className="flex-1 bg-[#090912] flex flex-col overflow-y-auto">
          {/* Simulated Browser Bar */}
          <div className="flex items-center gap-2 border-b border-white/10 bg-[#0d0d16] px-4 py-2 shrink-0">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex-1 max-w-lg mx-auto bg-black/40 border border-white/10 rounded-md px-3 py-1 text-[11px] text-zinc-400 flex items-center justify-between">
              <span>https://{startupName.toLowerCase().replace(/\s+/g, '')}.aiscoutx.app</span>
              <RefreshCw className="h-3 w-3 text-zinc-500 hover:text-white cursor-pointer" />
            </div>
          </div>

          {/* SaaS Generated Web Application Canvas */}
          <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
            
            {/* SaaS App Header */}
            <header className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-r ${primaryColor} flex items-center justify-center font-bold text-white shadow-lg`}>
                  {startupName.charAt(0)}
                </div>
                <span className="font-bold text-lg text-white">{heroTitle}</span>
              </div>
              <div className="flex items-center gap-3">
                <button className="text-xs text-zinc-400 hover:text-white">Pricing</button>
                <button className="text-xs text-zinc-400 hover:text-white">Docs</button>
                <button className={`rounded-lg bg-gradient-to-r ${primaryColor} px-3 py-1.5 text-xs font-semibold text-white shadow-md`}>
                  Sign In
                </button>
              </div>
            </header>

            {/* Interactive SaaS Feature Dashboard */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5 backdrop-blur-xl">
              <div>
                <h2 className="text-lg font-bold text-white">Create Voiceover Studio</h2>
                <p className="text-xs text-zinc-400 mt-1">Paste your text script below to generate hyper-realistic audio instantly.</p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-300">Select AI Voice Actor</label>
                <select 
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/60 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option>Sarah - Natural US Female (Studio)</option>
                  <option>Michael - Deep Authoritative Male</option>
                  <option>Emma - Casual British Accent</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">Script Content</label>
                <textarea
                  rows={4}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/60 p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  placeholder="Paste script here..."
                />
              </div>

              <button
                onClick={handleGenerateVoice}
                disabled={isGenerating}
                className={`w-full rounded-xl bg-gradient-to-r ${primaryColor} py-3 text-xs font-bold text-white shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Rendering Studio Audio...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" /> Generate Studio Voiceover (1 Credit)
                  </>
                )}
              </button>

              {/* Generated Result Output Box */}
              {generatedAudio && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Voiceover Ready (.MP3)
                    </span>
                    <span className="text-[10px] text-zinc-400">Duration: 0:14s</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/60 overflow-hidden">
                    <div className="h-full bg-emerald-400 w-full animate-pulse" />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button className="text-xs px-3 py-1 rounded bg-emerald-500 text-black font-semibold">Download Audio</button>
                  </div>
                </div>
              )}
            </div>

            {/* Generated Legal & Footer bar */}
            <footer className="flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-zinc-500">
              <div>© 2026 {startupName} Inc. All rights reserved.</div>
              <div className="flex gap-3">
                <span className="hover:text-zinc-300 cursor-pointer">Privacy Policy</span>
                <span className="hover:text-zinc-300 cursor-pointer">Terms of Service</span>
                <span className="hover:text-zinc-300 cursor-pointer">Contact Us</span>
              </div>
            </footer>
          </div>
        </div>

        {/* PANE 3: Right AI Co-Founder Chatbot (Hyper-Intelligent & Friendly) */}
        <div className="w-96 border-l border-white/10 bg-[#08080f] flex flex-col shrink-0">
          
          {/* Chatbot Header */}
          <div className="p-3.5 border-b border-white/10 bg-[#0c0c16] flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#deff9a] flex items-center justify-center shadow-[0_0_12px_rgba(222,255,154,0.3)]">
              <Bot className="h-4 w-4 text-black" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                AI Co-Founder <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[10px] text-zinc-400">Context Memory Active • Karan Sir</div>
            </div>
          </div>

          {/* Messages Stream */}
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
                  className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-[#deff9a] text-black font-medium"
                      : "bg-white/[0.05] border border-white/10 text-zinc-200 whitespace-pre-line"
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

          {/* Quick Guidance Prompt Pills */}
          <div className="p-2 border-t border-white/5 bg-[#0a0a12] flex gap-1.5 overflow-x-auto text-[10px]">
            <button 
              onClick={() => setInputMessage("How to connect Stripe payments?")}
              className="px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.02] text-zinc-300 hover:border-[#deff9a]/40 shrink-0"
            >
              💳 Setup Stripe
            </button>
            <button 
              onClick={() => setInputMessage("Change primary theme color to blue")}
              className="px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.02] text-zinc-300 hover:border-[#deff9a]/40 shrink-0"
            >
              🎨 Change Theme
            </button>
            <button 
              onClick={() => setInputMessage("How do I connect my custom domain?")}
              className="px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.02] text-zinc-300 hover:border-[#deff9a]/40 shrink-0"
            >
              🌐 Connect Domain
            </button>
          </div>

          {/* Prompt Input Field */}
          <div className="p-3 border-t border-white/10 bg-[#0a0a14]">
            <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl p-1.5 focus-within:border-[#deff9a]/50">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask AI Co-Founder to change UI, fix code, or guide..."
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