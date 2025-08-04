-- COPY THIS SQL TO SUPABASE SQL EDITOR TO SET UP STAFF MANAGEMENT SYSTEM
-- ⚠️ IMPORTANT: Run the staff-management-schema.sql file in Supabase first!

-- This is a quick test to verify staff management tables exist
SELECT 
    '🔍 CHECKING STAFF MANAGEMENT TABLES' as test_status,
    table_name,
    CASE 
        WHEN table_name IN (
            'staff_members', 'staff_availability', 'staff_schedules', 
            'schedule_requests', 'time_clock_entries', 'tip_pools', 
            'tip_distributions', 'pay_periods', 'payroll_records', 
            'ai_insights', 'staff_performance_metrics'
        ) THEN '✅ Required Table'
        ELSE '❓ Other Table'
    END as table_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE 'staff_%' 
    OR table_name IN ('tip_pools', 'tip_distributions', 'pay_periods', 'payroll_records', 'ai_insights')
)
ORDER BY 
    CASE 
        WHEN table_name = 'staff_members' THEN 1
        WHEN table_name = 'staff_availability' THEN 2
        WHEN table_name = 'staff_schedules' THEN 3
        WHEN table_name = 'schedule_requests' THEN 4
        WHEN table_name = 'time_clock_entries' THEN 5
        WHEN table_name = 'tip_pools' THEN 6
        WHEN table_name = 'tip_distributions' THEN 7
        WHEN table_name = 'pay_periods' THEN 8
        WHEN table_name = 'payroll_records' THEN 9
        WHEN table_name = 'ai_insights' THEN 10
        WHEN table_name = 'staff_performance_metrics' THEN 11
        ELSE 99
    END;

-- Quick test to see if sample data was inserted
SELECT 
    '📊 SAMPLE STAFF DATA CHECK' as test_status,
    COUNT(*) as total_staff,
    COUNT(CASE WHEN employment_status = 'active' THEN 1 END) as active_staff,
    STRING_AGG(first_name || ' ' || last_name, ', ' ORDER BY last_name) as staff_names
FROM staff_members;

-- Test staff roles breakdown
SELECT 
    '👥 STAFF ROLES BREAKDOWN' as test_status,
    role,
    COUNT(*) as count,
    ROUND(AVG(hourly_rate), 2) as avg_hourly_rate
FROM staff_members 
GROUP BY role 
ORDER BY COUNT(*) DESC;
