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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch submission with related data using service role
    const { data: submission, error } = await supabaseAdmin
      .from('exam_attempts')
      .select(`
        *,
        users!candidate_id(name, email),
        exams(title, subject, max_score)
      `)
      .eq('id', id)
      .single()

    if (error || !submission) {
      console.error('Submission fetch error:', error)
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Fetch violations
    const { data: violations } = await supabaseAdmin
      .from('violations')
      .select('*')
      .eq('attempt_id', id)
      .order('timestamp', { ascending: true })

    return NextResponse.json({
      submission: {
        ...submission,
        candidate_name: submission.users?.name || 'Unknown',
        exam_title: submission.exams?.title || 'Unknown Exam',
        max_score: submission.exams?.max_score || 100
      },
      violations: violations || []
    })
  } catch (error) {
    console.error('Fetch submission error:', error)
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 })
  }
}
