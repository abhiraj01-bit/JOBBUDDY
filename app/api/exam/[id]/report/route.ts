import { NextRequest, NextResponse } from 'next/server'
import { riskScoringAI } from '@/lib/ai/risk-scoring'

const examSessions = new Map<string, any>()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { violations, duration } = body

    // Calculate AI-powered risk score
    const riskAnalysis = riskScoringAI.calculateRiskScore(violations, duration)
    const insights = riskScoringAI.generateInsights(violations)

    const report = {
      examId: id,
      timestamp: new Date().toISOString(),
      duration,
      riskScore: riskAnalysis.riskScore,
      riskLevel: riskAnalysis.riskLevel,
      recommendation: riskAnalysis.recommendation,
      totalViolations: riskAnalysis.totalViolations,
      genuineViolations: riskAnalysis.genuineViolations,
      violationSummary: riskAnalysis.violationSummary,
      analysis: riskAnalysis.analysis,
      insights,
      violations: violations.slice(0, 50) // Limit to 50 for report
    }

    return NextResponse.json(report)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
