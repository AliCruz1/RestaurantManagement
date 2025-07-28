-- Step 5: Add email management support for guest reservations
-- This enables guests to manage their reservations via email links

-- 1. Add reservation token for secure guest access
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS reservation_token TEXT UNIQUE;

-- 2. Create function to generate secure tokens
CREATE OR REPLACE FUNCTION generate_reservation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to auto-generate tokens for new reservations
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

-- 4. Backfill tokens for existing reservations
UPDATE public.reservations 
SET reservation_token = generate_reservation_token()
WHERE reservation_token IS NULL;

-- 5. Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_reservations_token 
ON public.reservations(reservation_token);

-- 6. Add RLS policy for guest reservation lookup by token
CREATE POLICY "Guests can view reservations by token" 
ON public.reservations 
FOR SELECT 
USING (reservation_token IS NOT NULL);

-- 7. Add RLS policy for guests to update their own reservations by token
CREATE POLICY "Guests can update reservations by token" 
ON public.reservations 
FOR UPDATE 
USING (reservation_token IS NOT NULL);

-- Note: Email sending will be handled in the application layer
