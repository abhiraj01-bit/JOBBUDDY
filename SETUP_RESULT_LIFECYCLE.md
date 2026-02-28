# RESULT LIFECYCLE - SETUP INSTRUCTIONS

## 🚀 QUICK SETUP (5 MINUTES)

### Step 1: Apply Database Migration

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to your project: `tsteschcyoiydnljaftu`
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy and paste the entire content from:
   ```
   supabase/result_lifecycle_migration.sql
   ```
6. Click **Run** button
7. Wait for "Success. No rows returned" message

### Step 2: Verify Migration

Run this query in SQL Editor to verify:

```sql
-- Check new columns exist
SELECT 
  evaluated,
  result_published,
  evaluated_at,
  published_at,
  teacher_remarks
FROM exam_attempts
LIMIT 1;
```

If no errors, migration is successful! ✅

### Step 3: Test the Workflow

#### As Student:
1. Login as candidate
2. Go to Exams
3. Start and submit an exam
4. You should see: "Results will be available after evaluation"
5. Try to view result → Should see: "Result is under evaluation"

#### As Teacher:
1. Login as institution user
2. Go to `/institution/submissions`
3. You should see the submitted exam
4. Click "Review"
5. Enter score and remarks
6. Click "Save Evaluation"
7. Click "Publish Result"
8. Confirm publication

#### As Student (After Publish):
1. Go back to exam result page
2. You should now see:
   - Your score
   - Teacher's remarks
   - Full proctoring report

---

## 🔧 TROUBLESHOOTING

### Issue: "Column does not exist"
**Solution:** Re-run the migration SQL

### Issue: "Permission denied"
**Solution:** Make sure you're using the correct Supabase project

### Issue: Student can see unpublished results
**Solution:** Check RLS policies are enabled:
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('exam_attempts', 'reports');
```

### Issue: Teacher cannot evaluate
**Solution:** Verify teacher's institution_id matches exam's institution_id

---

## 📝 TESTING CHECKLIST

- [ ] Database migration applied successfully
- [ ] Student submits exam → sees "under evaluation" message
- [ ] Student cannot view unpublished result
- [ ] Teacher can see submission in queue
- [ ] Teacher can evaluate and save score
- [ ] Teacher can publish result
- [ ] Student can view published result with score
- [ ] Teacher cannot edit after publishing

---

## 🎯 NEXT STEPS

After successful setup:

1. **Create Test Data:**
   - Create a test exam
   - Have a student take it
   - Evaluate as teacher
   - Publish result

2. **Customize UI:**
   - Adjust colors/styling in submission pages
   - Add institution branding
   - Customize email notifications (future)

3. **Monitor:**
   - Check Supabase logs for errors
   - Monitor API response times
   - Track submission → publish time

---

## 📞 SUPPORT

If you encounter issues:

1. Check browser console for errors (F12)
2. Check Supabase logs in dashboard
3. Verify environment variables in `.env.local`
4. Review `RESULT_LIFECYCLE_COMPLETE.md` for details

---

## ✅ SUCCESS CRITERIA

You'll know it's working when:

✅ Students see "under evaluation" message after submission
✅ Teachers can access submissions page
✅ Teachers can evaluate and publish results
✅ Students can view published results with scores
✅ No errors in browser console or Supabase logs

**Estimated Setup Time: 5 minutes**
**Complexity: Low**
**Risk: None (non-destructive migration)**

---

Ready to go! 🚀
