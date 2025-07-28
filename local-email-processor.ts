// Local Deno version of the email processor
// Run with: deno run --allow-net --allow-env local-email-processor.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Use your environment variables
    const supabaseUrl = 'https://yorecwmfjzseldpldgjp.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvcmVjd21manpzZWxkcGxkZ2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNDE5MDIsImV4cCI6MjA2ODgxNzkwMn0.UMpg5hktRx5jAgxkvAArDJnhMbIIVRdw7JOU3RoPW2Y';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get pending emails from queue
    const { data: emails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      throw fetchError;
    }

    const results = [];

    for (const email of emails || []) {
      try {
        console.log(`🚀 Processing email ${email.id} to ${email.to_email}`);
        console.log(`📧 Subject: ${email.subject}`);
        console.log(`🏷️ Type: ${email.email_type}`);
        
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        
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
        
        console.log(`✅ Email ${email.id} sent successfully!`);
        results.push({ id: email.id, status: 'sent' });
        
      } catch (emailError) {
        console.error(`❌ Failed to process email ${email.id}:`, emailError);
        
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

    const response = {
      success: true,
      processed: results.length,
      results,
      message: `Processed ${results.length} emails successfully`,
      timestamp: new Date().toISOString()
    };

    console.log(`📊 Summary: Processed ${results.length} emails`);
    
    return new Response(
      JSON.stringify(response, null, 2),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error processing emails:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }, null, 2),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

console.log('🚀 Starting Deno Email Processor...');
console.log('📧 Email processing server running on http://localhost:8000');
console.log('🔗 Test it by visiting: http://localhost:8000');
console.log('');

serve(handler, { port: 8000 });
