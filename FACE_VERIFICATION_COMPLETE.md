# FACE VERIFICATION SYSTEM - COMPLETE IMPLEMENTATION GUIDE

## ✅ COMPONENTS CREATED

### 1. Database Schema
**File**: `supabase/face_verification_migration.sql`
- Added face verification columns to exam_attempts
- Created face_snapshots table
- Added consent tracking

### 2. Face Detection Library
**File**: `lib/ai/face-verification.ts`
- Face detection using face-api.js
- Embedding generation (128-dimensional)
- Face comparison with similarity scoring
- Image capture utilities

### 3. Face Enrollment Component
**File**: `components/exam/face-enrollment.tsx`
- Pre-exam identity capture
- Camera consent flow
- Real-time face detection
- Single face validation

### 4. Continuous Verification Hook
**File**: `lib/ai/use-face-verification.ts`
- Periodic face verification during exam
- Violation detection and logging
- Auto-submit on excessive violations
- Voice warnings

### 5. API Endpoints
- `app/api/exam/face/enroll/route.ts` - Save reference face
- `app/api/exam/face/violation/route.ts` - Log violations
- `app/api/exam/face/snapshot/route.ts` - Save periodic snapshots

## 🔧 SETUP INSTRUCTIONS

### Step 1: Install Dependencies
```bash
npm install face-api.js
```

### Step 2: Download Face Detection Models
Download these models to `public/models/`:
- tiny_face_detector_model-weights_manifest.json
- tiny_face_detector_model-shard1
- face_landmark_68_model-weights_manifest.json
- face_landmark_68_model-shard1
- face_recognition_model-weights_manifest.json
- face_recognition_model-shard1

Download from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

### Step 3: Run Database Migration
In Supabase SQL Editor, run:
```sql
-- Content from face_verification_migration.sql
```

### Step 4: Update Verification Page
Replace `app/candidate/exam/[id]/verification/page.tsx` with face enrollment flow.

### Step 5: Integrate Continuous Verification
In exam page, add:
```typescript
import { useContinuousFaceVerification } from '@/lib/ai/use-face-verification'

// In component:
const { violations, identityRiskScore } = useContinuousFaceVerification(
  videoRef,
  {
    attemptId,
    referenceEmbedding,
    verificationInterval: 10, // seconds
    similarityThreshold: 0.6,
    onViolation: (violation) => {
      console.log('Violation:', violation)
    },
    onAutoSubmit: () => {
      handleSubmit()
    }
  },
  isExamActive
)
```

## 📋 WORKFLOW

### Pre-Exam (Verification Page)
1. Student clicks "Start Exam"
2. System creates exam attempt
3. Face enrollment component loads
4. Student provides camera consent
5. Student captures face image
6. System validates: exactly 1 face
7. Face embedding generated and stored
8. Exam can now start

### During Exam
1. Every 10 seconds, capture frame
2. Detect face in frame
3. Generate embedding
4. Compare with reference embedding
5. If similarity < 0.6: log FACE_MISMATCH
6. If no face: log FACE_ABSENT
7. If multiple faces: log MULTIPLE_FACES
8. Voice warning triggered
9. Risk score increased
10. After 10 violations or 3 mismatches: auto-submit

### Post-Exam (Teacher Dashboard)
1. Teacher views submission
2. Reference face image displayed
3. Random snapshots shown
4. Face match confidence scores
5. Identity risk level
6. Teacher makes final decision

## 🔒 SECURITY FEATURES

- ✅ Consent required before camera access
- ✅ Face data encrypted in database
- ✅ Images stored securely in /public/faces/
- ✅ Embeddings compared, not raw images
- ✅ Periodic snapshots for audit trail
- ✅ Auto-submit on excessive violations
- ✅ Voice warnings for violations

## 📊 VIOLATION TYPES

| Type | Severity | Description |
|------|----------|-------------|
| FACE_ABSENT | High | No face detected |
| MULTIPLE_FACES | Critical | More than 1 face |
| FACE_MISMATCH | Critical | Different person |
| CAMERA_DISABLED | Critical | Camera turned off |

## 🎯 THRESHOLDS

- **Similarity Threshold**: 0.6 (60%)
- **Max Violations**: 10
- **Max Mismatches**: 3
- **Verification Interval**: 10 seconds
- **Snapshot Save Rate**: 20%

## 📝 TEACHER DASHBOARD INTEGRATION

Add to submission detail page:
```typescript
// Fetch face data
const { data: faceData } = await supabase
  .from('exam_attempts')
  .select('reference_face_url, identity_risk_score, face_verified')
  .eq('id', attemptId)
  .single()

// Fetch snapshots
const { data: snapshots } = await supabase
  .from('face_snapshots')
  .select('*')
  .eq('attempt_id', attemptId)
  .order('timestamp', { ascending: false })
  .limit(10)

// Display in UI
<div>
  <h3>Identity Verification</h3>
  <img src={faceData.reference_face_url} alt="Reference" />
  <p>Risk Score: {faceData.identity_risk_score}/100</p>
  <div>
    {snapshots.map(snap => (
      <img key={snap.id} src={snap.snapshot_url} />
    ))}
  </div>
</div>
```

## ✅ TESTING CHECKLIST

- [ ] Install face-api.js
- [ ] Download models to public/models/
- [ ] Run database migration
- [ ] Test face enrollment
- [ ] Test single face validation
- [ ] Test multiple face rejection
- [ ] Test continuous verification
- [ ] Test violation logging
- [ ] Test auto-submit
- [ ] Test voice warnings
- [ ] Test teacher dashboard

## 🚀 DEPLOYMENT

1. Ensure models are in public/models/
2. Verify .env has all keys
3. Run migration in production
4. Test with real camera
5. Monitor violation logs
6. Adjust thresholds if needed

## 📌 NOTES

- Face-api.js works in browser only
- Models are ~6MB total
- First load takes 2-3 seconds
- Works offline after models loaded
- Requires HTTPS in production
- Camera permission required

---

**Status**: ✅ CORE IMPLEMENTATION COMPLETE
**Next**: Install dependencies and test
