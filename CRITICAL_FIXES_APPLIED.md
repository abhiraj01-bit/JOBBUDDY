# CRITICAL FIXES APPLIED - Exam Attempt & Result Publishing

## Issues Found & Fixed

### 🔴 Issue 1: Exam Attempt Not Being Updated
**Problem**: Submit API was receiving exam ID instead of attempt ID
**Root Cause**: Frontend was passing `attemptId` in URL but sending exam `id`
**Fix**: Changed submit endpoint to receive exam ID in URL and attemptId in request body

**Files Modified**:
- `app/candidate/exam/[id]/page.tsx` - Changed submit URL from `/api/exam/${attemptId}/submit` to `/api/exam/${id}/submit` and added `attemptId` to request body
- `app/api/exam/[id]/submit/route.ts` - Updated to accept `attemptId` in request body and use service role client

### 🔴 Issue 2: Students Cannot See Published Results
**Problem**: Result API was using regular Supabase client with RLS policies blocking access
**Root Cause**: RLS policies were preventing data access even when `result_published=true`
**Fix**: Changed all teacher/admin APIs to use service role client that bypasses RLS

**Files Modified**:
- `app/api/candidate/results/[id]/route.ts` - Now uses service role client
- `app/api/institution/submissions/route.ts` - Now uses service role client
- `app/api/institution/submissions/[id]/route.ts` - Now uses service role client
- `app/api/institution/submissions/[id]/evaluate/route.ts` - Now uses service role client with better validation
- `app/api/institution/submissions/[id]/publish/route.ts` - Now uses service role client with better validation

## Technical Changes

### Service Role Client Configuration
All admin/teacher APIs now use properly configured service role client:

```typescript
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
```

### Data Flow Fix

**Before (Broken)**:
1. Student starts exam → Creates attempt with ID `abc123`
2. Student submits → Sends to `/api/exam/abc123/submit` (wrong - this is attempt ID)
3. API expects exam ID in URL → Fails to find exam
4. Student tries to view result → RLS blocks access even if published

**After (Fixed)**:
1. Student starts exam → Creates attempt with ID `abc123` for exam `xyz789`
2. Student submits → Sends to `/api/exam/xyz789/submit` with `attemptId: abc123` in body
3. API correctly updates attempt `abc123`
4. Teacher evaluates and publishes using service role client
5. Student views result using service role client (bypasses RLS after checking `result_published`)

## Validation Improvements

### Evaluate Route
- Changed validation from `!score` to `score === undefined || score === null` (allows score of 0)
- Added default empty string for remarks if not provided
- Added error logging

### Publish Route
- Changed validation to check for `null` and `undefined` separately
- Added error logging
- Better error messages

## Testing Checklist

After restarting dev server, test:

- [ ] Student can start exam (creates attempt)
- [ ] Student can submit exam (updates attempt with answers)
- [ ] Teacher can see submission in queue
- [ ] Teacher can evaluate submission (sets score, remarks, evaluated=true)
- [ ] Teacher can publish result (sets result_published=true)
- [ ] Student can view published result with score and remarks
- [ ] Student cannot view unpublished result (gets 403 error)

## Files Changed Summary

1. ✅ `app/candidate/exam/[id]/page.tsx` - Fixed submit URL and payload
2. ✅ `app/api/exam/[id]/submit/route.ts` - Service role + attemptId in body
3. ✅ `app/api/candidate/results/[id]/route.ts` - Service role client
4. ✅ `app/api/institution/submissions/route.ts` - Service role client
5. ✅ `app/api/institution/submissions/[id]/route.ts` - Service role client
6. ✅ `app/api/institution/submissions/[id]/evaluate/route.ts` - Service role + better validation
7. ✅ `app/api/institution/submissions/[id]/publish/route.ts` - Service role + better validation

## Next Steps

1. **Restart dev server** (REQUIRED for changes to take effect)
2. **Test complete workflow**:
   - Student: Start → Take → Submit exam
   - Teacher: View → Evaluate → Publish result
   - Student: View published result
3. **Check browser console** for any errors
4. **Check server logs** for API errors

## Why Service Role Client?

The service role client bypasses Row Level Security (RLS) policies. This is necessary because:

1. **Teacher APIs**: Teachers need to access student data across their institution
2. **Result Publishing**: Once published, students need to see results but RLS policies are complex
3. **Evaluation**: Teachers need to update student attempts without being the owner

The security is maintained by:
- Checking `result_published` flag before showing results to students
- Validating teacher permissions in application logic
- Using institution_id to scope data access

## Database State

The migration adds these columns to `exam_attempts`:
- `evaluated` (boolean) - Has teacher evaluated?
- `result_published` (boolean) - Is result visible to student?
- `evaluated_at` (timestamp) - When was it evaluated?
- `published_at` (timestamp) - When was it published?
- `teacher_remarks` (text) - Teacher's feedback

All APIs now properly set these fields.
