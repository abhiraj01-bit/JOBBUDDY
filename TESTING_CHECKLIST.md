# PHASE 1 TESTING CHECKLIST

## ✅ Build Status
- [x] Project builds successfully
- [x] No TypeScript errors
- [x] All dependencies installed

## 🧪 Testing Instructions

### 1. Start Development Server
```bash
pnpm dev
```
Open: http://localhost:3000

---

### 2. Login
- Go to: http://localhost:3000/login
- Click "Candidate" quick login
- Should redirect to: /candidate/dashboard

---

### 3. Navigate to Exams
- Click "Exams" in sidebar
- Should see list of exams
- Find "Web Development Fundamentals" (not-started status)

---

### 4. Test Pre-Exam Verification

#### Step 1: Start Verification
- Click "Start Exam" button
- Should navigate to: `/candidate/exam/e2/verification`
- Should see 4-step progress indicator
- Should see "Loading AI models..." message (2-3 seconds)

#### Step 2: Camera Test
- Click "Start Camera" button
- Browser should ask for camera permission
- **ALLOW camera access**
- Video feed should appear
- Button should change to "Camera Active"
- Progress should move to Step 2

#### Step 3: Face Verification
- Click "Verify Face" button
- AI should detect your face
- If successful: Green "Face Verified" badge appears
- If no face: Error message "No face detected"
- If multiple faces: Error message "Multiple faces detected"
- Progress should move to Step 3

#### Step 4: Environment Scan
- Click "Scan Environment" button
- AI scans for unauthorized objects (phones, books)
- If clear: Green "Environment Clear" badge appears
- If objects detected: Error message with object names
- Progress should move to Step 4

#### Step 5: Start Exam
- Click "Start Exam" button
- Should navigate to: `/candidate/exam/e2`
- Camera should stop

---

### 5. Test AI-Powered Exam Monitoring

#### Check AI Status
- Look at top-right corner
- Should see 3 indicators:
  - **AI** badge (green = monitoring active)
  - **READY** badge (blue = AI models loaded)
  - **Violation counter** (red, appears when violations detected)

#### Test Face Detection
- **Test 1**: Look away from screen for 3+ seconds
  - Should detect "LOOKING_AWAY" violation
  - Violation counter should increase
  - Warning banner should appear

- **Test 2**: Cover camera briefly
  - Should detect "NO_FACE" violation
  - Violation counter should increase

#### Test Tab Switch Detection
- **Test 3**: Press Alt+Tab to switch windows
  - Should detect "TAB_SWITCH" violation
  - Violation counter should increase
  - Warning banner: "Tab switched during exam"

- **Test 4**: Click browser address bar
  - Should detect "WINDOW_BLUR" violation
  - Violation counter should increase

#### Test Copy/Paste Prevention
- **Test 5**: Try to copy text (Ctrl+C)
  - Should be blocked
  - Should detect "COPY_PASTE" violation
  - Violation counter should increase

#### Test Right-Click Prevention
- **Test 6**: Right-click anywhere
  - Should be blocked
  - Should detect "RIGHT_CLICK" violation
  - Violation counter should increase

---

### 6. Complete Exam
- Answer a few questions
- Click "Submit Exam" button
- Confirm submission
- Should navigate back to exams list

---

### 7. View AI Report
- Go to: http://localhost:3000/candidate/exam/e2/report
- Should see:
  - **Risk Score** (0-100)
  - **Risk Level** (LOW/MEDIUM/HIGH/CRITICAL)
  - **Recommendation** (PASS/REVIEW/FAIL)
  - **AI Analysis** text
  - **Key Insights** list
  - **Violation Summary** with counts
  - **Exam Details**

---

## 🐛 Known Issues to Check

### Issue 1: AI Models Not Loading
**Symptom**: "Loading AI models..." never completes
**Check**: 
- Open browser console (F12)
- Look for errors
- Check internet connection (models download from CDN)

### Issue 2: Camera Permission Denied
**Symptom**: "Camera access denied" error
**Fix**: 
- Click lock icon in address bar
- Allow camera permission
- Refresh page

### Issue 3: Face Not Detected
**Symptom**: "No face detected" error even when face visible
**Check**:
- Ensure good lighting
- Face camera directly
- Remove glasses/mask if wearing
- Wait 2-3 seconds for AI to process

### Issue 4: Violations Not Showing
**Symptom**: Tab switches not detected
**Check**:
- AI must be loaded (READY badge should be blue)
- Monitoring must be active (AI badge should be green)
- Check browser console for errors

### Issue 5: High CPU Usage
**Symptom**: Browser becomes slow
**Expected**: 
- AI uses 15-25% CPU
- ~200MB RAM
- This is normal for real-time AI processing

---

## 📊 Expected Results

### Pre-Exam Verification
- ✅ Camera starts successfully
- ✅ Face detected in 1-2 seconds
- ✅ Environment scan completes
- ✅ Smooth transition to exam

### Live Monitoring
- ✅ AI indicators show active status
- ✅ Face detection runs every 2 seconds
- ✅ Object detection runs every 10 seconds
- ✅ Tab switches detected immediately
- ✅ Violations counted accurately

### Post-Exam Report
- ✅ Risk score calculated correctly
- ✅ False positives filtered out
- ✅ Insights generated
- ✅ Report displays properly

---

## 🔧 Troubleshooting

### Clear Browser Cache
```
Ctrl + Shift + Delete
Clear cached images and files
```

### Restart Dev Server
```bash
# Stop server (Ctrl+C)
pnpm dev
```

### Check Console Logs
```
F12 → Console tab
Look for:
- "✅ AI Proctoring initialized"
- "✅ Face detection AI loaded"
- "✅ Object detection AI loaded"
```

### Test in Different Browser
- Chrome (Recommended)
- Edge (Recommended)
- Firefox (May have issues)
- Safari (Not tested)

---

## 📝 Test Results

### Date: ___________
### Tester: ___________

| Test | Status | Notes |
|------|--------|-------|
| Build Success | ⬜ Pass ⬜ Fail | |
| Login Works | ⬜ Pass ⬜ Fail | |
| AI Models Load | ⬜ Pass ⬜ Fail | |
| Camera Access | ⬜ Pass ⬜ Fail | |
| Face Detection | ⬜ Pass ⬜ Fail | |
| Environment Scan | ⬜ Pass ⬜ Fail | |
| Tab Switch Detection | ⬜ Pass ⬜ Fail | |
| Copy/Paste Block | ⬜ Pass ⬜ Fail | |
| Right-Click Block | ⬜ Pass ⬜ Fail | |
| Violation Counter | ⬜ Pass ⬜ Fail | |
| Report Generation | ⬜ Pass ⬜ Fail | |

---

## ✅ Sign-Off

Phase 1 is ready for testing when:
- [x] Build completes without errors
- [x] All files created
- [x] Dependencies installed
- [x] Routes configured correctly

**Status**: ✅ READY FOR TESTING

**Next Steps**: 
1. Run `pnpm dev`
2. Follow testing instructions above
3. Report any issues found
4. If all tests pass → Commit to git
5. If issues found → Fix and retest
