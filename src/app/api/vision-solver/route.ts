import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: Request) {
  try {
    const { base64Image, currentStep, techStack, userMessage } = await request.json();

    if (!base64Image) {
      return NextResponse.json({ success: false, error: "No diagnostic screenshot uploaded." }, { status: 400 });
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    if (!openAiKey) {
      return NextResponse.json({ success: false, error: "Vision model engine unauthorized." }, { status: 500 });
    }

    // Extract raw string payload data securely
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // On-the-fly surgical image compression using 'sharp' to minimize token bills
    let optimizedBase64 = base64Data;
    try {
      const compressedBuffer = await sharp(imageBuffer)
        .resize(800) 
        .jpeg({ quality: 75 }) 
        .toBuffer();
      optimizedBase64 = compressedBuffer.toString('base64');
    } catch (compressionError) {
      console.log("Sharp native compression fallback triggered safely.");
    }

    // Capture context message from user or default to standard check
    const contextualQuery = userMessage || "Analyze this error layout framework layout constraint setup.";

    // Formulate dynamic global localized system prompts
    const visionPayload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are the expert Technical Co-Founder for AIscoutX, serving global innovators across the world. 
          Analyze the user's interface screenshot (Current Tech Stack: ${techStack || 'Bubble'}, Active Sequence Marker: Step ${currentStep || 1}).
          
          DYNAMIC LANGUAGE & TONAL LAWS:
          1. Observe and strictly identify the user's language, vocabulary, and linguistic preference from their query text ("${contextualQuery}").
          2. Respond dynamically in that EXACT same language (e.g., if the user asks in Spanish, reply in friendly Spanish; if in pure English, reply in pure English; if in French, reply in French; if in Hinglish/Hindi, reply in Hinglish/Hindi).
          3. Maintain an ultra-supportive, cooperative, peer-to-peer co-founder energy.
          
          OUTPUT LAYOUT RULE:
          - Provide a direct, crystal-clear 2-bullet-point technical fix based on visual error diagnostics. Keep it sharp, concise, and immediately actionable for their dashboard.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: contextualQuery },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${optimizedBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 400
    };

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiKey}`
      },
      body: JSON.stringify(visionPayload)
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`OpenAI Vision analytics returned code: ${aiResponse.status} - ${errText}`);
    }

    const aiResult = await aiResponse.json();
    const solutionReply = aiResult?.choices?.[0]?.message?.content || "Screenshot analysis timed out.";

    return NextResponse.json({
      success: true,
      solution: solutionReply
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}