# Institution Pages - Real Data Implementation

## Summary
Removed all mocked data from institution candidates and reports pages. Now showing real data from database.

---

## Changes Made

### 1. Candidates Page
**File**: `app/institution/candidates/page.tsx`

**Before**: Showed 8 hardcoded mock candidates
**After**: Fetches real candidates from database with their exam statistics

**Features**:
- Lists all candidates from the institution
- Shows exam count per candidate
- Calculates average score from published results
- Search and filter functionality
- Loading and empty states

### 2. Candidates API
**File**: `app/api/institution/candidates/route.ts` (NEW)

**What it does**:
- Fetches all users with role='candidate' from institution
- For each candidate, calculates:
  - Total exams completed
  - Average score from published results
- Returns candidate list with stats

### 3. Reports Page
**File**: `app/institution/reports/page.tsx`

**Before**: Showed hardcoded stats and mock chart data
**After**: Fetches real analytics from database

**Features**:
- Average score across all exams
- Pass rate (40% threshold)
- Total exam attempts
- Pending evaluations count
- Bar chart showing performance by exam
- Loading and empty states

### 4. Reports API
**File**: `app/api/institution/reports/route.ts` (NEW)

**What it does**:
- Fetches all exam attempts for institution
- Calculates:
  - Average score
  - Pass rate (40% passing grade)
  - Total attempts
  - Pending evaluations
- Groups attempts by exam for chart
- Returns top 10 exams for visualization

---

## Data Flow

### Candidates Page
```
Frontend → /api/institution/candidates?institutionId={id}
         → Service Role Client
         → Fetch users + exam stats
         → Return candidates with stats
```

### Reports Page
```
Frontend → /api/institution/reports?institutionId={id}
         → Service Role Client
         → Fetch attempts + calculate stats
         → Return analytics + chart data
```

---

## Files Modified/Created

1. ✅ `app/institution/candidates/page.tsx` - Real data implementation
2. ✅ `app/api/institution/candidates/route.ts` - NEW API endpoint
3. ✅ `app/institution/reports/page.tsx` - Real data implementation
4. ✅ `app/api/institution/reports/route.ts` - NEW API endpoint

---

## Features

### Candidates Page
- ✅ Real candidate list from database
- ✅ Exam completion count
- ✅ Average score calculation
- ✅ Search by name/email
- ✅ Filter by status
- ✅ Loading state
- ✅ Empty state

### Reports Page
- ✅ Real-time statistics
- ✅ Average score across institution
- ✅ Pass rate calculation
- ✅ Total attempts count
- ✅ Pending evaluations
- ✅ Performance chart by exam
- ✅ Loading state
- ✅ Empty state

---

## Statistics Calculated

### Average Score
- Only from published results (result_published = true)
- Calculated as percentage: (score / max_score) * 100
- Rounded to nearest integer

### Pass Rate
- Based on 40% passing threshold
- Only from published results
- Formula: (passed_count / total_published) * 100

### Pending Evaluation
- Count of attempts where evaluated = false
- Shows workload for teachers

### Exam Performance Chart
- Groups attempts by exam title
- Shows average score per exam
- Shows attempt count per exam
- Limited to top 10 exams

---

## Testing Steps

1. **Restart dev server**:
   ```bash
   npm run dev
   ```

2. **Test Candidates Page**:
   - Login as institution user
   - Go to `/institution/candidates`
   - Should see list of real candidates
   - Try search and filter
   - Check exam counts and scores

3. **Test Reports Page**:
   - Go to `/institution/reports`
   - Should see real statistics
   - Check chart shows actual exam data
   - Verify numbers match database

4. **Check Console**:
   - No errors
   - API calls successful
   - Data loading properly

---

## Expected Behavior

### Candidates Page
- Shows all candidates from institution
- Displays accurate exam counts
- Shows average scores (only from published results)
- Search works across name and email
- Filter works for active/inactive status

### Reports Page
- Shows institution-wide statistics
- Average score reflects all published results
- Pass rate based on 40% threshold
- Chart shows top 10 exams by attempt count
- All numbers are real-time from database

---

## Empty States

### No Candidates
- Shows "No candidates found" message
- Happens when institution has no registered candidates

### No Reports
- Shows "No exam data available yet" message
- Happens when no exams have been submitted

---

## API Security

Both APIs use:
- ✅ Service role client (bypasses RLS)
- ✅ Institution ID validation
- ✅ Proper error handling
- ✅ Console logging for debugging

---

## Performance Notes

- Candidates API: One query per candidate for stats (could be optimized with joins)
- Reports API: Single query for all attempts, then JavaScript aggregation
- Chart limited to 10 exams to prevent overcrowding
- All calculations done server-side

---

## Future Enhancements

1. **Candidates Page**:
   - Add risk level calculation
   - Add last active date
   - Add detailed view per candidate
   - Export to CSV

2. **Reports Page**:
   - Add date range filter
   - Add more chart types (pie, line)
   - Add subject-wise breakdown
   - Add trend analysis
   - Export reports to PDF

---

**Status**: ✅ COMPLETE - All institution pages now use real data

**Restart server and test!**
