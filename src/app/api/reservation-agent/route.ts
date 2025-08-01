import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const systemPrompt = `You are an intelligent reservation agent for HostMate, a fine dining restaurant. Your role is to help customers make reservations through natural conversation.

RESTAURANT INFO:
- Name: HostMate
- Location: 123 Culinary Lane, Foodie City
- Hours: Monday-Sunday 9:00 AM - 10:30 PM
- Phone: (123) 456-7890
- Cuisine: Fine dining with modern American cuisine
- Average dining time: 1.5-2 hours
- Party size: 1-12 people

RESERVATION REQUIREMENTS:
You must collect these details to complete a reservation:
1. Party size (number of people)
2. Date (validate it's available and in the future)
3. Time (between 9:00 AM - 10:30 PM, suggest times based on availability)
4. Customer name (full name)
5. Contact method (email OR phone number)

GUIDELINES:
- Be conversational, friendly, and professional
- Never reference or mention pre-filled, previous, or prior information. Always use the latest user input as the source of truth for all reservation details, even if the user's name or email is pre-filled.
- Never ask for clarification about pre-filled or previous values. If the user provides a new value, use it and move forward.
- Never mention or reference the user's account, login status, or profile information in the conversation.
- Only ask for each required detail once. Do not ask for repeated confirmations or for the same information again if it has already been provided.
- As soon as you have all required details, immediately confirm the reservation in a single, clear message. Do not ask for additional confirmations or repeat the details multiple times.
- If the user provides all details at once, confirm the reservation right away.
- Validate each input (e.g., realistic party sizes, future dates, proper times)
- Suggest alternatives if requested time isn't available
- If user provides multiple details at once, acknowledge all and ask for missing ones
- Use the customer's name once you have it
- For logged-in users, pre-fill their name and email if available, but never mention this in the conversation
`;

