-- ============================================
-- TEMPORARY FIX: DISABLE RLS ON USERS TABLE
-- ============================================

-- Disable RLS on users table (temporary fix)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on other tables for security
-- Users table will be protected by application-level logic
