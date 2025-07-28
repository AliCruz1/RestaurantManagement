import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    // Get API key from headers for security
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.EMAIL_PROCESSOR_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pending emails from queue
    const { data: emails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10); // Process 10 emails at a time

    if (fetchError) {
      console.error('Failed to fetch emails:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
    }

    const results = [];

    for (const email of emails || []) {
      try {
        // Simulate email sending (in production, integrate with Resend/SendGrid)
        console.log(`Processing email ${email.id} to ${email.to_email}`);
        console.log(`Subject: ${email.subject}`);
        console.log(`Type: ${email.email_type}`);
        
        // Mark as sent
        const { error: updateError } = await supabase
          .from('email_queue')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString() 
          })
          .eq('id', email.id);

        if (updateError) {
          throw updateError;
        }
        
        results.push({ id: email.id, status: 'sent' });
        
      } catch (emailError) {
        console.error(`Failed to process email ${email.id}:`, emailError);
        
        // Mark as failed
        await supabase
          .from('email_queue')
          .update({ 
            status: 'failed', 
            error_message: emailError instanceof Error ? emailError.message : 'Unknown error'
          })
          .eq('id', email.id);
        
        results.push({ 
          id: email.id, 
          status: 'failed', 
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: results.length,
      results 
    });

  } catch (error) {
    console.error('Email processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
