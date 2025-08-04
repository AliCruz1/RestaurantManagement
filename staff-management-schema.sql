-- STAFF MANAGEMENT SYSTEM DATABASE SCHEMA
-- This script creates all necessary tables for comprehensive staff management
-- Features: Profiles, Scheduling, Time Clocking, Tips, Payroll, AI Insights

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- STAFF PROFILES & MANAGEMENT
-- =============================================

-- Staff members table - Core employee information
CREATE TABLE IF NOT EXISTS staff_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(20) UNIQUE NOT NULL, -- Custom employee ID (e.g., EMP001)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    
    -- Employment details
    role VARCHAR(50) NOT NULL, -- server, cook, manager, host, busser, bartender
    department VARCHAR(50), -- kitchen, front_of_house, management
    hire_date DATE NOT NULL,
    termination_date DATE,
    employment_status VARCHAR(20) DEFAULT 'active', -- active, inactive, terminated
    
    -- Compensation
    hourly_rate DECIMAL(8,2) NOT NULL,
    overtime_rate DECIMAL(8,2), -- Usually 1.5x hourly_rate
    salary_amount DECIMAL(10,2), -- For salaried employees
    pay_type VARCHAR(20) DEFAULT 'hourly', -- hourly, salary
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    
    CONSTRAINT valid_employment_status CHECK (employment_status IN ('active', 'inactive', 'terminated')),
    CONSTRAINT valid_pay_type CHECK (pay_type IN ('hourly', 'salary')),
    CONSTRAINT valid_role CHECK (role IN ('server', 'cook', 'manager', 'host', 'busser', 'bartender', 'dishwasher', 'prep_cook', 'sous_chef', 'head_chef'))
);

-- Staff availability - When staff are available to work
CREATE TABLE IF NOT EXISTS staff_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6),
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- =============================================
-- SCHEDULING SYSTEM
-- =============================================

-- Shifts/Schedules - Actual scheduled work periods
CREATE TABLE IF NOT EXISTS staff_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    
    -- Schedule details
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    position VARCHAR(50), -- specific position for this shift
    station VARCHAR(50), -- specific station/section
    
    -- Status and notes
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, confirmed, cancelled, no_show
    notes TEXT,
    break_duration INTEGER DEFAULT 30, -- minutes
    
    -- Created by manager/admin
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_schedule_status CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'no_show', 'completed')),
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Schedule requests - Staff can request specific shifts or time off
CREATE TABLE IF NOT EXISTS schedule_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL, -- time_off, shift_change, availability_change
    
    -- Request details
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    reason TEXT,
    
    -- Approval workflow
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, denied
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_request_type CHECK (request_type IN ('time_off', 'shift_change', 'availability_change')),
    CONSTRAINT valid_request_status CHECK (status IN ('pending', 'approved', 'denied'))
);

-- =============================================
-- TIME CLOCKING SYSTEM
-- =============================================

-- Time clock entries - Actual clock in/out records
CREATE TABLE IF NOT EXISTS time_clock_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES staff_schedules(id),
    
    -- Clock times
    clock_in_time TIMESTAMP WITH TIME ZONE,
    clock_out_time TIMESTAMP WITH TIME ZONE,
    
    -- Break tracking
    break_start_time TIMESTAMP WITH TIME ZONE,
    break_end_time TIMESTAMP WITH TIME ZONE,
    total_break_minutes INTEGER DEFAULT 0,
    
    -- Calculated fields
    total_hours DECIMAL(5,2), -- Calculated automatically
    regular_hours DECIMAL(5,2),
    overtime_hours DECIMAL(5,2),
    
    -- Status and adjustments
    status VARCHAR(20) DEFAULT 'open', -- open, closed, adjusted
    adjustment_reason TEXT,
    adjusted_by UUID REFERENCES profiles(id),
    
    -- Location tracking (optional)
    clock_in_location TEXT,
    clock_out_location TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_clock_status CHECK (status IN ('open', 'closed', 'adjusted'))
);

-- =============================================
-- TIP MANAGEMENT SYSTEM
-- =============================================

