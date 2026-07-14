import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PAIN_KEYWORDS = ['expensive', 'sucks', 'difficult', 'lacks', 'error', 'how to', 'alternative', 'annoying', 'hate', 'problem', 'broken', 'issue', 'waste', 'frustrated'];
// SAFE FIX: Keep subreddits clean for JSON template integration
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
  
  // 🛡️ CRITICAL SECURITY CHECK (Kept completely intact)
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
    console.log("🔥 AIscoutX Global Data Pipeline Triggered via JSON Fetcher!");

    // Pure JSON Input pipeline execution replacing legacy XML parser completely
    for (const subreddit of TARGET_SUBREDDITS) {
      // Direct dynamic slash template structure mapping to prevent URL malformation
      const targetUrl = `https://reddit.com/r/${subreddit}/new.json?limit=15`;
      
      try {
        const res = await fetch(targetUrl, {
          headers: { 'User-Agent': 'AIscoutX-Agent/1.0' },
          cache: 'no-store'
        });
        
        if (!res.ok) {
          console.warn(`⚠️ Reddit JSON endpoint failed for /r/${subreddit}`);
          continue;
        }
        
        const json = await res.json();
        const posts = json.data?.children || [];

        for (const post of posts) {
          if (!post.data) continue;

          const title = post.data.title || '';
          const text = post.data.selftext || '';
          const link = `https://reddit.com${post.data.permalink}` || post.data.url;
          const combinedText = `${title} ${text}`.toLowerCase();

          // 1. Pain Point Match Check using strict file constants
          const hasPainPoint = PAIN_KEYWORDS.some(keyword => combinedText.includes(keyword));
          if (!hasPainPoint) continue;

          // 2. Gracefully eliminate duplicate url inputs before wasting openai tokens
          const { data: existingData } = await supabase
            .from('market_pain_points')
            .select('id')
            .eq('url', link)
            .maybeSingle();

          if (existingData) continue;

          const originalTextCombo = `${title} ${text.substring(0, 800)}`;

          try {
            // 3. Compute Semantic High-Dimensional Multi-Vector array
            const embeddingVectorArray = await generateEmbedding(originalTextCombo, openAiKey);

            // 4. Standard upsert directly into pgvector row matching your structural layout
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
            console.error("⚠️ Token generation or single row storage skip:", embedError);
            continue; 
          }
        }
      } catch (subError) {
        console.error(`❌ Network error context skipped for /r/${subreddit}:`, subError);
        continue;
      }
    }

    return NextResponse.json({ success: true, vector_rag_upserts_completed: globalInsertedCount });
  } catch (error: any) {
    console.error("🔥 Global System Pipeline Crash:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}