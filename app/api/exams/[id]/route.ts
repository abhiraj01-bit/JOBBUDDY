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
