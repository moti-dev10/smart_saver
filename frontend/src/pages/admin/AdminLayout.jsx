import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { key: 'dashboard', label: 'לוח בקרה',    icon: '📊' },
  { key: 'products',  label: 'מוצרים',       icon: '📦' },
  { key: 'deals',     label: 'מחירים ומבצעים',icon: '💰' },
  { key: 'retailers', label: 'רשתות ומועדונים',icon: '🏪' },
  { key: 'users',     label: 'משתמשים',      icon: '👥' },
  { key: 'reports',   label: 'דיווחי משתמשים',icon: '🚨' },
  { key: 'import',    label: 'ייבוא נתונים',  icon: '📥' },
]

export default function AdminLayout({ page, onNav, children, pendingReportsCount = 0 }) {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', direction: 'rtl' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 220,
        background: '#1e293b',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width .2s',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>💰</span>
          {!collapsed && <span style={{ fontWeight: 800, fontSize: 16 }}>אדמין פאנל</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV.map(item => (
            <button
              key={item.key}
              onClick={() => onNav(item.key)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '12px 20px' : '12px 20px',
                background: page === item.key ? '#3b82f6' : 'none',
                border: 'none',
                color: page === item.key ? '#fff' : '#94a3b8',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: page === item.key ? 600 : 400,
                textAlign: 'right',
                borderRadius: 0,
                transition: 'all .15s',
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.key === 'reports' && pendingReportsCount > 0 && (
                <span style={{ marginRight: 'auto', background: '#ef4444', color: '#fff', borderRadius: 10, fontSize: 11, padding: '1px 6px', fontWeight: 700 }}>
                  {pendingReportsCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid #334155', padding: 12 }}>
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{ width: '100%', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18, padding: 8 }}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 24px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>
            {NAV.find(n => n.key === page)?.icon} {NAV.find(n => n.key === page)?.label}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user?.avatar_url && <img src={user.avatar_url} style={{ width: 32, height: 32, borderRadius: '50%' }} alt="" />}
            <span style={{ fontSize: 13, color: '#64748b' }}>{user?.name || user?.email}</span>
            <span style={{ fontSize: 11, background: user?.role === 'admin' ? '#dbeafe' : '#dcfce7', color: user?.role === 'admin' ? '#1d4ed8' : '#15803d', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
              {user?.role === 'admin' ? 'מנהל ראשי' : user?.role === 'editor' ? 'עורך' : 'משתמש'}
            </span>
            <button onClick={logout} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '6px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
              יציאה
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
