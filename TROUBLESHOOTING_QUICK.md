# Quick Troubleshooting Guide

## If Exam Attempt Still Not Working

### 1. Check Browser Console (F12)
Look for errors when:
- Starting exam
- Submitting exam
- Viewing results

Common errors:
- `attemptId is null` → Exam start failed
- `404 Not Found` → Wrong API endpoint
- `403 Forbidden` → Result not published yet

### 2. Check Server Logs
In your terminal where dev server is running, look for:
```
Creating attempt for exam: [exam-id] candidate: [user-id]
Attempt created: [attempt-id]
```

If you see errors, check:
- Supabase credentials in `.env.local`
- Database migration was applied
- Service role key is correct

### 3. Verify Database Migration

Run this in Supabase SQL Editor:
```sql
-- Check if columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'exam_attempts' 
AND column_name IN ('evaluated', 'result_published', 'evaluated_at', 'published_at', 'teacher_remarks');
```

Should return 5 rows. If not, re-run migration from `supabase/result_lifecycle_migration.sql`

### 4. Check Exam Attempt Creation

After starting exam, run in Supabase SQL Editor:
```sql
SELECT id, exam_id, candidate_id, status, evaluated, result_published
FROM exam_attempts
ORDER BY created_at DESC
LIMIT 5;
```

Should show:
- `status: 'in_progress'` when exam started
- `status: 'submitted'` after submission
- `evaluated: false` initially
- `result_published: false` initially

### 5. Check Result Publishing

After teacher publishes, run:
```sql
SELECT id, score, evaluated, result_published, evaluated_at, published_at
FROM exam_attempts
WHERE id = '[attempt-id]';
```

Should show:
- `evaluated: true`
- `result_published: true`
- `score: [number]`
- Both timestamps filled

## Common Issues & Solutions

### Issue: "Exam attempt not found"
**Solution**: 
1. Check if attempt was created (see step 4 above)
2. Verify `attemptId` is being stored in frontend state
3. Check browser console for attempt creation response

### Issue: "Result is under evaluation"
**Solution**: This is correct! Teacher must:
1. Go to `/institution/submissions`
2. Click "Review" on the submission
3. Enter score and remarks
4. Click "Save Evaluation"
5. Click "Publish Result"

### Issue: Teacher cannot see submissions
**Solution**:
1. Verify teacher's `institution_id` matches exam's `institution_id`
2. Check if exam was actually submitted (status='submitted')
3. Verify service role key in `.env.local`

### Issue: Score not saving
**Solution**:
1. Make sure score is a number (not empty string)
2. Check if score is within max_score range
3. Look for validation errors in server logs

### Issue: Student sees old data
**Solution**:
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check if API is returning updated data (Network tab in DevTools)

## Testing Commands

### Test Exam Flow
```bash
# 1. Start dev server
npm run dev

# 2. Open browser to http://localhost:3000
# 3. Login as student
# 4. Go to Exams → Start exam
# 5. Check console for "Attempt created: [id]"
# 6. Submit exam
# 7. Should redirect to /candidate/exams?submitted=true
```

### Test Teacher Flow
```bash
# 1. Login as teacher/institution user
# 2. Go to /institution/submissions
# 3. Should see submitted exams
# 4. Click "Review" on any submission
# 5. Enter score and remarks
# 6. Click "Save Evaluation"
# 7. Click "Publish Result"
```

### Test Student Result View
```bash
# 1. Login as student who submitted exam
# 2. Go to /candidate/exam/[attempt-id]/report
# 3. Before publish: Should see "Result is under evaluation"
# 4. After publish: Should see score, remarks, and full report
```

## Environment Variables Check

Verify `.env.local` has all required variables:
```bash
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyCmqG8I6dfDvmNz5cujdZK4hMyZlVGKiuA
NEXT_PUBLIC_SUPABASE_URL=https://tsteschcyoiydnljaftu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

## Still Not Working?

1. **Restart dev server** (Ctrl+C then `npm run dev`)
2. **Clear browser cache** completely
3. **Check Supabase logs** in dashboard
4. **Verify RLS policies** are enabled on exam_attempts table
5. **Check if migration was applied** (see step 3 above)

## Success Indicators

✅ Student can start exam without errors
✅ Console shows "Attempt created: [id]"
✅ Student can submit exam
✅ Redirects to exams page with success message
✅ Teacher sees submission in queue
✅ Teacher can evaluate and save
✅ Teacher can publish result
✅ Student can view published result with score

If all above work, system is functioning correctly! 🎉
