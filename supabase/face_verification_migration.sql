-- ============================================
-- FACE VERIFICATION SYSTEM MIGRATION
-- ============================================

-- Add face verification columns to exam_attempts
ALTER TABLE exam_attempts
ADD COLUMN IF NOT EXISTS reference_face_url TEXT,
ADD COLUMN IF NOT EXISTS reference_face_embedding FLOAT8[],
ADD COLUMN IF NOT EXISTS face_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS face_verification_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS identity_risk_score INTEGER DEFAULT 0;

-- Create face_enrollments table (stores face data before attempt is created)
CREATE TABLE IF NOT EXISTS face_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  face_url TEXT NOT NULL,
  embedding FLOAT8[] NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(exam_id, candidate_id)
);

-- Create face_snapshots table for storing periodic face captures during exam
CREATE TABLE IF NOT EXISTS face_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL,
  snapshot_url TEXT NOT NULL,
  embedding FLOAT8[],
  similarity_score DECIMAL(5,4),
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  match_status TEXT CHECK (match_status IN ('match', 'mismatch', 'no_face', 'multiple_faces'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_face_enrollments_exam_candidate ON face_enrollments(exam_id, candidate_id);
CREATE INDEX IF NOT EXISTS idx_face_snapshots_attempt ON face_snapshots(attempt_id);
CREATE INDEX IF NOT EXISTS idx_face_snapshots_captured ON face_snapshots(captured_at);

-- Add consent tracking
ALTER TABLE exam_attempts
ADD COLUMN IF NOT EXISTS face_consent_given BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS face_consent_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN exam_attempts.reference_face_url IS 'URL to reference face image captured before exam';
COMMENT ON COLUMN exam_attempts.reference_face_embedding IS '128-dimensional face embedding array';
COMMENT ON COLUMN exam_attempts.face_verified IS 'Whether face verification was completed successfully';
COMMENT ON COLUMN exam_attempts.identity_risk_score IS 'Cumulative identity verification risk score (0-100)';
COMMENT ON TABLE face_enrollments IS 'Face enrollment data captured before exam attempt creation';
COMMENT ON TABLE face_snapshots IS 'Periodic face captures during exam for identity verification';
