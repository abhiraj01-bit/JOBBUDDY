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
    const { teacherId } = await request.json()

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID required' }, { status: 400 })
    }

    // Check if evaluated
    const { data: attempt } = await supabaseAdmin
      .from('exam_attempts')
      .select('evaluated, score')
      .eq('id', id)
      .single()

    if (!attempt?.evaluated || attempt?.score === null || attempt?.score === undefined) {
      return NextResponse.json({ error: 'Submission must be evaluated before publishing' }, { status: 400 })
    }

    // Publish result - lock from further editing
    const { error } = await supabaseAdmin
      .from('exam_attempts')
      .update({
        result_published: true,
        published_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Publish error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Result published successfully' })
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json({ error: 'Failed to publish result' }, { status: 500 })
  }
}
