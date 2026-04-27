import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ProfileDrawer({ open, onClose, onClubsChange }) {
  const { user, token, logout } = useAuth()
  const [tab, setTab] = useState('clubs')
  const [clubs, setClubs] = useState([])
  const [activity, setActivity] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [loadingClubs, setLoadingClubs] = useState(false)
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [loadingWishlist, setLoadingWishlist] = useState(false)

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  )

  // טעינת מועדונים
  useEffect(() => {
    if (!open || !token) return
    setLoadingClubs(true)
    fetch('/profile/clubs', { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then(data => setClubs(data))
      .catch(() => setClubs([]))
      .finally(() => setLoadingClubs(false))
  }, [open, token])

  // טעינת פעילות
  useEffect(() => {
    if (!open || !token || tab !== 'activity') return
    setLoadingActivity(true)
    fetch('/profile/activity', { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then(data => setActivity(data))
      .catch(() => setActivity([]))
      .finally(() => setLoadingActivity(false))
  }, [open, token, tab])

  // טעינת מועדפים
  useEffect(() => {
    if (!open || !token || tab !== 'wishlist') return
    setLoadingWishlist(true)
    fetch('/wishlist', { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then(data => setWishlist(data))
      .catch(() => setWishlist([]))
      .finally(() => setLoadingWishlist(false))
  }, [open, token, tab])

  async function toggleClub(club) {
    const endpoint = club.is_member
      ? `/profile/clubs/${club.id}/leave`
      : `/profile/clubs/${club.id}/join`
    const method = club.is_member ? 'DELETE' : 'POST'

    setClubs(prev =>
      prev.map(c => c.id === club.id ? { ...c, is_member: !c.is_member } : c)
    )

    try {
      await fetch(endpoint, { method, headers: headers() })
      onClubsChange?.()
    } catch {
      // החזר את המצב הקודם אם נכשל
      setClubs(prev =>
        prev.map(c => c.id === club.id ? { ...c, is_member: club.is_member } : c)
      )
    }
  }

  // קיבוץ מועדונים לפי רשת
  const grouped = clubs.reduce((acc, club) => {
    const key = club.retailer_name
    if (!acc[key]) acc[key] = { logo: club.retailer_logo, clubs: [] }
    acc[key].clubs.push(club)
    return acc
  }, {})

  const memberCount = clubs.filter(c => c.is_member).length

  function removeFromWishlist(productId) {
    setWishlist(prev => prev.filter(i => i.product_id !== productId))
    fetch(`/wishlist/${productId}`, {
      method: 'DELETE',
      headers: headers(),
    }).catch(() => {})
  }

  if (!open) return null

  return (
    <>
      {/* רקע כהה */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 200,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* המגירה */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: 380,
        maxWidth: '100vw',
        background: '#f9fafb',
        zIndex: 201,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.2)',
        overflowY: 'auto',
      }}>

        {/* כותרת + פרטי משתמש */}
        <div style={{
          background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
          padding: '24px 20px 20px',
          color: '#fff',
          position: 'relative',
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, left: 16,
              background: 'rgba(255,255,255,0.2)',
              border: 'none', borderRadius: '50%',
              width: 32, height: 32,
              fontSize: 16, cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)' }}
              />
            ) : (
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>
                {user?.name?.[0]?.toUpperCase() || '👤'}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{user?.name || 'משתמש'}</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>{user?.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
            <StatPill label="מועדונים פעילים" value={memberCount} />
            <StatPill label="מועדפים" value={wishlist.length || '—'} />
          </div>
        </div>

        {/* טאבים */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
          <TabBtn label="המועדונים שלי" active={tab === 'clubs'} onClick={() => setTab('clubs')} />
          <TabBtn label="❤️ מועדפים" active={tab === 'wishlist'} onClick={() => setTab('wishlist')} />
          <TabBtn label="ביקורים" active={tab === 'activity'} onClick={() => setTab('activity')} />
        </div>

        {/* תוכן */}
        <div style={{ flex: 1, padding: '16px 16px 24px', overflowY: 'auto' }}>

          {/* ── מועדונים ── */}
          {tab === 'clubs' && (
            <>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
                סמן את המועדונים שאתה חבר בהם — נציג לך את המחירים המיטביים
              </p>
              {loadingClubs ? (
                <Spinner />
              ) : clubs.length === 0 ? (
                <Empty text="אין מועדונים במערכת" />
              ) : (
                Object.entries(grouped).map(([retailer, { logo, clubs: rClubs }]) => (
                  <div key={retailer} style={{ marginBottom: 18 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: '#9ca3af',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      {logo && (
                        <img
                          src={logo} alt=""
                          style={{ width: 14, height: 14, objectFit: 'contain' }}
                          onError={e => { e.target.style.display = 'none' }}
                        />
                      )}
                      {retailer}
                    </div>
                    {rClubs.map(club => (
                      <ClubToggleRow
                        key={club.id}
                        club={club}
                        onToggle={() => toggleClub(club)}
                      />
                    ))}
                  </div>
                ))
              )}
            </>
          )}

          {/* ── מועדפים ── */}
          {tab === 'wishlist' && (
            <>
              {loadingWishlist ? (
                <Spinner />
              ) : wishlist.length === 0 ? (
                <Empty text="לא שמרת מוצרים עדיין — לחץ ❤️ על מוצר כלשהו" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {wishlist.map(item => (
                    <WishlistRow key={item.product_id} item={item} onRemove={removeFromWishlist} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── פעילות ── */}
          {tab === 'activity' && (
            <>
              {loadingActivity ? (
                <Spinner />
              ) : activity.length === 0 ? (
                <Empty text="לא ביקרת באף עסקה עדיין" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activity.map(item => (
                    <ActivityRow key={item.deal_id} item={item} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* יציאה */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
          <button
            onClick={() => { logout(); onClose() }}
            style={{
              width: '100%', padding: '11px',
              background: '#fff', border: '1.5px solid #ef4444',
              borderRadius: 8, fontSize: 14, fontWeight: 600,
              color: '#ef4444', cursor: 'pointer',
            }}
          >
            יציאה מהחשבון
          </button>
        </div>
      </div>
    </>
  )
}

// ── רכיבי עזר ────────────────────────────────────────────────────────────────

function StatPill({ label, value }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.18)',
      borderRadius: 8, padding: '5px 12px',
      textAlign: 'center',
    }}>
      <div style={{ fontWeight: 700, fontSize: 15 }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.8 }}>{label}</div>
    </div>
  )
}

function TabBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '12px 8px',
        background: 'none', border: 'none',
        borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
        color: active ? '#1d4ed8' : '#6b7280',
        fontWeight: active ? 700 : 400,
        fontSize: 13, cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function ClubToggleRow({ club, onToggle }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 8, padding: '10px 14px', marginBottom: 6,
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{club.name}</div>
      </div>
      <Toggle on={club.is_member} onChange={onToggle} />
    </div>
  )
}

function Toggle({ on, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 42, height: 24, borderRadius: 12,
        background: on ? '#22c55e' : '#d1d5db',
        position: 'relative', cursor: 'pointer',
        transition: 'background .2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 3, right: on ? 3 : undefined, left: on ? undefined : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'all .2s',
      }} />
    </div>
  )
}

function ActivityRow({ item }) {
  const date = new Date(item.clicked_at)
  const label = date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 8, padding: '10px 14px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.product_name}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          {item.retailer_name} · {label}
        </div>
      </div>
      <div style={{ textAlign: 'left', flexShrink: 0, marginRight: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
          ₪{item.deal_price.toLocaleString()}
        </div>
        {item.savings_pct > 0 && (
          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
            −{item.savings_pct}%
          </div>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 13 }}>
      טוען...
    </div>
  )
}

function Empty({ text }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 13 }}>
      {text}
    </div>
  )
}

function WishlistRow({ item, onRemove }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 8, padding: '10px 14px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {item.product_category && (
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{item.product_category}</div>
        )}
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.product_name}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginRight: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>
          ₪{item.best_price.toLocaleString()}
        </div>
        <button
          onClick={() => onRemove(item.product_id)}
          title="הסר מהמועדפים"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#ef4444', padding: 2 }}
        >
          ❤️
        </button>
      </div>
    </div>
  )
}
