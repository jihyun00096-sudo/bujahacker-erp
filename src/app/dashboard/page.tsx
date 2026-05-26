'use client'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [stats, setStats] = useState({ members: 0, lectures: 0, paid: 0, pending: 0 })

  useEffect(() => {
    async function load() {
      const [mRes, lRes] = await Promise.all([
        fetch('/api/members?limit=1'),
        fetch('/api/lectures'),
      ])
      const mData = await mRes.json()
      const lData = await lRes.json()
      const lectures = lData.data || []
      const paid = lectures.reduce((s: number, l: any) => s + (l.paid_count || 0), 0)
      const pending = lectures.reduce((s: number, l: any) => s + (l.pending_count || 0), 0)
      setStats({ members: mData.total || 0, lectures: lectures.length, paid, pending })
    }
    load()
  }, [])

  const cards = [
    { label: '전체 회원', value: stats.members, color: 'var(--accent)', border: 'var(--accent)' },
    { label: '전체 강의', value: stats.lectures, color: '#f7c948', border: '#f7c948' },
    { label: '결제 완료', value: stats.paid, color: 'var(--success)', border: 'var(--success)' },
    { label: '입금 대기', value: stats.pending, color: 'var(--danger)', border: 'var(--danger)' },
  ]

  return (
    <div>
      <div style={{ padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', background: 'rgba(13,15,20,0.9)' }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>대시보드</div>
      </div>
      <div style={{ padding: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
          {cards.map(c => (
            <div key={c.label} className="card" style={{ padding: 20, borderTop: `2px solid ${c.border}` }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'Space Mono', color: c.color }}>{c.value.toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div style={{ color: 'var(--text2)', fontSize: 14 }}>왼쪽 메뉴에서 전체 회원 또는 강의 관리를 선택하세요.</div>
      </div>
    </div>
  )
}
