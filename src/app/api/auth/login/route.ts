import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!username || !password) return NextResponse.json({ error: '아이디와 비밀번호를 입력해주세요.' }, { status: 400 })

  const { data: admin } = await supabaseAdmin
    .from('admins')
    .select('*')
    .eq('username', username)
    .single()

  if (!admin) return NextResponse.json({ error: '아이디 또는 비밀번호가 틀렸습니다.' }, { status: 401 })

  // 첫 로그인 시 비밀번호 설정 (SETUP_IN_NEXTJS 상태)
  if (admin.password_hash === 'SETUP_IN_NEXTJS') {
    const hash = await bcrypt.hash(password, 10)
    await supabaseAdmin.from('admins').update({ password_hash: hash }).eq('id', admin.id)
  } else {
    const valid = await bcrypt.compare(password, admin.password_hash)
    if (!valid) return NextResponse.json({ error: '아이디 또는 비밀번호가 틀렸습니다.' }, { status: 401 })
  }

  const token = await createToken({ id: admin.id, username: admin.username, role: admin.role })
  const res = NextResponse.json({ success: true, user: { username: admin.username, name: admin.name, role: admin.role } })
  res.cookies.set('auth_token', token, { httpOnly: true, maxAge: 60 * 60 * 24, path: '/' })
  return res
}
