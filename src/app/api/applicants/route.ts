import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const lectureId = searchParams.get('lecture_id')
  const status = searchParams.get('status')
  const search = searchParams.get('search') || ''

  let query = supabaseAdmin.from('applicants').select('*', { count: 'exact' })
  if (lectureId) query = query.eq('lecture_id', lectureId)
  if (status) query = query.eq('pay_status', status)
  if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,sender_name.ilike.%${search}%`)

  const { data, count, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const body = await req.json()

  // 회원 조회 (전화번호로)
  const { data: member } = await supabaseAdmin.from('members').select('id, lecture_count, is_blacklist, blacklist_memo, note').eq('phone', body.phone).single()
  if (member) {
    body.member_id = member.id
    body.lecture_history_count = member.lecture_count || 0
    body.is_blacklist = member.is_blacklist
    body.blacklist_memo = member.blacklist_memo
  }

  const { data, error } = await supabaseAdmin.from('applicants').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
