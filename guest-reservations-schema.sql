-- Step 1: Add guest reservation support to reservations table
-- This allows reservations without requiring user accounts

-- 1. Make user_id nullable to support guest reservations
ALTER TABLE public.reservations 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add guest contact fields (these will be used when user_id is null)
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS guest_email TEXT,
ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- 3. Add a constraint to ensure either user_id OR guest contact info is provided
ALTER TABLE public.reservations 
ADD CONSTRAINT check_reservation_owner 
CHECK (
  (user_id IS NOT NULL) OR 
  (guest_name IS NOT NULL AND guest_email IS NOT NULL AND guest_phone IS NOT NULL)
);

-- 4. Create an index for guest email lookups (for reservation management)
CREATE INDEX IF NOT EXISTS idx_reservations_guest_email 
ON public.reservations(guest_email) 
WHERE guest_email IS NOT NULL;

-- 5. Update RLS policies to allow guest reservations
-- Allow anyone to create reservations (guests or authenticated users)
DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;
CREATE POLICY "Anyone can create reservations" 
ON public.reservations 
FOR INSERT 
WITH CHECK (true);

-- Allow users to view their own reservations OR guests to view by email
DROP POLICY IF EXISTS "Users can view their own reservations" ON public.reservations;
CREATE POLICY "Users can view their own reservations or guests by email" 
ON public.reservations 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (user_id IS NULL AND guest_email = current_setting('request.jwt.claims', true)::json->>'email')
);

-- Admin policies (if they exist) remain unchanged - admins can see all reservations
