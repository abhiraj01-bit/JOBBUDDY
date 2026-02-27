import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: institutions, error } = await supabase
      .from('institutions')
      .select('id, name, region, country')
      .order('name')

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch institutions' }, { status: 500 })
    }

    return NextResponse.json({ institutions })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
