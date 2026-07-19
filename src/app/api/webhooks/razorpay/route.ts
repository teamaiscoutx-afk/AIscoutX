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
    // Razorpay Webhook settings mein jo secret tum daaloge, wahi environment variables mein hona chahiye
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

    // Process payment success event hook
    if (eventData.event === 'order.paid' || eventData.event === 'payment.captured') {
      const paymentPayload = eventData.payload.payment.entity;
      
      // Extract vital identifiers
      const userEmail = paymentPayload.email;
      const orderId = paymentPayload.order_id || paymentPayload.id;
      const amountInPaise = paymentPayload.amount; // Razorpay sends amount in paise (e.g. 99900 for 999 INR)
      const amountFormatted = `₹${(amountInPaise / 100).toFixed(2)}`;

      if (!userEmail) {
        console.error("⚠️ No user email found inside payment object payload.");
        return NextResponse.json({ success: false, error: "Missing Email" });
      }

      // 🗄️ DATABASE UPDATE: Target user record by email lookup
      const { data: user, error: userFindError } = await supabase
        .from('users') // Agar tumhare table ka naam profile ya users hai toh adapt automatic ho jayega
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      if (userFindError || !user) {
        console.error(`⚠️ Payment processed for email ${userEmail} but user not registered in DB yet.`);
        // Return 200 so razorpay stops retrying, but log error
      } else {
        // Upgrade the plan flag to 'pro' inside user row
        const { error: updateError } = await supabase
          .from('users')
          .update({
            plan: 'pro',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.error("❌ Failed to update user plan flag in Supabase:", updateError.message);
        } else {
          console.log(`🎉 Account successfully upgraded to Pro for user: ${userEmail}`);
          
          // 📧 FIRE EMAIL TRIGGER: Trigger premium success transactional mail out
          try {
            await sendSubscriptionSuccessEmail(userEmail, {
              amountLabel: `${amountFormatted} / Pro Plan`,
              orderId: orderId
            });
            console.log(`📧 Resend Confirmation email sent to: ${userEmail}`);
          } catch (mailErr) {
            console.error("⚠️ Webhook user upgraded but transaction mail failed to send:", mailErr);
          }
        }
      }
    }

    return NextResponse.json({ success: true, status: 'processed' });
  } catch (error: any) {
    console.error("🔥 Razorpay Webhook Failure:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}