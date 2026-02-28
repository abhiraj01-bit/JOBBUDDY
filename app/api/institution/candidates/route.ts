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

    // Fetch all candidates from this institution
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, created_at')
      .eq('institution_id', institutionId)
      .eq('role', 'candidate')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Users fetch error:', usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    // For each candidate, get their exam stats
    const candidatesWithStats = await Promise.all(
      (users || []).map(async (user) => {
        // Get exam attempts
        const { data: attempts } = await supabaseAdmin
          .from('exam_attempts')
          .select('score, max_score, status')
          .eq('candidate_id', user.id)
          .eq('status', 'submitted')

        const examsCompleted = attempts?.length || 0
        const publishedAttempts = attempts?.filter(a => a.score !== null) || []
        
        let avgScore = null
        if (publishedAttempts.length > 0) {
          const totalPercentage = publishedAttempts.reduce((sum, a) => {
            return sum + ((a.score / (a.max_score || 100)) * 100)
          }, 0)
          avgScore = Math.round(totalPercentage / publishedAttempts.length)
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          examsCompleted,
          avgScore,
          status: 'Active',
          created_at: user.created_at
        }
      })
    )

    return NextResponse.json({ candidates: candidatesWithStats })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 })
  }
}
