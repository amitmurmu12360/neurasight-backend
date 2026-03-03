-- NeuraSight Supabase Setup
-- ==========================
-- Run this SQL in your Supabase SQL Editor to create the profiles table

-- Create profiles table for user persistence
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL, -- Can be email or auth user ID
  last_connected_sheet_id TEXT,
  persona_preference TEXT DEFAULT 'CEO', -- CEO, CMO, VP Sales
  audio_muted BOOLEAN DEFAULT true NOT NULL, -- Voice command mute state
  ghost_state JSONB, -- Agent 8: Persistence Warden - Stores Ghost State (simulation predictions) for recovery
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read/write their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

