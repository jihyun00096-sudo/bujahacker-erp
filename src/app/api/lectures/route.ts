import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabaseAdmin.from('lectures').select(`
    *, 
    applicants(count),
    applicants!inner(pay_status)
  `)

  // 심플하게 그냥 강의만 조회
  let q2 = supabaseAdmin.from('lectures').select('*', { count: 'exact' })
  if (status) q2 = q2.eq('status', status)
  const { data, count } = await q2.order('created_at', { ascending: false })

  // 각 강의별 신청자 수, 결제완료 수 추가
  const lecturesWithStats = await Promise.all((data || []).map(async (lecture) => {
    const { count: total } = await supabaseAdmin.from('applicants').select('*', { count: 'exact', head: true }).eq('lecture_id', lecture.id)
    const { count: paid } = await supabaseAdmin.from('applicants').select('*', { count: 'exact', head: true }).eq('lecture_id', lecture.id).eq('pay_status', '결제완료')
    const { count: pending } = await supabaseAdmin.from('applicants').select('*', { count: 'exact', head: true }).eq('lecture_id', lecture.id).eq('pay_status', '입금확인전')
    return { ...lecture, total_applicants: total || 0, paid_count: paid || 0, pending_count: pending || 0 }
  }))

  return NextResponse.json({ data: lecturesWithStats, total: count })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('lectures').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
