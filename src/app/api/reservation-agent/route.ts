import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const systemPrompt = `You are an intelligent reservation agent for HostMate, a fine dining restaurant. Your role is to help customers make reservations through natural conversation.

RESTAURANT INFO:
- Name: HostMate
- Location: 123 Culinary Lane, Foodie City
- Hours: Monday-Saturday 5 PM - 11 PM, Closed Sundays
- Phone: (123) 456-7890
- Cuisine: Fine dining with modern American cuisine
- Average dining time: 1.5-2 hours
- Party size: 1-12 people

RESERVATION REQUIREMENTS:
You must collect these details to complete a reservation:
1. Party size (number of people)
2. Date (validate it's available and in the future)
3. Time (between 5 PM - 9 PM, suggest times based on availability)
4. Customer name (full name)
5. Contact method (email OR phone number)

GUIDELINES:
- Be conversational, friendly, and professional
- Ask for ONE piece of information at a time
- Validate each input (e.g., realistic party sizes, future dates, proper times)
- Suggest alternatives if requested time isn't available
- If user provides multiple details at once, acknowledge all and ask for missing ones
- Use the customer's name once you have it
- For logged-in users, pre-fill their name and email if available

RESPONSE FORMAT:
Respond with natural language. When you have all required information (party size, date, time, customer name, and email/phone), immediately proceed to book the reservation. End your response with "READY_TO_BOOK" to indicate the booking should be processed. Do not ask for additional confirmation once you have all required details.

AVAILABILITY RULES:
- Suggest time slots: 5:00 PM, 5:30 PM, 6:00 PM, 6:30 PM, 7:00 PM, 7:30 PM, 8:00 PM, 8:30 PM, 9:00 PM
- Larger parties (8+) should be suggested earlier times (5:00-7:00 PM)
- Weekend nights are busier - suggest reserving early

Current date: ${new Date().toLocaleDateString()}
Current time: ${new Date().toLocaleTimeString()}`;

