-- Run this in the Supabase SQL editor for your project

CREATE TABLE submissions (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL UNIQUE,
  value      integer NOT NULL CHECK (value >= 1 AND value <= 10),
  created_at timestamptz DEFAULT now()
);

-- Allow anonymous reads (needed for Realtime and sum queries from the frontend)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read" ON submissions
  FOR SELECT TO anon USING (true);

-- Inserts go through the Python backend (service key bypasses RLS)

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