-- Tip pools - Daily tip collection and distribution
CREATE TABLE IF NOT EXISTS tip_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    shift_type VARCHAR(20), -- morning, afternoon, evening, all_day
    
    -- Tip amounts
    total_cash_tips DECIMAL(10,2) DEFAULT 0,
    total_card_tips DECIMAL(10,2) DEFAULT 0,
    total_tips DECIMAL(10,2) GENERATED ALWAYS AS (total_cash_tips + total_card_tips) STORED,
    
    -- Distribution method
    distribution_method VARCHAR(30) DEFAULT 'hours_worked', -- equal, hours_worked, points_based
    
    -- Status
    status VARCHAR(20) DEFAULT 'open', -- open, calculated, distributed
    distributed_at TIMESTAMP WITH TIME ZONE,
    distributed_by UUID REFERENCES profiles(id),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_shift_type CHECK (shift_type IN ('morning', 'afternoon', 'evening', 'all_day')),
    CONSTRAINT valid_distribution_method CHECK (distribution_method IN ('equal', 'hours_worked', 'points_based')),
    CONSTRAINT valid_tip_status CHECK (status IN ('open', 'calculated', 'distributed'))
);

-- Individual tip distributions
CREATE TABLE IF NOT EXISTS tip_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tip_pool_id UUID NOT NULL REFERENCES tip_pools(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    
    -- Distribution details
    hours_worked DECIMAL(5,2),
    tip_points INTEGER, -- For points-based systems
    tip_amount DECIMAL(8,2) NOT NULL,
    
    -- Additional individual tips
    individual_tips DECIMAL(8,2) DEFAULT 0,
    total_tips DECIMAL(8,2) DEFAULT 0,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PAYROLL SYSTEM
-- =============================================

-- Pay periods
CREATE TABLE IF NOT EXISTS pay_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pay_date DATE,
    
    status VARCHAR(20) DEFAULT 'open', -- open, calculated, approved, paid
    calculated_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_pay_period CHECK (start_date < end_date),
    CONSTRAINT valid_payroll_status CHECK (status IN ('open', 'calculated', 'approved', 'paid'))
);

-- Payroll records for each employee per pay period
CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pay_period_id UUID NOT NULL REFERENCES pay_periods(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    
    -- Hours summary
    regular_hours DECIMAL(6,2) DEFAULT 0,
    overtime_hours DECIMAL(6,2) DEFAULT 0,
    total_hours DECIMAL(6,2) DEFAULT 0,
    
    -- Pay calculations
    hourly_rate DECIMAL(8,2),
    overtime_rate DECIMAL(8,2),
    regular_pay DECIMAL(10,2),
    overtime_pay DECIMAL(10,2),
    
    -- Tips and bonuses
    total_tips DECIMAL(10,2) DEFAULT 0,
    bonuses DECIMAL(10,2) DEFAULT 0,
    
    -- Deductions (estimated)
    federal_tax_estimate DECIMAL(10,2) DEFAULT 0,
    state_tax_estimate DECIMAL(10,2) DEFAULT 0,
    social_security_tax DECIMAL(10,2) DEFAULT 0,
    medicare_tax DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    
    -- Calculated totals (will be calculated via trigger)
    gross_pay DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(10,2) DEFAULT 0,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- AI INSIGHTS & ANALYTICS
-- =============================================

-- AI-generated insights and recommendations
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_type VARCHAR(50) NOT NULL, -- scheduling, performance, cost_optimization, tip_analysis
    
    -- Data analysis period
    analysis_start_date DATE,
    analysis_end_date DATE,
    
    -- AI-generated content
    title VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL,
    detailed_analysis JSONB, -- Store complex AI analysis data
    recommendations TEXT[],
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    
    -- Metadata
    ai_model VARCHAR(50) DEFAULT 'gemini', -- gemini, gpt-4, etc.
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User interaction
    viewed_by UUID[] DEFAULT '{}', -- Array of user IDs who viewed this
    status VARCHAR(20) DEFAULT 'active', -- active, archived, dismissed
    
    CONSTRAINT valid_insight_type CHECK (insight_type IN ('scheduling', 'performance', 'cost_optimization', 'tip_analysis', 'staffing_forecast')),
    CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1),
    CONSTRAINT valid_insight_status CHECK (status IN ('active', 'archived', 'dismissed'))
);

