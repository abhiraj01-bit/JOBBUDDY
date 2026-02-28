-- ============================================
-- UPDATE OLD EXAM ATTEMPTS
-- Run this to fix existing exam attempts in database
-- ============================================

-- Update all existing submitted attempts to have default values
UPDATE exam_attempts
SET 
  evaluated = COALESCE(evaluated, false),
  result_published = COALESCE(result_published, false)
WHERE status = 'submitted'
  AND (evaluated IS NULL OR result_published IS NULL);

-- Check the results
SELECT 
  id,
  exam_id,
  candidate_id,
  status,
  score,
  evaluated,
  result_published,
  submitted_at
FROM exam_attempts
WHERE status = 'submitted'
ORDER BY submitted_at DESC
LIMIT 10;

-- If you want to manually publish old results (OPTIONAL)
-- Uncomment and modify the WHERE clause to target specific attempts

/*
UPDATE exam_attempts
SET 
  evaluated = true,
  result_published = true,
  evaluated_at = submitted_at,
  published_at = submitted_at,
  teacher_remarks = 'Auto-published for migration'
WHERE status = 'submitted'
  AND score IS NOT NULL
  AND result_published = false;
*/

-- Verify all attempts have the new columns
SELECT 
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN evaluated IS NULL THEN 1 END) as null_evaluated,
  COUNT(CASE WHEN result_published IS NULL THEN 1 END) as null_published,
  COUNT(CASE WHEN evaluated = true THEN 1 END) as evaluated_count,
  COUNT(CASE WHEN result_published = true THEN 1 END) as published_count
FROM exam_attempts
WHERE status = 'submitted';
