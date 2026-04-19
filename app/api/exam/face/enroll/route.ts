import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { examId, candidateId, imageDataUrl, embedding } = await req.json()

    if (!examId || !candidateId || !imageDataUrl || !embedding) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('face_enrollments')
      .select('id')
      .eq('exam_id', examId)
      .eq('candidate_id', candidateId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'You have already enrolled for this exam. Cannot retake.' }, { status: 409 })
    }

    // Save image to database as base64 (since Vercel has a read-only filesystem)
    const faceUrl = imageDataUrl

    // Store in database
    const { error } = await supabase
      .from('face_enrollments')
      .insert({
        exam_id: examId,
        candidate_id: candidateId,
        face_url: faceUrl,
        embedding: embedding,
        enrolled_at: new Date().toISOString()
      })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to save face data' }, { status: 500 })
    }

    return NextResponse.json({ success: true, faceUrl, embedding })
  } catch (error) {
    console.error('Face enrollment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
