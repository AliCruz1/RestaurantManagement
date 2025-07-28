-- 🔧 COMPLETE DATABASE SETUP FOR HOSTMATE
-- This script adds all missing columns and functions for guest reservations
-- Copy this entire script and run it in your Supabase SQL Editor

-- 1. Make user_id nullable to support guest reservations
ALTER TABLE public.reservations 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add guest contact fields (these will be used when user_id is null)
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS guest_email TEXT,
ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- 3. Add reservation token for secure guest access
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS reservation_token TEXT UNIQUE;

-- 4. Create function to generate secure tokens
CREATE OR REPLACE FUNCTION generate_reservation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to auto-generate tokens for new reservations
CREATE OR REPLACE FUNCTION set_reservation_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reservation_token IS NULL THEN
    NEW.reservation_token = generate_reservation_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_set_reservation_token ON public.reservations;

-- Create trigger for new reservations
CREATE TRIGGER trigger_set_reservation_token
  BEFORE INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION set_reservation_token();

-- 6. Backfill tokens for existing reservations
UPDATE public.reservations 
SET reservation_token = generate_reservation_token()
WHERE reservation_token IS NULL;

-- 7. Add a constraint to ensure either user_id OR guest contact info is provided
ALTER TABLE public.reservations 
DROP CONSTRAINT IF EXISTS check_reservation_owner;
ALTER TABLE public.reservations 
ADD CONSTRAINT check_reservation_owner 
CHECK (
  (user_id IS NOT NULL) OR 
  (guest_name IS NOT NULL AND guest_email IS NOT NULL AND guest_phone IS NOT NULL)
);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reservations_guest_email 
ON public.reservations(guest_email) 
WHERE guest_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_token 
ON public.reservations(reservation_token);

-- 9. Update RLS policies to allow guest reservations
-- Allow anyone to create reservations (guests or authenticated users)
DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Anyone can create reservations" ON public.reservations;
CREATE POLICY "Anyone can create reservations" 
ON public.reservations 
FOR INSERT 
WITH CHECK (true);

-- Allow users to view their own reservations OR guests to view by token
DROP POLICY IF EXISTS "Users can view their own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can view their own reservations or guests by email" ON public.reservations;
CREATE POLICY "Users can view their own reservations or guests by token" 
ON public.reservations 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  reservation_token IS NOT NULL
);

-- Allow users to update their own reservations OR guests to update by token
DROP POLICY IF EXISTS "Users can update their own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Guests can update reservations by token" ON public.reservations;
CREATE POLICY "Users can update their own reservations or guests by token" 
ON public.reservations 
FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  reservation_token IS NOT NULL
);

-- 10. Create email queue table (if not exists)
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('confirmation', 'cancellation')),
  reservation_id UUID REFERENCES public.reservations(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- 11. Enable RLS on email queue
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- 12. Create email queue policies
DROP POLICY IF EXISTS "Service role can manage email queue" ON public.email_queue;
CREATE POLICY "Service role can manage email queue" 
ON public.email_queue 
FOR ALL 
USING (auth.role() = 'service_role');

-- 13. Create functions for email and guest linking
CREATE OR REPLACE FUNCTION queue_email(
  p_to_email TEXT,
  p_subject TEXT,
  p_body TEXT,
  p_email_type TEXT,
  p_reservation_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  email_id UUID;
BEGIN
  INSERT INTO public.email_queue (
    to_email,
    subject,
    body,
    email_type,
    reservation_id
  ) VALUES (
    p_to_email,
    p_subject,
    p_body,
    p_email_type,
    p_reservation_id
  ) RETURNING id INTO email_id;
  
  RETURN email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

CREATE OR REPLACE FUNCTION admin_link_guest_reservations(
  user_email TEXT,
  target_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  linked_count INTEGER;
BEGIN
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

-- 14. Create analytics function for the analytics page
CREATE OR REPLACE FUNCTION get_reservations_per_day()
RETURNS TABLE (
  day TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(DATE(datetime), 'YYYY-MM-DD') as day,
    COUNT(*) as count
  FROM public.reservations
  WHERE status != 'cancelled'
  GROUP BY DATE(datetime)
  ORDER BY DATE(datetime);
END;
$$ LANGUAGE plpgsql;

-- 15. Grant permissions
GRANT EXECUTE ON FUNCTION queue_email TO authenticated;
GRANT EXECUTE ON FUNCTION queue_email TO anon;
GRANT EXECUTE ON FUNCTION get_linkable_reservations TO authenticated;
GRANT EXECUTE ON FUNCTION get_linkable_reservations TO anon;
GRANT EXECUTE ON FUNCTION admin_link_guest_reservations TO authenticated;
GRANT EXECUTE ON FUNCTION get_reservations_per_day TO authenticated;
GRANT EXECUTE ON FUNCTION get_reservations_per_day TO anon;

-- 16. Test with a sample guest reservation (optional)
-- This will verify everything is working
INSERT INTO public.reservations (
  guest_name,
  guest_email, 
  guest_phone,
  party_size,
  datetime,
  status
) VALUES (
  'Test Guest',
  'test@guest.com',
  '555-0123',
  2,
  NOW() + INTERVAL '1 day',
  'confirmed'
) ON CONFLICT DO NOTHING;
