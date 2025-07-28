-- Fix the guest reservation constraint to be more flexible
-- Allow guest reservations with either email OR phone (not requiring both)

-- 1. Drop the existing overly restrictive constraint
ALTER TABLE public.reservations 
DROP CONSTRAINT IF EXISTS check_reservation_owner;

-- 2. Add a more flexible constraint that allows either email OR phone for guests
ALTER TABLE public.reservations 
ADD CONSTRAINT check_reservation_owner 
CHECK (
  (user_id IS NOT NULL) OR 
  (guest_name IS NOT NULL AND (guest_email IS NOT NULL OR guest_phone IS NOT NULL))
);

-- This allows guests to provide either:
-- - name + email (phone optional)
-- - name + phone (email optional)
-- - name + email + phone (both provided)
