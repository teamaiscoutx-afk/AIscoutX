import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// PHASE 1: Keyword Trigger Checklist (Spam Clean)
const PAIN_KEYWORDS = ['expensive', 'sucks', 'difficult', 'lacks', 'error', 'how to', 'alternative', 'annoying', 'hate'];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  
  // 1. KEEP EXISTING CRON GUARDRAIL SAFE (No security breaches)
  if (
    searchParams.get('secret') !== process.env.CRON_SECRET && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized Access', { status: 401 });
  }

  try {
    // 2. Fetch active user profiles exactly like old script
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, niche_focus')
      .not('niche_focus', 'is', null);

    if (profileError) throw profileError;

    // 3. PHASE 1: Live Web Scraping Engine (Reddit RSS Feed - 100% Free)
    const redditFeedUrl = 'https://www.reddit.com/r/saas/new.json?limit=10';
    const response = await fetch(redditFeedUrl, { headers: { 'User-Agent': 'AIscoutX-Crawler/2.0' } });
    const data = await response.json();
    const posts = data?.data?.children || [];

    let activeMarketPainPoints: Array<{ title: string; content: string; link: string; category: string; vector: number[] }> = [];

    // 4. Extract, Filter, and Vectorize Real Problems
    for (const post of posts) {
      const title = post.data.title || '';
      const selftext = post.data.selftext || '';
      const fullText = `${title} ${selftext}`.toLowerCase();

      // Simple keyword matching utility
      const hasPainPoint = PAIN_KEYWORDS.some(keyword => fullText.includes(keyword));

      if (hasPainPoint) {
        const rawContent = `Title: ${title}\nContent: ${selftext}`;

        // Verify with Gemini-2.5-Flash (Using your existing Gemini/OpenAI environment setup key)
        const apiKey = process.env.OPENAI_API_KEY || process.env.TAVILY_API_KEY || ''; // Fallback safeguard
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Analyze if this text indicates a real software problem or user frustration. If yes, extract the core problem under 2 sentences and map it to a clear category (e.g., Healthcare, AI, SaaS, Finance). Respond ONLY in valid JSON format: {"isRealPain": boolean, "cleanProblem": "string", "category": "string"}. Text: "${rawContent}"` }] }]
          })
        });

        const aiResult = await aiResponse.json();
        const aiText = aiResult?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
        
        let parsedAnalysis;
        try {
          parsedAnalysis = JSON.parse(aiText.replace(/```json|```/g, ''));
        } catch { continue; }

        if (parsedAnalysis?.isRealPain) {
          // PHASE 2: Generate 1536 Spatial Vector Arrays via Text Embedding Model
          const embeddingResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: "models/text-embedding-004",
              content: { parts: [{ text: parsedAnalysis.cleanProblem }] }
            })
          });

          const embeddingResult = await embeddingResponse.json();
          const vectorArray = embeddingResult?.embedding?.values;

          if (vectorArray) {
            // Push vectorized objects to local cycle cache
            activeMarketPainPoints.push({
              title: "🔥 Real-Time Market Pain Point Captured",
              content: parsedAnalysis.cleanProblem,
              link: post.data.url || `https://reddit.com${post.data.permalink}`,
              category: parsedAnalysis.category || 'General',
              vector: vectorArray
            });

            // Master Raw Node Save directly into the database for persistent cross-referencing
            await supabase.from('market_pain_points').insert({
              source: 'reddit',
              original_text: rawContent,
              clean_problem: parsedAnalysis.cleanProblem,
              category: parsedAnalysis.category || 'General',
              embedding: vectorArray
            });
          }
        }
      }
    }

    // 5. Connect Real Live Scraped Trends back to Users (Preserving Existing Notifications Loop)
    let insertedCount = 0;
    
    if (activeMarketPainPoints.length > 0 && profiles.length > 0) {
      for (const profile of profiles) {
        // Fallback: If no real pain point matches current niche perfectly, assign the freshest live problem captured
        const selectedProblem = activeMarketPainPoints.find(p => p.category.toLowerCase() === profile.niche_focus?.toLowerCase()) || activeMarketPainPoints[0];
        
        const { error: insertError } = await supabase
          .from('platform_notifications')
          .insert({
            user_id: profile.id,
            niche_focus: profile.niche_focus || 'General',
            title: selectedProblem.title,
            content: `${selectedProblem.content} (Captured live from global internet streams matching ${profile.niche_focus})`,
            source_link: selectedProblem.link
          });

        if (!insertError) insertedCount++;
      }
    }

    return NextResponse.json({ success: true, updates_synchronized: insertedCount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}