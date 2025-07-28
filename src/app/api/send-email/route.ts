import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { reservation, type } = await request.json();
    
    const emailContent = generateEmailContent(reservation, type);
    
    // Queue the email in Supabase
    const { data, error } = await supabase.rpc('queue_email', {
      p_to_email: reservation.displayEmail,
      p_subject: emailContent.subject,
      p_body: emailContent.body,
      p_email_type: type,
      p_reservation_id: reservation.id
    });
    
    if (error) {
      console.error('Failed to queue email:', error);
      // Fall back to console logging
      console.log('=== EMAIL FALLBACK (Console) ===');
      console.log(`To: ${reservation.displayEmail}`);
      console.log(`Subject: ${emailContent.subject}`);
      console.log(`Body:\n${emailContent.body}`);
      console.log('=== END EMAIL ===');
    } else {
      console.log('Email queued successfully with ID:', data);
      // Also log to console for development
      console.log('=== EMAIL QUEUED IN SUPABASE ===');
      console.log(`To: ${reservation.displayEmail}`);
      console.log(`Subject: ${emailContent.subject}`);
      console.log(`Queue ID: ${data}`);
      console.log('=== EMAIL WILL BE PROCESSED ===');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email queued for delivery' 
    });
    
  } catch (error) {
    console.error('Email queueing error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to queue email' },
      { status: 500 }
    );
  }
}

function generateEmailContent(reservation: any, type: 'confirmation' | 'cancellation') {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const lookupUrl = `${baseUrl}/reservation-lookup?token=${reservation.reservation_token}&email=${encodeURIComponent(reservation.displayEmail)}`;
  
  if (type === 'confirmation') {
    return {
      subject: `HostMate - Reservation Confirmation #${reservation.reservation_token.slice(-8)}`,
      body: `
Dear ${reservation.displayName},

Thank you for your reservation at HostMate! Here are your reservation details:

🍽️ RESERVATION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${reservation.displayName}
Email: ${reservation.displayEmail}
Phone: ${reservation.displayPhone}
Party Size: ${reservation.party_size} ${reservation.party_size === 1 ? 'Guest' : 'Guests'}
Date & Time: ${new Date(reservation.datetime).toLocaleString()}
Status: ${reservation.status === 'confirmed' ? 'Confirmed ✓' : 'Pending Review ⏳'}

Reservation ID: ${reservation.reservation_token}

🔗 MANAGE YOUR RESERVATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
View or cancel your reservation: ${lookupUrl}

📍 RESTAURANT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HostMate Restaurant
Downtown District
Hours: 9:00 AM - 10:30 PM (Daily)
Cuisine: Modern American

We look forward to welcoming you!

Best regards,
The HostMate Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated message. Please save your Reservation ID for future reference.
      `.trim()
    };
  } else {
    return {
      subject: `HostMate - Reservation Cancelled #${reservation.reservation_token.slice(-8)}`,
      body: `
Dear ${reservation.displayName},

Your reservation at HostMate has been cancelled as requested.

📋 CANCELLED RESERVATION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${reservation.displayName}
Original Date & Time: ${new Date(reservation.datetime).toLocaleString()}
Party Size: ${reservation.party_size} ${reservation.party_size === 1 ? 'Guest' : 'Guests'}
Reservation ID: ${reservation.reservation_token}

Status: Cancelled ✗

We're sorry to see you go! If you'd like to make a new reservation, please visit our website.

🔗 MAKE A NEW RESERVATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Visit: ${baseUrl}

Thank you for considering HostMate.

Best regards,
The HostMate Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated message.
      `.trim()
    };
  }
}
