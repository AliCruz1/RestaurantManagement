-- SQL to run in your Supabase dashboard to fix reservation deletion issues
-- This creates an admin function that bypasses RLS for reservation deletion

-- 1. Create an admin function to delete reservations (bypasses RLS)
CREATE OR REPLACE FUNCTION admin_delete_reservation(reservation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with elevated privileges
AS $$
BEGIN
  -- Delete the reservation directly (bypasses RLS)
  DELETE FROM public.reservations 
  WHERE id = reservation_id;
  
  -- Return true if deletion was successful
  RETURN FOUND;
END;
$$;

-- 2. Grant execute permission to authenticated users (so admin can call it)
GRANT EXECUTE ON FUNCTION admin_delete_reservation TO authenticated;

-- 3. Optional: Update RLS policies to allow admins to delete reservations
-- Check if there's already an admin role policy
DO $$
BEGIN
  -- Create policy for admin users to delete any reservation
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reservations' 
    AND policyname = 'Admin can delete any reservation'
  ) THEN
    CREATE POLICY "Admin can delete any reservation" 
    ON public.reservations 
    FOR DELETE 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
      )
    );
  END IF;
END $$;

-- 4. Optional: If you want to allow admins to update any reservation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reservations' 
    AND policyname = 'Admin can update any reservation'
  ) THEN
    CREATE POLICY "Admin can update any reservation" 
    ON public.reservations 
    FOR UPDATE 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
      )
    );
  END IF;
END $$;

-- 5. Optional: Allow admins to read all reservations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reservations' 
    AND policyname = 'Admin can view all reservations'
  ) THEN
    CREATE POLICY "Admin can view all reservations" 
    ON public.reservations 
    FOR SELECT 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
      )
    );
  END IF;
END $$;

-- 6. Verify the function was created
SELECT proname, proargnames, prosrc 
FROM pg_proc 
WHERE proname = 'admin_delete_reservation';
