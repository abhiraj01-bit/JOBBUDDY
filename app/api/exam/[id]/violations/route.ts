import { NextRequest, NextResponse } from 'next/server'

const examSessions = new Map<string, any>()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { violations } = body

    if (!examSessions.has(id)) {
      examSessions.set(id, {
        examId: id,
        startTime: new Date().toISOString(),
        violations: []
      })
    }

    const session = examSessions.get(id)
    session.violations.push(...violations)

    return NextResponse.json({
      success: true,
      violationCount: session.violations.length
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save violations' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = examSessions.get(id)

    if (!session) {
      return NextResponse.json(
        { error: 'Exam session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(session)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}
