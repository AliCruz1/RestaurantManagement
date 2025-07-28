-- 📧 EMAIL QUEUE SETUP FOR HOSTMATE
-- Copy this entire script and paste it into your Supabase SQL Editor
-- Then click "Run" to create the email system

-- 1. Create email_queue table
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

-- 2. Enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for service role access only
CREATE POLICY "Service role can manage email queue" 
ON public.email_queue 
FOR ALL 
USING (auth.role() = 'service_role');

-- 4. Create index for processing emails
CREATE INDEX IF NOT EXISTS idx_email_queue_status_created 
ON public.email_queue(status, created_at);

-- 5. Create function to queue email
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

-- 6. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION queue_email TO authenticated;
GRANT EXECUTE ON FUNCTION queue_email TO anon;

-- 7. Create function to check for linkable reservations (for guest account linking)
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

-- 8. Create function for manual linking of guest reservations
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

-- 9. Grant execute permissions for linking functions
GRANT EXECUTE ON FUNCTION get_linkable_reservations TO authenticated;
GRANT EXECUTE ON FUNCTION get_linkable_reservations TO anon;
GRANT EXECUTE ON FUNCTION admin_link_guest_reservations TO authenticated;

-- 10. Insert a test email to verify everything works
SELECT queue_email(
  'test@hostmate.com',
  'HostMate Email System - Setup Complete!',
  'Congratulations! Your email queue system is now active and ready to process reservation confirmations and cancellations.',
  'confirmation'
);
