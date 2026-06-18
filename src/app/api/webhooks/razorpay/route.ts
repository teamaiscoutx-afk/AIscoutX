import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js"; // Direct library se import, local file ka jhanjhat khatam!
// trigger fresh production build for supabase
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || "";

    if (!webhookSecret) {
      console.error("❌ Webhook Error: Missing RAZORPAY_WEBHOOK_SECRET");
      return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
    }

    // 1. Verify Razorpay Signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("❌ Invalid Razorpay Webhook Signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    console.log(`🚀 Razorpay Webhook Event Received: ${event}`);

    // 2. Handle Successful Payment Event
    if (event === "payment.captured") {
      const payment = payload.payload.payment.entity;
      const orderId = payment.order_id;
      const userEmail = payment.notes?.email || payment.email;

      console.log(`💳 Processing successful payment for Order: ${orderId}, User: ${userEmail}`);

      // 3. Initialize Supabase Admin Bypass Client inline safely
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      
      const { error: dbError } = await supabase
        .from("profiles")
        .update({
          plan_tier: "pro",
          updated_at: new Date().toISOString(),
        })
        .eq("email", userEmail);

      if (dbError) {
        console.error("❌ Database update failed during webhook:", dbError);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }

      console.log(`🎉 User ${userEmail} has been successfully upgraded to PRO!`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("💥 Webhook crashed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}