// Simple verification using fetch to our API
async function verifyDeletion() {
  console.log('🔍 Checking if chicken tenders was deleted...\n');

  try {
    // Use our existing API endpoint to check inventory
    const response = await fetch('http://localhost:3001/api/verify-deletion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        searchTerm: 'chicken tender'
      })
    });

    if (!response.ok) {
      // If the API doesn't exist, that's fine - we'll create a simpler check
      console.log('ℹ️  API endpoint not found, creating alternative verification...');
      return;
    }

    const result = await response.json();
    
    if (result.found) {
      console.log('⚠️  Chicken tenders still exists in database!');
      console.log('   Item details:', result.item);
    } else {
      console.log('✅ SUCCESS: Chicken tenders was successfully deleted from Supabase!');
    }

  } catch (error) {
    console.log('ℹ️  Direct API check failed, will create verification endpoint...');
    console.log('   Error:', error.message);
  }
}

verifyDeletion();
