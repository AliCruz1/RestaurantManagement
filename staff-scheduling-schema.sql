-- Staff Scheduling System Database Schema (You already have core scheduling in staff-management-schema.sql)
-- This file can be used for incremental adjustments or re-run safely.

-- 1. Ensure base table exists (idempotent)
CREATE TABLE IF NOT EXISTS staff_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    position VARCHAR(50),
    station VARCHAR(50),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','cancelled','no_show','completed')),
    notes TEXT,
    break_duration INTEGER DEFAULT 30,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- 2. Supporting indexes (skip if they already exist)
CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff ON staff_schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_date ON staff_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_status ON staff_schedules(status);

-- 3. Simple view for upcoming shifts (next 14 days)
CREATE OR REPLACE VIEW upcoming_shifts AS
SELECT s.id,
       s.scheduled_date,
       s.start_time,
       s.end_time,
       s.position,
       s.station,
       s.status,
       sm.first_name,
       sm.last_name,
       sm.role
FROM staff_schedules s
JOIN staff_members sm ON sm.id = s.staff_id
WHERE s.scheduled_date >= CURRENT_DATE
  AND s.scheduled_date < CURRENT_DATE + INTERVAL '14 days'
ORDER BY s.scheduled_date, s.start_time;

-- 4. Sample data (only inserts if none exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM staff_schedules LIMIT 1) THEN
    INSERT INTO staff_schedules (staff_id, scheduled_date, start_time, end_time, position, station, status)
    SELECT id, CURRENT_DATE + INTERVAL '1 day', '10:00', '16:00', role, 'Main', 'scheduled' FROM staff_members LIMIT 3;
  END IF;
END $$;

-- 5. Success message
SELECT '✅ Scheduling incremental setup complete' AS status, COUNT(*) AS total_shifts FROM staff_schedules;
