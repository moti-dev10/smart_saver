import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage({ onSwitch, onSuccess }) {
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) { setError('הסיסמה חייבת להכיל לפחות 6 תווים'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'שגיאה בהרשמה'); return }
      login(data.access_token, data.user)
      onSuccess?.()
    } catch {
      setError('שגיאת רשת — נסה שוב')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle(credential) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'שגיאה'); return }
      login(data.access_token, data.user)
      onSuccess?.()
    } catch {
      setError('שגיאת רשת — נסה שוב')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>יצירת חשבון חדש</h2>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <GoogleLogin
          onSuccess={r => handleGoogle(r.credential)}
          onError={() => setError('כניסה עם גוגל נכשלה')}
          locale="he"
          text="signup_with"
          shape="rectangular"
        />
      </div>

      <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>או</div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="שם מלא"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="email"
          placeholder="כתובת מייל"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="סיסמה (לפחות 6 תווים)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        {error && <div style={styles.error}>{error}</div>}
        <button type="submit" disabled={loading} style={styles.btn}>
          {loading ? 'נרשם...' : 'הרשמה'}
        </button>
      </form>

      <p style={styles.switch}>
        כבר יש לך חשבון?{' '}
        <button onClick={onSwitch} style={styles.link}>כניסה</button>
      </p>
    </div>
  )
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '36px 32px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
  },
  title: { fontSize: 22, fontWeight: 800, marginBottom: 24, textAlign: 'center' },
  input: {
    padding: '12px 14px',
    fontSize: 15,
    border: '1.5px solid #e5e7eb',
    borderRadius: 10,
    outline: 'none',
    width: '100%',
  },
  btn: {
    padding: '13px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 13,
    border: '1px solid #fecaca',
  },
  switch: { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b7280' },
  link: { background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
}
