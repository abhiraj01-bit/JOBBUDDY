import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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

    // Get all exam attempts for this institution
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from('exam_attempts')
      .select('*, exams(title)')
      .eq('institution_id', institutionId)
      .eq('status', 'submitted')

    if (attemptsError) {
      console.error('Attempts fetch error:', attemptsError)
      return NextResponse.json({ error: attemptsError.message }, { status: 500 })
    }

    const totalAttempts = attempts?.length || 0
    const publishedAttempts = attempts?.filter(a => a.result_published && a.score !== null) || []
    const pendingEvaluation = attempts?.filter(a => !a.evaluated).length || 0

    // Calculate average score
    let avgScore = null
    if (publishedAttempts.length > 0) {
      const totalPercentage = publishedAttempts.reduce((sum, a) => {
        return sum + ((a.score / (a.max_score || 100)) * 100)
      }, 0)
      avgScore = Math.round(totalPercentage / publishedAttempts.length)
    }

    // Calculate pass rate (assuming 40% is passing)
    let passRate = null
    if (publishedAttempts.length > 0) {
      const passed = publishedAttempts.filter(a => {
        const percentage = (a.score / (a.max_score || 100)) * 100
        return percentage >= 40
      }).length
      passRate = Math.round((passed / publishedAttempts.length) * 100)
    }

    // Group by exam for chart
    const examGroups: Record<string, any[]> = {}
    publishedAttempts.forEach(attempt => {
      const examTitle = attempt.exams?.title || 'Unknown Exam'
      if (!examGroups[examTitle]) {
        examGroups[examTitle] = []
      }
      examGroups[examTitle].push(attempt)
    })

    const examPerformance = Object.entries(examGroups).map(([exam, attempts]) => {
      const totalPercentage = attempts.reduce((sum, a) => {
        return sum + ((a.score / (a.max_score || 100)) * 100)
      }, 0)
      return {
        exam: exam.length > 20 ? exam.substring(0, 20) + '...' : exam,
        avgScore: Math.round(totalPercentage / attempts.length),
        attempts: attempts.length
      }
    }).slice(0, 10) // Limit to 10 exams for chart

    return NextResponse.json({
      stats: {
        avgScore,
        passRate,
        totalAttempts,
        pendingEvaluation
      },
      examPerformance
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
