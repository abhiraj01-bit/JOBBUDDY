import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = await request.json()
    const { id: examId } = await params

    const { data, error } = await supabaseAdmin
      .from('exams')
      .update({ status })
      .eq('id', examId)
      .select()
      .single()

    if (error) {
      console.error('Update exam error:', error)
      return NextResponse.json({ error: 'Failed to update exam: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, exam: data })
  } catch (error) {
    console.error('Update exam error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params

    const { data: exam, error } = await supabaseAdmin
      .from('exams')
      .select('*, questions(*)')
      .eq('id', examId)
      .single()

    if (error) {
      console.error('Fetch exam error:', error)
      return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 404 })
    }

    // Sort questions by order_index if available
    if (exam && exam.questions) {
      exam.questions.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
    }

    return NextResponse.json({ exam })
  } catch (error) {
    console.error('Get exam error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
