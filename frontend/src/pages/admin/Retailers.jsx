import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const EMPTY = { name: '', affiliate_url: '', logo_url: '' }

export default function Retailers() {
  const { token } = useAuth()
  const [retailers, setRetailers] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    fetch('/admin/retailers', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setRetailers(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function openAdd() { setForm(EMPTY); setModal('add') }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/admin/retailers', { method: 'POST', headers, body: JSON.stringify(form) })
      const newR = await res.json()
      setRetailers(rs => [...rs, { ...newR, clubs: [] }])
      setModal(null)
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={openAdd} style={btn('#3b82f6')}>+ הוסף רשת</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>טוען...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {retailers.map(r => (
            <div key={r.id} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)', border: '1.5px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800 }}>{r.name}</h3>
                {r.affiliate_url && (
                  <a href={r.affiliate_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none' }}>
                    לאתר ←
                  </a>
                )}
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>מועדוני לקוחות</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {r.clubs && r.clubs.map(c => (
                    <span key={c.id} style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {c.name}
                    </span>
                  ))}
                  {(!r.clubs || r.clubs.length === 0) && <span style={{ color: '#94a3b8', fontSize: 12 }}>אין מועדון</span>}
                </div>
              </div>
              {r.affiliate_url && (
                <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.affiliate_url}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={overlayStyle}>
          <div style={modalBox}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>הוספת רשת קמעונאית</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={labelStyle}>שם הרשת <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="KSP, BUG..." /></label>
              <label style={labelStyle}>קישור אפיליאייט <input value={form.affiliate_url} onChange={e => setForm(f => ({ ...f, affiliate_url: e.target.value }))} style={inputStyle} placeholder="https://..." /></label>
              <label style={labelStyle}>קישור לוגו <input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} style={inputStyle} placeholder="https://..." /></label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={save} disabled={!form.name || saving} style={btn('#3b82f6')}>{saving ? 'שומר...' : 'שמור'}</button>
              <button onClick={() => setModal(null)} style={btn('#94a3b8')}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }
const modalBox = { background: '#fff', borderRadius: 16, padding: 28, width: 460, boxShadow: '0 8px 40px rgba(0,0,0,.15)' }
const labelStyle = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151' }
const inputStyle = { padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', marginTop: 2 }
function btn(bg) { return { background: bg, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' } }
