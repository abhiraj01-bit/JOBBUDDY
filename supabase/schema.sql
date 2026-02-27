-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('candidate', 'institution', 'admin')),
  phone TEXT,
  institution TEXT,
  avatar_url TEXT,
  resume_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exams table
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- in minutes
  total_questions INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  institution_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mcq', 'descriptive')),
  options JSONB, -- array of options for MCQ
  correct_answer INTEGER, -- index of correct option for MCQ
  marks INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam attempts table
CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id),
  candidate_id UUID REFERENCES users(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  answers JSONB, -- {"question_id": "answer"}
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
  attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- TAB_SWITCH, WINDOW_BLUR, COPY_PASTE, etc.
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- additional data like screenshot_url, etc.
);

-- Proctoring recordings table
CREATE TABLE proctoring_recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
  video_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES users(id),
  exam_id UUID REFERENCES exams(id),
  overall_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  risk_score INTEGER DEFAULT 0,
  strengths TEXT[], -- array of strengths
  weaknesses TEXT[], -- array of weaknesses
  feedback TEXT,
  details JSONB, -- topic-wise scores
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_exams_institution ON exams(institution_id);
CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX idx_attempts_candidate ON exam_attempts(candidate_id);
CREATE INDEX idx_violations_attempt ON violations(attempt_id);
CREATE INDEX idx_violations_severity ON violations(severity);
CREATE INDEX idx_recordings_attempt ON proctoring_recordings(attempt_id);
CREATE INDEX idx_reports_candidate ON reports(candidate_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctoring_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Basic - customize based on auth setup)
-- Candidates can view their own data
CREATE POLICY "Candidates can view own attempts" ON exam_attempts
  FOR SELECT USING (candidate_id = auth.uid()::uuid);

CREATE POLICY "Candidates can view own reports" ON reports
  FOR SELECT USING (candidate_id = auth.uid()::uuid);

CREATE POLICY "Candidates can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid()::uuid);

-- Institutions can view their exams
CREATE POLICY "Institutions can manage own exams" ON exams
  FOR ALL USING (institution_id = auth.uid()::uuid);

-- Admins can view everything (implement based on your auth)
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING (true); -- Add admin check here
