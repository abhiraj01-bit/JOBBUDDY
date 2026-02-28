import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials:', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseServiceKey 
  })
}

// Service role client bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params
    const { candidateId } = await request.json()

    console.log('Start exam request:', { examId, candidateId })

    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID required' }, { status: 400 })
    }

    // Get exam details
    const { data: exam, error: examError } = await supabaseAdmin
      .from('exams')
      .select('max_score, institution_id')
      .eq('id', examId)
      .single()

    console.log('Exam fetch result:', { exam, examError })

    if (examError || !exam) {
      return NextResponse.json({ 
        error: 'Exam not found',
        details: examError 
      }, { status: 404 })
    }

    // Check if attempt already exists
    const { data: existing } = await supabaseAdmin
      .from('exam_attempts')
      .select('id')
      .eq('exam_id', examId)
      .eq('candidate_id', candidateId)
      .eq('status', 'in_progress')
      .maybeSingle()

    if (existing) {
      console.log('Existing attempt found:', existing.id)
      return NextResponse.json({ attemptId: existing.id })
    }

    // Create new exam attempt (institution_id will be auto-populated by trigger)
    console.log('Creating new attempt...')
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('exam_attempts')
      .insert({
        exam_id: examId,
        candidate_id: candidateId,
        max_score: exam.max_score,
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    console.log('Attempt creation result:', { attempt, attemptError })

    if (attemptError) {
      console.error('Attempt creation error:', attemptError)
      return NextResponse.json({ 
        error: attemptError.message || 'Failed to create attempt',
        details: attemptError 
      }, { status: 500 })
    }

    if (!attempt) {
      return NextResponse.json({ error: 'No attempt returned' }, { status: 500 })
    }

    console.log('Attempt created successfully:', attempt.id)
    return NextResponse.json({ attemptId: attempt.id })
  } catch (error: any) {
    console.error('Start exam error:', error)
    return NextResponse.json({ 
      error: 'Failed to start exam',
      message: error.message,
      details: error
    }, { status: 500 })
  }
}
