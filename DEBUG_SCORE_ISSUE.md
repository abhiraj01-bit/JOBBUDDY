# Debug: Check Score in Database

## Run this in Supabase SQL Editor to check the actual score value:

```sql
-- Check all exam attempts with their scores
SELECT 
  id,
  candidate_id,
  exam_id,
  status,
  score,
  evaluated,
  result_published,
  evaluated_at,
  published_at,
  teacher_remarks,
  created_at,
  submitted_at
FROM exam_attempts
WHERE status = 'submitted'
ORDER BY submitted_at DESC
LIMIT 10;
```

## Check specific attempt:

```sql
-- Replace [attempt-id] with your actual attempt ID
SELECT 
  id,
  score,
  evaluated,
  result_published,
  teacher_remarks
FROM exam_attempts
WHERE id = '[attempt-id]';
```

## If score is NULL or 0 when it shouldn't be:

### Option 1: Manually update the score
```sql
-- Replace [attempt-id] and [score-value]
UPDATE exam_attempts
SET 
  score = 85,
  evaluated = true,
  result_published = true,
  evaluated_at = NOW(),
  published_at = NOW(),
  teacher_remarks = 'Good work!'
WHERE id = '[attempt-id]';
```

### Option 2: Check if evaluation API is working
1. Open browser DevTools (F12)
2. Go to Network tab
3. Teacher evaluates submission
4. Check the request payload and response
5. Look for errors in server logs

## Common Issues:

### Issue 1: Score is NULL
**Cause**: Teacher didn't evaluate or evaluation didn't save
**Solution**: Teacher must click "Save Evaluation" before publishing

### Issue 2: Score is 0 but should be higher
**Cause**: 
- Teacher entered 0
- Validation issue in evaluate API
- Database constraint

**Solution**: Check server logs when teacher saves evaluation

### Issue 3: Score shows in teacher view but not student view
**Cause**: 
- result_published is false
- API not returning score correctly
- Frontend not displaying score

**Solution**: 
1. Check result_published = true in database
2. Check API response in Network tab
3. Check browser console for frontend errors

## Debug Steps:

1. **Check Database**:
   ```sql
   SELECT score, evaluated, result_published 
   FROM exam_attempts 
   WHERE id = '[attempt-id]';
   ```

2. **Check API Response**:
   - Open `/candidate/exam/[attempt-id]/report`
   - Open DevTools → Network tab
   - Look for `/api/candidate/results/[attempt-id]` request
   - Check response JSON - does it have `report.score`?

3. **Check Frontend Console**:
   - Look for: "Frontend - Received result data:"
   - Look for: "Frontend - Report score:"
   - Does it show the correct score?

4. **Check Server Logs**:
   - Look for: "Result API - Attempt data:"
   - Does it show the correct score from database?

## Quick Fix (If score is in database but not showing):

The issue is likely one of these:
1. ❌ `score` is NULL in database → Teacher needs to evaluate
2. ❌ `result_published` is false → Teacher needs to publish
3. ❌ API not returning score → Check server logs
4. ❌ Frontend not displaying → Check browser console

## Test Query:

```sql
-- This should return the score if everything is correct
SELECT 
  ea.id as attempt_id,
  ea.score,
  ea.evaluated,
  ea.result_published,
  u.name as student_name,
  e.title as exam_title
FROM exam_attempts ea
JOIN users u ON ea.candidate_id = u.id
JOIN exams e ON ea.exam_id = e.id
WHERE ea.status = 'submitted'
  AND ea.evaluated = true
  AND ea.result_published = true
ORDER BY ea.published_at DESC
LIMIT 5;
```

This will show all published results with scores. If your result is here with a score, then the issue is in the API or frontend. If score is NULL, then evaluation didn't save properly.