export async function POST(req: NextRequest) {
  console.log("=== RESERVATION AGENT API CALLED (v2) ===");
  
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey === "your_google_gemini_api_key_here") {
    console.log("Google API key not configured - using fallback responses");
    
    try {
      const body = await req.json();
      const { message, conversationHistory, reservationData, userProfile } = body;

      console.log("Request body:", { message, reservationData, userProfile });

      // Simple fallback logic for testing
      const lowerMessage = message.toLowerCase();
      let reply = "";
      let updatedReservationData = { ...reservationData };

      // Auto-fill user data if available
      if (userProfile && !updatedReservationData.customerName && userProfile.name) {
        updatedReservationData.customerName = userProfile.name;
      }
      if (userProfile && !updatedReservationData.email && userProfile.email) {
        updatedReservationData.email = userProfile.email;
      }

      // Extract basic data
      const partyMatch = message.match(/(\d+)\s*(?:people|person|ppl|party|of|for)/i);
      if (partyMatch) {
        updatedReservationData.partySize = parseInt(partyMatch[1]);
      }

      if (lowerMessage.includes("hi") || lowerMessage.includes("hello")) {
        reply = "Hello! I'm your reservation assistant. I'll help you book the perfect table. What size party are you planning for?";
      } else if (!updatedReservationData.partySize) {
        reply = "I'd be happy to help you make a reservation! How many people will be dining with us?";
      } else if (!updatedReservationData.date) {
        reply = `Great! A party of ${updatedReservationData.partySize}. What date would you like to dine with us?`;
      } else if (!updatedReservationData.time) {
        reply = `Perfect! For ${updatedReservationData.date}. What time would you prefer? We have availability from 5:00 PM to 9:00 PM.`;
      } else if (!updatedReservationData.customerName && !userProfile?.name) {
        reply = "Excellent! May I have a name for the reservation?";
      } else if (!updatedReservationData.email && !updatedReservationData.phone && !userProfile?.email) {
        reply = "Perfect! And could I get a phone number or email for confirmation?";
      } else {
        reply = `Perfect! Let me confirm your reservation:
        
Party of ${updatedReservationData.partySize}
Date: ${updatedReservationData.date}
Time: ${updatedReservationData.time}
Name: ${updatedReservationData.customerName || userProfile?.name}
Contact: ${updatedReservationData.email || updatedReservationData.phone || userProfile?.email}

I'm processing your reservation now... READY_TO_BOOK`;
      }

      // Check if ready to book
      const isReadyToBook = reply.includes("READY_TO_BOOK");
      let action = null;

      if (isReadyToBook && isReservationComplete(updatedReservationData)) {
        try {
          const reservationResult = await createReservation(updatedReservationData, userProfile);
          if (reservationResult.success) {
            action = "COMPLETE_RESERVATION";
          }
        } catch (error) {
          console.error("Error creating reservation:", error);
        }
      }

      return NextResponse.json({
        reply: reply.replace("READY_TO_BOOK", "").trim(),
        reservationData: updatedReservationData,
        action
      });

    } catch (error: any) {
      console.error("Error in fallback reservation agent:", error);
      return NextResponse.json(
        { error: `An error occurred: ${error.message}` },
        { status: 500 }
      );
    }
  }

  // Original Google Gemini logic
  try {
    const body = await req.json();
    const { message, conversationHistory, reservationData, userProfile } = body;

    console.log("Request body:", { message, reservationData, userProfile });

    // Extract reservation data from the conversation
    const updatedReservationData = extractReservationData(message, reservationData, userProfile);
    
    console.log("Updated reservation data:", updatedReservationData);
    console.log("Original reservation data:", reservationData);
    console.log("Changes detected:", JSON.stringify(updatedReservationData) !== JSON.stringify(reservationData));

    // Build conversation context
    let contextMessage = `Customer message: "${message}"\n\n`;
    
    if (userProfile) {
      contextMessage += `LOGGED-IN USER INFO:\n`;
      contextMessage += `- Name: ${userProfile.name || 'Not provided'}\n`;
      contextMessage += `- Email: ${userProfile.email}\n\n`;
    }

    if (Object.keys(updatedReservationData || {}).length > 0) {
      contextMessage += `CURRENT RESERVATION PROGRESS:\n`;
      if (updatedReservationData.partySize) contextMessage += `- Party size: ${updatedReservationData.partySize} people ✓\n`;
      if (updatedReservationData.date) contextMessage += `- Date: ${updatedReservationData.date} ✓\n`;
      if (updatedReservationData.time) contextMessage += `- Time: ${updatedReservationData.time} ✓\n`;
      if (updatedReservationData.customerName) contextMessage += `- Name: ${updatedReservationData.customerName} ✓\n`;
      if (updatedReservationData.email) contextMessage += `- Email: ${updatedReservationData.email} ✓\n`;
      if (updatedReservationData.phone) contextMessage += `- Phone: ${updatedReservationData.phone} ✓\n`;
      contextMessage += '\n';
      
      contextMessage += `IMPORTANT: Do NOT ask for information that already has a ✓ checkmark above. Move on to the next missing piece of information.\n\n`;
      
      // Check if we have all required information
      const hasAllInfo = isReservationComplete(updatedReservationData, userProfile);
      
      if (hasAllInfo) {
        contextMessage += `ALL REQUIRED INFORMATION COLLECTED! You have everything needed to complete the reservation. Do not ask for confirmation - proceed directly to book by ending with "READY_TO_BOOK".\n\n`;
      }
    }

    contextMessage += `Please respond naturally to help complete this reservation. Extract any new information from the customer's message and guide them to the next step. Do not repeat requests for information we already have.`;

    console.log("Context being sent to AI:", contextMessage);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(contextMessage);
    const response = result.response;
    const agentReply = response.text();

    console.log("Agent response:", agentReply);

    // Check if ready to book
    const isReadyToBook = agentReply.includes("READY_TO_BOOK");
    let action = null;

    if (isReadyToBook && isReservationComplete(updatedReservationData, userProfile)) {
      // Create the reservation
      try {
        const reservationResult = await createReservation(updatedReservationData, userProfile);
        if (reservationResult.success) {
          action = "COMPLETE_RESERVATION";
        }
      } catch (error) {
        console.error("Error creating reservation:", error);
      }
    }

    return NextResponse.json({
      reply: agentReply.replace("READY_TO_BOOK", "").trim(),
      reservationData: updatedReservationData,
      action
    });

  } catch (error: any) {
    console.error("Error in reservation agent API:", error);
    return NextResponse.json(
      { error: `An error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}

function extractReservationData(message: string, currentData: any = {}, userProfile: any = null) {
  const data = { ...currentData };
  
  console.log("=== EXTRACTION DEBUG ===");
  console.log("Message:", message);
  console.log("Current data:", data);
  console.log("User profile:", userProfile);
  
  // Auto-fill user data if available
  if (userProfile && !data.customerName && userProfile.name) {
    data.customerName = userProfile.name;
  }
  if (userProfile && !data.email && userProfile.email) {
    data.email = userProfile.email;
  }

  const lowerMessage = message.toLowerCase();

  // Clear any incorrect data first
  // If time is just a number (like "2 " or "1"), it was incorrectly extracted
  if (data.time && data.time.match(/^\d+\s*$/)) {
    console.log("Clearing incorrect time value:", data.time);
    delete data.time;
  }

  // Extract party size - only if we don't already have it
  if (!data.partySize) {
    const partyMatches = message.match(/(\d+)\s*(?:people|person|ppl|party|of|for|guest|guests)/i);
    if (partyMatches) {
      const size = parseInt(partyMatches[1]);
      if (size >= 1 && size <= 12) {
        data.partySize = size;
        console.log("Extracted party size:", size);
      }
    } else if (message.match(/^[1-9]$/) && !data.partySize) {
      // If it's just a single digit 1-9, likely party size
      data.partySize = parseInt(message);
      console.log("Extracted party size from single digit:", data.partySize);
    }
  }

  // Extract date - only if we don't already have it
  if (!data.date) {
    if (lowerMessage.includes('today')) {
      data.date = 'today';
      console.log("Extracted date: today");
    } else if (lowerMessage.includes('tomorrow')) {
      data.date = 'tomorrow';
      console.log("Extracted date: tomorrow");
    } else if (lowerMessage.match(/(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i)) {
      const dayMatch = message.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
      if (dayMatch) {
        data.date = dayMatch[1];
        console.log("Extracted date (day):", dayMatch[1]);
      }
    } else if (message.match(/(\d{1,2}\/\d{1,2}\/\d{4})/)) {
      const dateMatch = message.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      if (dateMatch) {
        data.date = dateMatch[1];
        console.log("Extracted date (formatted):", dateMatch[1]);
      }
    } else if (message.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i)) {
      const monthMatch = message.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i);
      if (monthMatch) {
        data.date = `${monthMatch[1]} ${monthMatch[2]}`;
        console.log("Extracted date (month):", `${monthMatch[1]} ${monthMatch[2]}`);
      }
    }
  }

  // Extract time - only if we don't already have it
  if (!data.time) {
    const timePattern = /(\d{1,2}):(\d{2})\s*(pm|am|p\.m\.|a\.m\.)/i;
    const timeMatch = message.match(timePattern);
    if (timeMatch) {
      const hour = timeMatch[1];
      const minute = timeMatch[2];
      const period = timeMatch[3];
      data.time = `${hour}:${minute} ${period.toUpperCase()}`;
    } else {
      // Try simpler patterns
      const simpleTimeMatch = message.match(/(\d{1,2})\s*(pm|am)/i);
      if (simpleTimeMatch) {
        const hour = simpleTimeMatch[1];
        const period = simpleTimeMatch[2];
        data.time = `${hour}:00 ${period.toUpperCase()}`;
      } else if (lowerMessage.includes('evening') && !lowerMessage.includes('tomorrow')) {
        data.time = '7:00 PM';
      } else if (lowerMessage.includes('dinner')) {
        data.time = '7:00 PM';
      }
    }
  }

  // Extract name - only if we don't already have it
  if (!data.customerName && !userProfile?.name) {
    // Skip extraction if the message contains temporal words that might be mistaken for names
    const hasTemporalWords = /tomorrow|evening|today|yesterday|morning|afternoon|night|weekend/i.test(message);
    
    if (!hasTemporalWords) {
      const namePatterns = [
        /(?:my name is|i'm|i am|name's|this is)\s+([a-zA-Z\s]{2,30})/i,
        /(?:for|under)\s+([a-zA-Z\s]{2,30})/i,
        // Check if the entire message looks like a name (First Last)
        /^([A-Z][a-z]+\s+[A-Z][a-z]+)$/,
        // Check for lowercase names like "john smith"
        /^([a-z]+\s+[a-z]+)$/i
      ];
      
      for (const pattern of namePatterns) {
        const match = message.match(pattern);
        if (match) {
          // Capitalize the name properly
          const name = match[1].trim().toLowerCase().split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          data.customerName = name;
          console.log("Extracted name:", name);
          break;
        }
      }
    }
  }

  // Clean up invalid names that contain temporal words
  if (data.customerName && /tomorrow|evening|today|yesterday|morning|afternoon|night|weekend/i.test(data.customerName)) {
    console.log("Removing invalid name containing temporal words:", data.customerName);
    delete data.customerName;
  }

  // Extract email - only if we don't already have it
  if (!data.email && !userProfile?.email) {
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const emailMatch = message.match(emailPattern);
    if (emailMatch) {
      data.email = emailMatch[1];
      console.log("Extracted email:", emailMatch[1]);
    }
  }

  // Extract phone - only if we don't already have it
  if (!data.phone) {
    const phonePattern = /(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
    const phoneMatch = message.match(phonePattern);
    if (phoneMatch) {
      data.phone = phoneMatch[0];
      console.log("Extracted phone:", phoneMatch[0]);
    }
  }

  console.log("Final extracted data:", data);
  console.log("=== END EXTRACTION DEBUG ===");
  return data;
}

function isReservationComplete(data: any, userProfile: any = null): boolean {
  // For logged-in users, we can use their profile email, so phone is optional
  if (userProfile?.id) {
    return !!(
      data.partySize &&
      data.date &&
      data.time &&
      data.customerName &&
      (data.email || userProfile.email)
    );
  }
  
  // For guest users, we need both email AND phone (due to database constraint)
  return !!(
    data.partySize &&
    data.date &&
    data.time &&
    data.customerName &&
    data.email &&
    data.phone
  );
}

async function createReservation(reservationData: any, userProfile: any = null) {
  try {
    console.log("Creating reservation with data:", reservationData);
    
    // Parse date and time into a proper datetime
    let reservationDate;
    
    if (reservationData.date === 'today') {
      reservationDate = new Date();
    } else if (reservationData.date === 'tomorrow') {
      reservationDate = new Date();
      reservationDate.setDate(reservationDate.getDate() + 1);
    } else {
      reservationDate = new Date(reservationData.date);
    }
    
    console.log("Parsed reservation date:", reservationDate);
    
    // Parse time
    console.log("Original time string:", reservationData.time);
    const [time, period] = reservationData.time.split(/\s*(am|pm|a\.m\.|p\.m\.)/i);
    console.log("Time parts:", { time, period });
    const [hours, minutes = '00'] = time.split(':');
    console.log("Hour/minute parts:", { hours, minutes });
    
    let hour = parseInt(hours);
    if (period && period.toLowerCase().includes('p') && hour !== 12) {
      hour += 12;
    } else if (period && period.toLowerCase().includes('a') && hour === 12) {
      hour = 0;
    }
    
    console.log("Final hour:", hour, "minutes:", parseInt(minutes));
    reservationDate.setHours(hour, parseInt(minutes), 0, 0);
    console.log("Final reservation datetime:", reservationDate.toISOString());

    // Create reservation object following the same pattern as ReservationForm
    // For authenticated users: use name/email/phone fields + user_id
    // For guests: use guest_name/guest_email/guest_phone fields + user_id: null
    const reservationInsertData = {
      party_size: reservationData.partySize,
      datetime: reservationDate.toISOString(),
      status: 'confirmed',
      created_at: new Date().toISOString(),
      ...(userProfile?.id ? {
        // Authenticated user reservation
        user_id: userProfile.id,
        name: reservationData.customerName,
        email: reservationData.email || userProfile.email || null,
        phone: reservationData.phone || null,
      } : {
        // Guest reservation
        user_id: null,
        guest_name: reservationData.customerName,
        guest_email: reservationData.email || null,
        guest_phone: reservationData.phone || null,
      })
    };

    console.log("Inserting reservation with data:", reservationInsertData);

    const { data, error } = await supabase
      .from('reservations')
      .insert(reservationInsertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Reservation created:', data);
    return { success: true, reservation: data };
    
  } catch (error) {
    console.error('Error creating reservation:', error);
    return { success: false, error };
  }
}
