// Simple test to get admin user ID
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getAdminUser() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, role, email')
    .eq('role', 'admin')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Admin users:', profiles);
  
  if (profiles && profiles.length > 0) {
    return profiles[0].id;
  }
}

getAdminUser().then(adminId => {
  if (adminId) {
    console.log('Admin ID:', adminId);
  } else {
    console.log('No admin user found');
  }
}).catch(console.error);
