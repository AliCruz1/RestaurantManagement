-- Analytics functions for the reservation system
-- These functions provide data for charts and analytics dashboards

-- 1. Create function to get reservations per day (including guest reservations)
CREATE OR REPLACE FUNCTION get_reservations_per_day()
RETURNS TABLE (
  day DATE,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(datetime) as day,
    COUNT(*) as count
  FROM public.reservations
  WHERE status != 'cancelled'
  GROUP BY DATE(datetime)
  ORDER BY day;
END;
$$;

-- 2. Create function to get reservations per hour for a specific date
CREATE OR REPLACE FUNCTION get_reservations_per_hour(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  hour INTEGER,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(hour FROM datetime)::INTEGER as hour,
    COUNT(*) as count
  FROM public.reservations
  WHERE DATE(datetime) = target_date
    AND status != 'cancelled'
  GROUP BY EXTRACT(hour FROM datetime)
  ORDER BY hour;
END;
$$;

-- 3. Create function to get party size distribution
CREATE OR REPLACE FUNCTION get_party_size_distribution()
RETURNS TABLE (
  party_size INTEGER,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.party_size,
    COUNT(*) as count
  FROM public.reservations r
  WHERE status != 'cancelled'
  GROUP BY r.party_size
  ORDER BY r.party_size;
END;
$$;

-- 4. Create function to get reservation status breakdown
CREATE OR REPLACE FUNCTION get_reservation_status_breakdown()
RETURNS TABLE (
  status TEXT,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.status,
    COUNT(*) as count
  FROM public.reservations r
  GROUP BY r.status
  ORDER BY count DESC;
END;
$$;

-- 5. Create function to get guest vs user reservation breakdown
CREATE OR REPLACE FUNCTION get_guest_vs_user_breakdown()
RETURNS TABLE (
  reservation_type TEXT,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN user_id IS NULL THEN 'Guest'
      ELSE 'Registered User'
    END as reservation_type,
    COUNT(*) as count
  FROM public.reservations
  WHERE status != 'cancelled'
  GROUP BY (user_id IS NULL)
  ORDER BY count DESC;
END;
$$;

-- Grant execute permissions to authenticated users (admins can call these)
GRANT EXECUTE ON FUNCTION get_reservations_per_day TO authenticated;
GRANT EXECUTE ON FUNCTION get_reservations_per_hour TO authenticated;
GRANT EXECUTE ON FUNCTION get_party_size_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION get_reservation_status_breakdown TO authenticated;
GRANT EXECUTE ON FUNCTION get_guest_vs_user_breakdown TO authenticated;

-- Verify functions were created
SELECT 
  proname as function_name,
  pronargs as num_args,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname IN (
  'get_reservations_per_day',
  'get_reservations_per_hour', 
  'get_party_size_distribution',
  'get_reservation_status_breakdown',
  'get_guest_vs_user_breakdown'
)
ORDER BY proname;
