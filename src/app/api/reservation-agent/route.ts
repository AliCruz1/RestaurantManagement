import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const systemPrompt = `You are an intelligent reservation & guest relations agent for HostMate. You:
1) Answer ANY guest question about the restaurant using ONLY the verified knowledge below.
2) Seamlessly collect reservation details when the guest wants to book.
3) Never contradict or fabricate beyond the knowledge base; if unknown, say you will gladly check with the team.

================ VERIFIED RESTAURANT KNOWLEDGE (SOURCE OF TRUTH) ================
IDENTITY & CONCEPT
- Name: HostMate
- Location: 123 Culinary Lane, Foodie City
- Concept: Modern American seasonal tasting-driven kitchen with a warm, upscale yet relaxed dining room. Focus on locally sourced, sustainably farmed produce & ethically raised proteins. Refined but approachable.
- Tagline Themes: Seasonal • Sustainable • Crafted Hospitality.

CUISINE & MENU STRUCTURE
- Core Style: Modern American with global accents (Mediterranean herbs, Japanese citrus, Latin spice notes) emphasizing peak-season produce.
- Menu Sections: Chef's Tasting (6 & 9 course options), A La Carte (starters, mains, shared sides), Raw & Chilled (oysters, crudo), Wood-Fired Features (rotating), Desserts, Artisan Cheeses.
- Dietary Accommodation: Vegetarian & vegan tasting paths available with 24h notice; gluten-free friendly (most sauces thickened via reductions, not flour); nut allergies handled with strict separation & flagged in POS; can omit dairy in most savory dishes.
- Kids: Welcomed at lunch & early dinner (before 7:00 PM); no dedicated kids menu but can prepare simplified grilled chicken, buttered pasta or plain vegetables on request.
- Seasonal Rotation: Major menu refresh every 6–8 weeks; micro-adjustments daily based on farmer deliveries & fish market.
- Signature Dishes (examples—keep concise):
  * Charred Carrot & Citrus Labneh (starter)
  * Dry-aged American Wagyu Strip with smoked bone marrow jus (main)
  * Miso-Glazed Black Cod with fermented yuzu & seaweed broth (main)
  * Wood-Fired Cauliflower Steak with almond romesco (vegan)
  * Brown Butter Honey Cake with whipped mascarpone (dessert)

RAW BAR / SEAFOOD
- Daily oysters (East + West coast), seasonal crudo (often line-caught local fish), sustainable sourcing (no endangered species; Monterey Bay Aquarium guidelines considered).

BEVERAGE PROGRAM
- Full bar + craft seasonal cocktails (clarified & zero-proof variants offered).
- Wine: 250+ label curated list, Old & New World balance with strong Burgundy, Willamette, Napa, and grower Champagne presence. Coravin used for premium pours by the glass.
- Beer: Rotating local draft (3 taps) + curated bottled craft selection.
- Zero-Proof: House shrubs, infused sodas, spirit-free Negroni & citrus spritz.
- Coffee & Tea: Single-origin pour-over & espresso; loose-leaf teas (jasmine, oolong, chamomile, peppermint) + herbal digestif blends.

DESSERT & PASTRY
- Daily-baked breads; pastry program emphasizes reduced refined sugar via roasted fruit & natural sweeteners.

OPERATIONS / HOURS
- Service Hours: Monday–Sunday 9:00 AM – 10:30 PM (last seating 9:45 PM). Brunch focus 9 AM–2 PM weekends; dinner menu after 5 PM daily.
- Average dining duration: 1.5–2 hours (tasting menu ~2–2.5 hours).

RESERVATIONS
- Bookable Party Size Range: 1–12 online; larger (13–24) handled via private dining inquiry (respond with instructions).
- Grace Period: 15 minutes; after that table may be reassigned but we attempt to accommodate.
- Cancellation: Kindly give 24h notice for standard reservations; tasting menu parties >6: 48h recommended.
- Deposit Policy: Currently NO deposit for standard reservations (subject to change during peak holidays). Private events may require contract + deposit.
- Modifications: Guests can adjust party size or time via direct message or phone; encourage early notice for reductions or dietary updates.

PRIVATE DINING & EVENTS
- Spaces: Glass-enclosed Garden Room (up to 18 seated), Chef’s Counter (6 seats tasting only), Partial Buyout (60 main dining), Full Buyout (90 seated / 120 reception style).
- AV: 70" display + discrete speakers in private room; HDMI & wireless presentation available.
- Inquiries: Provide email events@hostmate.example or phone line (123) 456-7890 (same main number) & note typical 24h response.

SEATING AREAS
- Main Dining Room: Mixed banquettes & tables (noise level: moderate conversational hum).
- Patio: Seasonal (April–October), heaters & wind screens, pet-friendly (leashed dogs) on patio only.
- Chef’s Counter: Direct kitchen view, tasting menu only, 2-hour seating blocks.
- Bar & Lounge: Walk-in friendly; limited a la carte + full cocktail & bar snack list.

ACCESSIBILITY & INCLUSIVITY
- ADA: Step-free entrance, 36" aisle clearances, accessible restrooms, low-profile ramps to patio.
- Menu: Large-print & high-contrast digital menu available; staff trained to read items aloud upon request.
- Service Animals welcomed (patio or dining room).

DRESS CODE
- Smart casual: Tailored denim acceptable; request no athletic gym wear, beach flip-flops, or excessively distressed clothing. Jackets not required.

PAYMENT & FINANCIAL
- Accepted: Major credit cards (Visa, MC, AmEx, Discover), contactless (Apple Pay / Google Pay), house digital gift cards.
- Split checks: Up to 4 ways gracefully; larger groups encouraged to plan one form if >8.
- Automatic gratuity NOT added except private events; team shares pooled service charge for events.

LOYALTY & GUEST EXPERIENCE
- Internal CRM tracks preferences (favorite wine styles, dietary flags, milestone dates) for personalized service; do not state internal data to guest unprompted.
- Birthday / Anniversary: Complimentary celebratory inscription & petite confection; custom cake with 48h notice.

ALLERGEN & FOOD SAFETY
- Dedicated allergen prep zone for severe nut/gluten allergies where feasible.
- Cannot guarantee 100% absence of trace allergens, but cross-contact minimized with sanitized utensils, fresh gloves & segregated cutting boards.

SOURCING & SUSTAINABILITY
- Produce: Partnership with regional organic farms within 150 miles; seafood from traceable fisheries; beef dry-aged in-house.
- Waste: Active composting & cooking oil recycling; reduction of single-use plastics (paper / reusable service ware).

PARKING & TRANSPORT
- Parking: Validated 2-hour parking in adjacent Culinary Garage (ticket stamping at host stand).
- Valet: Friday & Saturday 5 PM–close.
- Public Transit: Two blocks from Central Station (Green & Red lines).
- Rideshare: Clearly marked pickup zone on 4th Street side.

AMENITIES
- Free secure Wi-Fi (network: HostMate Guest; captive portal splash). No password required.
- Phone Charging: USB-C & Lightning cables available on request.
- Coat Check: Complimentary during cooler months.

BAR & HAPPY HOUR
- Happy Hour (Bar / Patio only): Weekdays 3–5 PM (select oysters, draft, seasonal spritz, bar bites).

NOISE & AMBIENCE
- Atmosphere: Warm lighting (2700K), curated playlist (modern instrumental + subtle jazz evenings). Average dB: 65–72 peak weekend.

PHOTOGRAPHY & DEVICES
- Casual photos welcome (no flash preferred). Tripods / large rigs require manager approval.

PET POLICY
- Only service animals inside; leashed, well-behaved dogs allowed on patio.

LOST & FOUND
- Items logged daily; retained 30 days; contact host desk with description.

UNKNOWN OR NOT LISTED
- If a question is outside this knowledge, politely state you will check and encourage direct contact.
================ END VERIFIED KNOWLEDGE =================

RESERVATION REQUIREMENTS (when guest intends to book):
1. Party size
2. Date (future)
3. Time (between 09:00 and 22:30, last seating 21:45; confirm within hours)
4. Full name
5. Contact (email OR phone)

CONVERSATION & ANSWER GUIDELINES
- If the user asks a general question (menu, dress code, parking, chef, allergies, hours, wine, private dining, sourcing, etc.) BEFORE giving booking details: Answer thoroughly using knowledge base, then gently offer to help with a reservation.
- If the user bundles a question WITH booking intent, answer the question first briefly, then resume collecting missing reservation fields.
- Never reference internal data / profile existence; you may internally infer name or email but do not mention inference.
- Never ask repeatedly for the same already confirmed field.
- Confirm reservation immediately once all fields gathered—one concise message.
- If user supplies everything in one free-form sentence, parse & confirm directly.
- Keep factual tone; do not embellish outside provided facts.
- If user asks something not in knowledge (e.g., "Do you serve Ethiopian coffee ceremony?"), respond: polite partial answer + offer to check with team.

SAFETY / NON-COMMITTAL AREAS
- Do NOT promise guaranteed allergen absence (phrase: "we minimize cross-contact but cannot guarantee 100% absence").
- Do NOT invent pricing; if asked and not specified, say pricing can vary and you'd be happy to provide ranges if they share a dish interest.

STYLE
- Warm, concise, professional. Use bullet points when listing options.
- Use customer's name after they provide it.

Proceed using these rules.
`;

