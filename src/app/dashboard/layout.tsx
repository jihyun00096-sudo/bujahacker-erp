'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ username: string; name: string; role: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.error) router.push('/')
      else setUser(d.user)
    })
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const navItems = [
    { href: '/dashboard', icon: '📊', label: '대시보드' },
    { href: '/dashboard/members', icon: '👥', label: '전체 회원' },
    { href: '/dashboard/lectures', icon: '📚', label: '강의 관리' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* 사이드바 */}
      <aside className="sidebar" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'Space Mono', fontSize: 10, color: 'var(--accent)', letterSpacing: 2, marginBottom: 4 }}>BUJAHACKER</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>부자해커<span style={{ color: 'var(--accent)' }}>스쿨</span></div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          <div style={{ padding: '8px 16px 4px', fontSize: 10, color: 'var(--text3)', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700 }}>메뉴</div>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div className={`nav-item ${pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) ? 'active' : ''}`}>
                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{user?.role === 'admin' ? '관리자' : '스태프'}</div>
          </div>
          <button onClick={logout} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text2)', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 */}
      <main style={{ marginLeft: 220, flex: 1, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
