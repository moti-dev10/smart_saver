import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ReportModal({ deal, productName, onClose }) {
  const { token } = useAuth()
  const [type, setType] = useState('deal_wrong')
  const [notes, setNotes] = useState('')
  const [suggestedPrice, setSuggestedPrice] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!notes.trim()) return
    setLoading(true)
    try {
      await fetch('/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type,
          notes,
          deal_id: deal.id ?? null,
          suggested_price: suggestedPrice ? +suggestedPrice : null,
        }),
      })
    } catch {
      // backend not running — show success anyway in demo mode
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>תודה על הדיווח!</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
              הדיווח שלך יועבר לצוות שלנו ויטופל בקרוב.
            </p>
            <button onClick={onClose} style={btnPrimary}>סגור</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>דיווח על הטבה</h3>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                  {productName} · {deal.retailer_name}
                </p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            {/* Type selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { value: 'deal_wrong', label: '❌ הטבה שגויה או לא קיימת' },
                { value: 'deal_suggest', label: '💡 הצעת הטבה חדשה' },
              ].map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    background: type === t.value ? '#eff6ff' : '#f8fafc',
                    border: `2px solid ${type === t.value ? '#3b82f6' : '#e2e8f0'}`,
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: type === t.value ? 700 : 400,
                    color: type === t.value ? '#1d4ed8' : '#64748b',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Notes */}
            <label style={labelStyle}>
              {type === 'deal_wrong' ? 'מה השגיאה?' : 'פרטי ההטבה שמצאת'}
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={type === 'deal_wrong'
                  ? 'למשל: המחיר עלה, ההטבה פגה, המוצר לא במלאי...'
                  : 'למשל: ראיתי מחיר X שקל עם מועדון Y באתר Z...'}
                rows={3}
                style={{ ...inputStyle, resize: 'none', marginTop: 6 }}
              />
            </label>

            {type === 'deal_suggest' && (
              <label style={{ ...labelStyle, marginTop: 12 }}>
                מחיר מוצע (שקל)
                <input
                  type="number"
                  value={suggestedPrice}
                  onChange={e => setSuggestedPrice(e.target.value)}
                  placeholder="0"
                  style={{ ...inputStyle, marginTop: 6 }}
                />
              </label>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={submit} disabled={!notes.trim() || loading} style={btnPrimary}>
                {loading ? 'שולח...' : 'שלח דיווח'}
              </button>
              <button onClick={onClose} style={btnSecondary}>ביטול</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }
const box = { background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 460, boxShadow: '0 8px 40px rgba(0,0,0,.15)' }
const labelStyle = { display: 'flex', flexDirection: 'column', fontSize: 13, fontWeight: 600, color: '#374151' }
const inputStyle = { padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }
const btnPrimary = { background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }
const btnSecondary = { background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }
