import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { attemptId, type, severity, description, timestamp, similarity } = await req.json()

    if (!attemptId || !type || !severity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Calculate risk score increase
    const riskIncrease = severity === 'critical' ? 20 : 
                        severity === 'high' ? 15 :
                        severity === 'medium' ? 10 : 5

    // Update identity_risk_score in exam_attempts
    const { data: attempt } = await supabase
      .from('exam_attempts')
      .select('identity_risk_score')
      .eq('id', attemptId)
      .single()

    const currentRisk = attempt?.identity_risk_score || 0
    const newRisk = Math.min(100, currentRisk + riskIncrease)

    await supabase
      .from('exam_attempts')
      .update({ identity_risk_score: newRisk })
      .eq('id', attemptId)

    // Log violation (optional - if you want to keep violation history)
    // You can create a violations table or just update the risk score

    return NextResponse.json({ success: true, newRiskScore: newRisk })
  } catch (error) {
    console.error('Violation logging error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
