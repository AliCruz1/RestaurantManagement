-- Create daily_metrics table for storing restaurant metrics by date
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  daily_revenue DECIMAL(10,2) DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  food_cost_percent DECIMAL(5,2) DEFAULT 0,
  labor_cost_percent DECIMAL(5,2) DEFAULT 0,
  daily_covers INTEGER DEFAULT 0,
  table_turnover DECIMAL(5,2) DEFAULT 0,
  reservation_rate DECIMAL(5,2) DEFAULT 0,
  waste_percent DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policy so users can only access their own metrics
CREATE POLICY "Users can manage their own metrics" ON public.daily_metrics
  FOR ALL USING (auth.uid() = user_id);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON public.daily_metrics(user_id, date);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_daily_metrics_updated_at 
    BEFORE UPDATE ON public.daily_metrics 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
