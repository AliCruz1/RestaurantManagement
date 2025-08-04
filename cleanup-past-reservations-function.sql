-- Create a server function to cleanup past reservations
-- This function runs with elevated privileges and can bypass RLS
-- Copy and paste this into your Supabase SQL Editor

-- 1. Create the cleanup function
CREATE OR REPLACE FUNCTION cleanup_past_reservations()
RETURNS TABLE (
  deleted_count INTEGER,
  deleted_reservations JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
DECLARE
  cutoff_date TIMESTAMP WITH TIME ZONE;
  deleted_data JSONB;
  count_deleted INTEGER;
BEGIN
  -- Get current date at midnight UTC
  cutoff_date := DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC');
  
  -- First, delete related email_queue entries to avoid foreign key constraint violations
  DELETE FROM public.email_queue 
  WHERE reservation_id IN (
    SELECT id FROM public.reservations 
    WHERE datetime < cutoff_date
  );
  
  -- Delete past reservations and capture the deleted data
  WITH deleted AS (
    DELETE FROM public.reservations 
    WHERE datetime < cutoff_date
    RETURNING id, datetime, 
             COALESCE(name, guest_name) as reservation_name,
             COALESCE(email, guest_email) as reservation_email,
             status, party_size
  )
  SELECT 
    COUNT(*)::INTEGER,
    COALESCE(JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', id,
        'datetime', datetime,
        'name', reservation_name,
        'email', reservation_email,
        'status', status,
        'party_size', party_size
      )
    ), '[]'::JSON)::JSONB
  INTO count_deleted, deleted_data
  FROM deleted;
  
  -- Return the results
  RETURN QUERY SELECT count_deleted, deleted_data;
END;
$$;

-- 2. Grant execute permission to authenticated users and anon
GRANT EXECUTE ON FUNCTION cleanup_past_reservations() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_past_reservations() TO anon;

-- 3. Create a function to preview what would be deleted (without actually deleting)
CREATE OR REPLACE FUNCTION preview_cleanup_past_reservations()
RETURNS TABLE (
  count_to_delete INTEGER,
  reservations_to_delete JSONB,
  cutoff_date TIMESTAMP WITH TIME ZONE,
  email_queue_entries_to_delete INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cutoff TIMESTAMP WITH TIME ZONE;
  preview_data JSONB;
  count_preview INTEGER;
  email_count INTEGER;
BEGIN
  -- Get current date at midnight UTC
  cutoff := DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC');
  
  -- Count email queue entries that would be deleted
  SELECT COUNT(*)::INTEGER INTO email_count
  FROM public.email_queue 
  WHERE reservation_id IN (
    SELECT id FROM public.reservations 
    WHERE datetime < cutoff
  );
  
  -- Preview what would be deleted
  SELECT 
    COUNT(*)::INTEGER,
    COALESCE(JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', id,
        'datetime', datetime,
        'name', COALESCE(name, guest_name),
        'email', COALESCE(email, guest_email),
        'status', status,
        'party_size', party_size
      )
    ), '[]'::JSON)::JSONB
  INTO count_preview, preview_data
  FROM public.reservations 
  WHERE datetime < cutoff;
  
  -- Return the preview results
  RETURN QUERY SELECT count_preview, preview_data, cutoff, email_count;
END;
$$;

-- 4. Grant execute permission for preview function
GRANT EXECUTE ON FUNCTION preview_cleanup_past_reservations() TO authenticated;
GRANT EXECUTE ON FUNCTION preview_cleanup_past_reservations() TO anon;

-- 5. Test the preview function
SELECT * FROM preview_cleanup_past_reservations();
