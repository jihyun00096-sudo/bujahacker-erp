'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Lecture = { id: number; name: string; start_date: string; end_date: string; price: number; status: string; form_url: string; memo: string; total_applicants: number; paid_count: number; pending_count: number }

const EMPTY_FORM = { name: '', short_name: '', start_date: '', end_date: '', price: '', status: '모집중', form_url: '', memo: '' }
const STATUS_COLORS: Record<string, string> = { '모집중': 'badge-blue', '진행중': 'badge-green', '완료': 'badge-gray' }

export default function LecturesPage() {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Lecture | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  async function load() {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/lectures?${params}`)
    const data = await res.json()
    setLectures(data.data || [])
  }

  useEffect(() => { load() }, [statusFilter])

  function openAdd() { setForm(EMPTY_FORM); setSelected(null); setModal('add') }
  function openEdit(l: Lecture) {
    setSelected(l)
    setForm({ name: l.name, short_name: '', start_date: l.start_date || '', end_date: l.end_date || '', price: String(l.price || ''), status: l.status, form_url: l.form_url || '', memo: l.memo || '' })
    setModal('edit')
  }

  async function save() {
    setSaving(true)
    const body = { ...form, price: form.price ? parseInt(form.price) : null }
    const res = await fetch(selected ? `/api/lectures/${selected.id}` : '/api/lectures', {
      method: selected ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) { setModal(null); load() }
    setSaving(false)
  }

  async function deleteLecture() {
    if (!confirm('강의를 삭제하면 관련 신청자 데이터도 모두 삭제됩니다. 계속하시겠습니까?')) return
    await fetch(`/api/lectures/${selected?.id}`, { method: 'DELETE' })
    setModal(null); load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>강의 관리 <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 400 }}>총 {lectures.length}개</span></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">전체 상태</option>
            <option value="모집중">모집중</option>
            <option value="진행중">진행중</option>
            <option value="완료">완료</option>
          </select>
          <button className="btn-primary" style={{ fontSize: 13, padding: '7px 14px' }} onClick={openAdd}>+ 새 강의 추가</button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {lectures.map(l => (
            <div key={l.id} className="card" style={{ padding: 20, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ flex: 1, marginRight: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>{l.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{l.start_date} ~ {l.end_date}</div>
                </div>
                <span className={`badge ${STATUS_COLORS[l.status] || 'badge-gray'}`}>{l.status}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>수강료: {l.price?.toLocaleString()}원</div>
              <div style={{ display: 'flex', gap: 16, paddingTop: 12, borderTop: '1px solid var(--border)', marginBottom: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Space Mono', color: 'var(--accent)' }}>{l.total_applicants}</div>
                  <div style={{ fontSize: 10, color: 'var(--text2)' }}>신청</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Space Mono', color: 'var(--success)' }}>{l.paid_count}</div>
                  <div style={{ fontSize: 10, color: 'var(--text2)' }}>결제</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Space Mono', color: 'var(--warning)' }}>{l.pending_count}</div>
                  <div style={{ fontSize: 10, color: 'var(--text2)' }}>대기</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href={`/dashboard/lectures/${l.id}`} style={{ flex: 1 }}>
                  <button className="btn-primary" style={{ width: '100%', fontSize: 12, padding: '7px' }}>명단 관리</button>
                </Link>
                <button className="btn-secondary" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => openEdit(l)}>수정</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 강의 추가/수정 모달 */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 26px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>{modal === 'add' ? '새 강의 추가' : '강의 수정'}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '20px 26px' }}>
              {[
                { key: 'name', label: '강의명 *', type: 'text', placeholder: '소액부동산 완전정복반 (4주)' },
                { key: 'start_date', label: '시작일', type: 'date', placeholder: '' },
                { key: 'end_date', label: '종료일', type: 'date', placeholder: '' },
                { key: 'price', label: '수강료', type: 'number', placeholder: '270000' },
                { key: 'form_url', label: '구글폼 URL', type: 'text', placeholder: 'https://forms.gle/...' },
                { key: 'memo', label: '메모', type: 'text', placeholder: '' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{label}</label>
                  <input className="input" type={type} placeholder={placeholder} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>상태</label>
                <select className="select" style={{ width: '100%' }} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option>모집중</option><option>진행중</option><option>완료</option>
                </select>
              </div>
            </div>
            <div style={{ padding: '14px 26px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              {modal === 'edit' && <button className="btn-danger" onClick={deleteLecture} style={{ fontSize: 13 }}>삭제</button>}
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button className="btn-secondary" onClick={() => setModal(null)} style={{ fontSize: 13 }}>취소</button>
                <button className="btn-primary" onClick={save} disabled={saving} style={{ fontSize: 13 }}>{saving ? '저장 중...' : '저장'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
