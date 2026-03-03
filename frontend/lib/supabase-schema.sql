-- NeuraSight Sovereign Vault Schema
-- Run this SQL in your Supabase SQL Editor

-- Sessions Table: Store audit sessions with unique TX-ID
CREATE TABLE IF NOT EXISTS sovereign_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_id TEXT UNIQUE NOT NULL, -- Format: NS-YYYYMMDD-HHMMSS-RANDOM
  health_score INTEGER NOT NULL DEFAULT 100,
  industry TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Governance Log: Track action rights and permissions
CREATE TABLE IF NOT EXISTS governance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sovereign_sessions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'READ_ONLY', 'WRITE_BACK', 'AUTO_FIX'
  granted_by TEXT NOT NULL, -- User ID or 'SYSTEM'
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Agentic Memory: Store 12-agent JSON debate for every audit
CREATE TABLE IF NOT EXISTS agentic_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sovereign_sessions(id) ON DELETE CASCADE,
  agent_id INTEGER NOT NULL, -- 0-11
  agent_name TEXT NOT NULL,
  debate_payload JSONB NOT NULL,
  strategic_pivot TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_tx_id ON sovereign_sessions(tx_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sovereign_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sovereign_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_governance_session_id ON governance_log(session_id);
CREATE INDEX IF NOT EXISTS idx_memory_session_id ON agentic_memory(session_id);

-- Function to generate unique TX-ID
CREATE OR REPLACE FUNCTION generate_sovereign_tx_id()
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  time_part TEXT;
  random_part TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  time_part := TO_CHAR(NOW(), 'HH24MISS');
  random_part := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN 'NS-' || date_part || '-' || time_part || '-' || random_part;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (Row Level Security)
ALTER TABLE sovereign_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentic_memory ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own sessions
CREATE POLICY "Users can view own sessions"
  ON sovereign_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON sovereign_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view governance logs for their sessions
CREATE POLICY "Users can view own governance logs"
  ON governance_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sovereign_sessions
      WHERE id = governance_log.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own governance logs"
  ON governance_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sovereign_sessions
      WHERE id = governance_log.session_id
      AND user_id = auth.uid()
    )
  );

-- Policy: Users can view agentic memory for their sessions
CREATE POLICY "Users can view own agentic memory"
  ON agentic_memory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sovereign_sessions
      WHERE id = agentic_memory.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own agentic memory"
  ON agentic_memory FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sovereign_sessions
      WHERE id = agentic_memory.session_id
      AND user_id = auth.uid()
    )
  );

