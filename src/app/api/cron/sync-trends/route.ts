import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PAIN_KEYWORDS = ['expensive', 'sucks', 'difficult', 'lacks', 'error', 'how to', 'alternative', 'annoying', 'hate', 'problem', 'broken', 'issue', 'waste', 'frustrated'];
// 🌐 SOURCE TUNING: Subreddits list intact
const TARGET_SUBREDDITS = ['saas', 'entrepreneur', 'sideproject'];

// Isolated function to generate 1536 dimensions vector embedding array using OpenAI
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI Embedding Generation failed with status code: ${response.status}`);
  }

  const result = await response.json();
  return result?.data?.[0]?.embedding || [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  
  // 🛡️ CRITICAL SECURITY CHECK
  if (
    searchParams.get('secret') !== process.env.CRON_SECRET && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized Access', { status: 401 });
  }

  try {
    const openAiKey = process.env.OPENAI_API_KEY;
    if (!openAiKey) {
      return NextResponse.json({ success: false, error: "Missing OPENAI_API_KEY in cloud variables" }, { status: 500 });
    }

    let globalInsertedCount = 0;
    console.log("🔥 AIscoutX Autopilot Multi-Source Pipeline Active!");

    // ==========================================
    // BRANCH 1: HIGH-SPEED REDDIT JSON FETCHER
    // ==========================================
    for (const subreddit of TARGET_SUBREDDITS) {
      const targetUrl = `https://reddit.com/r/${subreddit}/new.json?limit=15`;
      
      try {
        const res = await fetch(targetUrl, {
          headers: { 'User-Agent': 'AIscoutX-Agent/1.0' },
          cache: 'no-store'
        });
        
        if (!res.ok) continue;
        
        const json = await res.json();
        const posts = json.data?.children || [];

        for (const post of posts) {
          if (!post.data) continue;

          const title = post.data.title || '';
          const text = post.data.selftext || '';
          const link = `https://reddit.com${post.data.permalink}` || post.data.url;
          const combinedText = `${title} ${text}`.toLowerCase();

          const hasPainPoint = PAIN_KEYWORDS.some(keyword => combinedText.includes(keyword));
          if (!hasPainPoint) continue;

          const { data: existingData } = await supabase
            .from('market_pain_points')
            .select('id')
            .eq('url', link)
            .maybeSingle();

          if (existingData) continue;

          const originalTextCombo = `${title} ${text.substring(0, 800)}`;

          try {
            const embeddingVectorArray = await generateEmbedding(originalTextCombo, openAiKey);

            await supabase.from('market_pain_points').upsert(
              {
                source: `reddit_r_${subreddit}`,
                original_text: originalTextCombo,
                clean_problem: title,
                url: link,
                category: subreddit,
                embedding: embeddingVectorArray
              },
              { onConflict: 'url' }
            );

            globalInsertedCount++;
          } catch (embedError) {
            continue; 
          }
        }
      } catch (subError) {
        continue;
      }
    }

    // ==========================================
    // BRANCH 2: LIVE GLOBAL GOOGLE TRENDS STREAM
    // ==========================================
    try {
      const googleTrendsUrl = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=US`;
      const googleRes = await fetch(googleTrendsUrl, { cache: 'no-store' });
      
      if (googleRes.ok) {
        const textData = await googleRes.text();
        const items = textData.match(/<item>[\s\S]*?<\/item>/g) || [];
        
        for (const item of items) {
          const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
          const trafficMatch = item.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/);
          
          if (!titleMatch) continue;
          
          const rawTitle = titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
          const dynamicTraffic = trafficMatch ? trafficMatch[1].trim() : 'High Volume';
          
          const title = `Global Market Spike: ${rawTitle}`;
          const contentText = `Massive consumer search movement caught on Google. Traffic velocity index: ${dynamicTraffic}. Evaluating software optimization setups and monetization gaps.`;
          
          // 🔥 FIXED: Removed dynamic timestamp to prevent continuous duplicate billing entries
          const customGoogleLink = `https://google.com/search?q=${encodeURIComponent(rawTitle)}+issue+problem`;
          
          const { data: existingGoogle } = await supabase
            .from('market_pain_points')
            .select('id')
            .eq('url', customGoogleLink)
            .maybeSingle();

          if (existingGoogle) continue;

          const finalGoogleString = `${title} ${contentText}`;
          
          try {
            const googleEmbedding = await generateEmbedding(finalGoogleString, openAiKey);

            await supabase.from('market_pain_points').upsert(
              {
                source: 'google_trends_global',
                original_text: finalGoogleString,
                clean_problem: title,
                url: customGoogleLink,
                category: 'global_trends',
                embedding: googleEmbedding
              },
              { onConflict: 'url' }
            );
            globalInsertedCount++;
          } catch (e) {
            continue;
          }
        }
      }
    } catch (googleErr) {
      console.error("⚠️ Google Stream gracefully bypassed:", googleErr);
    }

    return NextResponse.json({ success: true, vector_rag_upserts_completed: globalInsertedCount });
  } catch (error: any) {
    console.error("🔥 Global System Pipeline Crash:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}