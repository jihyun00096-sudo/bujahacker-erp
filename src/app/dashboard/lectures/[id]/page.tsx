'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Applicant = { id: number; name: string; sender_name: string; phone: string; email: string; address: string; pay_status: string; pay_amount: number; pay_type: string; is_blacklist: boolean; lecture_history_count: number; guide_sent: boolean; note: string; source_type: string }
type Transaction = { id: number; tx_date: string; sender_name: string; bank: string; tx_type: string; amount: number; is_matched: boolean; applicants?: { name: string } }
type Lecture = { id: number; name: string; start_date: string; end_date: string; price: number; status: string; form_url: string }

const TABS = ['신청자 정리', '거래내역', '미입금자', '환불명단', '모집인원 분석']
const PAY_STATUS_COLORS: Record<string, string> = { '결제완료': 'badge-green', '입금확인전': 'badge-yellow', '환불': 'badge-red', '미결제취소': 'badge-gray' }
const EMPTY_APP = { name: '', sender_name: '', phone: '', email: '', address: '', receipt_num: '', pay_status: '입금확인전', pay_amount: '', pay_type: '계좌이체', source_type: '', note: '' }
const EMPTY_TX = { tx_date: '', sender_name: '', bank: '', tx_type: '계좌이체', amount: '', memo: '' }

