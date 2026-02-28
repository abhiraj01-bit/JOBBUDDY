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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params
    const { attemptId, answers, violations, duration, candidateId } = await request.json()

    if (!attemptId) {
      return NextResponse.json({ error: 'Attempt ID required' }, { status: 400 })
    }

    // Update exam attempt - DO NOT calculate score yet
    const { error: updateError } = await supabaseAdmin
      .from('exam_attempts')
      .update({
        answers,
        duration_seconds: Math.floor(duration),
        submitted_at: new Date().toISOString(),
        status: 'submitted',
        evaluated: false,
        result_published: false
      })
      .eq('id', attemptId)
      .eq('candidate_id', candidateId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Store violations
    if (violations && violations.length > 0) {
      const violationRecords = violations.map((v: any) => ({
        attempt_id: attemptId,
        type: v.type,
        severity: v.severity,
        description: v.description,
        confidence: v.confidence || 0.9,
        timestamp: v.timestamp,
        metadata: v
      }))

      await supabaseAdmin.from('violations').insert(violationRecords)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Exam submitted successfully. Results will be available after evaluation.'
    })
  } catch (error) {
    console.error('Submission error:', error)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
