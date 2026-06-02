import { NextResponse } from "next/server";

import {
  createRouteHandlerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Waitlist is not configured yet. Please add Supabase environment variables.",
        },
        { status: 503 }
      );
    }

    const supabase = createRouteHandlerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection failed. Please try again." },
        { status: 503 }
      );
    }

    const { error } = await supabase.from("waitlist").insert({ email });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            error: "This email is already on the waitlist.",
            alreadyRegistered: true,
          },
          { status: 409 }
        );
      }

      console.error("[waitlist] Supabase insert error:", error.message);
      return NextResponse.json(
        { error: "Could not join the waitlist. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Successfully joined the waitlist.",
        email,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
