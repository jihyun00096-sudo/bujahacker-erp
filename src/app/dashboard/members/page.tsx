'use client'
import { useEffect, useState, useCallback } from 'react'

type Member = {
  id: number; name: string; nickname: string; bank: string; bank_holder: string;
  phone: string; email: string; is_kicked: boolean; is_blacklist: boolean;
  blacklist_memo: string; note: string; lecture_count: number;
}

const EMPTY_FORM = { name: '', nickname: '', bank: '', bank_holder: '', phone: '', email: '', is_kicked: false, is_blacklist: false, blacklist_memo: '', note: '' }

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [blackFilter, setBlackFilter] = useState('')
  const [kickFilter, setKickFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<'add' | 'edit' | 'detail' | null>(null)
  const [selected, setSelected] = useState<Member | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '50', search })
    if (blackFilter) params.set('blacklist', blackFilter)
    if (kickFilter) params.set('kicked', kickFilter)
    const res = await fetch(`/api/members?${params}`)
    const data = await res.json()
    setMembers(data.data || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, search, blackFilter, kickFilter])

  useEffect(() => { load() }, [load])

  function openAdd() { setForm(EMPTY_FORM); setModal('add') }
  function openEdit(m: Member) { setSelected(m); setForm({ name: m.name, nickname: m.nickname || '', bank: m.bank || '', bank_holder: m.bank_holder || '', phone: m.phone || '', email: m.email || '', is_kicked: m.is_kicked, is_blacklist: m.is_blacklist, blacklist_memo: m.blacklist_memo || '', note: m.note || '' }); setModal('edit') }
  function openDetail(m: Member) { setSelected(m); setModal('detail') }

  async function save() {
    setSaving(true)
    const isEdit = modal === 'edit'
    const res = await fetch(isEdit ? `/api/members/${selected?.id}` : '/api/members', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) { setModal(null); load() }
    setSaving(false)
  }

  async function deleteMember() {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await fetch(`/api/members/${selected?.id}`, { method: 'DELETE' })
    setModal(null); load()
  }

  async function downloadExcel() {
    const res = await fetch(`/api/members?limit=99999&search=${search}`)
    const data = await res.json()
    const rows = data.data || []
    const header = ['No', '이름', '닉네임', '은행', '예금주', '핸드폰', '이메일', '블랙리스트', '강퇴', '특이사항', '수강강의수']
    const csv = [header, ...rows.map((m: Member, i: number) => [i+1, m.name, m.nickname, m.bank, m.bank_holder, m.phone, m.email, m.is_blacklist ? 'Y' : '-', m.is_kicked ? 'Y' : '-', m.note, m.lecture_count])].map(r => r.map((c: any) => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `전체회원명단_${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* 상단 */}
      <div style={{ padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>전체 회원 명단 <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 400 }}>총 {total.toLocaleString()}명</span></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" style={{ fontSize: 13, padding: '7px 14px' }} onClick={downloadExcel}>⬇ 엑셀 다운로드</button>
          <button className="btn-primary" style={{ fontSize: 13, padding: '7px 14px' }} onClick={openAdd}>+ 회원 추가</button>
        </div>
      </div>

      {/* 필터 */}
      <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0, background: 'var(--surface)' }}>
        <input className="input" style={{ maxWidth: 320 }} placeholder="🔍 이름, 닉네임, 전화번호, 이메일 검색..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        <select className="select" value={blackFilter} onChange={e => { setBlackFilter(e.target.value); setPage(1) }}>
          <option value="">블랙리스트 전체</option>
          <option value="true">블랙리스트만</option>
          <option value="false">정상 회원만</option>
        </select>
        <select className="select" value={kickFilter} onChange={e => { setKickFilter(e.target.value); setPage(1) }}>
          <option value="">강퇴 전체</option>
          <option value="true">강퇴자만</option>
        </select>
        <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => { setSearch(''); setBlackFilter(''); setKickFilter(''); setPage(1) }}>초기화</button>
      </div>

      {/* 테이블 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>불러오는 중...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>No</th><th>이름 / 닉네임</th><th>은행</th><th>핸드폰</th><th>이메일</th>
                <th style={{ textAlign: 'center' }}>수강수</th><th>블랙</th><th>강퇴</th><th>특이사항</th><th>관리</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.id} onClick={() => openDetail(m)} style={{ cursor: 'pointer' }}>
                  <td style={{ color: 'var(--text2)', fontFamily: 'Space Mono', fontSize: 11 }}>{(page - 1) * 50 + i + 1}</td>
                  <td><div style={{ fontWeight: 700 }}>{m.name}</div><div style={{ fontSize: 11, color: 'var(--text2)' }}>{m.nickname}</div></td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>{m.bank}</td>
                  <td style={{ fontFamily: 'Space Mono', fontSize: 12 }}>{m.phone}</td>
                  <td style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent)', fontFamily: 'Space Mono' }}>{m.lecture_count}</td>
                  <td>{m.is_blacklist ? <span className="badge badge-red">블랙</span> : <span style={{ color: 'var(--text3)' }}>-</span>}</td>
                  <td>{m.is_kicked ? <span className="badge badge-yellow">강퇴</span> : <span style={{ color: 'var(--text3)' }}>-</span>}</td>
                  <td style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.note}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn-secondary" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => openEdit(m)}>수정</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--surface)', flexShrink: 0 }}>
          <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>◀</button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const p = page <= 5 ? i + 1 : page - 4 + i
            if (p < 1 || p > totalPages) return null
            return <button key={p} className="btn-secondary" style={{ fontSize: 12, padding: '5px 10px', background: p === page ? 'var(--accent)' : '', color: p === page ? '#fff' : '', border: p === page ? 'none' : '' }} onClick={() => setPage(p)}>{p}</button>
          })}
          <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>▶</button>
          <span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 8 }}>{page}/{totalPages}페이지 · {total.toLocaleString()}명</span>
        </div>
      )}

      {/* 추가/수정 모달 */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 26px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>{modal === 'add' ? '회원 추가' : '회원 수정'}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '20px 26px' }}>
              {[
                { key: 'name', label: '이름 *', type: 'text' },
                { key: 'nickname', label: '닉네임(거래내용)', type: 'text' },
                { key: 'phone', label: '핸드폰', type: 'text' },
                { key: 'email', label: '이메일', type: 'text' },
                { key: 'bank', label: '은행', type: 'text' },
                { key: 'bank_holder', label: '예금주명', type: 'text' },
                { key: 'note', label: '특이사항', type: 'text' },
                { key: 'blacklist_memo', label: '블랙리스트 사유', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{label}</label>
                  <input className="input" type={type} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={form.is_blacklist} onChange={e => setForm(p => ({ ...p, is_blacklist: e.target.checked }))} /> 블랙리스트
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={form.is_kicked} onChange={e => setForm(p => ({ ...p, is_kicked: e.target.checked }))} /> 단톡방 강퇴
                </label>
              </div>
            </div>
            <div style={{ padding: '14px 26px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              {modal === 'edit' && <button className="btn-danger" onClick={deleteMember} style={{ fontSize: 13 }}>삭제</button>}
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button className="btn-secondary" onClick={() => setModal(null)} style={{ fontSize: 13 }}>취소</button>
                <button className="btn-primary" onClick={save} disabled={saving} style={{ fontSize: 13 }}>{saving ? '저장 중...' : '저장'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {modal === 'detail' && selected && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ width: 620 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 26px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>{selected.name} <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 400 }}>#{selected.id}</span></h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => { setModal(null); setTimeout(() => openEdit(selected), 100) }}>수정</button>
                <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 22, cursor: 'pointer' }}>✕</button>
              </div>
            </div>
            <div style={{ padding: '20px 26px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { label: '닉네임', value: selected.nickname },
                  { label: '핸드폰', value: selected.phone },
                  { label: '이메일', value: selected.email },
                  { label: '은행', value: selected.bank },
                  { label: '예금주', value: selected.bank_holder },
                  { label: '수강 강의 수', value: `${selected.lecture_count}개` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{value || '-'}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {selected.is_blacklist && <span className="badge badge-red">블랙리스트: {selected.blacklist_memo}</span>}
                {selected.is_kicked && <span className="badge badge-yellow">단톡방 강퇴</span>}
                {!selected.is_blacklist && !selected.is_kicked && <span className="badge badge-green">정상</span>}
              </div>
              {selected.note && <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--text2)' }}>📝 {selected.note}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
