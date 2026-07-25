import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendSubscriptionSuccessEmail } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    // 🛡️ SECURITY MATCH: Webhook Secret Validation
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error("❌ RAZORPAY_WEBHOOK_SECRET missing in environment config");
      return new NextResponse('Internal Webhook Config Error', { status: 500 });
    }

    if (!signature) {
      return new NextResponse('Missing Signature Header', { status: 400 });
    }

    // Verify authenticity using crypto SHA256
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error("❌ Fraudulent request or signature mismatch!");
      return new NextResponse('Unauthorized Webhook Call', { status: 403 });
    }

    const eventData = JSON.parse(rawBody);
    console.log(`🔔 Verified Razorpay Webhook Event Received: ${eventData.event}`);

    // 🟢 1. PAYMENT SUCCESS / SUBSCRIPTION ACTIVATED EVENT
    if (
      eventData.event === 'order.paid' || 
      eventData.event === 'payment.captured' ||
      eventData.event === 'subscription.charged' ||
      eventData.event === 'subscription.activated'
    ) {
      const paymentPayload = eventData.payload.payment?.entity || eventData.payload.subscription?.entity;
      
      // Extract email from payment or notes
      const userEmail = 
        paymentPayload?.email || 
        paymentPayload?.notes?.email ||
        paymentPayload?.customer_email;

      const orderId = paymentPayload?.order_id || paymentPayload?.id || "ORDER_SUCCESS";
      const amountInPaise = paymentPayload?.amount || 1200;
      const amountFormatted = `₹${(amountInPaise / 100).toFixed(2)}`;

      if (!userEmail) {
        console.error("⚠️ No user email found inside payment object payload.");
        return NextResponse.json({ success: false, error: "Missing Email" });
      }

      // Calculate 30-Day Pro Expiry Timestamp
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);

      // 🗄️ DATABASE UPDATE: Sync across 'profiles' table
      const { data: profile, error: profileFindError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', userEmail)
        .maybeSingle();

      if (profileFindError) {
        console.error(`⚠️ Profile lookup error for email ${userEmail}:`, profileFindError.message);
      }

      if (profile) {
        // Upgrade plan in profiles table
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            plan: 'pro',
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error("❌ Failed to update profile plan in Supabase:", updateError.message);
        } else {
          console.log(`🎉 Account successfully upgraded to Pro in profiles for user: ${userEmail}`);
        }

        // Sync with Auth User Metadata
        try {
          await supabase.auth.admin.updateUserById(profile.id, {
            user_metadata: { plan: 'pro' }
          });
          console.log(`🔑 Auth user metadata set to Pro for ID: ${profile.id}`);
        } catch (authErr) {
          console.error("⚠️ Auth metadata sync error:", authErr);
        }
      } else {
        console.warn(`⚠️ User email ${userEmail} paid but not found in 'profiles' table yet.`);
      }

      // 📧 FIRE EMAIL TRIGGER
      try {
        await sendSubscriptionSuccessEmail(userEmail, {
          amountLabel: `${amountFormatted} / Pro Plan`,
          orderId: orderId
        });
        console.log(`📧 Confirmation email sent to: ${userEmail}`);
      } catch (mailErr) {
        console.error("⚠️ Email send error:", mailErr);
      }
    }

    // 🔴 2. AUTO EXPIRY / SUBSCRIPTION CANCELLED EVENT (30 Days Complete / Failed Renewal)
    if (
      eventData.event === 'subscription.cancelled' ||
      eventData.event === 'subscription.halted' ||
      eventData.event === 'subscription.completed'
    ) {
      const subPayload = eventData.payload.subscription?.entity;
      const userEmail = subPayload?.email || subPayload?.notes?.email;

      if (userEmail) {
        console.log(`⏳ Subscription expired/cancelled for ${userEmail}. Reverting to Free Plan.`);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', userEmail)
          .maybeSingle();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ plan: 'free', updated_at: new Date().toISOString() })
            .eq('id', profile.id);

          await supabase.auth.admin.updateUserById(profile.id, {
            user_metadata: { plan: 'free' }
          });
          console.log(`🔒 Account successfully reverted to Free for: ${userEmail}`);
        }
      }
    }

    return NextResponse.json({ success: true, status: 'processed' });
  } catch (error: any) {
    console.error("🔥 Razorpay Webhook Failure:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}