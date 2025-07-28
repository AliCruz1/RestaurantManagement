#!/usr/bin/env node

// Email System Test Script
// Run with: node test-email-system.js

const testEmailSystem = async () => {
  console.log('🧪 Testing Email System...\n');

  try {
    // Test 1: Check if email processing API is accessible
    console.log('1️⃣ Testing email processing API...');
    const response = await fetch('http://localhost:3001/api/process-email-queue', {
      method: 'POST',
      headers: {
        'x-api-key': 'hostmate-email-processor-2025',
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Email processing API working!');
      console.log('📊 Result:', result);
    } else {
      console.log('⚠️ Email processing API responded with:', response.status);
      const error = await response.text();
      console.log('Error:', error);
    }

  } catch (error) {
    console.log('❌ Error testing email system:', error.message);
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Run the SQL from supabase-email-queue.sql in your Supabase dashboard');
  console.log('2. Make a test reservation to queue an email');
  console.log('3. Call the email processor API to process queued emails');
  console.log('4. Check email_queue table in Supabase to see results');
};

testEmailSystem();
