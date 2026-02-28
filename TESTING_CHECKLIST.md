# ✅ COMPLETE TESTING CHECKLIST

## Pre-Testing Setup

- [ ] **Restart dev server** (CRITICAL - changes won't work without restart)
  ```bash
  # Press Ctrl+C to stop
  npm run dev
  ```

- [ ] **Verify .env.local** has all keys
  ```
  NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyCmqG8I6dfDvmNz5cujdZK4hMyZlVGKiuA
  NEXT_PUBLIC_SUPABASE_URL=https://tsteschcyoiydnljaftu.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-key]
  SUPABASE_SERVICE_ROLE_KEY=[your-key]
  ```

- [ ] **Database migration applied** (run in Supabase SQL Editor)
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'exam_attempts' 
  AND column_name IN ('evaluated', 'result_published');
  -- Should return 2 rows
  ```

- [ ] **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)

---

## Test 1: Student Exam Flow (5 minutes)

### 1.1 Start Exam
- [ ] Login as student/candidate
- [ ] Navigate to `/candidate/exams`
- [ ] Click "Start Exam" on any published exam
- [ ] Verify: Redirects to verification page
- [ ] Click "Enter Fullscreen & Begin"
- [ ] **Check browser console (F12)**:
  ```
  Expected: "Creating attempt for exam: [id] candidate: [id]"
  Expected: "Attempt created: [uuid]"
  ```
- [ ] Verify: Exam interface loads with questions
- [ ] Verify: Camera preview shows in bottom-right corner
- [ ] Verify: Timer is counting down

### 1.2 Take Exam
- [ ] Answer at least 2-3 questions
- [ ] Try flagging a question
- [ ] Navigate between questions using arrows
- [ ] Verify: Answers are saved in state (question numbers turn green)

### 1.3 Submit Exam
- [ ] Click "Submit Exam" button
- [ ] Confirm submission in dialog
- [ ] **Check browser console**:
  ```
  Expected: No errors
  Expected: Redirect to /candidate/exams?submitted=true
  ```
- [ ] Verify: Success alert shows "Results will be available after evaluation"
- [ ] **Check server logs**:
  ```
  Expected: "Exam submitted successfully"
  Expected: No error messages
  ```

### 1.4 Try to View Result (Before Publish)
- [ ] Navigate to `/candidate/exam/[attempt-id]/report`
- [ ] Verify: Shows "Result is under evaluation" message
- [ ] Verify: Does NOT show score or teacher remarks
- [ ] **Check browser console**:
  ```
  Expected: 403 error with message about evaluation
  ```

**Test 1 Status**: ⬜ Pass / ⬜ Fail

---

## Test 2: Teacher Evaluation Flow (3 minutes)

### 2.1 View Submissions Queue
- [ ] Login as teacher/institution user
- [ ] Navigate to `/institution/submissions`
- [ ] Verify: Submitted exam appears in list
- [ ] Verify: Shows candidate name
- [ ] Verify: Shows exam title
- [ ] Verify: Shows submission timestamp
- [ ] Verify: Status badge shows "Pending" or "Submitted"

### 2.2 Review Submission
- [ ] Click "Review" button on the submission
- [ ] Verify: Redirects to `/institution/submissions/[id]`
- [ ] Verify: Shows student answers
- [ ] Verify: Shows proctoring violations (if any)
- [ ] Verify: Shows AI risk score
- [ ] Verify: Evaluation form is visible with score input and remarks textarea

### 2.3 Evaluate Submission
- [ ] Enter score (e.g., 85)
- [ ] Enter remarks (e.g., "Good work! Well done.")
- [ ] Click "Save Evaluation"
- [ ] **Check browser console**:
  ```
  Expected: "Evaluation saved successfully" alert
  Expected: No errors
  ```
- [ ] Verify: "Evaluated on [date]" message appears
- [ ] Verify: "Publish Result" button becomes visible

### 2.4 Publish Result
- [ ] Click "Publish Result" button
- [ ] Confirm in dialog
- [ ] **Check browser console**:
  ```
  Expected: "Result published successfully" alert
  Expected: Redirect to /institution/submissions
  ```
- [ ] Verify: Submission now shows "Published" badge

**Test 2 Status**: ⬜ Pass / ⬜ Fail

---

## Test 3: Student Result View (2 minutes)

### 3.1 View Published Result
- [ ] Login as student again (same one who took exam)
- [ ] Navigate to `/candidate/exam/[attempt-id]/report`
- [ ] **Check browser console**:
  ```
  Expected: No errors
  Expected: Report data loaded
  ```
- [ ] Verify: Score is displayed (e.g., "85/100")
- [ ] Verify: Teacher remarks are shown
- [ ] Verify: Integrity score is displayed
- [ ] Verify: AI analysis section is visible
- [ ] Verify: Violation summary is shown
- [ ] Verify: Exam details section is complete

### 3.2 Verify Data Accuracy
- [ ] Confirm score matches what teacher entered
- [ ] Confirm remarks match what teacher entered
- [ ] Confirm exam duration is correct
- [ ] Confirm violation count is accurate

**Test 3 Status**: ⬜ Pass / ⬜ Fail

---

## Test 4: Edge Cases (5 minutes)

### 4.1 Score of Zero
- [ ] Create new exam submission
- [ ] Teacher evaluates with score = 0
- [ ] Verify: Score saves correctly (not rejected as falsy)
- [ ] Verify: Can publish result
- [ ] Verify: Student sees score of 0

### 4.2 Empty Remarks
- [ ] Create new exam submission
- [ ] Teacher evaluates with score but no remarks
- [ ] Verify: Evaluation saves successfully
- [ ] Verify: Can publish result
- [ ] Verify: Student sees score without remarks section

### 4.3 Multiple Submissions
- [ ] Have 2-3 students submit exams
- [ ] Verify: All appear in teacher's queue
- [ ] Verify: Teacher can evaluate each independently
- [ ] Verify: Publishing one doesn't affect others

### 4.4 Unpublished Result Access
- [ ] Create submission and evaluate (don't publish)
- [ ] Try to access result as student
- [ ] Verify: Still shows "under evaluation" message
- [ ] Verify: Does NOT show score or remarks

**Test 4 Status**: ⬜ Pass / ⬜ Fail

---

## Test 5: Database Verification (2 minutes)

### 5.1 Check Exam Attempt Record
Run in Supabase SQL Editor:
```sql
SELECT 
  id,
  exam_id,
  candidate_id,
  status,
  score,
  evaluated,
  result_published,
  evaluated_at,
  published_at,
  teacher_remarks
FROM exam_attempts
WHERE id = '[your-attempt-id]';
```

- [ ] Verify: `status = 'submitted'`
- [ ] Verify: `score` matches teacher input
- [ ] Verify: `evaluated = true`
- [ ] Verify: `result_published = true`
- [ ] Verify: `evaluated_at` has timestamp
- [ ] Verify: `published_at` has timestamp
- [ ] Verify: `teacher_remarks` matches teacher input

### 5.2 Check Violations
```sql
SELECT COUNT(*) as violation_count
FROM violations
WHERE attempt_id = '[your-attempt-id]';
```

- [ ] Verify: Count matches what's shown in UI

**Test 5 Status**: ⬜ Pass / ⬜ Fail

---

## Test 6: Error Handling (3 minutes)

### 6.1 Network Errors
- [ ] Open DevTools → Network tab
- [ ] Throttle to "Slow 3G"
- [ ] Try submitting exam
- [ ] Verify: Shows loading state
- [ ] Verify: Eventually succeeds or shows error

### 6.2 Invalid Data
- [ ] Try to publish without evaluating
- [ ] Verify: Shows error "must be evaluated before publishing"
- [ ] Try to evaluate with empty score
- [ ] Verify: Save button is disabled or shows validation error

### 6.3 Unauthorized Access
- [ ] Login as student
- [ ] Try to access `/institution/submissions`
- [ ] Verify: Redirects or shows access denied

**Test 6 Status**: ⬜ Pass / ⬜ Fail

---

## Overall Test Results

| Test | Status | Notes |
|------|--------|-------|
| Test 1: Student Exam Flow | ⬜ Pass / ⬜ Fail | |
| Test 2: Teacher Evaluation | ⬜ Pass / ⬜ Fail | |
| Test 3: Student Result View | ⬜ Pass / ⬜ Fail | |
| Test 4: Edge Cases | ⬜ Pass / ⬜ Fail | |
| Test 5: Database Verification | ⬜ Pass / ⬜ Fail | |
| Test 6: Error Handling | ⬜ Pass / ⬜ Fail | |

---

## If Any Test Fails

1. **Check browser console** for JavaScript errors
2. **Check server logs** for API errors
3. **Check database** for data inconsistencies
4. **Refer to**: `TROUBLESHOOTING_QUICK.md`
5. **Verify**: Dev server was restarted after code changes

---

## Success Criteria

✅ All 6 tests pass
✅ No errors in browser console
✅ No errors in server logs
✅ Database records are correct
✅ UI shows correct data at each step

---

## Performance Benchmarks

- [ ] Exam start: < 2 seconds
- [ ] Exam submit: < 3 seconds
- [ ] Evaluation save: < 1 second
- [ ] Result publish: < 1 second
- [ ] Result load: < 2 seconds

---

## Final Verification

- [ ] Complete workflow works end-to-end
- [ ] No console errors throughout entire flow
- [ ] All data persists correctly in database
- [ ] UI updates reflect database state
- [ ] Security checks work (unpublished results hidden)

---

**Testing Completed**: ⬜ Yes / ⬜ No

**Date**: _______________

**Tester**: _______________

**Overall Status**: ⬜ All Pass ✅ / ⬜ Some Failures ❌

**Notes**:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
