import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service role client bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get('institutionId')

    if (!institutionId) {
      return NextResponse.json({ error: 'Institution ID required' }, { status: 400 })
    }

    // Fetch submitted exam attempts with candidate and exam details
    const { data: submissions, error } = await supabaseAdmin
      .from('exam_attempts')
      .select(`
        *,
        users!candidate_id(name),
        exams(title, subject)
      `)
      .eq('institution_id', institutionId)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Submissions fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get violation counts for each submission
    const submissionsWithViolations = await Promise.all(
      (submissions || []).map(async (sub) => {
        const { count } = await supabaseAdmin
          .from('violations')
          .select('*', { count: 'exact', head: true })
          .eq('attempt_id', sub.id)

        return {
          ...sub,
          candidate_name: sub.users?.name || 'Unknown',
          exam_title: sub.exams?.title || 'Unknown Exam',
          violation_count: count || 0
        }
      })
    )

    return NextResponse.json({ submissions: submissionsWithViolations })
  } catch (error) {
    console.error('Fetch submissions error:', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}
