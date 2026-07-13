import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { XMLParser } from 'fast-xml-parser';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PAIN_KEYWORDS = ['expensive', 'sucks', 'difficult', 'lacks', 'error', 'how to', 'alternative', 'annoying', 'hate', 'problem', 'broken', 'issue', 'waste', 'frustrated'];
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
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

    for (const subreddit of TARGET_SUBREDDITS) {
      const targetUrl = `https://www.reddit.com/r/${subreddit}/new/.rss`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
      
      let xmlData = "";
      try {
        const response = await fetch(proxyUrl, { cache: 'no-store' });
        if (!response.ok) continue;
        const wrapper = await response.json();
        xmlData = wrapper.contents;
      } catch (e) {
        continue;
      }

      const jsonObj = parser.parse(xmlData);
      const entries = jsonObj?.feed?.entry || [];
      const posts = Array.isArray(entries) ? entries : [entries];

      for (const post of posts) {
        if (!post) continue;
        
        const title = post.title || '';
        const content = typeof post.content === 'object' ? post.content['#text'] || '' : post.content || '';
        const link = post.link?.['@_href'] || post.id || `https://reddit.com/r/${subreddit}`;
        const fullText = `${title} ${content}`.toLowerCase();

        const hasPainPoint = PAIN_KEYWORDS.some(keyword => fullText.includes(keyword));
        if (!hasPainPoint) continue;

        // Gracefully eliminate duplicate url inputs before wasting tokens
        const { data: existingData } = await supabase
          .from('market_pain_points')
          .select('id')
          .eq('url', link)
          .maybeSingle();

        if (existingData) continue;

        const originalTextCombo = `${title} ${content.substring(0, 800)}`;

        try {
          // Compute Semantic High-Dimensional Multi-Vector array
          const embeddingVectorArray = await generateEmbedding(originalTextCombo, openAiKey);

          // Standard upsert directly into pgvector layer handling sudden race conditions smoothly
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
          continue; // Skip single stream errors safely
        }
      }
    }

    return NextResponse.json({ success: true, vector_rag_upserts_completed: globalInsertedCount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}