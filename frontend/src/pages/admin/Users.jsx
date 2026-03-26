import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const ROLES = [
  { value: 'user',   label: 'משתמש',      color: '#64748b', bg: '#f1f5f9' },
  { value: 'editor', label: 'עורך',        color: '#7c3aed', bg: '#f5f3ff' },
  { value: 'admin',  label: 'מנהל ראשי',  color: '#1d4ed8', bg: '#dbeafe' },
]

export default function Users() {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [editRole, setEditRole] = useState(null)
  const [loading, setLoading] = useState(true)

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    fetch('/admin/users', { headers })
      .then(r => r.json())
      .then(d => { setUsers(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function changeRole(userId, role) {
    await fetch(`/admin/users/${userId}/role`, { method: 'PATCH', headers, body: JSON.stringify({ role }) })
    setUsers(us => us.map(u => u.id === userId ? { ...u, role } : u))
    setEditRole(null)
  }

  function roleInfo(role) { return ROLES.find(r => r.value === role) || ROLES[0] }

  return (
    <div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>טוען...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['משתמש', 'תפקיד', 'מועדונים', 'הצטרף', 'פעולות'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const role = roleInfo(u.role)
                return (
                  <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{u.name || '—'}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{u.email}</div>
                    </td>
                    <td style={td}>
                      {editRole === u.id ? (
                        <select defaultValue={u.role} autoFocus
                          onChange={e => changeRole(u.id, e.target.value)}
                          onBlur={() => setEditRole(null)}
                          style={{ padding: '4px 8px', border: '1.5px solid #3b82f6', borderRadius: 6, fontSize: 13, outline: 'none' }}>
                          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      ) : (
                        <span style={{ background: role.bg, color: role.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{role.label}</span>
                      )}
                    </td>
                    <td style={{ ...td, fontWeight: 600 }}>{u.clubs}</td>
                    <td style={{ ...td, fontSize: 13, color: '#64748b' }}>{u.created_at}</td>
                    <td style={td}>
                      <button onClick={() => setEditRole(u.id)}
                        style={{ background: '#f1f5f9', border: 'none', color: '#374151', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        שנה תפקיד
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: 20, background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#374151' }}>הסבר תפקידים</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ROLES.map(r => (
            <div key={r.value} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ background: r.bg, color: r.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, minWidth: 80, textAlign: 'center' }}>{r.label}</span>
              <span style={{ fontSize: 13, color: '#64748b' }}>
                {r.value === 'admin'  && 'גישה מלאה — ניהול מוצרים, עסקאות, משתמשים ודיווחים'}
                {r.value === 'editor' && 'יכול להוסיף ולערוך מוצרים ועסקאות, לאשר דיווחים'}
                {r.value === 'user'   && 'משתמש רגיל — חיפוש ודיווח בלבד'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const td = { padding: '14px 16px', fontSize: 14, color: '#1e293b', verticalAlign: 'middle' }
