import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const TYPE_LABELS = {
  deal_wrong:   { label: 'הטבה שגויה',  color: '#dc2626', bg: '#fef2f2' },
  deal_suggest: { label: 'הצעת הטבה',   color: '#7c3aed', bg: '#f5f3ff' },
}

const STATUS_LABELS = {
  pending:  { label: 'ממתין', color: '#92400e', bg: '#fef3c7' },
  approved: { label: 'אושר',  color: '#15803d', bg: '#dcfce7' },
  rejected: { label: 'נדחה',  color: '#dc2626', bg: '#fee2e2' },
}

export default function Reports() {
  const { token } = useAuth()
  const [reports, setReports] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/admin/reports', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setReports(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  async function updateStatus(id, status) {
    await fetch(`/admin/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    })
    setReports(rs => rs.map(r => r.id === id ? { ...r, status } : r))
  }

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter)
  const pendingCount = reports.filter(r => r.status === 'pending').length

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { value: 'all',      label: `הכל (${reports.length})` },
          { value: 'pending',  label: `ממתינים (${pendingCount})` },
          { value: 'approved', label: 'אושרו' },
          { value: 'rejected', label: 'נדחו' },
        ].map(t => (
          <button key={t.value} onClick={() => setFilter(t.value)} style={{
            padding: '7px 16px',
            background: filter === t.value ? '#1e293b' : '#fff',
            color: filter === t.value ? '#fff' : '#64748b',
            border: '1.5px solid', borderColor: filter === t.value ? '#1e293b' : '#e2e8f0',
            borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>טוען...</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', background: '#fff', borderRadius: 12 }}>אין דיווחים</div>
        )}
        {filtered.map(r => {
          const typeInfo  = TYPE_LABELS[r.type]  || TYPE_LABELS.deal_wrong
          const statusInfo = STATUS_LABELS[r.status] || STATUS_LABELS.pending
          return (
            <div key={r.id} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)', border: r.status === 'pending' ? '1.5px solid #fde68a' : '1.5px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ background: typeInfo.bg, color: typeInfo.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{typeInfo.label}</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{r.product || 'מוצר לא ידוע'}</span>
                  {r.retailer && <span style={{ fontSize: 13, color: '#64748b' }}>· {r.retailer}</span>}
                </div>
                <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {statusInfo.label}
                </span>
              </div>

              {r.notes && (
                <div style={{ fontSize: 13, color: '#475569', background: '#f8fafc', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                  "{r.notes}"
                </div>
              )}

              {r.type === 'deal_suggest' && (
                <div style={{ fontSize: 13, color: '#7c3aed', marginBottom: 12, display: 'flex', gap: 16 }}>
                  {r.suggested_price && <span>מחיר מוצע: <strong>₪{(+r.suggested_price).toLocaleString()}</strong></span>}
                  {r.suggested_club  && <span>מועדון: <strong>{r.suggested_club}</strong></span>}
                  {r.suggested_retailer && <span>רשת: <strong>{r.suggested_retailer}</strong></span>}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.user} · {r.created_at}</div>
                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => updateStatus(r.id, 'approved')} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>✓ אשר</button>
                    <button onClick={() => updateStatus(r.id, 'rejected')} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>✕ דחה</button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
