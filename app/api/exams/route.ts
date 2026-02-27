import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { title, subject, description, duration, totalQuestions, maxScore, questions, institutionId, createdBy, scheduledDate } = await request.json()

    if (!title || !subject || !duration || !totalQuestions || !maxScore || !institutionId || !createdBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create exam
    const { data: exam, error: examError } = await supabaseAdmin
      .from('exams')
      .insert({
        title,
        subject,
        description,
        duration: parseInt(duration),
        total_questions: parseInt(totalQuestions),
        max_score: parseInt(maxScore),
        institution_id: institutionId,
        created_by: createdBy,
        status: 'draft',
        scheduled_date: scheduledDate || null
      })
      .select()
      .single()

    if (examError) {
      console.error('Exam creation error:', examError)
      return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 })
    }

    // Create questions if provided
    if (questions && questions.length > 0) {
      const questionsData = questions.map((q: any, index: number) => ({
        exam_id: exam.id,
        text: q.text,
        type: q.type,
        options: q.options || null,
        correct_answer: q.correctAnswer !== undefined ? q.correctAnswer : null,
        marks: q.marks,
        order_index: index
      }))

      const { error: questionsError } = await supabaseAdmin
        .from('questions')
        .insert(questionsData)

      if (questionsError) {
        console.error('Questions creation error:', questionsError)
        return NextResponse.json({ error: 'Exam created but failed to add questions' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, exam })
  } catch (error) {
    console.error('Create exam error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get('institutionId')
    const status = searchParams.get('status')

    let query = supabaseAdmin
      .from('exams')
      .select('*, questions(count)')

    if (institutionId) {
      query = query.eq('institution_id', institutionId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: exams, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch exams error:', error)
      return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
    }

    return NextResponse.json({ exams })
  } catch (error) {
    console.error('Get exams error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
