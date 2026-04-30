import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'

const FIELD_LABELS = {
  deal_id: 'מזהה עסקה',
  product_id: 'מזהה מוצר',
  product_name: 'שם מוצר',
  category: 'קטגוריה',
  barcode: 'ברקוד',
  image_url: 'תמונה',
  retailer_id: 'מזהה רשת',
  retailer_name: 'רשת',
  club_id: 'מזהה מועדון',
  club_name: 'מועדון',
  regular_price: 'מחיר רגיל',
  deal_price: 'מחיר מבצע',
  valid_from: 'תוקף מ',
  valid_until: 'תוקף עד',
}

const STEP = { UPLOAD: 'upload', PREVIEW: 'preview', SAVING: 'saving', DONE: 'done' }

export default function Import() {
  const { token } = useAuth()
  const [step, setStep] = useState(STEP.UPLOAD)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [showEmpty, setShowEmpty] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  async function handleFile(f) {
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls', 'json'].includes(ext)) {
      setError(`סוג קובץ לא נתמך: .${ext} — השתמש ב-CSV, XLSX, או JSON`)
      return
    }
    setError(null)
    setFile(f)
    setLoading(true)

    const fd = new FormData()
    fd.append('file', f)
    try {
      const res = await fetch('/admin/import/preview', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const text = await res.text()
      let data = {}
      try { data = JSON.parse(text) } catch { throw new Error(`שגיאת שרת (${res.status}): ${text.slice(0, 120)}`) }
      if (!res.ok) throw new Error(data.detail || 'שגיאה בניתוח הקובץ')
      setPreview(data)
      // סמן אוטומטית רק שורות עם תוכן
      const defaultSelected = new Set(
        data.rows.filter(r => r.has_content).map(r => r.index)
      )
      setSelected(defaultSelected)
      setStep(STEP.PREVIEW)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function toggleRow(index) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  function toggleAll(rows) {
    const allSelected = rows.every(r => selected.has(r.index))
    setSelected(prev => {
      const next = new Set(prev)
      rows.forEach(r => allSelected ? next.delete(r.index) : next.add(r.index))
      return next
    })
  }

  async function handleSave() {
    setStep(STEP.SAVING)
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    const indices = [...selected].join(',')
    try {
      const res = await fetch(`/admin/import/save?selected_indices=${indices}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const text = await res.text()
      let data = {}
      try { data = JSON.parse(text) } catch { throw new Error(`שגיאת שרת (${res.status}): ${text.slice(0, 120)}`) }
      if (!res.ok) throw new Error(data.detail || 'שגיאה בשמירה')
      setResult(data)
      setStep(STEP.DONE)
    } catch (e) {
      setError(e.message)
      setStep(STEP.PREVIEW)
    }
  }

  function reset() {
    setStep(STEP.UPLOAD)
    setFile(null)
    setPreview(null)
    setSelected(new Set())
    setShowEmpty(false)
    setResult(null)
    setError(null)
  }

  // ── Upload step ──────────────────────────────────────────────────────────
  if (step === STEP.UPLOAD) return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
        העלה קובץ CSV, Excel או JSON — המערכת תזהה את העמודות אוטומטית ותייבא לבסיס הנתונים
      </p>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#3b82f6' : '#cbd5e1'}`,
          borderRadius: 16, padding: '60px 24px', textAlign: 'center',
          cursor: 'pointer', background: dragOver ? '#eff6ff' : '#f8fafc', transition: 'all .15s',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
          {loading ? 'מנתח קובץ...' : 'גרור קובץ לכאן או לחץ לבחירה'}
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>CSV · XLSX · XLS · JSON</div>
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.json"
          style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
      </div>

      <div style={{ marginTop: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 10 }}>עמודות מומלצות בקובץ</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['שם מוצר', 'קטגוריה', 'ברקוד', 'רשת', 'מועדון', 'מחיר רגיל', 'מחיר מבצע', 'תוקף עד'].map(col => (
            <span key={col} style={{ background: '#f1f5f9', color: '#475569', fontSize: 12, padding: '3px 10px', borderRadius: 20, fontFamily: 'monospace' }}>
              {col}
            </span>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Preview step ─────────────────────────────────────────────────────────
  if (step === STEP.PREVIEW) {
    const contentRows = preview.rows.filter(r => r.has_content)
    const emptyRows = preview.rows.filter(r => !r.has_content)
    const visibleRows = showEmpty ? preview.rows : contentRows

    return (
      <div>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Summary bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 700 }}>
            📄 {file?.name}
          </div>
          <div style={{ fontSize: 14, color: '#475569' }}>
            <strong>{contentRows.length}</strong> שורות עם תוכן
            {emptyRows.length > 0 && <span style={{ color: '#94a3b8' }}> · {emptyRows.length} ריקות</span>}
          </div>
          <div style={{ marginRight: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={reset}
              style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
              ← בחר קובץ אחר
            </button>
            <button onClick={handleSave} disabled={selected.size === 0}
              style={{ background: selected.size === 0 ? '#94a3b8' : '#2563eb', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: selected.size === 0 ? 'default' : 'pointer' }}>
              ייבא {selected.size} שורות →
            </button>
          </div>
        </div>

        {/* Column mapping */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 10 }}>מיפוי עמודות</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(preview.column_mapping).map(([col, field]) => (
              <div key={col} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: field ? '#f0fdf4' : '#fef9c3',
                border: `1px solid ${field ? '#bbf7d0' : '#fde68a'}`,
                borderRadius: 8, padding: '4px 10px', fontSize: 12,
              }}>
                <span style={{ fontFamily: 'monospace', color: '#374151' }}>{col}</span>
                {field ? (
                  <><span style={{ color: '#94a3b8' }}>→</span>
                    <span style={{ color: '#15803d', fontWeight: 600 }}>{FIELD_LABELS[field] || field}</span></>
                ) : <span style={{ color: '#b45309' }}>לא זוהה</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 13, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>תצוגה מקדימה</span>
            <button onClick={() => toggleAll(visibleRows)}
              style={{ background: '#f1f5f9', border: 'none', color: '#475569', padding: '3px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
              {visibleRows.every(r => selected.has(r.index)) ? 'בטל הכל' : 'סמן הכל'}
            </button>
            {emptyRows.length > 0 && (
              <button onClick={() => setShowEmpty(p => !p)}
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '3px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', marginRight: 'auto' }}>
                {showEmpty ? 'הסתר שורות ריקות' : `הצג ${emptyRows.length} שורות ריקות`}
              </button>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '8px 12px', width: 36 }}></th>
                  {preview.headers.map(h => (
                    <th key={h} style={{
                      padding: '8px 12px', textAlign: 'right', fontWeight: 600,
                      color: preview.column_mapping[h] ? '#1e293b' : '#94a3b8',
                      borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap',
                    }}>
                      {h}
                      {preview.column_mapping[h] && (
                        <div style={{ fontSize: 10, color: '#3b82f6', fontWeight: 400 }}>
                          {FIELD_LABELS[preview.column_mapping[h]] || preview.column_mapping[h]}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map(row => (
                  <tr key={row.index}
                    onClick={() => toggleRow(row.index)}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: selected.has(row.index) ? '#f0fdf4' : row.has_content ? '#fff' : '#fafafa',
                      cursor: 'pointer', opacity: row.has_content ? 1 : 0.5,
                    }}>
                    <td style={{ padding: '7px 12px', textAlign: 'center' }}>
                      <input type="checkbox" checked={selected.has(row.index)} onChange={() => toggleRow(row.index)}
                        onClick={e => e.stopPropagation()} />
                    </td>
                    {preview.headers.map(h => (
                      <td key={h} style={{ padding: '7px 12px', color: '#374151', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.data[h] || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ── Saving step ──────────────────────────────────────────────────────────
  if (step === STEP.SAVING) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>מייבא נתונים...</div>
      <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>אנא המתן</div>
    </div>
  )

  // ── Done step ────────────────────────────────────────────────────────────
  if (step === STEP.DONE) return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 24, marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#15803d', marginBottom: 4 }}>הייבוא הושלם</div>
        <div style={{ fontSize: 13, color: '#166534' }}>{file?.name}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'נוספו חדשים', value: result.imported, color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'עודכנו', value: result.updated, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'דולגו', value: result.skipped, color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '16px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.color, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {result.errors.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '10px 16px', background: '#fef9c3', borderBottom: '1px solid #fde68a', fontSize: 13, fontWeight: 700, color: '#92400e' }}>
            ⚠️ {result.errors.length} שורות לא יובאו
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {result.errors.map((err, i) => (
              <div key={i} style={{ padding: '6px 16px', fontSize: 12, color: '#64748b', borderBottom: '1px solid #f8fafc' }}>
                {err}
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={reset}
        style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
        ייבא קובץ נוסף
      </button>
    </div>
  )

  return null
}
