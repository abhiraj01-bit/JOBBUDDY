import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { riskScoringAI } from '@/lib/ai/risk-scoring'

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
    const { id: attemptId } = await params

    // Fetch exam attempt using service role to bypass RLS
    const { data: attempt, error } = await supabaseAdmin
      .from('exam_attempts')
      .select(`
        *,
        exams(title, subject, max_score)
      `)
      .eq('id', attemptId)
      .single()

    if (error || !attempt) {
      console.error('Attempt fetch error:', error)
      return NextResponse.json({ error: 'Result not found' }, { status: 404 })
    }

    // Check if result is published
    if (!attempt.result_published) {
      return NextResponse.json({ 
        error: 'Result is under evaluation by your institution. Please check back later.' 
      }, { status: 403 })
    }

    // Fetch violations for report
    const { data: violations } = await supabaseAdmin
      .from('violations')
      .select('*')
      .eq('attempt_id', attemptId)
      .order('timestamp', { ascending: true })

    // Generate AI analysis
    const riskAnalysis = riskScoringAI.calculateRiskScore(
      violations || [],
      attempt.duration_seconds || 3600
    )
    const insights = riskScoringAI.generateInsights(violations || [])

    console.log('Result API - Attempt data:', {
      attemptId,
      score: attempt.score,
      evaluated: attempt.evaluated,
      result_published: attempt.result_published,
      teacher_remarks: attempt.teacher_remarks
    })

    const report = {
      examId: attemptId,
      examTitle: attempt.exams?.title || 'Exam',
      timestamp: attempt.submitted_at,
      duration: attempt.duration_seconds || 0,
      score: attempt.score ?? 0,
      maxScore: attempt.exams?.max_score || 100,
      teacherRemarks: attempt.teacher_remarks || '',
      riskScore: riskAnalysis.riskScore,
      riskLevel: riskAnalysis.riskLevel,
      recommendation: riskAnalysis.recommendation,
      totalViolations: riskAnalysis.totalViolations,
      genuineViolations: riskAnalysis.genuineViolations,
      violationSummary: riskAnalysis.violationSummary,
      analysis: riskAnalysis.analysis,
      insights,
      violations: violations?.slice(0, 50) || []
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Fetch result error:', error)
    return NextResponse.json({ error: 'Failed to fetch result' }, { status: 500 })
  }
}
