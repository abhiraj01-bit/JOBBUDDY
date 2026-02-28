import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const attemptId = searchParams.get('attemptId')

    if (!attemptId) {
      return NextResponse.json({ error: 'Missing attemptId' }, { status: 400 })
    }

    // Get attempt to find exam_id and candidate_id
    const { data: attempt } = await supabase
      .from('exam_attempts')
      .select('exam_id, candidate_id, reference_face_embedding')
      .eq('id', attemptId)
      .single()

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // If embedding already in attempt, return it
    if (attempt.reference_face_embedding) {
      return NextResponse.json({ embedding: attempt.reference_face_embedding })
    }

    // Otherwise, fetch from face_enrollments
    const { data: enrollment } = await supabase
      .from('face_enrollments')
      .select('embedding')
      .eq('exam_id', attempt.exam_id)
      .eq('candidate_id', attempt.candidate_id)
      .order('enrolled_at', { ascending: false })
      .limit(1)
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: 'No face enrollment found' }, { status: 404 })
    }

    // Update attempt with embedding for faster future access
    await supabase
      .from('exam_attempts')
      .update({ reference_face_embedding: enrollment.embedding })
      .eq('id', attemptId)

    return NextResponse.json({ embedding: enrollment.embedding })
  } catch (error) {
    console.error('Reference fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
