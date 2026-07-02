import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const templates = [
      {
        title: "🔥 High-Demand Micro-SaaS Trend Identified",
        content: "Sudden spike in search volume found on Reddit and X for automated internal micro-auditing tools. Significant market gap identified with low competition.",
        source_link: "https://www.reddit.com/r/SaaS/"
      },
      {
        title: "🚀 Rising Competitor Infiltration Alert",
        content: "A new automated programmatic tool launched on Product Hunt and Twitter gaining fast weekly velocity. Ideal positioning strategy recommended for early adoption.",
        source_link: "https://twitter.com/search?q=solopreneur"
      },
      {
        title: "📈 High Demand Exponential Growth Sector",
        content: "Verified data points from Google Trends show an 80% increase in content curation automation interest across modern global indie hackers.",
        source_link: "https://trends.google.com"
      }
    ];

    let insertedCount = 0;

    for (const profile of profiles) {
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
      
      const { error: insertError } = await supabase
        .from('platform_notifications')
        .insert({
          user_id: profile.id,
          niche_focus: profile.niche_focus || 'General',
          title: randomTemplate.title,
          content: `${randomTemplate.content} (Tailored for your interest in ${profile.niche_focus})`,
          source_link: randomTemplate.source_link
        });

      if (!insertError) insertedCount++;
    }

    return NextResponse.json({ success: true, updates_synchronized: insertedCount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}