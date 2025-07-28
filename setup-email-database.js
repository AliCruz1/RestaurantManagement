#!/usr/bin/env node

// Auto-setup email queue database schema
// This will create the email_queue table and functions in your Supabase database

const setupEmailDatabase = async () => {
  console.log('🔧 Setting up email queue database schema...\n');

  const SUPABASE_URL = 'https://yorecwmfjzseldpldgjp.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvcmVjd21manpzZWxkcGxkZ2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNDE5MDIsImV4cCI6MjA2ODgxNzkwMn0.UMpg5hktRx5jAgxkvAArDJnhMbIIVRdw7JOU3RoPW2Y';
  
  try {
    // Test 1: Check if email_queue table exists
    console.log('1️⃣ Checking if email_queue table exists...');
    
    const checkTableResponse = await fetch(`${SUPABASE_URL}/rest/v1/email_queue?limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (checkTableResponse.status === 200) {
      console.log('✅ Email queue table already exists!');
      
      // Test the queue_email function
      console.log('\n2️⃣ Testing queue_email function...');
      
      const testEmailResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/queue_email`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_to_email: 'test@example.com',
          p_subject: 'Test Email',
          p_body: 'This is a test email from the queue system.',
          p_email_type: 'confirmation'
        }),
      });

      if (testEmailResponse.ok) {
        const result = await testEmailResponse.text();
        console.log('✅ Successfully queued test email! ID:', result);
        
        // Now test the email processor
        console.log('\n3️⃣ Testing email processor...');
        
        const processResponse = await fetch('http://localhost:3001/api/process-email-queue', {
          method: 'POST',
          headers: {
            'x-api-key': 'hostmate-email-processor-2025',
            'Content-Type': 'application/json',
          },
        });

        if (processResponse.ok) {
          const processResult = await processResponse.json();
          console.log('✅ Email processor working!');
          console.log('📊 Processed:', processResult.processed, 'emails');
          console.log('📊 Results:', processResult.results);
        } else {
          console.log('⚠️ Email processor issue:', processResponse.status);
        }
        
      } else {
        console.log('⚠️ queue_email function test failed:', testEmailResponse.status);
        const error = await testEmailResponse.text();
        console.log('Error:', error);
      }
      
    } else if (checkTableResponse.status === 404) {
      console.log('❌ Email queue table does not exist');
      console.log('\n📋 Manual Setup Required:');
      console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/projects');
      console.log('2. Open your project: yorecwmfjzseldpldgjp');
      console.log('3. Go to SQL Editor');
      console.log('4. Copy and paste the contents of supabase-email-queue.sql');
      console.log('5. Run the SQL to create the email_queue table');
      console.log('6. Run this script again to test');
      
    } else {
      console.log('⚠️ Unexpected response:', checkTableResponse.status);
      const error = await checkTableResponse.text();
      console.log('Error:', error);
    }

  } catch (error) {
    console.log('❌ Error setting up email database:', error.message);
    console.log('\n📋 Manual Setup Instructions:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy contents of supabase-email-queue.sql');
    console.log('3. Run the SQL script');
    console.log('4. Test again with: node setup-email-database.js');
  }
};

setupEmailDatabase();
