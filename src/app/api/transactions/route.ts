import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const lectureId = searchParams.get('lecture_id')

  let query = supabaseAdmin.from('transactions').select('*, applicants(name, phone)')
  if (lectureId) query = query.eq('lecture_id', lectureId)
  const { data, error } = await query.order('tx_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const body = await req.json()

  // 이름으로 자동 매칭
  const { data: matched } = await supabaseAdmin.from('applicants')
    .select('id, name').eq('lecture_id', body.lecture_id)
    .or(`name.eq.${body.sender_name},sender_name.eq.${body.sender_name}`)
    .single()

  if (matched) {
    body.is_matched = true
    body.matched_applicant_id = matched.id
    // 결제완료 자동 처리
    await supabaseAdmin.from('applicants').update({ pay_status: '결제완료', pay_amount: body.amount, pay_type: body.tx_type }).eq('id', matched.id)
  }

  const { data, error } = await supabaseAdmin.from('transactions').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, auto_matched: !!matched, matched_name: matched?.name })
}
