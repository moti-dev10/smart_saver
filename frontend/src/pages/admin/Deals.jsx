import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const today = new Date().toISOString().split('T')[0]
const future = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0]
const EMPTY = { product_id: '', retailer_id: '', club_id: '', regular_price: '', deal_price: '', valid_from: today, valid_until: future }

export default function Deals() {
  const { token } = useAuth()
  const [deals, setDeals] = useState([])
  const [products, setProducts] = useState([])
  const [retailers, setRetailers] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch('/admin/deals',    { headers: h }).then(r => r.json()),
      fetch('/admin/products', { headers: h }).then(r => r.json()),
      fetch('/admin/retailers',{ headers: h }).then(r => r.json()),
    ]).then(([d, p, r]) => {
      setDeals(Array.isArray(d) ? d : [])
      setProducts(Array.isArray(p) ? p : [])
      setRetailers(Array.isArray(r) ? r : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // clubs for the selected retailer
  const selectedRetailer = retailers.find(r => r.id === +form.retailer_id)
  const availableClubs = selectedRetailer?.clubs || []

  function openAdd() {
    const firstRetailer = retailers[0]
    setForm({ ...EMPTY, retailer_id: firstRetailer?.id || '', product_id: products[0]?.id || '' })
    setModal('add')
  }

  function openEdit(d) {
    setForm({
      product_id: d.product_id,
      retailer_id: d.retailer_id,
      club_id: d.club_id || '',
      regular_price: d.regular_price,
      deal_price: d.deal_price,
      valid_from: d.valid_from || today,
      valid_until: d.valid_until || future,
    })
    setModal(d)
  }

  async function save() {
    setSaving(true)
    try {
      const body = {
        ...form,
        product_id: +form.product_id,
        retailer_id: +form.retailer_id,
        club_id: form.club_id ? +form.club_id : null,
        regular_price: +form.regular_price,
        deal_price: +form.deal_price,
      }
      if (modal === 'add') {
        const res = await fetch('/admin/deals', { method: 'POST', headers, body: JSON.stringify(body) })
        const newD = await res.json()
        // re-fetch to get names
        const updated = await fetch('/admin/deals', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
        setDeals(Array.isArray(updated) ? updated : [])
      } else {
        await fetch(`/admin/deals/${modal.id}`, { method: 'PUT', headers, body: JSON.stringify(body) })
        const updated = await fetch('/admin/deals', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
        setDeals(Array.isArray(updated) ? updated : [])
      }
      setModal(null)
    } finally { setSaving(false) }
  }

  async function remove(id) {
    if (!confirm('למחוק עסקה זו?')) return
    await fetch(`/admin/deals/${id}`, { method: 'DELETE', headers })
    setDeals(ds => ds.filter(d => d.id !== id))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={openAdd} style={btnStyle('#3b82f6')}>+ הוסף עסקה</button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>טוען...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['מוצר', 'רשת', 'מועדון', 'מחיר רגיל', 'מחיר מבצע', 'חיסכון', 'תוקף', 'פעולות'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.map((d, i) => {
                const savingAmt = d.regular_price - d.deal_price
                const pct = Math.round(savingAmt / d.regular_price * 100)
                return (
                  <tr key={d.id} style={{ borderBottom: i < deals.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ ...td, maxWidth: 200 }}><span style={{ fontSize: 13, fontWeight: 600 }}>{d.product}</span></td>
                    <td style={td}>{d.retailer}</td>
                    <td style={td}>
                      {d.club
                        ? <span style={{ fontSize: 12, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 10 }}>{d.club}</span>
                        : <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>}
                    </td>
                    <td style={{ ...td, color: '#94a3b8', textDecoration: 'line-through' }}>₪{(+d.regular_price).toLocaleString()}</td>
                    <td style={{ ...td, fontWeight: 700, color: '#16a34a' }}>₪{(+d.deal_price).toLocaleString()}</td>
                    <td style={td}><span style={{ fontSize: 12, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{pct}%</span></td>
                    <td style={{ ...td, fontSize: 12, color: '#64748b' }}>{d.valid_until}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(d)} style={btnStyle('#64748b', true)}>עריכה</button>
                        <button onClick={() => remove(d.id)} style={btnStyle('#ef4444', true)}>מחיקה</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div style={overlayStyle}>
          <div style={modalBox}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>
              {modal === 'add' ? 'הוספת עסקה חדשה' : 'עריכת עסקה'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ ...labelStyle, gridColumn: '1/-1' }}>
                מוצר
                <select value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))} style={inputStyle}>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label style={labelStyle}>
                רשת קמעונאית
                <select value={form.retailer_id} onChange={e => setForm(f => ({ ...f, retailer_id: e.target.value, club_id: '' }))} style={inputStyle}>
                  {retailers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </label>
              <label style={labelStyle}>
                מועדון
                <select value={form.club_id} onChange={e => setForm(f => ({ ...f, club_id: e.target.value }))} style={inputStyle}>
                  <option value="">ללא מועדון</option>
                  {availableClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label style={labelStyle}>
                מחיר רגיל (₪)
                <input type="number" value={form.regular_price} onChange={e => setForm(f => ({ ...f, regular_price: e.target.value }))} style={inputStyle} placeholder="0" />
              </label>
              <label style={labelStyle}>
                מחיר מבצע (₪)
                <input type="number" value={form.deal_price} onChange={e => setForm(f => ({ ...f, deal_price: e.target.value }))} style={inputStyle} placeholder="0" />
              </label>
              <label style={labelStyle}>
                תוקף מ-
                <input type="date" value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                תוקף עד
                <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} style={inputStyle} />
              </label>
            </div>
            {form.regular_price && form.deal_price && +form.deal_price < +form.regular_price && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#dcfce7', borderRadius: 8, fontSize: 13, color: '#15803d', fontWeight: 600 }}>
                חיסכון: ₪{(+form.regular_price - +form.deal_price).toLocaleString()} ({Math.round((+form.regular_price - +form.deal_price) / +form.regular_price * 100)}%)
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={save} disabled={!form.product_id || !form.retailer_id || !form.regular_price || !form.deal_price || saving} style={btnStyle('#3b82f6')}>
                {saving ? 'שומר...' : 'שמור'}
              </button>
              <button onClick={() => setModal(null)} style={btnStyle('#94a3b8')}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const td = { padding: '12px 16px', fontSize: 14, color: '#1e293b', verticalAlign: 'middle' }
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }
const modalBox = { background: '#fff', borderRadius: 16, padding: 28, width: 520, boxShadow: '0 8px 40px rgba(0,0,0,.15)', maxHeight: '90vh', overflowY: 'auto' }
const labelStyle = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151' }
const inputStyle = { padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }
function btnStyle(bg, small) {
  return { background: bg, color: '#fff', border: 'none', borderRadius: 8, padding: small ? '6px 12px' : '10px 20px', fontSize: small ? 12 : 14, fontWeight: 600, cursor: 'pointer' }
}
