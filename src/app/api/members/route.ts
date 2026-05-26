import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const blacklist = searchParams.get('blacklist')
  const kicked = searchParams.get('kicked')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = (page - 1) * limit

  let query = supabaseAdmin.from('members').select('*', { count: 'exact' })

  if (search) {
    query = query.or(`name.ilike.%${search}%,nickname.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
  }
  if (blacklist === 'true') query = query.eq('is_blacklist', true)
  if (blacklist === 'false') query = query.eq('is_blacklist', false)
  if (kicked === 'true') query = query.eq('is_kicked', true)

  const { data, count, error } = await query
    .order('name')
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('members').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
