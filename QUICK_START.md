# 🚀 QUICK START GUIDE

## Phase 1: AI-Powered Proctoring - READY TO TEST

---

## ⚡ 3-Step Quick Start

### 1️⃣ Start Server
```bash
pnpm dev
```

### 2️⃣ Login
- Go to: http://localhost:3000
- Click "Candidate" quick login

### 3️⃣ Test AI Proctoring
- Click "Exams" → "Start Exam" (Web Development)
- Allow camera access
- Complete 4-step verification
- Take exam (AI monitors you)
- View AI report

---

## ✅ Everything is Working If:

1. **Build succeeds** ✓
   ```
   ✓ Compiled successfully
   ```

2. **AI models load** ✓
   - See "Loading AI models..." (2-3 seconds)
   - Then "✅ AI Proctoring initialized" in console

3. **Camera works** ✓
   - Video feed appears
   - Face detected

4. **Monitoring active** ✓
   - Green "AI" badge
   - Blue "READY" badge
   - Violations counted

5. **Report generates** ✓
   - Risk score shown
   - Insights displayed

---

## 🐛 If Something Breaks:

### Camera Not Working?
```
1. Allow camera permission in browser
2. Check if camera is being used by another app
3. Try Chrome/Edge browser
```

### AI Not Loading?
```
1. Check internet connection (models download from CDN)
2. Clear browser cache
3. Check console for errors (F12)
```

### Build Errors?
```bash
# Reinstall dependencies
rm -rf node_modules
pnpm install

# Rebuild
pnpm run build
```

---

## 📚 Documentation

- **Full Docs**: `AI_PROCTORING_README.md`
- **Testing Guide**: `TESTING_CHECKLIST.md`
- **Status Report**: `PHASE1_STATUS.md`

---

## 🎯 What to Test

1. ✅ Pre-exam verification (4 steps)
2. ✅ Face detection
3. ✅ Object detection
4. ✅ Tab switch detection
5. ✅ Copy/paste blocking
6. ✅ Violation counting
7. ✅ AI report generation

---

## 💡 Pro Tips

- **Use Chrome** for best compatibility
- **Good lighting** helps face detection
- **Face camera directly** for accurate detection
- **Check console** (F12) for AI logs
- **Wait 2-3 seconds** for AI to initialize

---

## ✅ Ready to Commit?

After testing, commit with:
```bash
git add .
git commit -m "feat: Phase 1 - AI-Powered Proctoring System"
git push
```

---

**Status**: ✅ READY FOR TESTING

**Next**: Follow `TESTING_CHECKLIST.md` for detailed testing
