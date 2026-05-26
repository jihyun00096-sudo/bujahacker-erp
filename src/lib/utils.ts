// 전화번호 포맷
export function formatPhone(phone: string) {
  const clean = phone.replace(/\D/g, '')
  if (clean.length === 11) return clean.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  if (clean.length === 10) return clean.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  return phone
}

// 금액 포맷
export function formatAmount(amount: number | null) {
  if (!amount) return '-'
  return amount.toLocaleString('ko-KR') + '원'
}

// 날짜 포맷
export function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ko-KR')
}

// 결제상태 색상
export function getPayStatusColor(status: string) {
  const colors: Record<string, string> = {
    '결제완료': 'bg-green-100 text-green-800',
    '입금확인전': 'bg-yellow-100 text-yellow-800',
    '환불': 'bg-red-100 text-red-800',
    '미결제취소': 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
