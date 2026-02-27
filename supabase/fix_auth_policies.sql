-- ============================================
-- FIX RLS POLICIES FOR SUPABASE AUTH
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view institutions" ON institutions;
DROP POLICY IF EXISTS "Users view same institution" ON users;
DROP POLICY IF EXISTS "Candidates view published exams" ON exams;
DROP POLICY IF EXISTS "Teachers manage own exams" ON exams;
DROP POLICY IF EXISTS "Questions follow exam access" ON questions;
DROP POLICY IF EXISTS "Candidates view own attempts" ON exam_attempts;
DROP POLICY IF EXISTS "Candidates create attempts" ON exam_attempts;
DROP POLICY IF EXISTS "Violations follow attempt access" ON violations;
DROP POLICY IF EXISTS "Candidates view own reports" ON reports;
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
DROP POLICY IF EXISTS "Admin view audit logs" ON audit_logs;

-- ============================================
-- NEW POLICIES WITH PROPER AUTH
-- ============================================

-- Institutions: Public read access (for signup dropdown)
CREATE POLICY "Public can view institutions" ON institutions
  FOR SELECT USING (true);

-- Users: View own profile and same institution users
CREATE POLICY "Users manage own profile" ON users
  FOR ALL USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users view same institution" ON users
  FOR SELECT USING (
    auth.uid() = id OR
    institution_id IN (SELECT institution_id FROM users WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Exams: Candidates see published, teachers see all from their institution
CREATE POLICY "View exams by role" ON exams
  FOR SELECT USING (
    (status = 'published' AND institution_id IN (SELECT institution_id FROM users WHERE id = auth.uid())) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('institution', 'admin'))
  );

CREATE POLICY "Teachers manage exams" ON exams
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'institution' AND institution_id = exams.institution_id) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Questions: Follow exam access
CREATE POLICY "View questions with exam access" ON questions
  FOR SELECT USING (
    exam_id IN (SELECT id FROM exams)
  );

CREATE POLICY "Teachers manage questions" ON questions
  FOR ALL USING (
    exam_id IN (SELECT id FROM exams WHERE created_by = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Exam attempts: Candidates view own, teachers view their institution
CREATE POLICY "View own attempts" ON exam_attempts
  FOR SELECT USING (
    candidate_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('institution', 'admin') AND institution_id = exam_attempts.institution_id)
  );

CREATE POLICY "Candidates create attempts" ON exam_attempts
  FOR INSERT WITH CHECK (
    candidate_id = auth.uid() AND
    EXISTS (SELECT 1 FROM exams WHERE id = exam_id AND status = 'published' AND institution_id IN (SELECT institution_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY "Update own attempts" ON exam_attempts
  FOR UPDATE USING (candidate_id = auth.uid());

-- Violations: Follow attempt access
CREATE POLICY "View violations" ON violations
  FOR SELECT USING (
    attempt_id IN (SELECT id FROM exam_attempts WHERE candidate_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('institution', 'admin'))
  );

-- Proctoring recordings: Follow attempt access
CREATE POLICY "View recordings" ON proctoring_recordings
  FOR SELECT USING (
    attempt_id IN (SELECT id FROM exam_attempts WHERE candidate_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('institution', 'admin'))
  );

-- Reports: Candidates view own, teachers view their institution
CREATE POLICY "View reports" ON reports
  FOR SELECT USING (
    candidate_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('institution', 'admin') AND institution_id = reports.institution_id)
  );

-- Notifications: View own only
CREATE POLICY "View own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Audit logs: Admin only
CREATE POLICY "Admin view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
