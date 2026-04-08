-- Execute this in Supabase SQL Editor to add the preferred_section column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_section TEXT DEFAULT NULL;

-- Optional: Add constraint to only allow valid values
COMMENT ON COLUMN profiles.preferred_section IS 'User preference: geek, pop, or null (not set)';