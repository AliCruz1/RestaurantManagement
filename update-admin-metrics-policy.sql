-- Update RLS policy to allow all admins to see all metrics data
-- This allows admins to view the same "Saved Metrics History"

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can manage their own metrics" ON public.daily_metrics;

-- Create new policy that allows:
-- 1. Users to manage their own metrics
-- 2. Admins to view ALL metrics (from any user)
CREATE POLICY "Users can manage metrics based on role" ON public.daily_metrics
  FOR ALL USING (
    auth.uid() = user_id OR 
    (auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ))
  );
