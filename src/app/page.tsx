'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        router.push('/dashboard')
      } else {
        setError(data.error || '로그인 실패')
      }
    } catch {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 60% 40%, #1a2540 0%, #0d0f14 70%)' }}>
      <div className="card" style={{ width: 380, padding: '48px 40px' }}>
        <div style={{ fontFamily: 'Space Mono', fontSize: 11, color: 'var(--accent)', letterSpacing: 3, marginBottom: 8 }}>BUJAHACKER SCHOOL</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>
          관리자 <span style={{ color: 'var(--accent)' }}>로그인</span>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>아이디</label>
            <input className="input" type="text" placeholder="아이디" value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>비밀번호</label>
            <input className="input" type="password" placeholder="비밀번호" value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
          </div>
          {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', padding: '13px', fontSize: 15, opacity: loading ? 0.7 : 1 }}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