export async function POST(req: NextRequest) {
  console.log("=== RESERVATION AGENT API CALLED (v2) ===");

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey === "your_google_gemini_api_key_here") {
    return fallbackReservationLogic(req);
  }

  try {
    const body = await req.json();
    const { message, conversationHistory, reservationData, userProfile } = body;

    const updatedReservationData = extractReservationData(message, reservationData, userProfile);
    const contextMessage = buildContextMessage(message, updatedReservationData, userProfile);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(contextMessage);
    const agentReply = result.response.text();

    // If all required details are present, immediately create the reservation and confirm
    if (isReservationComplete(updatedReservationData, userProfile)) {
      const reservationResult = await createReservation(updatedReservationData, userProfile);
      if (reservationResult.success) {
        return NextResponse.json({
          reply: `🎉 Your reservation is confirmed!\n\nParty of ${updatedReservationData.partySize}\nDate: ${updatedReservationData.date}\nTime: ${updatedReservationData.time}\nName: ${updatedReservationData.customerName}\nContact: ${updatedReservationData.email || updatedReservationData.phone}\n\nYou'll receive a confirmation email or text shortly. Thank you for booking with HostMate!`,
          reservationData: updatedReservationData,
          action: "COMPLETE_RESERVATION"
        });
      } else {
        return NextResponse.json({
          reply: `Sorry, there was a problem creating your reservation. Error: ${reservationResult.error || 'Unknown error'}`,
          reservationData: updatedReservationData,
          action: null
        });
      }
    }

    // Otherwise, send only the clear input instruction for the next missing detail (never the Gemini reply)
    let instruction = "";
    if (!updatedReservationData.customerName) {
      instruction = "Welcome! May I have your full name for the reservation? Please reply with your full name, for example: 'John Smith'.";
    } else if (!updatedReservationData.partySize) {
      instruction = `Thank you, ${updatedReservationData.customerName}! How many people will be in your party? Please reply with a number (e.g., '4') or a phrase like 'party of 4'.`;
    } else if (!updatedReservationData.date) {
      instruction = `Great! What date would you like for your reservation? Please reply with a date, for example: 'August 5th', 'tomorrow', or '11/05/2025'.`;
    } else if (!updatedReservationData.time) {
      instruction = `Thank you! What time would you prefer? We’re open 9:00 AM to 10:30 PM. Please reply with a time, for example: '7:30 PM' or '19:30'.`;
    } else if (!updatedReservationData.email && !updatedReservationData.phone) {
      instruction = "Almost done! Can I get an email or phone number for confirmation? Please reply with your email address (e.g., 'you@email.com') or phone number (e.g., '(123) 456-7890').";
    }

    return NextResponse.json({
      reply: instruction,
      reservationData: updatedReservationData,
      action: null
    });
  } catch (error: any) {
    console.error("Error in reservation agent API:", error);
    return NextResponse.json(
      { error: `An error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}

async function fallbackReservationLogic(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, reservationData, userProfile } = body;

    let updatedReservationData = {
      ...reservationData,
      ...extractReservationData(message, reservationData, userProfile),
    };

    if (userProfile?.name && !updatedReservationData.customerName) {
      updatedReservationData.customerName = userProfile.name;
    }
    if (userProfile?.email && !updatedReservationData.email) {
      updatedReservationData.email = userProfile.email;
    }

    // If all required details are present, immediately create the reservation and confirm
    if (isReservationComplete(updatedReservationData, userProfile)) {
      const reservationResult = await createReservation(updatedReservationData, userProfile);
      if (reservationResult.success) {
        return NextResponse.json({
          reply: `🎉 Your reservation is confirmed!\n\nParty of ${updatedReservationData.partySize}\nDate: ${updatedReservationData.date}\nTime: ${updatedReservationData.time}\nName: ${updatedReservationData.customerName}\nContact: ${updatedReservationData.email || updatedReservationData.phone}\n\nYou'll receive a confirmation email or text shortly. Thank you for booking with HostMate!`,
          reservationData: updatedReservationData,
          action: "COMPLETE_RESERVATION"
        });
      } else {
        return NextResponse.json({
          reply: `Sorry, there was a problem creating your reservation. Please try again or contact us directly.`,
          reservationData: updatedReservationData,
          action: null
        });
      }
    }

    // Otherwise, ask for only one missing detail at a time, never combining date and time
    let reply = "";
    if (!updatedReservationData.customerName) {
      reply = "Welcome! May I have your full name for the reservation? Please reply with your full name, for example: 'John Smith'.";
    } else if (!updatedReservationData.partySize) {
      reply = `Thank you, ${updatedReservationData.customerName}! How many people will be in your party? Please reply with a number (e.g., '4') or a phrase like 'party of 4'.`;
    } else if (!updatedReservationData.date) {
      reply = `Great! What date would you like for your reservation? Please reply with a date, for example: 'August 5th', 'tomorrow', or '11/05/2025'.`;
    } else if (!updatedReservationData.time) {
      reply = `Thank you! What time would you prefer? We’re open 9:00 AM to 10:30 PM. Please reply with a time, for example: '7:30 PM' or '19:30'.`;
    } else if (!updatedReservationData.email && !updatedReservationData.phone) {
      reply = "Almost done! Can I get an email or phone number for confirmation? Please reply with your email address (e.g., 'you@email.com') or phone number (e.g., '(123) 456-7890').";
    }

    return NextResponse.json({
      reply,
      reservationData: updatedReservationData,
      action: null
    });
  } catch (error: any) {
    console.error("Fallback error:", error);
    return NextResponse.json(
      { error: `An error occurred in fallback: ${error.message}` },
      { status: 500 }
    );
  }
}

// Checks if all required reservation details are present
function isReservationComplete(reservationData: any, userProfile: any): boolean {
  const hasPartySize = !!reservationData?.partySize;
  const hasDate = !!reservationData?.date;
  const hasTime = !!reservationData?.time;
  const hasCustomerName = !!reservationData?.customerName || !!userProfile?.name;
  const hasContact = !!reservationData?.email || !!reservationData?.phone || !!userProfile?.email || !!userProfile?.phone;
  return hasPartySize && hasDate && hasTime && hasCustomerName && hasContact;
}

