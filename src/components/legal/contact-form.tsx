"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMPANY } from "@/lib/company";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`AIscoutX Contact — ${name || "Inquiry"}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`
    );
    window.location.href = `mailto:${COMPANY.email}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl sm:p-8"
    >
      <div className="space-y-2">
        <Label htmlFor="contact-name" className="text-zinc-400">
          Your name
        </Label>
        <Input
          id="contact-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border-white/[0.08] bg-black/20 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email" className="text-zinc-400">
          Email
        </Label>
        <Input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border-white/[0.08] bg-black/20 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message" className="text-zinc-400">
          Message
        </Label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          className="flex w-full rounded-md border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#deff9a]/20"
          placeholder="How can we help you build faster?"
        />
      </div>
      <Button
        type="submit"
        className="btn-glow-lime w-full bg-[#deff9a] font-semibold text-black hover:bg-[#d8f992] sm:w-auto"
      >
        <Send className="mr-2 h-4 w-4" />
        Send Message
      </Button>
      {sent && (
        <p className="text-xs text-[#deff9a]">
          Opening your email client to reach {COMPANY.email}…
        </p>
      )}
      <a
        href={`mailto:${COMPANY.email}`}
        className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-[#deff9a]"
      >
        <Mail className="h-4 w-4" />
        {COMPANY.email}
      </a>
    </form>
  );
}
