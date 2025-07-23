  console.log("/api/chatbot POST called");
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not set." }, { status: 500 });
  }

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful restaurant assistant. Help users with reservations and questions." },
        { role: "user", content: message },
      ],
      max_tokens: 200,
    }),
  });

  if (!openaiRes.ok) {
    const errorText = await openaiRes.text();
    console.error("OpenAI API error:", errorText);
    return NextResponse.json({ error: "OpenAI API error.", details: errorText }, { status: 500 });
  }

  const data = await openaiRes.json();
  const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";
  return NextResponse.json({ reply });
}
