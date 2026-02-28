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

    // Convert base64 to buffer
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Save to public/faces directory
    const filename = `face-${candidateId}-${Date.now()}.jpg`
    const filepath = join(process.cwd(), 'public', 'faces', filename)
    
    try {
      await mkdir(join(process.cwd(), 'public', 'faces'), { recursive: true })
    } catch (err) {
      // Directory might already exist
    }
    
    await writeFile(filepath, buffer)

    const faceUrl = `/faces/${filename}`

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
