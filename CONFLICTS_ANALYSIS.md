# Face Verification Integration - Conflicts Analysis

## ✅ NO CRITICAL CONFLICTS FOUND

After analyzing the codebase, the face verification system can be safely integrated. Here's what I found:

---

## 1. VIDEO ELEMENT CONFLICT ⚠️ MINOR

**Issue**: Both systems use `videoRef`
- `useProctoringMonitor` → uses `videoRef` for Gemini AI proctoring
- `useFaceVerification` → needs separate `videoRef` for face detection

**Solution**: Use **same video element** for both systems
- Both can share the same camera stream
- Face verification reads from proctoring video element
- No need for two separate cameras

---

## 2. MISSING API ROUTES ❌ REQUIRED

**Missing Files**:
- `/api/exam/face/enroll/route.ts` - NOT CREATED YET
- `/api/exam/face/violation/route.ts` - NOT CREATED YET  
- `/api/exam/face/snapshot/route.ts` - NOT CREATED YET

**Action**: Must create these 3 API routes before integration

---

## 3. FACE ENROLLMENT COMPONENT MISMATCH ⚠️

**Current**: `FaceEnrollment` expects:
```typescript
interface FaceEnrollmentProps {
  attemptId: string
  onSuccess: (faceUrl: string, embedding: number[]) => void
  onError: (error: string) => void
}
```

**Problem**: Exam page doesn't have `attemptId` until AFTER face enrollment

**Solution**: Change flow:
1. Face enrollment FIRST (before attemptId)
2. Store embedding in state
3. Create attemptId
4. Save embedding to database with attemptId

---

## 4. HOOK INTERFACE MISMATCH ⚠️

**Current**: `use-face-verification.ts` exports `useContinuousFaceVerification`
- Requires `referenceEmbedding` in config
- Complex configuration object

**Expected**: Simple hook like `useFaceVerification(attemptId, onAutoSubmit)`

**Solution**: Create wrapper hook that matches expected interface

---

## 5. DATABASE MIGRATION STATUS ❓

**Required**: `face_verification_migration.sql` must be run
- Adds columns to `exam_attempts` table
- Creates `face_snapshots` table

**Action**: Confirm migration is executed in Supabase

---

## 6. DEPENDENCY CHECK ✅

**Required**: `face-api.js` package
- Status: ✅ Installed via `pnpm add face-api.js`
- Models: ✅ Downloaded to `/public/models/`

---

## 7. VOICE WARNING CONFLICT ⚠️ MINOR

**Issue**: Both systems use voice warnings
- `useProctoringMonitor` → uses `voiceWarning` utility
- `useFaceVerification` → uses `window.speechSynthesis` directly

**Solution**: Use same `voiceWarning` utility for consistency

---

## RECOMMENDED INTEGRATION STEPS

### Step 1: Create Missing API Routes
```bash
mkdir app\api\exam\face\enroll
mkdir app\api\exam\face\violation  
mkdir app\api\exam\face\snapshot
```

### Step 2: Fix Face Enrollment Flow
- Modify `FaceEnrollment` to work without attemptId
- Store embedding temporarily in exam page state
- Save to database after attemptId is created

### Step 3: Create Wrapper Hook
Create `lib/ai/use-face-verification-wrapper.ts` that:
- Wraps `useContinuousFaceVerification`
- Fetches reference embedding from database
- Provides simple interface

### Step 4: Share Video Element
- Use proctoring `videoRef` for face verification
- Pass same ref to both hooks

### Step 5: Run Database Migration
Execute `face_verification_migration.sql` in Supabase

---

## FINAL VERDICT: ✅ SAFE TO PROCEED

**No blocking conflicts**. Minor adjustments needed:
1. Create 3 API routes
2. Fix enrollment flow
3. Create wrapper hook
4. Share video element
5. Run migration

Estimated time: 15-20 minutes