-- Performance metrics for AI analysis
CREATE TABLE IF NOT EXISTS staff_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    
    -- Performance indicators
    punctuality_score DECIMAL(3,2), -- 0.00 to 1.00
    hours_worked DECIMAL(5,2),
    shifts_completed INTEGER DEFAULT 0,
    shifts_missed INTEGER DEFAULT 0,
    customer_ratings_avg DECIMAL(3,2),
    tips_per_hour DECIMAL(8,2),
    
    -- Calculated metrics
    reliability_score DECIMAL(3,2),
    efficiency_score DECIMAL(3,2),
    
    notes TEXT,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_scores CHECK (
        punctuality_score >= 0 AND punctuality_score <= 1 AND
        reliability_score >= 0 AND reliability_score <= 1 AND
        efficiency_score >= 0 AND efficiency_score <= 1
    )
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Staff members indexes
CREATE INDEX IF NOT EXISTS idx_staff_members_role ON staff_members(role);
CREATE INDEX IF NOT EXISTS idx_staff_members_status ON staff_members(employment_status);
CREATE INDEX IF NOT EXISTS idx_staff_members_employee_id ON staff_members(employee_id);

-- Scheduling indexes
CREATE INDEX IF NOT EXISTS idx_staff_schedules_date ON staff_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff_date ON staff_schedules(staff_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff_day ON staff_availability(staff_id, day_of_week);

-- Time clock indexes
CREATE INDEX IF NOT EXISTS idx_time_clock_staff_date ON time_clock_entries(staff_id, clock_in_time);
CREATE INDEX IF NOT EXISTS idx_time_clock_status ON time_clock_entries(status);

-- Tip management indexes
CREATE INDEX IF NOT EXISTS idx_tip_pools_date ON tip_pools(date);
CREATE INDEX IF NOT EXISTS idx_tip_distributions_pool_staff ON tip_distributions(tip_pool_id, staff_id);

-- Payroll indexes
CREATE INDEX IF NOT EXISTS idx_payroll_records_period_staff ON payroll_records(pay_period_id, staff_id);
CREATE INDEX IF NOT EXISTS idx_pay_periods_dates ON pay_periods(start_date, end_date);

-- AI insights indexes
CREATE INDEX IF NOT EXISTS idx_ai_insights_type_date ON ai_insights(insight_type, generated_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_staff_date ON staff_performance_metrics(staff_id, metric_date);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_clock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tip_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE tip_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Admin access policy (can see everything)
CREATE POLICY "Admins can manage all staff data" ON staff_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Apply similar admin policies to other tables
CREATE POLICY "Admins can manage schedules" ON staff_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage time clock" ON time_clock_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage tips" ON tip_pools
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage payroll" ON payroll_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- =============================================
-- TRIGGERS FOR AUTOMATIC CALCULATIONS
-- =============================================

-- Function to calculate total hours worked
CREATE OR REPLACE FUNCTION calculate_time_clock_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.clock_in_time IS NOT NULL AND NEW.clock_out_time IS NOT NULL THEN
        -- Calculate total hours
        NEW.total_hours = EXTRACT(EPOCH FROM (NEW.clock_out_time - NEW.clock_in_time)) / 3600.0;
        
        -- Subtract break time
        IF NEW.total_break_minutes > 0 THEN
            NEW.total_hours = NEW.total_hours - (NEW.total_break_minutes / 60.0);
        END IF;
        
        -- Calculate regular vs overtime (assuming 8 hours = regular, rest = overtime)
        IF NEW.total_hours <= 8 THEN
            NEW.regular_hours = NEW.total_hours;
            NEW.overtime_hours = 0;
        ELSE
            NEW.regular_hours = 8;
            NEW.overtime_hours = NEW.total_hours - 8;
        END IF;
        
        NEW.status = 'closed';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate payroll totals
CREATE OR REPLACE FUNCTION calculate_payroll_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total hours
    NEW.total_hours = COALESCE(NEW.regular_hours, 0) + COALESCE(NEW.overtime_hours, 0);
    
    -- Calculate gross pay
    NEW.gross_pay = COALESCE(NEW.regular_pay, 0) + COALESCE(NEW.overtime_pay, 0) + COALESCE(NEW.total_tips, 0) + COALESCE(NEW.bonuses, 0);
    
    -- Calculate total deductions
    NEW.total_deductions = COALESCE(NEW.federal_tax_estimate, 0) + COALESCE(NEW.state_tax_estimate, 0) + 
                          COALESCE(NEW.social_security_tax, 0) + COALESCE(NEW.medicare_tax, 0) + COALESCE(NEW.other_deductions, 0);
    
    -- Calculate net pay
    NEW.net_pay = NEW.gross_pay - NEW.total_deductions;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate tip distribution totals
CREATE OR REPLACE FUNCTION calculate_tip_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total tips (tip_amount + individual_tips)
    NEW.total_tips = COALESCE(NEW.tip_amount, 0) + COALESCE(NEW.individual_tips, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to time_clock_entries
CREATE TRIGGER trigger_calculate_hours
    BEFORE UPDATE ON time_clock_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_time_clock_hours();

-- Apply trigger to payroll_records
CREATE TRIGGER trigger_calculate_payroll_totals
    BEFORE INSERT OR UPDATE ON payroll_records
    FOR EACH ROW
    EXECUTE FUNCTION calculate_payroll_totals();

-- Apply trigger to tip_distributions
CREATE TRIGGER trigger_calculate_tip_totals
    BEFORE INSERT OR UPDATE ON tip_distributions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_tip_totals();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER trigger_staff_members_updated_at
    BEFORE UPDATE ON staff_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_staff_schedules_updated_at
    BEFORE UPDATE ON staff_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Insert sample staff members (only if table is empty)
INSERT INTO staff_members (employee_id, first_name, last_name, email, phone, role, hire_date, hourly_rate, overtime_rate)
SELECT * FROM (VALUES
    ('EMP001', 'John', 'Smith', 'john.smith@restaurant.com', '555-0101', 'server', DATE '2024-01-15', 15.00, 22.50),
    ('EMP002', 'Sarah', 'Johnson', 'sarah.johnson@restaurant.com', '555-0102', 'cook', DATE '2024-02-01', 18.00, 27.00),
    ('EMP003', 'Mike', 'Davis', 'mike.davis@restaurant.com', '555-0103', 'manager', DATE '2023-12-01', 25.00, 37.50),
    ('EMP004', 'Emily', 'Wilson', 'emily.wilson@restaurant.com', '555-0104', 'host', DATE '2024-03-10', 14.00, 21.00),
    ('EMP005', 'Carlos', 'Rodriguez', 'carlos.rodriguez@restaurant.com', '555-0105', 'bartender', DATE '2024-01-20', 16.00, 24.00)
) AS sample_data(employee_id, first_name, last_name, email, phone, role, hire_date, hourly_rate, overtime_rate)
WHERE NOT EXISTS (SELECT 1 FROM staff_members LIMIT 1);

-- =============================================
-- VIEWS FOR EASY DATA ACCESS
-- =============================================

-- Comprehensive staff overview
CREATE OR REPLACE VIEW staff_overview AS
SELECT 
    sm.id,
    sm.employee_id,
    sm.first_name || ' ' || sm.last_name AS full_name,
    sm.email,
    sm.phone,
    sm.role,
    sm.department,
    sm.employment_status,
    sm.hourly_rate,
    sm.hire_date,
    
    -- Current week schedule count
    (SELECT COUNT(*) 
     FROM staff_schedules ss 
     WHERE ss.staff_id = sm.id 
     AND ss.scheduled_date >= date_trunc('week', CURRENT_DATE)
     AND ss.scheduled_date < date_trunc('week', CURRENT_DATE) + interval '1 week'
    ) as current_week_shifts,
    
    -- This month hours
    (SELECT COALESCE(SUM(tce.total_hours), 0)
     FROM time_clock_entries tce
     WHERE tce.staff_id = sm.id
     AND tce.clock_in_time >= date_trunc('month', CURRENT_DATE)
    ) as month_hours_worked,
    
    sm.created_at
FROM staff_members sm
WHERE sm.employment_status = 'active'
ORDER BY sm.last_name, sm.first_name;

-- Daily schedule view
CREATE OR REPLACE VIEW daily_schedule AS
SELECT 
    ss.scheduled_date,
    sm.employee_id,
    sm.first_name || ' ' || sm.last_name AS staff_name,
    sm.role,
    ss.start_time,
    ss.end_time,
    ss.position,
    ss.station,
    ss.status,
    EXTRACT(EPOCH FROM (ss.end_time - ss.start_time)) / 3600.0 AS scheduled_hours
FROM staff_schedules ss
JOIN staff_members sm ON ss.staff_id = sm.id
WHERE sm.employment_status = 'active'
ORDER BY ss.scheduled_date, ss.start_time, sm.last_name;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

SELECT 
    '✅ STAFF MANAGEMENT SCHEMA SETUP COMPLETE!' as status,
    COUNT(DISTINCT table_name) as tables_created,
    'Ready for Step 2: Staff Profile Management UI' as next_step
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'staff_%' 
OR table_name IN ('tip_pools', 'tip_distributions', 'pay_periods', 'payroll_records', 'ai_insights');