export default function LectureDetailPage() {
  const params = useParams()
  const router = useRouter()
  const lectureId = params.id as string

  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [tab, setTab] = useState('신청자 정리')
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [search, setSearch] = useState('')
  const [payFilter, setPayFilter] = useState('')
  const [modal, setModal] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<Applicant | null>(null)
  const [appForm, setAppForm] = useState<any>(EMPTY_APP)
  const [txForm, setTxForm] = useState<any>(EMPTY_TX)
  const [saving, setSaving] = useState(false)
  const [txMsg, setTxMsg] = useState('')

  useEffect(() => {
    fetch(`/api/lectures/${lectureId}`).then(r => r.json()).then(d => setLecture(d.data))
  }, [lectureId])

  const loadApplicants = useCallback(async () => {
    const p = new URLSearchParams({ lecture_id: lectureId, search })
    if (payFilter) p.set('status', payFilter)
    const res = await fetch(`/api/applicants?${p}`)
    const data = await res.json()
    setApplicants(data.data || [])
  }, [lectureId, search, payFilter])

  const loadTransactions = useCallback(async () => {
    const res = await fetch(`/api/transactions?lecture_id=${lectureId}`)
    const data = await res.json()
    setTransactions(data.data || [])
  }, [lectureId])

  useEffect(() => { loadApplicants() }, [loadApplicants])
  useEffect(() => { loadTransactions() }, [loadTransactions])

  function openAddApp() { setAppForm(EMPTY_APP); setSelectedApp(null); setModal('app') }
  function openEditApp(a: Applicant) { setSelectedApp(a); setAppForm({ name: a.name, sender_name: a.sender_name || '', phone: a.phone, email: a.email || '', address: a.address || '', pay_status: a.pay_status, pay_amount: String(a.pay_amount || ''), pay_type: a.pay_type || '계좌이체', note: a.note || '', source_type: a.source_type || '' }); setModal('app') }

  async function saveApp() {
    setSaving(true)
    const body = { ...appForm, lecture_id: parseInt(lectureId), pay_amount: appForm.pay_amount ? parseInt(appForm.pay_amount) : null }
    const res = await fetch(selectedApp ? `/api/applicants/${selectedApp.id}` : '/api/applicants', {
      method: selectedApp ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    if (res.ok) { setModal(null); loadApplicants() }
    setSaving(false)
  }

  async function markGuide(id: number) {
    await fetch(`/api/applicants/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guide_sent: true, guide_sent_at: new Date().toISOString() }) })
    loadApplicants()
  }

  async function saveTx() {
    setSaving(true)
    setTxMsg('')
    const body = { ...txForm, lecture_id: parseInt(lectureId), amount: parseInt(txForm.amount) }
    const res = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (res.ok) {
      setTxMsg(data.auto_matched ? `✅ ${data.matched_name}님 자동 매칭 완료!` : '⚠️ 자동 매칭 실패 - 신청자 명단에서 확인해주세요')
      setTxForm(EMPTY_TX)
      loadTransactions(); loadApplicants()
    }
    setSaving(false)
  }

  async function downloadExcel() {
    const header = ['No', '본명', '입금자명', '휴대폰', '이메일', '주소', '결제상태', '입금금액', '거래구분', '수강이력', '블랙리스트', '안내발송', '특이사항']
    const csv = [header, ...applicants.map((a, i) => [i+1, a.name, a.sender_name, a.phone, a.email, a.address, a.pay_status, a.pay_amount, a.pay_type, a.lecture_history_count, a.is_blacklist ? 'Y' : '-', a.guide_sent ? 'Y' : '-', a.note])].map(r => r.map((c: any) => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${lecture?.name}_명단_${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  const paid = applicants.filter(a => a.pay_status === '결제완료').length
  const pending = applicants.filter(a => a.pay_status === '입금확인전').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* 헤더 */}
      <div style={{ padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => router.back()}>← 목록</button>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{lecture?.name}</div>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>{lecture?.start_date} ~ {lecture?.end_date}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginRight: 16 }}>
            <span style={{ fontSize: 13 }}>전체 <strong style={{ color: 'var(--accent)' }}>{applicants.length}</strong></span>
            <span style={{ fontSize: 13 }}>결제 <strong style={{ color: 'var(--success)' }}>{paid}</strong></span>
            <span style={{ fontSize: 13 }}>대기 <strong style={{ color: 'var(--warning)' }}>{pending}</strong></span>
          </div>
          <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={downloadExcel}>⬇ 엑셀</button>
          <button className="btn-primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={openAddApp}>+ 신청자 추가</button>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', padding: '0 24px', flexShrink: 0, background: 'var(--surface)' }}>
        {TABS.map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: tab === t ? 'var(--accent)' : 'var(--text2)', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1, transition: 'all 0.15s' }}>
            {t}
          </div>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <div style={{ flex: 1, overflow: 'auto' }}>

        {/* 신청자 정리 */}
        {tab === '신청자 정리' && (
          <div>
            <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--surface)' }}>
              <input className="input" style={{ maxWidth: 280 }} placeholder="🔍 이름, 전화번호 검색..." value={search} onChange={e => setSearch(e.target.value)} />
              <select className="select" value={payFilter} onChange={e => setPayFilter(e.target.value)}>
                <option value="">결제 전체</option>
                <option value="결제완료">결제완료</option>
                <option value="입금확인전">입금확인전</option>
                <option value="환불">환불</option>
                <option value="미결제취소">미결제취소</option>
              </select>
            </div>
            <table>
              <thead>
                <tr>
                  <th>No</th><th>본명</th><th>입금자명</th><th>휴대폰</th><th>이메일</th>
                  <th>수강이력</th><th>결제상태</th><th>입금금액</th><th>블랙</th><th>안내</th><th>관리</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((a, i) => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--text2)', fontSize: 11, fontFamily: 'Space Mono' }}>{i + 1}</td>
                    <td><strong>{a.name}</strong></td>
                    <td style={{ color: 'var(--text2)' }}>{a.sender_name}</td>
                    <td style={{ fontFamily: 'Space Mono', fontSize: 12 }}>{a.phone}</td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{a.email}</td>
                    <td style={{ textAlign: 'center' }}><span className="badge badge-blue">{a.lecture_history_count}회</span></td>
                    <td><span className={`badge ${PAY_STATUS_COLORS[a.pay_status] || 'badge-gray'}`}>{a.pay_status}</span></td>
                    <td style={{ fontFamily: 'Space Mono', fontSize: 12 }}>{a.pay_amount ? a.pay_amount.toLocaleString() + '원' : '-'}</td>
                    <td>{a.is_blacklist ? <span className="badge badge-red">블랙</span> : '-'}</td>
                    <td>
                      {a.pay_status === '결제완료' && !a.guide_sent
                        ? <button style={{ background: 'var(--success)', color: '#0d0f14', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 700 }} onClick={() => markGuide(a.id)}>안내발송</button>
                        : <span style={{ fontSize: 11, color: a.guide_sent ? 'var(--success)' : 'var(--text3)' }}>{a.guide_sent ? '✓발송완료' : '-'}</span>}
                    </td>
                    <td><button className="btn-secondary" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => openEditApp(a)}>수정</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 거래내역 */}
        {tab === '거래내역' && (
          <div>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
              {txMsg && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: txMsg.startsWith('✅') ? 'rgba(61,214,140,0.1)' : 'rgba(247,169,72,0.1)', fontSize: 13 }}>{txMsg}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr) auto', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>날짜</div>
                  <input className="input" type="datetime-local" value={txForm.tx_date} onChange={e => setTxForm((p: any) => ({ ...p, tx_date: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>입금자명 *</div>
                  <input className="input" placeholder="홍길동" value={txForm.sender_name} onChange={e => setTxForm((p: any) => ({ ...p, sender_name: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>금액 *</div>
                  <input className="input" type="number" placeholder="270000" value={txForm.amount} onChange={e => setTxForm((p: any) => ({ ...p, amount: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>은행/카드</div>
                  <input className="input" placeholder="신한" value={txForm.bank} onChange={e => setTxForm((p: any) => ({ ...p, bank: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>거래구분</div>
                  <select className="select" style={{ width: '100%' }} value={txForm.tx_type} onChange={e => setTxForm((p: any) => ({ ...p, tx_type: e.target.value }))}>
                    <option>계좌이체</option><option>신용카드</option><option>현금</option><option>환불</option>
                  </select>
                </div>
                <button className="btn-primary" style={{ alignSelf: 'flex-end', padding: '9px 16px', fontSize: 13 }} onClick={saveTx} disabled={saving}>추가</button>
              </div>
            </div>
            <table>
              <thead>
                <tr><th>날짜</th><th>입금자명</th><th>은행/카드</th><th>거래구분</th><th>금액</th><th>매칭</th></tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{t.tx_date ? new Date(t.tx_date).toLocaleString('ko-KR') : '-'}</td>
                    <td><strong>{t.sender_name}</strong></td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{t.bank}</td>
                    <td><span className="badge badge-blue">{t.tx_type}</span></td>
                    <td style={{ fontFamily: 'Space Mono', fontWeight: 700, color: 'var(--success)' }}>{t.amount?.toLocaleString()}원</td>
                    <td>{t.is_matched ? <span className="badge badge-green">✓ 매칭됨</span> : <span className="badge badge-yellow">미매칭</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 나머지 탭 */}
        {['미입금자', '환불명단', '모집인원 분석'].includes(tab) && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
            <div style={{ fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>{tab}</div>
            <div style={{ fontSize: 13 }}>다음 업데이트에서 추가됩니다.</div>
          </div>
        )}
      </div>

      {/* 신청자 추가/수정 모달 */}
      {modal === 'app' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ width: 600 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 26px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>{selectedApp ? '신청자 수정' : '신청자 추가'}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '20px 26px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { key: 'name', label: '본명 *', type: 'text' },
                { key: 'sender_name', label: '입금자명', type: 'text' },
                { key: 'phone', label: '휴대폰 *', type: 'text' },
                { key: 'email', label: '이메일', type: 'text' },
                { key: 'pay_amount', label: '입금금액', type: 'number' },
                { key: 'source_type', label: '유입경로', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{label}</label>
                  <input className="input" type={type} value={appForm[key]} onChange={e => setAppForm((p: any) => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>주소지</label>
                <input className="input" value={appForm.address} onChange={e => setAppForm((p: any) => ({ ...p, address: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>결제상태</label>
                <select className="select" style={{ width: '100%' }} value={appForm.pay_status} onChange={e => setAppForm((p: any) => ({ ...p, pay_status: e.target.value }))}>
                  <option>입금확인전</option><option>결제완료</option><option>환불</option><option>미결제취소</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>거래구분</label>
                <select className="select" style={{ width: '100%' }} value={appForm.pay_type} onChange={e => setAppForm((p: any) => ({ ...p, pay_type: e.target.value }))}>
                  <option>계좌이체</option><option>신용카드</option><option>현금</option>
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>메모/특이사항</label>
                <input className="input" value={appForm.note} onChange={e => setAppForm((p: any) => ({ ...p, note: e.target.value }))} />
              </div>
            </div>
            <div style={{ padding: '14px 26px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setModal(null)} style={{ fontSize: 13 }}>취소</button>
              <button className="btn-primary" onClick={saveApp} disabled={saving} style={{ fontSize: 13 }}>{saving ? '저장 중...' : '저장'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
