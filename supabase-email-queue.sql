-- Create email queue system for Supabase
-- This allows us to queue emails and process them with Edge Functions

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
