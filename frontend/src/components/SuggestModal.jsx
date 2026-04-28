import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function SuggestModal({ onClose }) {
  const { token } = useAuth()
  const [notes, setNotes] = useState('')
  const [retailer, setRetailer] = useState('')
  const [price, setPrice] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function submit() {
    if (!notes.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: 'deal_suggest',
          notes,
          suggested_retailer: retailer || null,
          suggested_price: price ? +price : null,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`${res.status}: ${text}`)
      }
      setSubmitted(true)
    } catch (e) {
      setError(`שגיאה: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💡</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>תודה על ההצעה!</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
              נבדוק את ההטבה ונוסיף אותה אם היא תקפה.
            </p>
            <button onClick={onClose} style={btnPrimary}>סגור</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>💡 הצעת הטבה חדשה</h3>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                  ראית הטבה שלא מופיעה אצלנו? ספר לנו!
                </p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <label style={labelStyle}>
              פרטי ההטבה
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="למשל: ראיתי מקרר סמסונג ב-KSP עם מועדון ב-3,990 ₪..."
                rows={3}
                style={{ ...inputStyle, resize: 'none', marginTop: 6 }}
              />
            </label>

            <label style={{ ...labelStyle, marginTop: 12 }}>
              שם הרשת (אופציונלי)
              <input
                value={retailer}
                onChange={e => setRetailer(e.target.value)}
                placeholder="למשל: KSP, BUG..."
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </label>

            <label style={{ ...labelStyle, marginTop: 12 }}>
              מחיר (שקל, אופציונלי)
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0"
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </label>

            {error && (
              <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={submit} disabled={!notes.trim() || loading} style={btnPrimary}>
                {loading ? 'שולח...' : 'שלח הצעה'}
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
