# Score Showing 0 - Debug Fix Applied

## Changes Made

### 1. Added Console Logging to API
**File**: `app/api/candidate/results/[id]/route.ts`

Added logging to see what score is being retrieved from database:
```typescript
console.log('Result API - Attempt data:', {
  attemptId,
  score: attempt.score,
  evaluated: attempt.evaluated,
  result_published: attempt.result_published,
  teacher_remarks: attempt.teacher_remarks
})
```

### 2. Added Console Logging to Frontend
**File**: `app/candidate/exam/[id]/report/page.tsx`

Added logging to see what score is received by frontend:
```typescript
console.log('Frontend - Received result data:', data)
console.log('Frontend - Report score:', data.report.score)
```

### 3. Fixed Score Display Logic
Changed from:
```typescript
score: attempt.score  // Could be null/undefined
```

To:
```typescript
score: attempt.score ?? 0  // Defaults to 0 if null/undefined
```

### 4. Fixed Score Card Rendering
Changed from:
```typescript
{report.score !== undefined && (  // Would hide if score is 0
```

To:
```typescript
{(report.score !== undefined && report.score !== null) && (  // Shows even if score is 0
```

## How to Debug

### Step 1: Restart Dev Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 2: Check Server Logs
When student views result, you should see:
```
Result API - Attempt data: {
  attemptId: 'abc-123',
  score: 85,  // ← Should show actual score, not null
  evaluated: true,
  result_published: true,
  teacher_remarks: 'Good work!'
}
```

### Step 3: Check Browser Console (F12)
When student views result, you should see:
```
Frontend - Received result data: { report: { score: 85, ... } }
Frontend - Report score: 85
```

### Step 4: Check Database
Run in Supabase SQL Editor:
```sql
SELECT id, score, evaluated, result_published, teacher_remarks
FROM exam_attempts
WHERE id = '[your-attempt-id]';
```

Expected result:
- `score`: Should be a number (e.g., 85), NOT NULL
- `evaluated`: true
- `result_published`: true
- `teacher_remarks`: Should have text

## Possible Issues & Solutions

### Issue 1: Server log shows `score: null`
**Problem**: Score was never saved to database
**Solution**: 
1. Teacher must go to `/institution/submissions/[id]`
2. Enter score in the input field
3. Click "Save Evaluation"
4. Then click "Publish Result"

### Issue 2: Server log shows correct score but frontend shows 0
**Problem**: Frontend not receiving or displaying data correctly
**Solution**: Check browser console for errors, hard refresh (Ctrl+Shift+R)

### Issue 3: Database has score but API returns null
**Problem**: API query issue or RLS blocking
**Solution**: Already fixed with service role client

### Issue 4: Score is actually 0 (teacher entered 0)
**Problem**: This is correct behavior
**Solution**: If teacher meant to enter a different score, they need to re-evaluate

## Testing Steps

1. **Create new exam submission**:
   - Student takes and submits exam
   
2. **Teacher evaluates**:
   - Go to `/institution/submissions`
   - Click "Review" on submission
   - Enter score: 75
   - Enter remarks: "Test evaluation"
   - Click "Save Evaluation"
   - Check server logs for evaluation success
   
3. **Teacher publishes**:
   - Click "Publish Result"
   - Confirm
   - Check server logs for publish success
   
4. **Student views result**:
   - Go to `/candidate/exam/[attempt-id]/report`
   - Check server logs: Should show `score: 75`
   - Check browser console: Should show `score: 75`
   - UI should display: "75/100"

## Quick Database Fix (If Needed)

If score is NULL in database but teacher claims they evaluated:

```sql
-- Check current state
SELECT id, score, evaluated, result_published 
FROM exam_attempts 
WHERE id = '[attempt-id]';

-- If score is NULL, manually set it
UPDATE exam_attempts
SET 
  score = 85,  -- Replace with actual score
  evaluated = true,
  result_published = true,
  evaluated_at = NOW(),
  published_at = NOW(),
  teacher_remarks = 'Manually updated'
WHERE id = '[attempt-id]';

-- Verify
SELECT id, score, evaluated, result_published 
FROM exam_attempts 
WHERE id = '[attempt-id]';
```

## Files Modified

1. ✅ `app/api/candidate/results/[id]/route.ts` - Added logging, fixed score default
2. ✅ `app/candidate/exam/[id]/report/page.tsx` - Added logging, fixed display logic
3. ✅ `DEBUG_SCORE_ISSUE.md` - Created debug guide

## Next Steps

1. **Restart dev server** (REQUIRED)
2. **Test complete flow**:
   - Student submits exam
   - Teacher evaluates with specific score (e.g., 75)
   - Teacher publishes
   - Student views result
3. **Check all logs**:
   - Server logs should show score from database
   - Browser console should show score received
   - UI should display score correctly
4. **If still showing 0**:
   - Check `DEBUG_SCORE_ISSUE.md` for SQL queries
   - Run queries to verify database state
   - Check if evaluation API is actually saving

## Expected Behavior

✅ Teacher enters score → Saves to database
✅ Teacher publishes → Sets result_published = true
✅ Student views result → API fetches score from database
✅ Frontend receives score → Displays in UI
✅ Score of 0 is valid and should display as "0/100"
✅ Score of 85 should display as "85/100"

The logging will help identify exactly where the score is being lost (database, API, or frontend).
