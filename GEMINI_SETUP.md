# Job Buddy - AI Proctored Exam Platform

## Gemini AI Integration

This platform uses **Google Gemini AI** for fully autonomous proctoring with:
- Real face verification (not mocked)
- Real environment scanning (detects unauthorized objects)
- Autonomous violation detection during exams
- Voice warnings using Web Speech API
- Auto-submit after 3 critical violations or 3 tab switches

## Setup Instructions

### 1. Get Free Gemini API Key
1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Application
```bash
npm run dev
```

### 4. Start an Exam
1. Navigate to `/candidate/exams`
2. Click "Start Exam"
3. Enter your Gemini API key when prompted
4. Complete verification steps:
   - Camera test
   - Face verification (Gemini AI analyzes your face)
   - Environment scan (Gemini AI detects unauthorized objects)
5. Start exam with full AI monitoring

## Features

### Pre-Exam Verification
- **Camera Test**: Ensures camera is working
- **Face Verification**: Gemini AI verifies exactly 1 face is present
- **Environment Scan**: Gemini AI detects phones, books, laptops, other people

### During Exam Monitoring
- **Face Detection**: Every 3 seconds, Gemini AI checks:
  - Face count (should be 1)
  - Face position (looking at screen)
  - Multiple people detection
- **Object Detection**: Gemini AI detects unauthorized items
- **Tab Switch Detection**: Tracks tab switches, auto-submits after 3
- **Voice Warnings**: Speaks violations aloud
- **Auto-Submit**: After 3 critical violations or 3 tab switches

### Violation Types
- `NO_FACE`: No face detected
- `MULTIPLE_FACES`: More than 1 face
- `LOOKING_AWAY`: Face not centered
- `UNAUTHORIZED_OBJECT`: Phone, book, laptop detected
- `MULTIPLE_PEOPLE`: More than 1 person
- `TAB_SWITCH`: Tab switched during exam
- `WINDOW_BLUR`: Window lost focus
- `COPY_PASTE`: Copy attempt
- `RIGHT_CLICK`: Right-click attempt

### Post-Exam Report
- Risk score (0-100)
- Risk level (Low/Medium/High/Critical)
- Recommendation (PASS/REVIEW/FAIL)
- AI analysis summary
- Violation breakdown

## Technology Stack
- **Frontend**: Next.js 16, React 19, TypeScript
- **AI**: Google Gemini 1.5 Flash (vision model)
- **Voice**: Web Speech API
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 100% Free Solution
- No backend costs
- No database costs
- Free Gemini API (60 requests/minute)
- All processing in browser
- Open source

## API Rate Limits
Gemini Free Tier:
- 60 requests per minute
- 1,500 requests per day
- Sufficient for exam proctoring (1 request every 3 seconds)

## Privacy
- No data stored on servers
- All AI processing via Gemini API
- Violations stored in-memory only
- Camera feed never uploaded

## Support
For issues or questions, check the code comments or create an issue.
