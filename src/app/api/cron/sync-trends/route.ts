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

    const redditFeedUrl = 'https://www.reddit.com/r/saas/new.json?limit=10';
    const response = await fetch(redditFeedUrl, { headers: { 'User-Agent': 'AIscoutX-Crawler/2.0' } });
    const data = await response.json();
    const posts = data?.data?.children || [];

    let activeMarketPainPoints: Array<{ title: string; content: string; link: string; category: string }> = [];
    const openAiKey = process.env.OPENAI_API_KEY;

    if (!openAiKey) {
      return NextResponse.json({ success: false, error: "Missing OPENAI_API_KEY in cloud environment variables" }, { status: 500 });
    }

    for (const post of posts) {
      const title = post.data.title || '';
      const selftext = post.data.selftext || '';
      const fullText = `${title} ${selftext}`.toLowerCase();

      const hasPainPoint = PAIN_KEYWORDS.some(keyword => fullText.includes(keyword));

      if (hasPainPoint) {
        const rawContent = `Title: ${title}\nContent: ${selftext}`;

        // Switching to valid OpenAI endpoint that honors your sk-proj key safely
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            response_format: { type: "json_object" },
            messages: [
              {
                role: 'system',
                content: 'You are a market analysis bot. Extract structural SaaS software vulnerabilities. Respond only with a flat JSON object: {"isRealPain": boolean, "cleanProblem": "Under 2 sentences detail", "category": "AI/SaaS/Finance/etc"}'
              },
              {
                role: 'user',
                content: rawContent
              }
            ]
          })
        });

        if (!aiResponse.ok) continue; // Skip if single fetch limits out

        const aiResult = await aiResponse.json();
        const aiText = aiResult?.choices?.[0]?.message?.content?.trim() || '{}';
        
        let parsedAnalysis;
        try {
          parsedAnalysis = JSON.parse(aiText);
        } catch {
          continue;
        }

        if (parsedAnalysis?.isRealPain && parsedAnalysis.cleanProblem) {
          activeMarketPainPoints.push({
            title: "🔥 Real-Time Market Pain Point Captured",
            content: parsedAnalysis.cleanProblem,
            link: post.data.url || `https://reddit.com${post.data.permalink}`,
            category: parsedAnalysis.category || 'General'
          });

          // Insert directly to Supabase with clean structure
          await supabase.from('market_pain_points').insert({
            source: 'reddit',
            original_text: rawContent,
            clean_problem: parsedAnalysis.cleanProblem,
            category: parsedAnalysis.category || 'General'
          });
        }
      }
    }

    let insertedCount = 0;
    if (activeMarketPainPoints.length > 0 && profiles.length > 0) {
      for (const profile of profiles) {
        const selectedProblem = activeMarketPainPoints.find(p => p.category.toLowerCase() === profile.niche_focus?.toLowerCase()) || activeMarketPainPoints[0];
        
        await supabase.from('platform_notifications').insert({
          user_id: profile.id,
          niche_focus: profile.niche_focus || 'General',
          title: selectedProblem.title,
          content: `${selectedProblem.content} (Captured live from global internet streams)`,
          source_link: selectedProblem.link
        });
        insertedCount++;
      }
    }

    return NextResponse.json({ success: true, updates_synchronized: insertedCount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}