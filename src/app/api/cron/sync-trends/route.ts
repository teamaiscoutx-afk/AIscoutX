import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { XMLParser } from 'fast-xml-parser';

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
    const openAiKey = process.env.OPENAI_API_KEY;
    if (!openAiKey) {
      return NextResponse.json({ success: false, error: "Missing OPENAI_API_KEY in cloud environment variables" }, { status: 500 });
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, niche_focus')
      .not('niche_focus', 'is', null);

    if (profileError) throw profileError;

    // SWITCHING TO RSS STREAM DATA PIPELINE: Extremely resilient against Vercel IP blocks
    const redditRssUrl = 'https://www.reddit.com/r/saas/new/.rss';
    const response = await fetch(redditRssUrl, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
      } 
    });

    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: `Reddit RSS Gateway failed with server response code status: ${response.status}`
      }, { status: 502 });
    }

    const xmlData = await response.text();
    const parser = new XMLParser();
    const jsonObj = parser.parse(xmlData);
    
    // Extract feed items safely
    const entries = jsonObj?.feed?.entry || [];
    const posts = Array.isArray(entries) ? entries : [entries];

    let activeMarketPainPoints: Array<{ title: string; content: string; link: string; category: string }> = [];

    for (const post of posts) {
      if (!post) continue;
      
      const title = post.title || '';
      // RSS content is inside parsed text content structure
      const content = typeof post.content === 'object' ? post.content['#text'] || '' : post.content || '';
      const fullText = `${title} ${content}`.toLowerCase();

      const hasPainPoint = PAIN_KEYWORDS.some(keyword => fullText.includes(keyword));

      if (hasPainPoint) {
        const rawContent = `Title: ${title}\nContentPreview: ${content.substring(0, 400)}`;
        const link = post.link?.['@_href'] || post.id || 'https://reddit.com/r/saas';

        try {
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

          if (!aiResponse.ok) continue;

          const aiResult = await aiResponse.json();
          const aiText = aiResult?.choices?.[0]?.message?.content?.trim() || '{}';
          const parsedAnalysis = JSON.parse(aiText);

          if (parsedAnalysis?.isRealPain && parsedAnalysis.cleanProblem) {
            activeMarketPainPoints.push({
              title: "🔥 Real-Time Market Pain Point Captured",
              content: parsedAnalysis.cleanProblem,
              link: link,
              category: parsedAnalysis.category || 'General'
            });

            await supabase.from('market_pain_points').insert({
              source: 'reddit_rss',
              original_text: title + " " + content.substring(0, 1000),
              clean_problem: parsedAnalysis.cleanProblem,
              category: parsedAnalysis.category || 'General'
            });
          }
        } catch {
          continue; 
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