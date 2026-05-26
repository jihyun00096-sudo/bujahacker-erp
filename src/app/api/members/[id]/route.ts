import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data: member } = await supabaseAdmin.from('members').select('*').eq('id', params.id).single()
  const { data: invests } = await supabaseAdmin.from('member_invest').select('*').eq('member_id', params.id)
  const { data: history } = await supabaseAdmin
    .from('lecture_history')
    .select('*, lectures(id, name, start_date)')
    .eq('member_id', params.id)

  return NextResponse.json({ data: { ...member, invests, history } })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('members').update(body).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { error } = await supabaseAdmin.from('members').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
