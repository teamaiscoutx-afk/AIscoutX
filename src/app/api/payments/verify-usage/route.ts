import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const FREE_TIER_DAILY_LIMIT = 10; // Max permitted chat/vision queries per day for free users

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing identity token." }, { status: 400 });
    }

    // Pull current profile consumption ledger
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('free_tier_requests_count, last_request_date, account_tier')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ success: false, error: "User profile not recognized." }, { status: 404 });
    }

    // Direct pass-through if premium account tier is active
    if (profile.account_tier === 'pro') {
      return NextResponse.json({ allowed: true, currentTier: 'pro' });
    }

    const todayString = new Date().toISOString().split('T')[0];
    let currentCount = profile.free_tier_requests_count || 0;

    // Reset daily counters smoothly if day has rolled over
    if (profile.last_request_date !== todayString) {
      currentCount = 0;
      await supabase
        .from('profiles')
        .update({ free_tier_requests_count: 0, last_request_date: todayString })
        .eq('id', userId);
    }

    // Trigger lockdown blockage if daily fair usage policy limit breached
    if (currentCount >= FREE_TIER_DAILY_LIMIT) {
      return NextResponse.json({ 
        allowed: false, 
        reason: "DAILY_LIMIT_EXCEEDED", 
        message: "Bhai, aaj ki free limits khatam! Upgrade to Pro for unlimited global access." 
      });
    }

    // Increment request usage tally securely inside database
    await supabase
      .from('profiles')
      .update({ free_tier_requests_count: currentCount + 1 })
      .eq('id', userId);

    return NextResponse.json({ 
      allowed: true, 
      remainingRequests: FREE_TIER_DAILY_LIMIT - (currentCount + 1) 
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}