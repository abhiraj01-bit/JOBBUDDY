import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Gemini initialized'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Initialization failed' },
      { status: 500 }
    )
  }
}
