# EXAM ATTEMPT CREATION - TROUBLESHOOTING GUIDE

## Error: "Failed to create exam attempt"

### Quick Diagnosis

Open browser console (F12) and check for the actual error message. Look for:

```
Creating attempt for exam: [exam-id] candidate: [user-id]
Exam fetch result: {...}
Attempt creation result: {...}
```

### Common Issues & Fixes

#### Issue 1: RLS Policy Blocking Insert
**Symptom:** Error mentions "policy" or "permission denied"

**Solution:** The service role key should bypass RLS. Check `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Make sure it's the SERVICE ROLE key, not the ANON key.

#### Issue 2: Trigger Failing
**Symptom:** Error mentions "trigger" or "institution_id"

**Solution:** The database trigger auto-populates institution_id. Check if trigger exists:

```sql
-- In Supabase SQL Editor
SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_set_attempt_institution';
```

If missing, run `FINAL_SCHEMA.sql` to create it.

#### Issue 3: Exam Not Found
**Symptom:** "Exam not found" error

**Solution:** Verify exam exists and is published:

```sql
SELECT id, title, status FROM exams WHERE id = 'your-exam-id';
```

#### Issue 4: User Not Authenticated
**Symptom:** candidateId is null or undefined

**Solution:** Check if user is logged in. In browser console:
```javascript
// Check user state
console.log(state.user)
```

### Manual Fix: Create Attempt Directly

If all else fails, create attempt manually in Supabase:

```sql
INSERT INTO exam_attempts (
  exam_id,
  candidate_id,
  institution_id,
  max_score,
  status,
  started_at
) VALUES (
  'your-exam-id',
  'your-user-id',
  (SELECT institution_id FROM exams WHERE id = 'your-exam-id'),
  100,
  'in_progress',
  NOW()
) RETURNING id;
```

Copy the returned ID and use it in the exam page.

### Check Server Logs

1. Open terminal where dev server is running
2. Look for console.log output:
   - "Start exam request"
   - "Exam fetch result"
   - "Attempt creation result"

3. Check for errors in red

### Verify Environment Variables

```bash
# Check if env vars are loaded
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

If empty, restart dev server:
```bash
npm run dev
```

### Test API Directly

Use curl or Postman to test the API:

```bash
curl -X POST http://localhost:3000/api/exam/[exam-id]/start \
  -H "Content-Type: application/json" \
  -d '{"candidateId": "your-user-id"}'
```

Check the response for detailed error.

### Still Not Working?

1. Check Supabase logs in dashboard
2. Verify database migration was applied
3. Check if exam_attempts table has all required columns
4. Verify RLS is enabled but service role bypasses it

### Emergency Workaround

If you need to test immediately, temporarily disable RLS:

```sql
-- TEMPORARY - DO NOT USE IN PRODUCTION
ALTER TABLE exam_attempts DISABLE ROW LEVEL SECURITY;
```

Remember to re-enable after testing:
```sql
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
```