export async function POST(req: NextRequest) {
  console.log("=== RESERVATION AGENT API CALLED (v2) ===");

  // Read Gemini API key from env; fall back to static logic if missing
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackReservationLogic(req);
  }

  try {
    const body = await req.json();
    const { message, conversationHistory, reservationData, userProfile } = body;

    // Normalize user profile name (support different possible fields) without exposing to user text
    const normalizedProfile = userProfile ? {
      ...userProfile,
      name:
        userProfile.name ||
        userProfile.full_name ||
        userProfile.fullName ||
        userProfile.username ||
        (userProfile.email ? userProfile.email.split('@')[0] : undefined)
    } : null;

    // Track existing sources coming from client (if any)
    const existingSources = (reservationData && reservationData._sources) || {};
    let fieldSources: Record<string,string> = { ...existingSources }; // field -> 'user' | 'inferred'

    const before = { ...reservationData };
    let updatedReservationData = extractReservationData(message, reservationData, normalizedProfile);
    // Determine which fields changed due to this message parsing => mark as user
    ['partySize','date','time','customerName','email','phone'].forEach(f => {
      if (updatedReservationData && (updatedReservationData as any)[f] && before?.[f] !== (updatedReservationData as any)[f]) {
        fieldSources[f] = 'user';
      }
    });

    // If user is signed in and didn't explicitly give a name, auto-fill from profile (internal only)
    if (!updatedReservationData.customerName && normalizedProfile?.name) {
      updatedReservationData.customerName = normalizedProfile.name;
      if (!fieldSources.customerName) fieldSources.customerName = 'inferred';
    }

    const contextMessage = buildContextMessage(message, updatedReservationData, normalizedProfile);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(contextMessage);
    const agentReply = result.response.text();

    // If all required details are present, immediately create the reservation and confirm
    // Attach sources into reservationData for round-trip
    (updatedReservationData as any)._sources = fieldSources;

    if (isReservationComplete(updatedReservationData, normalizedProfile)) {
      const reservationResult = await createReservation(updatedReservationData, normalizedProfile);
      if (reservationResult.success) {
        return NextResponse.json({
          reply: `🎉 Your reservation is confirmed!\n\nParty of ${updatedReservationData.partySize}\nDate: ${updatedReservationData.date}\nTime: ${updatedReservationData.time}\nName: ${updatedReservationData.customerName}\nContact: ${updatedReservationData.email || updatedReservationData.phone}\n\nYou'll receive a confirmation email or text shortly. Thank you for booking with HostMate!`,
          reservationData: updatedReservationData,
          reservationSources: fieldSources,
          action: "COMPLETE_RESERVATION"
        });
      } else {
        return NextResponse.json({
          reply: `Sorry, there was a problem creating your reservation. Error: ${reservationResult.error || 'Unknown error'}`,
          reservationData: updatedReservationData,
          reservationSources: fieldSources,
          action: null
        });
      }
    }
    // Detect general restaurant question (hours, menu, policies, etc.)
    const lowerMsg = message.toLowerCase();
  // Expanded slang & variant detection for general (non-reservation-field) questions (single regex literal for safety)
  const questionIndicators = /(hour|hours|open|close|closing|closing time|how late|open late|last seating|what time (?:do )?(?:yall|ya'll|y'all|you|u) (?:close|open)|(?:yall|ya'll|y'all|u guys|you guys|u) (?:still )?(?:open|closing)|menu|whats on (?:the )?menu|what's on (?:the )?menu|what do (?:you|yall|ya'll|y'all|u) serve|serve|food|dish|dishes|whatcha|watcha|whatchu|vegan|vegetarian|veg friendly|gluten|gluten[- ]?free|gf\b|dairy[- ]?free|allerg|allergy|nut[- ]?free|shellfish allergy|private dining|private|event|events|party room|room rental|buyout|chef's counter|wine list|wine|bar|cocktail|happy hour|zero[- ]?proof|non[- ]?alcoholic|kid friendly|kids?|children|child menu|kids menu|birthday|bday|b-day|anniversary|anniv|celebration|celebrate|accessib|wheelchair|ada|service animal|service dog|dog friendly|dogs?|pet friendly|pet|policy|deposit|cancellation|cancel|grace period|dress code|attire|sourcing|organic|local|sustainable|farm|seasonal|seasonal menu|parking|validated|validation|validate|valet|garage|transit|public transit|station|rideshare|uber|lyft|patio|outdoor|outside seating|heater|heaters|outdoor seating|wifi|wi-fi|charging|coat check|lost and found|lost & found|lost item|found item|chef|tasting menu|tasting|name of (?:the )?(?:restaurant|place)|what'?s the name of (?:the )?restaurant|what'?s this place called|restaurant name|this place called|where'?s (?:this place|the restaurant)|wheres (?:this place|the restaurant)|where (?:is|are) (?:this place|the restaurant)|where (?:are|r) (?:you|yall|ya'll|y'all|u) (?:located|at)|where (?:is|r) (?:it|ya'll|y'all)|where (?:u|you) located|location|address|located)/i;
    const isGeneralQuestion = questionIndicators.test(lowerMsg) || lowerMsg.trim().endsWith('?');

    // Determine which required fields are still missing
    const missingOrder: { key: keyof typeof updatedReservationData; prompt: string }[] = [
      { key: 'customerName', prompt: "Welcome! May I have your full name for the reservation? Please reply with your full name, for example: 'John Smith'." },
      { key: 'partySize', prompt: `Thank you${updatedReservationData.customerName ? ', ' + updatedReservationData.customerName : ''}! How many people will be in your party? Please reply with a number (e.g., '4') or a phrase like 'party of 4'.` },
      { key: 'date', prompt: `Great! What date would you like for your reservation? Please reply with a date, for example: 'August 5th', 'tomorrow', or '11/05/2025'.` },
      { key: 'time', prompt: `Thank you! What time would you prefer? We’re open 9:00 AM to 10:30 PM. Please reply with a time, for example: '7:30 PM' or '19:30'.` },
      { key: 'email', prompt: "Almost done! Can I get an email or phone number for confirmation? Please reply with your email address (e.g., 'you@email.com') or phone number (e.g., '(123) 456-7890')." }
    ];

    // Helper to compute next missing prompt
    function nextPrompt(): string {
      if (!updatedReservationData.customerName) return missingOrder[0].prompt;
      if (!updatedReservationData.partySize) return missingOrder[1].prompt;
      if (!updatedReservationData.date) return missingOrder[2].prompt;
      if (!updatedReservationData.time) return missingOrder[3].prompt;
      if (!updatedReservationData.email && !updatedReservationData.phone) return missingOrder[4].prompt;
      return '';
    }

    // Identify if any new reservation field was captured *this* message
    const prev = reservationData || {};
    const newlyCaptured = ['partySize','date','time','customerName','email','phone'].filter(f => (updatedReservationData as any)[f] && prev[f] !== (updatedReservationData as any)[f]);

    if (isGeneralQuestion) {
      // If no new reservation progress, answer the question and gently segue to first missing field
      if (newlyCaptured.length === 0) {
        // Detect generic follow-up like "more details" referencing previous topic
        const followUp = /^(more details|tell me more|what else|any other|more info|can i get more details|more about (that|it|this)|elaborate|expand|give me more)$/i.test(lowerMsg.trim());

        function expandedTopicAnswer(topic: string | undefined): string | null {
          switch(topic) {
            case 'menu':
              return `More menu detail:\n- Chef’s Tasting: 6 or 9 progressive seasonal courses (approx 2–2.5h) – can adapt vegetarian/vegan with 24h notice.\n- A La Carte Starters: seasonal veg highlight (e.g., Charred Carrot & Citrus Labneh), crudo, oysters.\n- Mains: Dry‑Aged American Wagyu Strip (smoked bone marrow jus), Miso‑Glazed Black Cod (fermented yuzu broth), rotating wood‑fired feature, plant‑forward options like Cauliflower Steak (almond romesco).\n- Sides: Market farm vegetables, roasted mushrooms, heritage grains.\n- Desserts: Refined, lower refined sugar focus (e.g., Brown Butter Honey Cake).\n- Beverage Pairing: Optional curated wine pairings; zero‑proof pairings available.\nDietary: Gluten‑friendly (minimal flour thickeners), nut allergy separation, vegan path with advance notice. Ask if you’d like recommendations by course.`;
            case 'hours':
              return `Hours detail: 9:00 AM – 10:30 PM daily (last seating 9:45 PM). Brunch emphasis weekends 9 AM–2 PM. Dinner menu begins 5 PM daily. Average dining duration: a la carte 1.5–2h, tasting 2–2.5h.`;
            case 'dietary':
              return `Dietary detail: Vegetarian & vegan tasting paths with 24h notice. Gluten‑friendly (reductions vs flour). Nut & other severe allergens handled with segregated tools & fresh gloves. Cross‑contact minimized but not 100% guaranteed.`;
            case 'location':
              return `Location detail: 123 Culinary Lane, Foodie City. 2 blocks from Central Station (Green & Red). Validated garage parking (2h) next door; valet Fri–Sat 5 PM+. Patio seasonal Apr–Oct with heaters.`;
            case 'private':
              return `Private dining detail: Garden Room (18 seated) with AV & 70" display, Chef’s Counter (6 seats tasting-only), partial buyout (60), full buyout (90 seated / 120 reception). Inquiries: events@hostmate.example or (123) 456‑7890.`;
            case 'beverage':
              return `Beverage detail: 250+ wine labels (Burgundy, Willamette, Napa, grower Champagne). Coravin for premium pours by the glass. Craft & zero‑proof cocktails (clarified & seasonal). Local draft + zero‑proof shrubs & sodas.`;
            default:
              return null;
          }
        }

        // Topic classification for current message (if not follow-up)
        function classifyTopic(msg: string): string | null {
          if (/menu|dish|dishes|tasting|what do .*serve|serve|whatcha|watcha|whatchu/.test(msg)) return 'menu';
            if (/hour|open|close|last seating|how late/.test(msg)) return 'hours';
            if (/vegan|vegetarian|gluten|allerg|allergy|gf\b|dairy/.test(msg)) return 'dietary';
            if (/where|location|address|located/.test(msg)) return 'location';
            if (/private|event|party room|buyout|chef's counter/.test(msg)) return 'private';
            if (/wine|cocktail|bar|happy hour|zero-?proof|non-?alcoholic/.test(msg)) return 'beverage';
            return null;
        }

        let replyText: string;
        if (followUp && (updatedReservationData as any)._lastTopic) {
          const expanded = expandedTopicAnswer((updatedReservationData as any)._lastTopic) || agentReply;
          replyText = expanded;
        } else {
          // Regular first answer
          const topic = classifyTopic(lowerMsg);
          if (topic) (updatedReservationData as any)._lastTopic = topic;
          replyText = agentReply;
        }
        const segue = nextPrompt() ? `\n\n${nextPrompt().replace('Welcome! ', '')}` : '';
        return NextResponse.json({
          reply: replyText + segue,
          reservationData: updatedReservationData,
          reservationSources: fieldSources,
          action: null
        });
      } else {
        // Mixed question + progress: provide concise answer then continue with next prompt
        const prompt = nextPrompt();
        const combined = prompt ? `${agentReply}\n\n${prompt}` : agentReply;
        return NextResponse.json({
          reply: combined,
          reservationData: updatedReservationData,
          reservationSources: fieldSources,
          action: null
        });
      }
    }

    // Otherwise, send only the clear input instruction for the next missing detail (reservation-first mode)
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
      reservationSources: fieldSources,
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

    // Basic general question detection (hours, dress code, parking, etc.) for fallback (no model available)
    const lowerMsg = (message || '').toLowerCase();
  const generalRegex = /(hour|hours|open|close|closing|closing time|how late|open late|last seating|what time (?:do )?(?:yall|ya'll|y'all|you|u) (?:close|open)|yall open|yall close|u open|u close|menu|whats on (?:the )?menu|what's on (?:the )?menu|whats on ur menu|what's on ur menu|serve|food|dish|dishes|whatcha|watcha|whatchu|vegan|vegetarian|veg friendly|gluten|gluten[- ]?free|gf\b|dairy[- ]?free|allerg|allergy|nut[- ]?free|private dining|private|event|events|party room|buyout|chef's counter|wine list|wine|bar|cocktail|happy hour|zero[- ]?proof|non[- ]?alcoholic|kid friendly|kids?|children|child menu|kids menu|birthday|bday|b-day|anniversary|anniv|celebration|accessib|wheelchair|ada|service (?:animal|dog)|dog friendly|dogs?|pet friendly|pet|policy|deposit|cancellation|cancel|grace period|dress code|attire|sourcing|organic|local|sustainable|farm|seasonal|parking|validated|validation|validate|valet|garage|transit|public transit|station|rideshare|uber|lyft|patio|outdoor|outside seating|heater|heaters|outdoor seating|wifi|wi-fi|charging|coat check|lost (?:and|&) found|lost item|found item|chef|tasting menu|tasting|name of (?:the )?(?:restaurant|place)|what'?s the name of (?:the )?restaurant|what'?s this place called|restaurant name|this place called|where'?s (?:this place|the restaurant)|wheres (?:this place|the restaurant)|where (?:is|are) (?:this place|the restaurant)|where (?:are|r) (?:you|yall|ya'll|y'all|u) (?:located|at)|where (?:is|r) (?:it|ya'll|y'all)|where (?:u|you) located|location|address|located)/i;
    const isGeneralQuestion = generalRegex.test(lowerMsg) || lowerMsg.trim().endsWith('?');

    // Identify newly captured fields (progress) vs none
    const prev = reservationData || {};
    const newlyCaptured = ['partySize','date','time','customerName','email','phone'].filter(f => (updatedReservationData as any)[f] && prev[f] !== (updatedReservationData as any)[f]);

    function nextPrompt(): string {
      if (!updatedReservationData.customerName) return "Welcome! May I have your full name for the reservation? Please reply with your full name, for example: 'John Smith'.";
      if (!updatedReservationData.partySize) return `Thank you${updatedReservationData.customerName ? ', ' + updatedReservationData.customerName : ''}! How many people will be in your party? Please reply with a number (e.g., '4') or a phrase like 'party of 4'.`;
      if (!updatedReservationData.date) return `Great! What date would you like for your reservation? Please reply with a date, for example: 'August 5th', 'tomorrow', or '11/05/2025'.`;
      if (!updatedReservationData.time) return `Thank you! What time would you prefer? We’re open 9:00 AM to 10:30 PM (last seating 9:45 PM). Please reply with a time, for example: '7:30 PM' or '19:30'.`;
      if (!updatedReservationData.email && !updatedReservationData.phone) return "Almost done! Can I get an email or phone number for confirmation? Please reply with your email address (e.g., 'you@email.com') or phone number (e.g., '(123) 456-7890').";
      return '';
    }

    function buildStaticAnswer(): string | null {
      // Map of regex -> answer text
      const pairs: { re: RegExp; ans: string }[] = [
  { re: /(hour|hours|close|closing|closing time|how late|open late|last seating)/i, ans: "Our service hours are 9:00 AM – 10:30 PM daily (last seating 9:45 PM)." },
  { re: /(where (?:is|are) (?:this place|the restaurant)|location|address|located)/i, ans: "We’re located at 123 Culinary Lane, Foodie City—two blocks from Central Station (Green & Red lines)." },
  { re: /(name of (?:the )?(?:restaurant|place)|what'?s the name of (?:the )?restaurant|what'?s this place called|restaurant name|this place called)/i, ans: "The restaurant is HostMate – modern American seasonal, sustainably sourced, at 123 Culinary Lane." },
        { re: /(menu|serve|food|dish|dishes|whatcha|watcha|whatchu)/i, ans: "Menu highlights: Chef’s Tasting (6 or 9 courses), a la carte starters & mains, raw/chilled oysters & crudo, rotating wood‑fired features, artisan cheeses, refined desserts (e.g., brown butter honey cake). Signatures: Charred Carrot & Citrus Labneh, Miso‑Glazed Black Cod, Dry‑Aged American Wagyu Strip, Wood‑Fired Cauliflower Steak (vegan). Ask for more details anytime." },
        { re: /(vegan|vegetarian|veg friendly)/i, ans: "Vegetarian & vegan tasting paths available with 24h notice; many a la carte items can be adjusted—just let us know." },
        { re: /(gluten|gf\b|allerg|allergy|nut[- ]?free)/i, ans: "We’re gluten‑friendly and handle nut & other allergies with careful separation; we minimize cross‑contact but cannot guarantee 100% absence." },
        { re: /dress code|attire/i, ans: "Dress code is smart casual: tailored denim fine; please avoid gym wear, beach flip-flops, overly distressed items. Jackets not required." },
        { re: /(parking|validated|validation|valet|garage)/i, ans: "We validate 2 hours in the adjacent Culinary Garage; valet Fri & Sat from 5 PM; rideshare pickup on 4th Street." },
        { re: /(patio|outdoor|outside seating|outdoor seating|heater|heaters)/i, ans: "Seasonal patio (Apr–Oct) with heaters & wind screens; leashed dogs permitted on patio only." },
        { re: /(private dining|private|event|events|party room|buyout|chef's counter)/i, ans: "Private options: Garden Room (18), Chef’s Counter (6 tasting), partial buyout (60), full buyout (90 seated). Inquiries: events@hostmate.example or (123) 456‑7890." },
        { re: /happy hour/i, ans: "Happy Hour (bar/patio) weekdays 3–5 PM: select oysters, seasonal spritz, draft beer, bar bites." },
        { re: /(kid|kids|children|kid friendly|kids menu|child menu)/i, ans: "Kids welcome at lunch & early dinner (before 7 PM). No dedicated kids menu, but we can prepare simplified dishes (e.g., grilled chicken, pasta, veggies)." },
        { re: /(wifi|wi-fi)/i, ans: "Free secure Wi‑Fi: network ‘HostMate Guest’ (captive portal, no password)." },
        { re: /(wheelchair|accessible|accessib|ada)/i, ans: "Accessible: step‑free entrance, compliant aisle clearances, accessible restrooms, patio ramp; service animals welcome." },
        { re: /(dog|dogs|pet|pet friendly|dog friendly|service (?:animal|dog))/i, ans: "Service animals allowed inside; leashed well‑behaved dogs welcome on patio only." },
        { re: /(birthday|bday|b-day|anniversary|anniv|celebration)/i, ans: "Complimentary inscription & petite confection for birthdays/anniversaries; custom cake requires 48h notice." },
        { re: /(deposit|cancellation|cancel|grace period|policy)/i, ans: "No deposit for standard reservations currently; 15‑minute grace period; please provide 24h notice for changes (48h for large tasting parties)." },
        { re: /(sourcing|organic|local|sustainable|farm|seasonal)/i, ans: "We source locally within ~150 miles, emphasize seasonal organic produce, traceable seafood, and in‑house dry‑aged beef; active composting & waste reduction." },
        { re: /(wine list|wine|cocktail|bar|zero[- ]?proof|non[- ]?alcoholic)/i, ans: "250+ label wine list (strong Burgundy, Willamette, Napa, grower Champagne) + craft cocktails (zero‑proof options) & local draft beer; Coravin for premium pours." },
        { re: /(tasting menu|tasting|chef's counter)/i, ans: "Chef’s Tasting: 6 or 9 courses (approx 2–2.5h). Chef’s Counter seating is tasting‑only in 2‑hour blocks." },
        { re: /(lost (?:and|&) found|lost item|found item|coat check|charging|wifi)/i, ans: "Amenities: complimentary coat check (seasonal), device charging cables on request, lost & found logged for 30 days, free guest Wi‑Fi." }
      ];
      for (const p of pairs) if (p.re.test(lowerMsg)) return p.ans;
      return null;
    }

    if (isGeneralQuestion) {
      const answer = buildStaticAnswer();
      if (answer) {
        if (newlyCaptured.length === 0) {
          const segue = nextPrompt();
            return NextResponse.json({
              reply: segue ? `${answer}\n\n${segue.replace('Welcome! ', '')}` : answer,
              reservationData: updatedReservationData,
              action: null
            });
        } else {
          const prompt = nextPrompt();
          return NextResponse.json({
            reply: prompt ? `${answer}\n\n${prompt}` : answer,
            reservationData: updatedReservationData,
            action: null
          });
        }
      }
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
  // Enhanced natural language extraction (robust free-form parsing)
  const original = message;
  const lower = message.toLowerCase();
  let updated = { ...reservationData };

  // 1. Party Size
  const numberWords: { [key: string]: number } = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12
  };
  // Common misspellings / phonetic variants -> canonical
  // Ambiguous tokens like 'for', 'to', 'too' intentionally excluded to avoid false positives (e.g., 'for August').
  const numberWordVariants: { [bad: string]: number } = {
    tw: 2,
    thre: 3, tree: 3, thr: 3,
    fou: 4,
    fve: 5, fi: 5,
    sx: 6, sev: 7, sevn: 7, ate: 8, eigth: 8, nien: 9, nin: 9,
    elevn: 11, twelv: 12
  };
  const partyPatterns: RegExp[] = [
    /(party of|table for)\s*(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/gi,
    // Phrases like "for 6" only treated as party size if immediately followed by a dining keyword
  /for\s*(\d{1,2})(?!\s*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec))\s*(people|persons|guests|at|on|please|thanks)?/gi,
    /(\d{1,2})\s*(people|persons|guests)/gi,
    /(\d{1,2})\s*(pp)/gi
  ];
  let partySizeCandidate: number | null = null;
  for (const pat of partyPatterns) {
    let m: RegExpExecArray | null;
    while ((m = pat.exec(lower)) !== null) {
      let raw = m[2] || m[1];
      // Skip patterns like 'for august' (month following 'for')
      if (/^for$/.test(m[1]) && /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)/.test(raw)) {
        continue;
      }
      let size = parseInt(raw, 10);
      if (isNaN(size)) {
        if (numberWords[raw as keyof typeof numberWords] !== undefined) size = numberWords[raw as keyof typeof numberWords];
        else if (numberWordVariants[raw] !== undefined) size = numberWordVariants[raw];
      }
      if (size && size > 0 && size < 100) partySizeCandidate = size; // keep last (most recent)
    }
  }
  // Additional pattern: standalone number followed by polite word (e.g., '3 please')
  const politeNum = lower.match(/\b(\d{1,2})\s*(please|pls|thanks|thank you)\b/);
  if (politeNum) {
    const val = parseInt(politeNum[1],10);
    if (val>0 && val<100) partySizeCandidate = val;
  }
  // Fuzzy single word like 'tree' or 'thre' that isn't already captured
  if (partySizeCandidate === null) {
    const singleTokens = lower.split(/[^a-z0-9]+/).filter(Boolean);
    for (const tok of singleTokens) {
      if (numberWords[tok] !== undefined) partySizeCandidate = numberWords[tok];
      else if (numberWordVariants[tok] !== undefined) partySizeCandidate = numberWordVariants[tok];
    }
  }
  if (partySizeCandidate === null) {
    const trimmed = lower.trim();
    if (numberWords[trimmed]) partySizeCandidate = numberWords[trimmed];
    else if (numberWordVariants[trimmed] !== undefined) partySizeCandidate = numberWordVariants[trimmed];
    else if (/^\d{1,2}$/.test(trimmed)) partySizeCandidate = parseInt(trimmed, 10);
  }
  if (partySizeCandidate !== null) updated.partySize = partySizeCandidate;

  // Helper: normalize and parse date expressions
  const weekdayMap: { [k: string]: number } = { sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 };
  const monthNames = [
    'january','february','march','april','may','june','july','august','september','october','november','december',
    'jan','feb','mar','apr','may','jun','jul','aug','sep','sept','oct','nov','dec'
  ];

  function formatDate(d: Date) { return d.toISOString().slice(0,10); }

  function parseNaturalDate(text: string): string | null {
    const now = new Date();
    // Explicit ISO / US numeric
    const iso = text.match(/(\d{4}-\d{2}-\d{2})/);
    if (iso) return iso[1];
    const us = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (us) {
      const parts = us[1].split(/[\/\-]/); // mm dd yyyy
      let y = parts[2];
      if (y.length === 2) y = '20'+y; // pivot 2000+
      return `${y}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`;
    }
    // Fuzzy tomorrow (tomorrow, tommorow, tomorow, tmr, tmrw)
    if (/(tom+o?r+o?w|tmrw|tmr)\b/.test(text)) { const d=new Date(now); d.setDate(d.getDate()+1); return formatDate(d); }
    if (/\btoday\b/.test(text)) return formatDate(now);
    if (/\bday after tomorrow\b/.test(text)) { const d=new Date(now); d.setDate(d.getDate()+2); return formatDate(d); }
    // In X days
    const inX = text.match(/in\s+(\d{1,2})\s+days?/);
    if (inX) { const d=new Date(now); d.setDate(d.getDate()+parseInt(inX[1],10)); return formatDate(d); }
    // Weekday alone or with this/next
    const weekdayPhrase = text.match(/\b(this|next)?\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
    if (weekdayPhrase) {
      const target = weekdayMap[weekdayPhrase[2]];
      const d=new Date(now);
      const todayW = d.getDay();
      let diff = target - todayW;
      if (diff <= 0 || weekdayPhrase[1]==='next') diff += 7; // next or past today
      if (weekdayPhrase[1]==='next' && diff < 7) diff += 7; // ensure truly next
      d.setDate(d.getDate()+diff);
      return formatDate(d);
    }
    // Month name + day (with ordinal)
    const monthDay = text.match(new RegExp(`\b(${monthNames.join('|')})\s+(\d{1,2})(st|nd|rd|th)?\b`,'i'));
    if (monthDay) {
      let monthIdx = monthNames.indexOf(monthDay[1].toLowerCase()) % 12; // 0-based
      const dNum = parseInt(monthDay[2],10);
      const year = now.getFullYear();
      return `${year}-${String(monthIdx+1).padStart(2,'0')}-${String(dNum).padStart(2,'0')}`;
    }
    // Ordinal only: on the 5th / the 12th
    const dayOnly = text.match(/\b(on\s+)?(the\s+)?(\d{1,2})(st|nd|rd|th)\b/);
    if (dayOnly) {
      const dNum = parseInt(dayOnly[3],10);
      const d=new Date(now);
      if (dNum < now.getDate()) { // passed this month -> next month
        d.setMonth(d.getMonth()+1); d.setDate(1);
      }
      d.setDate(dNum);
      return formatDate(d);
    }
    return null;
  }

  const parsedDate = parseNaturalDate(lower);
  if (parsedDate) updated.date = parsedDate;

  // 3. Time (support noon/midnight + multiple patterns; last occurrence wins)
  if (/\bnoon\b/.test(lower)) updated.time = '12:00';
  if (/\b(midnight|12am)\b/.test(lower)) updated.time = '00:00';
  const timePatterns: RegExp[] = [
    /(\d{1,2}):(\d{2})\s*(am|pm)?/gi,
    /(\d{1,2})\s*(am|pm)\b/gi,
    /at\s*(\d{1,2})(?:[:](\d{2}))?\s*(am|pm)?/gi
  ];
  let timeCandidate: { h: number; m: number; ampm: string | null } | null = null;
  for (const pat of timePatterns) {
    let m: RegExpExecArray | null;
    while ((m = pat.exec(lower)) !== null) {
      let hour: number; let minute: number; let ampm: string | null = null;
      if (pat === timePatterns[0]) { // HH:MM am/pm?
        hour = parseInt(m[1],10);
        minute = parseInt(m[2],10);
        ampm = (m[3]||null) as string | null;
      } else if (pat === timePatterns[1]) { // HH am/pm
        hour = parseInt(m[1],10);
        minute = 0;
        ampm = (m[2]||null) as string | null;
      } else { // at HH(:MM)? am/pm?
        hour = parseInt(m[1],10);
        minute = m[2] ? parseInt(m[2],10) : 0;
        ampm = (m[3]||null) as string | null;
      }
      if (!ampm) {
        // heuristic: typical dining context
        if (hour === 9) ampm = 'am';
        else if (hour >= 1 && hour <= 8) ampm = 'pm';
        else if (hour === 10) ampm = 'pm';
        else if (hour === 11) ampm = 'am';
        else if (hour === 12) ampm = 'pm';
      }
      timeCandidate = { h: hour, m: minute, ampm };
    }
  }
  if (timeCandidate) {
    let { h, m, ampm } = timeCandidate;
    if (ampm) {
      if (ampm === 'pm' && h < 12) h += 12;
      if (ampm === 'am' && h === 12) h = 0;
    }
    if (h >= 0 && h <= 23 && m >=0 && m <=59) {
      updated.time = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    }
  }

  // 4. Name detection (conservative overwrite)
  let detectedName: string | null = null;
  const confirmationWords = [ 'yes','yeah','yep','yup','no','nope','sure','ok','okay','confirm','confirmed','correct','right','absolutely','of course','please','thanks','thank you' ];
  const dateTimeWords = [ 'tomorrow','tmrw','tmr','today','tonight','morning','afternoon','evening','night', 'monday','tuesday','wednesday','thursday','friday','saturday','sunday', 'january','february','march','april','may','june','july','august','september','october','november','december','jan','feb','mar','apr','may','jun','jul','aug','sep','sept','oct','nov','dec' ];
  const partySizeWords = Object.keys(numberWords).concat(['1','2','3','4','5','6','7','8','9','10','11','12']);
  const intentStopWords = new Set<string>([ 'i','need','want','wanna','would','like','to','make','book','booking','a','table','reservation','res','party','of','for','fo','at','on','tomorrow','today','tonight','tmrw','tmr','please','pls','thanks','thank','you','and','is','name','names' ]);

  function sanitizeNameCandidate(raw: string): string | null {
    // Remove leading punctuation
    raw = raw.replace(/^[,\s]+/, '').trim();
    // Tokenize; keep alphabetic tokens until a stop/ineligible token
    const tokens = raw.split(/\s+/);
    const kept: string[] = [];
    for (const t of tokens) {
      const lowerT = t.toLowerCase().replace(/[^a-z\-']/g,'');
      if (!lowerT) break;
      if (intentStopWords.has(lowerT)) break; // stop at intent words
      if (confirmationWords.includes(lowerT)) break;
      if (dateTimeWords.includes(lowerT)) break;
      if (partySizeWords.includes(lowerT)) break;
      // Require starts with letter
      if (!/^[a-z][a-z\-']*$/i.test(lowerT)) break;
      // Capitalize original form for nicer display (simple cap of first char)
      const formatted = t.charAt(0).toUpperCase() + t.slice(1);
      kept.push(formatted);
      if (kept.length === 3) break; // limit length
    }
    if (kept.length === 0) return null;
    const candidate = kept.join(' ');
    if (candidate.length < 2) return null;
    return candidate;
  }

  // Support variants: "my name is", "my name's", "my names" (common casual typos)
  const nameMatch = original.match(/my name'?s?\s+([a-zA-Z\s\-']{2,})/i) || original.match(/(?:^|[\s,])name\s*is\s+([a-zA-Z\s\-']{2,})/i);
  if (nameMatch) {
    detectedName = sanitizeNameCandidate(nameMatch[1].trim());
  } else {
    // Try pattern: I'm Bob / I am Bob
    const iamMatch = original.match(/i\s*(am|'m)\s+([^,\n]{1,60})/i) || original.match(/im\s+([^,\n]{1,60})/i);
    if (iamMatch) {
      const tail = (iamMatch[2] || iamMatch[1] || '').trim();
      const candidate = sanitizeNameCandidate(tail);
      if (candidate) detectedName = candidate;
    }
  }
  if (!detectedName) {
    // Fallback standalone name if short message
    const simple = original.trim();
    const lowerSimple = simple.toLowerCase();
    const containsNameCue = /(^|\s)(name|'?s|is)\b/i.test(simple);
    if (!containsNameCue && /^[a-zA-Z][a-zA-Z\s\-']{1,40}$/.test(simple) && simple.split(/\s+/).length <=3 && !confirmationWords.includes(lowerSimple) && !dateTimeWords.includes(lowerSimple) && !partySizeWords.includes(lowerSimple) ) {
      detectedName = simple;
    }
  }
  if (detectedName && !updated.customerName) updated.customerName = detectedName;

  // 5. Email
  const emailMatch = original.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) updated.email = emailMatch[0];

  // 6. Phone
  const phoneMatch = original.match(/(\+?1[\s.-]?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
  if (phoneMatch) updated.phone = phoneMatch[0];

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
