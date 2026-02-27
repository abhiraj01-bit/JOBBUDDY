-- ============================================
-- FIX RECURSION WITH SECURITY DEFINER FUNCTION
-- ============================================

-- Create function to get user role (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = user_id;
  RETURN user_role;
END;
$$;

-- Drop all existing policies
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "exams_read_by_role" ON exams;
DROP POLICY IF EXISTS "exams_manage_by_teachers" ON exams;
DROP POLICY IF EXISTS "attempts_read" ON exam_attempts;
DROP POLICY IF EXISTS "attempts_insert" ON exam_attempts;
DROP POLICY IF EXISTS "attempts_update" ON exam_attempts;
DROP POLICY IF EXISTS "violations_read" ON violations;
DROP POLICY IF EXISTS "recordings_read" ON proctoring_recordings;
DROP POLICY IF EXISTS "reports_read" ON reports;
DROP POLICY IF EXISTS "audit_logs_read" ON audit_logs;
DROP POLICY IF EXISTS "questions_read" ON questions;
DROP POLICY IF EXISTS "questions_manage" ON questions;
DROP POLICY IF EXISTS "notifications_manage" ON notifications;

-- Create new policies using the function
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (
    auth.uid() = id OR
    get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Exams policies
CREATE POLICY "exams_read_by_role" ON exams
  FOR SELECT USING (
    status = 'published' OR
    get_user_role(auth.uid()) IN ('institution', 'admin')
  );

CREATE POLICY "exams_manage_by_teachers" ON exams
  FOR ALL USING (
    get_user_role(auth.uid()) IN ('institution', 'admin')
  );

-- Questions policies
CREATE POLICY "questions_read" ON questions
  FOR SELECT USING (true);

CREATE POLICY "questions_manage" ON questions
  FOR ALL USING (
    get_user_role(auth.uid()) IN ('institution', 'admin')
  );

-- Exam attempts policies
CREATE POLICY "attempts_read" ON exam_attempts
  FOR SELECT USING (
    candidate_id = auth.uid() OR
    get_user_role(auth.uid()) IN ('institution', 'admin')
  );

CREATE POLICY "attempts_insert" ON exam_attempts
  FOR INSERT WITH CHECK (candidate_id = auth.uid());

CREATE POLICY "attempts_update" ON exam_attempts
  FOR UPDATE USING (candidate_id = auth.uid());

-- Violations policies
CREATE POLICY "violations_read" ON violations
  FOR SELECT USING (
    attempt_id IN (SELECT id FROM exam_attempts WHERE candidate_id = auth.uid()) OR
    get_user_role(auth.uid()) IN ('institution', 'admin')
  );

CREATE POLICY "violations_insert" ON violations
  FOR INSERT WITH CHECK (true);

-- Recordings policies
CREATE POLICY "recordings_read" ON proctoring_recordings
  FOR SELECT USING (
    attempt_id IN (SELECT id FROM exam_attempts WHERE candidate_id = auth.uid()) OR
    get_user_role(auth.uid()) IN ('institution', 'admin')
  );

CREATE POLICY "recordings_insert" ON proctoring_recordings
  FOR INSERT WITH CHECK (true);

-- Reports policies
CREATE POLICY "reports_read" ON reports
  FOR SELECT USING (
    candidate_id = auth.uid() OR
    get_user_role(auth.uid()) IN ('institution', 'admin')
  );

CREATE POLICY "reports_insert" ON reports
  FOR INSERT WITH CHECK (true);

-- Notifications policies
CREATE POLICY "notifications_manage" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Audit logs policies
CREATE POLICY "audit_logs_read" ON audit_logs
  FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (true);
