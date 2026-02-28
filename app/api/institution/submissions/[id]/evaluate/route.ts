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
    const { id } = await params
    const { score, remarks, teacherId } = await request.json()

    if (score === undefined || score === null || !teacherId) {
      return NextResponse.json({ error: 'Score and teacher ID required' }, { status: 400 })
    }

    // Update exam attempt with evaluation
    const { error } = await supabaseAdmin
      .from('exam_attempts')
      .update({
        score: parseInt(score),
        teacher_remarks: remarks || '',
        evaluated: true,
        evaluated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Evaluation update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Evaluation saved successfully' })
  } catch (error) {
    console.error('Evaluation error:', error)
    return NextResponse.json({ error: 'Failed to save evaluation' }, { status: 500 })
  }
}
