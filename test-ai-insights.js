// Test AI insights generation without external deps
async function testInsights() {
  try {
    console.log('🔍 Testing AI Insights Generation...\n');

    // Make AI insights request directly to the API
    const response = await fetch('http://localhost:3000/api/inventory-insights', {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test-admin-id' // This will fail auth, but we can see the response structure
      }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testInsights();
