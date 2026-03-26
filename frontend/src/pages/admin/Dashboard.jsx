import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const STAT_META = [
  { key: 'products',        label: 'מוצרים פעילים',    icon: '📦', color: '#3b82f6', bg: '#eff6ff' },
  { key: 'deals',           label: 'עסקאות פעילות',    icon: '💰', color: '#16a34a', bg: '#dcfce7' },
  { key: 'users',           label: 'משתמשים רשומים',   icon: '👥', color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'pending_reports', label: 'דיווחים ממתינים',  icon: '🚨', color: '#dc2626', bg: '#fef2f2' },
]

export default function Dashboard({ onNav }) {
  const { token } = useAuth()
  const [stats, setStats] = useState(null)
  const [reports, setReports] = useState([])
  const [deals, setDeals] = useState([])

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` }
    fetch('/admin/stats',   { headers: h }).then(r => r.json()).then(setStats).catch(() => {})
    fetch('/admin/reports', { headers: h }).then(r => r.json()).then(d => setReports(Array.isArray(d) ? d.filter(r => r.status === 'pending').slice(0, 3) : [])).catch(() => {})
    fetch('/admin/deals',   { headers: h }).then(r => r.json()).then(d => setDeals(Array.isArray(d) ? d.slice(0, 5) : [])).catch(() => {})
  }, [token])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {STAT_META.map(s => (
          <div key={s.key} style={{ background: '#fff', borderRadius: 12, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>
                {stats ? stats[s.key] : '—'}
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent deals */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>עסקאות אחרונות</h3>
            <button onClick={() => onNav('deals')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 13, cursor: 'pointer' }}>הצג הכל</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {deals.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13 }}>טוען...</div>}
            {deals.map((d, i) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < deals.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{d.product}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{d.retailer}{d.club ? ` · ${d.club}` : ''}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#16a34a' }}>₪{(+d.deal_price).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending reports */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>דיווחים ממתינים לאישור</h3>
            <button onClick={() => onNav('reports')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 13, cursor: 'pointer' }}>הצג הכל</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reports.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 20 }}>אין דיווחים ממתינים</div>}
            {reports.map(r => (
              <div key={r.id} style={{ padding: '10px 12px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{r.product || 'הצעה חדשה'}</span>
                  <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>ממתין</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{r.type === 'deal_wrong' ? 'הטבה שגויה' : 'הצעת הטבה'} · {r.user}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
