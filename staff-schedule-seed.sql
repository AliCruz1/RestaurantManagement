-- Seed realistic multi-week schedule for all staff
-- Generates one shift per working day per staff for next 6 weeks (42 days)
-- Each staff gets two consistent days off derived from a hash of their id.
-- Safe & idempotent: skips days already having a shift for that staff.

-- 1. (Optional) Add uniqueness to prevent duplicate same-day primary shift (index version works on older PG)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_staff_day_idx ON staff_schedules(staff_id, scheduled_date);

DO $$
DECLARE
  start_monday date;
BEGIN
  -- Align start to current week's Monday
  start_monday := date_trunc('week', now())::date;  -- week starts Monday in ISO

  -- Insert shifts
  INSERT INTO staff_schedules (staff_id, scheduled_date, start_time, end_time, position, station, status, notes)
  SELECT
    sm.id,
    d::date AS scheduled_date,
    -- Start time logic varies by role & parity to simulate opening / closing rotations
    (
      CASE sm.role
        WHEN 'server' THEN CASE WHEN (extract(dow from d)::int % 2)=0 THEN '10:00' ELSE '16:00' END
        WHEN 'host' THEN '10:30'
        WHEN 'bartender' THEN CASE WHEN (extract(dow from d)::int % 2)=0 THEN '15:30' ELSE '17:00' END
        WHEN 'cook' THEN '09:00'
        WHEN 'chef' THEN '08:30'
        WHEN 'dishwasher' THEN '17:00'
        WHEN 'manager' THEN '09:00'
        WHEN 'assistant_manager' THEN '10:00'
        ELSE '11:00'
      END
    )::time AS start_time,
    (
      CASE sm.role
        WHEN 'server' THEN CASE WHEN (extract(dow from d)::int % 2)=0 THEN '16:00' ELSE '22:00' END
        WHEN 'host' THEN '18:30'
        WHEN 'bartender' THEN CASE WHEN (extract(dow from d)::int % 2)=0 THEN '23:00' ELSE '22:30' END
        WHEN 'cook' THEN '17:00'
        WHEN 'chef' THEN '17:30'
        WHEN 'dishwasher' THEN '23:00'
        WHEN 'manager' THEN '17:00'
        WHEN 'assistant_manager' THEN '18:00'
        ELSE '19:00'
      END
    )::time AS end_time,
    COALESCE(sm.role, 'general') AS position,
    CASE sm.role
      WHEN 'server' THEN (CASE WHEN (extract(dow from d)::int % 3)=0 THEN 'Patio' ELSE 'Main' END)
      WHEN 'bartender' THEN 'Bar'
      WHEN 'cook' THEN 'Line'
      WHEN 'chef' THEN 'Kitchen'
      WHEN 'dishwasher' THEN 'Dish Pit'
      WHEN 'host' THEN 'Front'
      WHEN 'manager' THEN 'Office'
      ELSE 'Main'
    END AS station,
    'scheduled' AS status,
    'Auto-seeded shift' AS notes
  FROM staff_members sm
  CROSS JOIN generate_series(start_monday, start_monday + INTERVAL '41 days', INTERVAL '1 day') d
  WHERE
    -- Days off: derive two stable off days (0=Sunday..6=Saturday) from md5 hash of id
    (
      -- compute hash integer
      (abs(('x'||substr(md5(sm.id::text),1,8))::bit(32)::int) % 7) != extract(dow from d)::int AND
      (abs(('x'||substr(md5(sm.id::text),9,8))::bit(32)::int) % 7) != extract(dow from d)::int
    )
    -- Skip if shift already exists that day
    AND NOT EXISTS (
      SELECT 1 FROM staff_schedules ss
       WHERE ss.staff_id = sm.id
         AND ss.scheduled_date = d::date
    );
END $$;

-- 2. Optional: create a few second (split) shifts for bartenders & servers (late cover)
DO $$ BEGIN
  INSERT INTO staff_schedules (staff_id, scheduled_date, start_time, end_time, position, station, status, notes)
  SELECT sm.id, (current_date + offs.day_offset) AS scheduled_date,
         '18:00'::time, '22:00'::time,
         sm.role, 'Cover', 'scheduled', 'Cover split shift'
  FROM staff_members sm
  JOIN LATERAL (VALUES (7),(14),(21),(28)) offs(day_offset) ON TRUE
  WHERE sm.role IN ('server','bartender')
    AND NOT EXISTS (
      SELECT 1 FROM staff_schedules ss
       WHERE ss.staff_id = sm.id
         AND ss.scheduled_date = (current_date + offs.day_offset)
         AND ss.start_time = '18:00'::time
    );
EXCEPTION WHEN others THEN NULL; -- ignore if constraint conflicts
END $$;

-- Summary
SELECT '✅ Seed complete' AS status,
       (SELECT count(*) FROM staff_schedules WHERE scheduled_date >= date_trunc('week', now())::date AND scheduled_date < date_trunc('week', now())::date + INTERVAL '42 days') AS seeded_window_shifts,
       (SELECT count(DISTINCT staff_id) FROM staff_schedules WHERE scheduled_date >= date_trunc('week', now())::date AND scheduled_date < date_trunc('week', now())::date + INTERVAL '42 days') AS active_staff;
