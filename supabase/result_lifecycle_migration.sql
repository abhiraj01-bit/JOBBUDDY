-- ============================================
-- RESULT LIFECYCLE MIGRATION
-- ============================================

-- Update exam_attempts table
ALTER TABLE exam_attempts
ADD COLUMN IF NOT EXISTS evaluated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS result_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS evaluated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS teacher_remarks TEXT;

-- Update existing records
UPDATE exam_attempts 
SET evaluated = FALSE, 
    result_published = FALSE 
WHERE evaluated IS NULL OR result_published IS NULL;

-- ============================================
-- RLS POLICIES FOR RESULT VISIBILITY
-- ============================================

-- Drop existing policies for exam_attempts
DROP POLICY IF EXISTS "attempts_read" ON exam_attempts;
DROP POLICY IF EXISTS "attempts_insert" ON exam_attempts;
DROP POLICY IF EXISTS "attempts_update" ON exam_attempts;

-- Students can only see their own attempts
-- BUT cannot see score/report unless result_published = true
CREATE POLICY "students_read_own_attempts" ON exam_attempts
  FOR SELECT USING (
    candidate_id = auth.uid()
  );

-- Students can insert their own attempts
CREATE POLICY "students_insert_attempts" ON exam_attempts
  FOR INSERT WITH CHECK (
    candidate_id = auth.uid() AND
    EXISTS (SELECT 1 FROM exams WHERE id = exam_id AND status = 'published')
  );

-- Students can update only their own in-progress attempts
CREATE POLICY "students_update_own_attempts" ON exam_attempts
  FOR UPDATE USING (
    candidate_id = auth.uid() AND
    status = 'in_progress'
  );

-- Teachers can read attempts from their institution
CREATE POLICY "teachers_read_institution_attempts" ON exam_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'institution' 
      AND institution_id = exam_attempts.institution_id
    )
  );

-- Teachers can update attempts from their institution (for evaluation)
CREATE POLICY "teachers_evaluate_attempts" ON exam_attempts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'institution' 
      AND institution_id = exam_attempts.institution_id
    )
  );

-- Admins can do everything
CREATE POLICY "admins_full_access_attempts" ON exam_attempts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- RLS POLICIES FOR REPORTS
-- ============================================

DROP POLICY IF EXISTS "reports_read" ON reports;
DROP POLICY IF EXISTS "reports_insert" ON reports;

-- Students can only see reports if result is published
CREATE POLICY "students_read_published_reports" ON reports
  FOR SELECT USING (
    candidate_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM exam_attempts 
      WHERE id = reports.attempt_id 
      AND result_published = true
    )
  );

-- Teachers can read all reports from their institution
CREATE POLICY "teachers_read_institution_reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'institution' 
      AND institution_id = reports.institution_id
    )
  );

-- Teachers can insert/update reports for their institution
CREATE POLICY "teachers_manage_reports" ON reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'institution' 
      AND institution_id = reports.institution_id
    )
  );

-- Admins full access
CREATE POLICY "admins_full_access_reports" ON reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
