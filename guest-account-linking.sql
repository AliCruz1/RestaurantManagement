-- Step 6: Account linking for guest reservations
-- This automatically links guest reservations to new user accounts with matching emails

-- 1. Create function to link guest reservations to new user accounts
CREATE OR REPLACE FUNCTION link_guest_reservations_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new user profile is created, link any existing guest reservations
  -- with the same email address to this user account
  
  UPDATE public.reservations 
  SET 
    user_id = NEW.id,
    -- Move guest data to user fields
    name = COALESCE(guest_name, name),
    email = COALESCE(guest_email, email), 
    phone = COALESCE(guest_phone, phone),
    -- Clear guest fields since they're now linked to a user
    guest_name = NULL,
    guest_email = NULL,
    guest_phone = NULL
  WHERE 
    user_id IS NULL 
    AND guest_email = NEW.email
    AND guest_email IS NOT NULL;
    
  -- Log the linking operation (optional, for debugging)
  INSERT INTO public.user_activity_log (user_id, action, details, created_at)
  VALUES (
    NEW.id, 
    'guest_reservations_linked', 
    'Linked guest reservations to new user account',
    NOW()
  ) ON CONFLICT DO NOTHING; -- Ignore if table doesn't exist
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger on profiles table for new user accounts
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_link_guest_reservations ON public.profiles;

-- Create trigger for when new profiles are created
CREATE TRIGGER trigger_link_guest_reservations
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_guest_reservations_to_user();

-- 3. Create a manual function for admins to link reservations
CREATE OR REPLACE FUNCTION admin_link_guest_reservations(
  user_email TEXT,
  target_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  linked_count INTEGER;
BEGIN
  -- Update guest reservations to link them to the specified user
  UPDATE public.reservations 
  SET 
    user_id = target_user_id,
    name = COALESCE(guest_name, name),
    email = COALESCE(guest_email, email),
    phone = COALESCE(guest_phone, phone),
    guest_name = NULL,
    guest_email = NULL,
    guest_phone = NULL
  WHERE 
    user_id IS NULL 
    AND guest_email = user_email
    AND guest_email IS NOT NULL;
    
  GET DIAGNOSTICS linked_count = ROW_COUNT;
  
  RETURN linked_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Create function to check for linkable reservations (for UI)
CREATE OR REPLACE FUNCTION get_linkable_reservations(user_email TEXT)
RETURNS TABLE (
  id UUID,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  party_size INTEGER,
  datetime TIMESTAMP WITH TIME ZONE,
  status TEXT,
  reservation_token TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.guest_name,
    r.guest_email,
    r.guest_phone,
    r.party_size,
    r.datetime,
    r.status,
    r.reservation_token
  FROM public.reservations r
  WHERE 
    r.user_id IS NULL 
    AND r.guest_email = user_email
    AND r.guest_email IS NOT NULL
    AND r.status != 'cancelled'
  ORDER BY r.datetime DESC;
END;
$$ LANGUAGE plpgsql;

-- 5. Add RLS policies for linked reservations (allow users to see their linked reservations)
-- This enhances the existing policies to work with linked reservations
CREATE POLICY "Users can view linked reservations" 
ON public.reservations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Note: The existing policies should handle most cases, but this ensures explicit access
