-- ============================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- ============================================

-- Drop problematic policies
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Create fixed policies without recursion
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (
    auth.uid() = id OR
    (SELECT role FROM users WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Fix other policies with recursion issues
DROP POLICY IF EXISTS "exams_read_by_role" ON exams;
DROP POLICY IF EXISTS "exams_manage_by_teachers" ON exams;

CREATE POLICY "exams_read_by_role" ON exams
  FOR SELECT USING (
    status = 'published' OR
    (SELECT role FROM users WHERE id = auth.uid() LIMIT 1) IN ('institution', 'admin')
  );

CREATE POLICY "exams_manage_by_teachers" ON exams
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid() LIMIT 1) IN ('institution', 'admin')
  );

-- Fix attempts policies
DROP POLICY IF EXISTS "attempts_read" ON exam_attempts;
DROP POLICY IF EXISTS "attempts_insert" ON exam_attempts;

CREATE POLICY "attempts_read" ON exam_attempts
  FOR SELECT USING (
    candidate_id = auth.uid() OR
    (SELECT role FROM users WHERE id = auth.uid() LIMIT 1) IN ('institution', 'admin')
  );

CREATE POLICY "attempts_insert" ON exam_attempts
  FOR INSERT WITH CHECK (
    candidate_id = auth.uid()
  );

-- Fix violations policies
DROP POLICY IF EXISTS "violations_read" ON violations;

CREATE POLICY "violations_read" ON violations
  FOR SELECT USING (
    attempt_id IN (SELECT id FROM exam_attempts WHERE candidate_id = auth.uid()) OR
    (SELECT role FROM users WHERE id = auth.uid() LIMIT 1) IN ('institution', 'admin')
  );

-- Fix recordings policies
DROP POLICY IF EXISTS "recordings_read" ON proctoring_recordings;

CREATE POLICY "recordings_read" ON proctoring_recordings
  FOR SELECT USING (
    attempt_id IN (SELECT id FROM exam_attempts WHERE candidate_id = auth.uid()) OR
    (SELECT role FROM users WHERE id = auth.uid() LIMIT 1) IN ('institution', 'admin')
  );

-- Fix reports policies
DROP POLICY IF EXISTS "reports_read" ON reports;

CREATE POLICY "reports_read" ON reports
  FOR SELECT USING (
    candidate_id = auth.uid() OR
    (SELECT role FROM users WHERE id = auth.uid() LIMIT 1) IN ('institution', 'admin')
  );

-- Fix audit logs policies
DROP POLICY IF EXISTS "audit_logs_read" ON audit_logs;

CREATE POLICY "audit_logs_read" ON audit_logs
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid() LIMIT 1) = 'admin'
  );
