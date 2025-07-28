import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("=== SIMPLE TEST API CALLED ===");
  
  try {
    const body = await req.json();
    console.log("Body received:", body);
    
    return NextResponse.json({ 
      reply: "Hello! This is a test response from the API. The route is working!" 
    });
    
  } catch (error: any) {
    console.error("Simple API Error:", error);
    return NextResponse.json({ 
      error: `Error: ${error.message}` 
    }, { status: 500 });
  }
}
