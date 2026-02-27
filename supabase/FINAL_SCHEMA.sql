-- ============================================
-- AI PROCTORED EXAM PLATFORM - FINAL SCHEMA
-- UNIFIED AUTH + DATABASE (NO CONFLICTS)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Institutions table
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  region TEXT NOT NULL,
  country TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (synced with Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY,  -- NO DEFAULT - comes from auth.users
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('candidate', 'institution', 'admin')),
  phone TEXT,
  institution_id UUID REFERENCES institutions(id) ON DELETE RESTRICT,
  avatar_url TEXT,
  resume_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT institution_required CHECK (
    (role = 'admin') OR (institution_id IS NOT NULL)
  )
);

-- Exams table
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mcq', 'descriptive')),
  options JSONB,
  correct_answer INTEGER,
  marks INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam attempts table
CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  answers JSONB,
  score INTEGER,
  max_score INTEGER,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'terminated', 'under_review')),
  risk_score INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Violations table
CREATE TABLE violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  confidence DECIMAL(3,2),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Proctoring recordings table
CREATE TABLE proctoring_recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  video_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  risk_score INTEGER DEFAULT 0,
  strengths TEXT[],
  weaknesses TEXT[],
  feedback TEXT,
  details JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_institution ON users(institution_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_exams_institution ON exams(institution_id);
CREATE INDEX idx_exams_created_by ON exams(created_by);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX idx_attempts_candidate ON exam_attempts(candidate_id);
CREATE INDEX idx_attempts_institution ON exam_attempts(institution_id);
CREATE INDEX idx_violations_attempt ON violations(attempt_id);
CREATE INDEX idx_recordings_attempt ON proctoring_recordings(attempt_id);
CREATE INDEX idx_reports_candidate ON reports(candidate_id);
CREATE INDEX idx_reports_institution ON reports(institution_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);

-- ============================================
-- TRIGGERS FOR AUTO-POPULATION
-- ============================================

-- Auto-populate and validate institution_id in exam_attempts
CREATE OR REPLACE FUNCTION set_attempt_institution()
RETURNS TRIGGER AS $$
DECLARE
  exam_institution_id UUID;
BEGIN
  SELECT institution_id INTO exam_institution_id FROM exams WHERE id = NEW.exam_id;
  
  IF exam_institution_id IS NULL THEN
    RAISE EXCEPTION 'Exam not found';
  END IF;
  
  IF NEW.institution_id IS NOT NULL AND NEW.institution_id != exam_institution_id THEN
    RAISE EXCEPTION 'Institution mismatch: attempt institution must match exam institution';
  END IF;
  
  NEW.institution_id := exam_institution_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_attempt_institution
BEFORE INSERT OR UPDATE ON exam_attempts
FOR EACH ROW
EXECUTE FUNCTION set_attempt_institution();

-- Auto-populate fields in reports from attempt
CREATE OR REPLACE FUNCTION set_report_fields()
RETURNS TRIGGER AS $$
BEGIN
  SELECT candidate_id, exam_id, institution_id
  INTO NEW.candidate_id, NEW.exam_id, NEW.institution_id
  FROM exam_attempts WHERE id = NEW.attempt_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_report_fields
BEFORE INSERT ON reports
FOR EACH ROW
EXECUTE FUNCTION set_report_fields();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctoring_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Institutions: Public read (for signup dropdown)
CREATE POLICY "public_read_institutions" ON institutions
  FOR SELECT USING (true);

-- Users: Insert during registration (service role bypasses RLS)
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (
    auth.uid() = id OR
    institution_id IN (SELECT institution_id FROM users WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Exams: Role-based access
CREATE POLICY "exams_read_by_role" ON exams
  FOR SELECT USING (
    (status = 'published' AND institution_id IN (SELECT institution_id FROM users WHERE id = auth.uid())) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('institution', 'admin'))
  );

CREATE POLICY "exams_manage_by_teachers" ON exams
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'institution' AND institution_id = exams.institution_id) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Questions: Follow exam access
CREATE POLICY "questions_read" ON questions
  FOR SELECT USING (
    exam_id IN (SELECT id FROM exams)
  );

CREATE POLICY "questions_manage" ON questions
  FOR ALL USING (
    exam_id IN (SELECT id FROM exams WHERE created_by = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Exam attempts: Candidates and teachers
CREATE POLICY "attempts_read" ON exam_attempts
  FOR SELECT USING (
    candidate_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('institution', 'admin') AND institution_id = exam_attempts.institution_id)
  );

CREATE POLICY "attempts_insert" ON exam_attempts
  FOR INSERT WITH CHECK (
    candidate_id = auth.uid() AND
    EXISTS (SELECT 1 FROM exams WHERE id = exam_id AND status = 'published' AND institution_id IN (SELECT institution_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY "attempts_update" ON exam_attempts
  FOR UPDATE USING (candidate_id = auth.uid());

-- Violations: Follow attempt access
CREATE POLICY "violations_read" ON violations
  FOR SELECT USING (
    attempt_id IN (SELECT id FROM exam_attempts WHERE candidate_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('institution', 'admin'))
  );

CREATE POLICY "violations_insert" ON violations
  FOR INSERT WITH CHECK (true);  -- System can insert violations

-- Proctoring recordings: Follow attempt access
CREATE POLICY "recordings_read" ON proctoring_recordings
  FOR SELECT USING (
    attempt_id IN (SELECT id FROM exam_attempts WHERE candidate_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('institution', 'admin'))
  );

CREATE POLICY "recordings_insert" ON proctoring_recordings
  FOR INSERT WITH CHECK (true);  -- System can insert recordings

-- Reports: Candidates and teachers
CREATE POLICY "reports_read" ON reports
  FOR SELECT USING (
    candidate_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('institution', 'admin') AND institution_id = reports.institution_id)
  );

CREATE POLICY "reports_insert" ON reports
  FOR INSERT WITH CHECK (true);  -- System can generate reports

-- Notifications: Own only
CREATE POLICY "notifications_manage" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Audit logs: Admin only
CREATE POLICY "audit_logs_read" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (true);  -- System can log

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO institutions (name, region, country) VALUES
('IIT Delhi', 'North India', 'India'),
('IIT Kanpur', 'North India', 'India'),
('IIT Roorkee', 'North India', 'India'),
('IIT BHU', 'North India', 'India'),
('Delhi University', 'North India', 'India'),
('Jawaharlal Nehru University', 'North India', 'India'),
('Jamia Millia Islamia', 'North India', 'India'),
('Punjab University', 'North India', 'India'),
('Aligarh Muslim University', 'North India', 'India'),
('Banaras Hindu University', 'North India', 'India'),
('NIT Kurukshetra', 'North India', 'India'),
('NIT Jalandhar', 'North India', 'India'),
('NIT Hamirpur', 'North India', 'India'),
('NIT Srinagar', 'North India', 'India'),
('BITS Pilani', 'North India', 'India'),
('IIIT Allahabad', 'North India', 'India'),
('IIIT Delhi', 'North India', 'India'),
('Chandigarh University', 'North India', 'India');
