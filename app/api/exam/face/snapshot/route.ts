import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { attemptId, imageDataUrl, embedding, similarity, matchStatus } = await req.json()

    if (!attemptId) {
      return NextResponse.json({ error: 'Missing attemptId' }, { status: 400 })
    }

    // Save snapshot to face_snapshots table
    const { error } = await supabase
      .from('face_snapshots')
      .insert({
        attempt_id: attemptId,
        snapshot_url: imageDataUrl, // Store as base64 or upload to storage
        embedding: embedding,
        similarity_score: similarity,
        match_status: matchStatus,
        captured_at: new Date().toISOString()
      })

    if (error) {
      console.error('Snapshot save error:', error)
      return NextResponse.json({ error: 'Failed to save snapshot' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Snapshot error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
