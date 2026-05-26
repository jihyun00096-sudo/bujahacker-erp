import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const body = await req.json()

  // 결제완료로 변경 시 전체회원명단 수강이력 업데이트
  if (body.pay_status === '결제완료') {
    const { data: applicant } = await supabaseAdmin.from('applicants').select('*').eq('id', params.id).single()
    if (applicant?.member_id && applicant?.lecture_id) {
      await supabaseAdmin.from('lecture_history').upsert({ member_id: applicant.member_id, lecture_id: applicant.lecture_id })
      // 수강 강의 수 업데이트
      const { count } = await supabaseAdmin.from('lecture_history').select('*', { count: 'exact', head: true }).eq('member_id', applicant.member_id)
      await supabaseAdmin.from('members').update({ lecture_count: count }).eq('id', applicant.member_id)
    }
  }

  const { data, error } = await supabaseAdmin.from('applicants').update(body).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const { error } = await supabaseAdmin.from('applicants').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
