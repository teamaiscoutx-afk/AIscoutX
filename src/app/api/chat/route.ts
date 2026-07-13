import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { userId, userMessage } = await processPayload(request);
    if (!userId || !userMessage) {
      return NextResponse.json({ success: false, error: "Missing required query parameters" }, { status: 400 });
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    if (!openAiKey) {
      return NextResponse.json({ success: false, error: "Missing API authorization key infrastructure" }, { status: 500 });
    }

    // 1. Pull user state matrix parameters securely
    let { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('is_locked, locked_idea, tech_stack, current_step')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ success: false, error: "User state initialization failed" }, { status: 404 });
    }

    // 2. Manage or Initialize Context Cache to keep token billing ultra low
    let { data: chatHistory } = await supabase
      .from('context_cached_chats')
      .select('messages, summary_override')
      .eq('user_id', userId)
      .maybeSingle();

    let historicalMessages = chatHistory?.messages ? (Array.isArray(chatHistory.messages) ? chatHistory.messages : []) : [];
    let summaryOverride = chatHistory?.summary_override || "";

    // Append raw entry to operational stream array
    historicalMessages.push({ role: 'user', content: userMessage });

    // 3. Dynamic Optimization: Automatic Context Cache Override if chain > 12 messages
    if (historicalMessages.length > 12) {
      summaryOverride = await generateContextSummary(historicalMessages, summaryOverride, openAiKey);
      historicalMessages = historicalMessages.slice(-4); // Retain only tactical tailing context entries safely
    }

    // 4. Heavy Master System Prompt - Enforcing Sequential Progression Rules
    const systemPrompt = `
      You are the elite empathetic Lead Tech Co-Founder for AIscoutX. Your objective is to permanently anchor and guide the user through their product incubation timeline.
      
      CURRENT WORKSPACE LOGISTICAL STATE:
      - Locked Idea Status: ${profile.locked_idea || 'Not selected yet'}
      - Assigned Framework Engine: ${profile.tech_stack}
      - Strict Incremental Phase Marker: Step ${profile.current_step} of 5
      
      STEP MAP PROTOCOLS:
      Step 1: Core Problem Validation Validation (Ensure target audience feels this pain).
      Step 2: Database Schema Architecture (Design fields simply like a standard spreadsheet).
      Step 3: Minimum Viable Logic Flows (Wire up basic actions/buttons).
      Step 4: Stripe/Razorpay Ledger Systems Integration.
      Step 5: Product-Led Traffic Blastoff Campaign.
      
      OPERATIONAL LAWS:
      - Reply like a world-class No-Code mentor using conversational, highly accessible Hinglish (mix of clean Hindi and English). Keep answers structural but simple.
      - ENFORCE SEQUENCE RULES: If the user tries to jump or ask about structural things in future steps (e.g., asking about step 4 billing while currently checked on Step ${profile.current_step}), gently refuse, block progression, and pull their focus back to completing the active step.
      - When they successfully validate/complete the current step, explicitly state: "[STEP_COMPLETED_CONFIRMATION]" so the system can upgrade their access profile.
    `;

    // 5. Build dynamic payload parameters
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...(summaryOverride ? [{ role: 'system', content: `Historical conversation condensed overview matrix: ${summaryOverride}` }] : []),
      ...historicalMessages
    ];

    // 6. Execute core LLM process cycle
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openAiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: apiMessages, temperature: 0.7 })
    });

    const aiResult = await aiResponse.json();
    const assistantReply = aiResult?.choices?.[0]?.message?.content || "Server context bottlenecked. Try again.";

    historicalMessages.push({ role: 'assistant', content: assistantReply });

    // 7. Check if active sequence step threshold has been successfully verified
    let nextCalculatedStep = profile.current_step;
    if (assistantReply.includes("[STEP_COMPLETED_CONFIRMATION]") && nextCalculatedStep < 5) {
      nextCalculatedStep += 1;
      await supabase.from('profiles').update({ current_step: nextCalculatedStep }).eq('id', userId);
    }

    // 8. Sync state context updates back into database ledger cache storage
    await supabase.from('context_cached_chats').upsert({
      user_id: userId,
      messages: historicalMessages,
      summary_override: summaryOverride
    }, { onConflict: 'user_id' });

    return NextResponse.json({
      success: true,
      reply: assistantReply.replace("[STEP_COMPLETED_CONFIRMATION]", ""),
      metaState: { currentStep: nextCalculatedStep, techStack: profile.tech_stack }
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function processPayload(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

// Highly efficient caching utility function to squeeze token overhead costs to bare minimums
async function generateContextSummary(msgs: any[], oldSummary: string, key: string): Promise<string> {
  try {
    const rawDataString = msgs.map(m => `${m.role}: ${m.content}`).join('\n');
    const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: `Summarize the crucial startup progression data points below. Merge with previous state map: ${oldSummary}` }, { role: 'user', content: rawDataString }]
      })
    });
    const resJson = await summaryResponse.json();
    return resJson?.choices?.[0]?.message?.content || oldSummary;
  } catch {
    return oldSummary;
  }
}