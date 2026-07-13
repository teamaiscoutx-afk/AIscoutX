import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PAIN_KEYWORDS = ['expensive', 'sucks', 'difficult', 'lacks', 'error', 'how to', 'alternative', 'annoying', 'hate'];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  
  if (
    searchParams.get('secret') !== process.env.CRON_SECRET && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized Access', { status: 401 });
  }

  try {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, niche_focus')
      .not('niche_focus', 'is', null);

    if (profileError) throw profileError;

    // FIX: Clean, standard URL without brackets for native Vercel fetch compatibility
    const redditFeedUrl = 'https://www.reddit.com/r/saas/new.json?limit=10';
    const response = await fetch(redditFeedUrl, { headers: { 'User-Agent': 'AIscoutX-Crawler/2.0' } });
    const data = await response.json();
    const posts = data?.data?.children || [];

    let activeMarketPainPoints: Array<{ title: string; content: string; link: string; category: string; vector: number[] }> = [];

    const apiKey = process.env.OPENAI_API_KEY || process.env.TAVILY_API_KEY || ''; 

    for (const post of posts) {
      const title = post.data.title || '';
      const selftext = post.data.selftext || '';
      const fullText = `${title} ${selftext}`.toLowerCase();

      const hasPainPoint = PAIN_KEYWORDS.some(keyword => fullText.includes(keyword));

      if (hasPainPoint) {
        const rawContent = `Title: ${title}\nContent: ${selftext}`;

        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Analyze if this text indicates a real software problem or user frustration. If yes, extract the core problem under 2 sentences and map it to a clear category (e.g., Healthcare, AI, SaaS, Finance). Respond ONLY in this exact JSON format, do not add any markdown blocks or extra characters: {"isRealPain": boolean, "cleanProblem": "string", "category": "string"}. Text to analyze: "${rawContent.replace(/"/g, '\\"')}"` }] }]
          })
        });

        const aiResult = await aiResponse.json();
        let aiText = aiResult?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
        
        if (aiText.includes('```')) {
          aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        let parsedAnalysis;
        try {
          parsedAnalysis = JSON.parse(aiText);
        } catch (jsonErr) {
          continue;
        }

        if (parsedAnalysis?.isRealPain) {
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
            activeMarketPainPoints.push({
              title: "🔥 Real-Time Market Pain Point Captured",
              content: parsedAnalysis.cleanProblem,
              link: post.data.url || `https://reddit.com${post.data.permalink}`,
              category: parsedAnalysis.category || 'General',
              vector: vectorArray
            });

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

    let insertedCount = 0;
    
    if (activeMarketPainPoints.length > 0 && profiles.length > 0) {
      for (const profile of profiles) {
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