// Example implementation for buildContextMessage
function buildContextMessage(
  message: string,
  reservationData: any,
  userProfile: any
): string {
  // You can enhance this function to include more context as needed
  let context = `User message: ${message}\n`;
  if (reservationData) {
    context += `Reservation data: ${JSON.stringify(reservationData)}\n`;
  }
  if (userProfile) {
    context += `User profile: ${JSON.stringify(userProfile)}\n`;
  }
  return context;
}

// Example implementation for extractReservationData
function extractReservationData(
  message: string,
  reservationData: any,
  userProfile: any
): any {
  // Basic extraction logic using regex for party size, date, time, name, email, and phone
  let updated = { ...reservationData };

  // Party size (always use latest user input, support multiple details in one message)
  const numberWords: { [key: string]: number } = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12
  };
  let lastPartySize = null;
  // Find all party size matches, even if mixed with other details
  const partySizeRegexAll = /(party of|table for|for)\s*(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/gi;
  let match;
  while ((match = partySizeRegexAll.exec(message.toLowerCase())) !== null) {
    let size = parseInt(match[2], 10);
    if (isNaN(size)) size = numberWords[match[2]];
    if (size > 0 && size < 100) lastPartySize = size;
  }
  // Also check for single number/word if message is just a number/word
  if (lastPartySize === null) {
    const singlePartySize = message.trim().toLowerCase();
    if (numberWords[singlePartySize]) lastPartySize = numberWords[singlePartySize];
    else if (/^\d{1,2}$/.test(singlePartySize)) lastPartySize = parseInt(singlePartySize, 10);
  }
  if (lastPartySize !== null) {
    updated.partySize = lastPartySize;
  }

  // Date (always use latest user input, support month abbreviations)
  const isoDateMatch = message.match(/(\d{4}-\d{2}-\d{2})/);
  const usDateMatch = message.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
  // Support both full and abbreviated months
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
    'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'
  ];
  const monthDayMatch = message.match(new RegExp(`(${monthNames.join('|')})\\s+\\d{1,2}(st|nd|rd|th)?`, 'i'));
  const tomorrowMatch = /tomorrow/i.test(message);
  const todayMatch = /today/i.test(message);
  if (isoDateMatch) {
    updated.date = isoDateMatch[1];
  } else if (usDateMatch) {
    const parts = usDateMatch[1].split(/[\/\-]/);
    if (parts[2].length === 2) parts[2] = '20' + parts[2];
    updated.date = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  } else if (monthDayMatch) {
    const now = new Date();
    let month = monthDayMatch[1].toLowerCase();
    let dayMatch = monthDayMatch[0].match(/\d{1,2}/);
    if (dayMatch) {
      const day = dayMatch[0];
      // Map abbreviations to month number
      let monthNum = monthNames.indexOf(month) % 12 + 1;
      updated.date = `${now.getFullYear()}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  } else if (tomorrowMatch) {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    updated.date = now.toISOString().slice(0, 10);
  } else if (todayMatch) {
    const now = new Date();
    updated.date = now.toISOString().slice(0, 10);
  }

  // Time (always use latest user input)
  let timeMatch = null;
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm)?/i, // 7:30 PM, 19:30
    /(\d{1,2})\s*(am|pm)/i,          // 7 pm, 2 am
    /at\s*(\d{1,2})(?:\s*(am|pm))?/i // at 5, at 5pm
  ];
  for (const pattern of timePatterns) {
    const match = message.match(pattern);
    if (match) {
      timeMatch = match;
      break;
    }
  }
  if (timeMatch) {
    let hour = 0;
    let minute = 0;
    let ampm = null;
    if (timeMatch[0].toLowerCase().includes('at')) {
      hour = parseInt(timeMatch[1], 10);
      minute = 0;
      ampm = timeMatch[2] ? timeMatch[2].toLowerCase() : null;
    } else {
      hour = parseInt(timeMatch[1], 10);
      minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
    }
    // Improved ambiguous time handling for restaurant context
    if (!ampm) {
      if (hour === 9) {
        ampm = 'am'; // 9 defaults to 9 AM
      } else if (hour >= 1 && hour <= 8) {
        ampm = 'pm'; // 1-8 default to PM
      } else if (hour === 10) {
        ampm = 'pm'; // 10 defaults to PM (dinner)
      } else if (hour === 11 || hour === 12) {
        ampm = 'am'; // 11/12 default to AM (brunch/lunch)
      }
    }
    if (ampm) {
      if (ampm === 'pm' && hour < 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
    }
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      updated.time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }

  // Name: only update if a new one is detected in the latest message, ignore confirmations and party size words, and do not overwrite if already set
  let detectedName: string | null = null;
  const confirmationWords = [
    'yes', 'yeah', 'yep', 'yup', 'no', 'nope', 'sure', 'ok', 'okay', 'confirm', 'confirmed', 'correct', 'right', 'absolutely', 'of course', 'please', 'thanks', 'thank you'
  ];
  const dateTimeWords = [
    'tomorrow', 'today', 'tonight', 'morning', 'afternoon', 'evening', 'night',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
    'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'
  ];
  const partySizeWords = [
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
  ];
  const nameMatch = message.match(/my name is ([a-zA-Z\s\-']{2,})/i);
  if (nameMatch) {
    detectedName = nameMatch[1].trim();
  } else {
    const simpleName = message.trim();
    const lowerSimple = simpleName.toLowerCase();
    if (
      /^[a-zA-Z][a-zA-Z\s\-']{1,40}$/.test(simpleName) &&
      simpleName.split(/\s+/).length <= 3 &&
      !confirmationWords.includes(lowerSimple) &&
      !dateTimeWords.includes(lowerSimple) &&
      !partySizeWords.includes(lowerSimple)
    ) {
      detectedName = simpleName;
    }
  }
  if (detectedName && !updated.customerName) {
    updated.customerName = detectedName;
  }

  // Email (always use latest user input)
  const emailMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    updated.email = emailMatch[0];
  }

  // Phone (always use latest user input)
  const phoneMatch = message.match(/(\+?1[\s.-]?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
  if (phoneMatch) {
    updated.phone = phoneMatch[0];
  }

  return updated;
}

// Create a reservation in the database (Supabase)
async function createReservation(reservationData: any, userProfile: any) {
  try {
    const { partySize, date, time, customerName, email, phone } = reservationData;
    // Use guest fields for guest reservations (no user_id)
    const isGuest = !userProfile?.id && (!reservationData.user_id || reservationData.user_id === null);
    let insertObj: any = {
      party_size: partySize,
      datetime: date && time ? new Date(`${date}T${time}`).toISOString() : null,
      created_at: new Date().toISOString(),
    };
    if (isGuest) {
      insertObj.guest_name = customerName;
      insertObj.guest_email = email;
      insertObj.guest_phone = phone;
    } else {
      insertObj.customer_name = customerName || userProfile?.name || null;
      insertObj.email = email || userProfile?.email || null;
      insertObj.phone = phone || userProfile?.phone || null;
      if (userProfile?.id) insertObj.user_id = userProfile.id;
    }

    // Prevent duplicate reservations: check for existing reservation with same email/phone, date, and time
    let contactField = email ? 'email' : 'phone';
    let contactValue = email || phone;
    let datetime = date && time ? new Date(`${date}T${time}`).toISOString() : null;
    let duplicateCheck = null;
    if (contactValue && datetime) {
      const { data: existing, error: checkError } = await supabase
        .from('reservations')
        .select('*')
        .or(`email.eq.${email},guest_email.eq.${email},phone.eq.${phone},guest_phone.eq.${phone}`)
        .eq('datetime', datetime)
        .limit(1);
      if (checkError) {
        console.error('Supabase duplicate check error:', checkError);
        return { success: false, error: checkError.message };
      }
      if (existing && existing.length > 0) {
        return { success: false, error: 'A reservation already exists for this contact, date, and time.' };
      }
    }

    const { data, error } = await supabase
      .from("reservations")
      .insert([insertObj])
      .select();

    if (error) {
      console.error("Supabase reservation insert error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error("createReservation error:", err);
    return { success: false, error: err.message };
  }
}
