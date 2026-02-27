# Supabase Setup Instructions

## 1. Create Supabase Project
1. Go to https://supabase.com
2. Sign up/Login
3. Create new project
4. Copy your project URL and anon key

## 2. Update Environment Variables
Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 3. Run Database Schema
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents from `supabase/schema.sql`
3. Run the SQL script

## 4. Database Tables Created
- `users` - User accounts (candidates, institutions, admins)
- `exams` - Exam definitions
- `questions` - Exam questions
- `exam_attempts` - Student exam sessions
- `violations` - Proctoring violations
- `proctoring_recordings` - Video recordings

## 5. Test Connection
Restart your dev server after adding environment variables.
