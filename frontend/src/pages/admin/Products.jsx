import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const EMPTY = { name: '', category: '', barcode: '', image_url: '' }

export default function Products() {
  const { token } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [freeText, setFreeText] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    fetch('/admin/products', { headers })
      .then(r => r.json())
      .then(d => { setProducts(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
    fetch('/search/categories')
      .then(r => r.ok ? r.json() : { categories: [] })
      .then(d => setCategories(d.categories || []))
      .catch(() => {})
  }, [])

  const filtered = products.filter(p => p.name.includes(search) || (p.category || '').includes(search))

  function openAdd()  { setForm(EMPTY); setFreeText(false); setModal('add') }
  function openEdit(p){ setForm({ name: p.name, category: p.category || '', barcode: p.barcode || '', image_url: p.image_url || '' }); setFreeText(false); setModal(p) }

  async function save() {
    setSaving(true)
    try {
      if (modal === 'add') {
        const res = await fetch('/admin/products', { method: 'POST', headers, body: JSON.stringify(form) })
        const newP = await res.json()
        setProducts(ps => [...ps, newP])
        if (form.category && !categories.includes(form.category))
          setCategories(cs => [...cs, form.category].sort())
      } else {
        await fetch(`/admin/products/${modal.id}`, { method: 'PUT', headers, body: JSON.stringify(form) })
        setProducts(ps => ps.map(p => p.id === modal.id ? { ...p, ...form } : p))
        if (form.category && !categories.includes(form.category))
          setCategories(cs => [...cs, form.category].sort())
      }
      setModal(null)
    } finally { setSaving(false) }
  }

  async function remove(id) {
    if (!confirm('למחוק מוצר זה?')) return
    await fetch(`/admin/products/${id}`, { method: 'DELETE', headers })
    setProducts(ps => ps.filter(p => p.id !== id))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש מוצר..."
          style={{ padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, width: 280, outline: 'none' }} />
        <button onClick={openAdd} style={btn('#3b82f6')}>+ הוסף מוצר</button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>טוען...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['מוצר', 'קטגוריה', 'ברקוד', 'עסקאות', 'פעולות'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <td style={td}><span style={{ fontWeight: 600 }}>{p.name}</span></td>
                  <td style={td}><span style={catBadge}>{p.category}</span></td>
                  <td style={{ ...td, color: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}>{p.barcode}</td>
                  <td style={td}><span style={{ fontWeight: 700, color: '#3bac65' }}>{p.deals}</span></td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(p)} style={btn('#9b1a7f', true)}>עריכה</button>
                      <button onClick={() => remove(p.id)} style={btn('#ef4444', true)}>מחיקה</button>
                    </div>
                  </td> 
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div style={overlay}>
          <div style={modalBox}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>{modal === 'add' ? 'הוספת מוצר חדש' : 'עריכת מוצר'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={labelS}>שם המוצר <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputS} /></label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>קטגוריה</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFreeText(f => !f)
                      setForm(f => ({ ...f, category: freeText ? (categories[0] || '') : '' }))
                    }}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                  >
                    {freeText ? 'חזור לרשימה' : '+ קטגוריה חדשה'}
                  </button>
                </div>
                {freeText ? (
                  <input
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="הקלד שם קטגוריה חדשה..."
                    style={inputS}
                    autoFocus
                  />
                ) : (
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    style={inputS}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>

              <label style={labelS}>ברקוד <input value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} style={inputS} /></label>
              <label style={labelS}>קישור תמונה <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} style={inputS} placeholder="https://..." /></label>
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

const td = { padding: '12px 16px', fontSize: 14, color: '#1e293b', verticalAlign: 'middle' }
const catBadge = { background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }
const overlay  = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }
const modalBox = { background: '#fff', borderRadius: 16, padding: 28, width: 460, boxShadow: '0 8px 40px rgba(0,0,0,.15)' }
const labelS   = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151' }
const inputS   = { padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', marginTop: 2 }
function btn(bg, small) { return { background: bg, color: '#fff', border: 'none', borderRadius: 8, padding: small ? '6px 14px' : '10px 20px', fontSize: small ? 13 : 14, fontWeight: 600, cursor: 'pointer' } }
