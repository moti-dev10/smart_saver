import { useState, useEffect } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './context/AuthContext'
import SearchBar from './components/SearchBar'
import SearchFilters from './components/SearchFilters'
import ProductCard from './components/ProductCard'
import ProfileDrawer from './components/ProfileDrawer'
import SuggestModal from './components/SuggestModal'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Products from './pages/admin/Products'
import Deals from './pages/admin/Deals'
import Users from './pages/admin/Users'
import Reports from './pages/admin/Reports'
import Retailers from './pages/admin/Retailers'
import Import from './pages/admin/Import'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const MOCK_DATA = {
  query: 'מקרר',
  total: 2,
  results: [
    {
      id: 1,
      name: 'מקרר סמסונג 500 ליטר ללא כפור',
      category: 'מקררים',
      image_url: null,
      best_price: 4290,
      best_deal: { retailer_name: 'KSP', retailer_logo: null, affiliate_url: 'https://www.ksp.co.il', club_name: 'מועדון KSP', regular_price: 4990, deal_price: 4290, savings: 700, savings_pct: 14.0, is_club_deal: true, user_has_club: true, valid_until: '2026-04-23' },
      all_deals: [
        { retailer_name: 'KSP', retailer_logo: null, affiliate_url: 'https://www.ksp.co.il', club_name: 'מועדון KSP', regular_price: 4990, deal_price: 4290, savings: 700, savings_pct: 14.0, is_club_deal: true, user_has_club: true, valid_until: '2026-04-23' },
        { retailer_name: 'המשביר לצרכן', retailer_logo: null, affiliate_url: 'https://www.hamashbir.com', club_name: 'מועדון המשביר', regular_price: 4990, deal_price: 4350, savings: 640, savings_pct: 12.8, is_club_deal: true, user_has_club: false, valid_until: '2026-04-23' },
        { retailer_name: 'BUG', retailer_logo: null, affiliate_url: 'https://www.bug.co.il', club_name: 'BUG Club', regular_price: 4990, deal_price: 4490, savings: 500, savings_pct: 10.0, is_club_deal: true, user_has_club: true, valid_until: '2026-04-23' },
        { retailer_name: 'אייבורי', retailer_logo: null, affiliate_url: 'https://www.ivory.co.il', club_name: null, regular_price: 4990, deal_price: 4750, savings: 240, savings_pct: 4.8, is_club_deal: false, user_has_club: true, valid_until: '2026-04-23' },
        { retailer_name: 'המחסן האלקטרוני', retailer_logo: null, affiliate_url: 'https://www.hmahsan.co.il', club_name: null, regular_price: 4990, deal_price: 4800, savings: 190, savings_pct: 3.8, is_club_deal: false, user_has_club: true, valid_until: '2026-04-23' },
      ],
    },
    {
      id: 2,
      name: 'מקרר LG 450 ליטר דלת-בדלת',
      category: 'מקררים',
      image_url: null,
      best_price: 3690,
      best_deal: { retailer_name: 'KSP', retailer_logo: null, affiliate_url: 'https://www.ksp.co.il', club_name: 'מועדון KSP', regular_price: 4200, deal_price: 3690, savings: 510, savings_pct: 12.1, is_club_deal: true, user_has_club: true, valid_until: '2026-04-23' },
      all_deals: [
        { retailer_name: 'KSP', retailer_logo: null, affiliate_url: 'https://www.ksp.co.il', club_name: 'מועדון KSP', regular_price: 4200, deal_price: 3690, savings: 510, savings_pct: 12.1, is_club_deal: true, user_has_club: true, valid_until: '2026-04-23' },
        { retailer_name: 'אייבורי', retailer_logo: null, affiliate_url: 'https://www.ivory.co.il', club_name: 'מועדון אייבורי', regular_price: 4200, deal_price: 3750, savings: 450, savings_pct: 10.7, is_club_deal: true, user_has_club: false, valid_until: '2026-04-23' },
        { retailer_name: 'BUG', retailer_logo: null, affiliate_url: 'https://www.bug.co.il', club_name: null, regular_price: 4200, deal_price: 3950, savings: 250, savings_pct: 5.9, is_club_deal: false, user_has_club: true, valid_until: '2026-04-23' },
        { retailer_name: 'המחסן האלקטרוני', retailer_logo: null, affiliate_url: 'https://www.hmahsan.co.il', club_name: null, regular_price: 4200, deal_price: 4050, savings: 150, savings_pct: 3.6, is_club_deal: false, user_has_club: true, valid_until: '2026-04-23' },
      ],
    },
  ],
}

const BROAD_CATEGORIES = [
  { label: 'מוצרי חשמל', icon: '🔌', sub: ['מקררים', 'טלוויזיות', 'מכונות כביסה', 'מייבשים', 'מדיחים', 'מזגנים'] },
  { label: 'טכנולוגיה',  icon: '📱', sub: ['סמארטפונים', 'מחשבים ניידים', 'טאבלטים'] },
  { label: 'בית וגן',    icon: '🏡', sub: [] },
  { label: 'אופנה',      icon: '👗', sub: [] },
  { label: 'מסעדות',     icon: '🍽️', sub: [] },
  { label: 'ספורט',      icon: '💪', sub: [] },
  { label: 'יופי וטיפוח',icon: '💄', sub: [] },
  { label: 'ילדים',      icon: '🧸', sub: [] },
]

function AdminApp({ onExit }) {
  const [adminPage, setAdminPage] = useState('dashboard')
  const [pendingCount, setPendingCount] = useState(0)
  const { token } = useAuth()

  useEffect(() => {
    fetch('/admin/reports', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const arr = Array.isArray(d) ? d : []
        setPendingCount(arr.filter(r => r.status === 'pending').length)
      })
      .catch(() => {})
  }, [token])

  const pages = { dashboard: <Dashboard onNav={setAdminPage} />, products: <Products />, deals: <Deals />, users: <Users />, reports: <Reports />, retailers: <Retailers />, import: <Import /> }
  return <AdminLayout page={adminPage} onNav={setAdminPage} onExit={onExit} pendingReportsCount={pendingCount}>{pages[adminPage]}</AdminLayout>
}

const DEFAULT_FILTERS = { category: null, min_price: null, max_price: null, sort_by: 'price_asc' }

function MainApp() {
  const { user, token, loading } = useAuth()
  const [authPage, setAuthPage] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [lastQuery, setLastQuery] = useState(null)
  const [activeBroadCat, setActiveBroadCat] = useState(null)
  const [featured, setFeatured] = useState(null)
  const [wishlistIds, setWishlistIds] = useState(new Set())
  const [userClubs, setUserClubs] = useState([])

  function refreshUserClubs() {
    if (!token) { setUserClubs([]); return }
    fetch('/profile/clubs', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => setUserClubs(data.filter(c => c.is_member)))
      .catch(() => {})
  }

  // טעינת מועדוני המשתמש
  useEffect(() => { refreshUserClubs() }, [token])

  // טעינת קטגוריות בהפעלה
  useEffect(() => {
    fetch('/search/categories')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.categories) setCategories(data.categories) })
      .catch(() => {})
  }, [])

  // טעינת מבצעים מובילים
  useEffect(() => {
    const params = new URLSearchParams()
    if (user?.id) params.set('user_id', user.id)
    fetch(`/search/featured?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setFeatured(data || MOCK_DATA))
      .catch(() => setFeatured(MOCK_DATA))
  }, [user?.id])

  // טעינת מזהי מועדפים כשמשתמש מחובר
  useEffect(() => {
    if (!token) { setWishlistIds(new Set()); return }
    fetch('/wishlist/ids', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { ids: [] })
      .then(data => setWishlistIds(new Set(data.ids)))
      .catch(() => {})
  }, [token])

  function handleWishlistChange(productId, saved) {
    setWishlistIds(prev => {
      const next = new Set(prev)
      saved ? next.add(productId) : next.delete(productId)
      return next
    })
  }

  async function doSearch(q, overrideFilters, catSubs) {
    const activeFilters = overrideFilters || filters
    setSearching(true)
    setError(null)
    const userId = user?.id || 1

    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (catSubs?.length) params.set('categories', catSubs.join(','))
    else if (activeFilters.category) params.set('category', activeFilters.category)
    if (activeFilters.min_price != null) params.set('min_price', activeFilters.min_price)
    if (activeFilters.max_price != null) params.set('max_price', activeFilters.max_price)
    if (activeFilters.sort_by) params.set('sort_by', activeFilters.sort_by)
    params.set('user_id', userId)

    try {
      const res = await fetch(`/search?${params}`)
      if (!res.ok) throw new Error()
      setResults(await res.json())
    } catch {
      if (q?.includes('מקרר') || catSubs?.length) setResults({ ...MOCK_DATA, query: q || catSubs?.join(', ') || '' })
      else setResults({ query: q || activeFilters.category || '', total: 0, results: [] })
      setError('השרת אינו זמין — מציג נתוני דמו')
    } finally {
      setSearching(false)
    }
  }

  function handleSearch(q) {
    setLastQuery(q)
    setActiveBroadCat(null)
    const newFilters = { ...filters, category: null }
    setFilters(newFilters)
    doSearch(q, newFilters)
  }

  function handleBroadCatClick(broadCat) {
    setLastQuery(null)
    setActiveBroadCat(broadCat)
    const newFilters = { ...DEFAULT_FILTERS }
    setFilters(newFilters)
    doSearch(null, newFilters, broadCat.sub)
  }

  function handleFiltersChange(newFilters) {
    setFilters(newFilters)
    doSearch(lastQuery, newFilters, activeBroadCat?.sub)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, fontSize: 16 }}>טוען...</div>

  const isDemoAdmin = window.location.hash === '#admin'
  if (showAdmin || isDemoAdmin) return <AdminApp onExit={() => { setShowAdmin(false); window.location.hash = '' }} />

  if (authPage) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 16,
      }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setAuthPage(null)}
            style={{ position: 'absolute', top: 12, left: 12, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', zIndex: 1 }}
          >✕</button>
          {authPage === 'login'
            ? <LoginPage onSwitch={() => setAuthPage('register')} onSuccess={() => setAuthPage(null)} />
            : <RegisterPage onSwitch={() => setAuthPage('login')} onSuccess={() => setAuthPage(null)} />}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* כותרת */}
      <header style={{
        background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #16a34a 100%)',
        padding: '28px 24px 44px',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, maxWidth: 860, margin: '0 auto 24px' }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>💰 חסכון חכם</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user ? (
              <>
                {(user.role === 'admin' || user.role === 'editor') && (
                  <button onClick={() => setShowAdmin(true)} style={{ background: '#fff', border: 'none', color: '#1d4ed8', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    ⚙️ ניהול
                  </button>
                )}
                {/* סמל פרופיל */}
                <button
                  onClick={() => setProfileOpen(true)}
                  title="פרופיל"
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderRadius: '50%',
                    width: 38, height: 38,
                    padding: 0,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 18, color: '#fff', fontWeight: 700, lineHeight: 1 }}>
                      {user.name?.[0]?.toUpperCase() || '👤'}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setAuthPage('login')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  כניסה
                </button>
                <button onClick={() => setAuthPage('register')} style={{ background: '#fff', border: 'none', color: '#1d4ed8', padding: '7px 16px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  הרשמה
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 15, opacity: 0.9, marginBottom: 24 }}>
            מצא את המחיר הטוב ביותר לפי המועדונים שלך
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <SearchBar onSearch={handleSearch} loading={searching} />
          </div>
        </div>
      </header>

      {/* סרגל מועדונים */}
      {user && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: 13, color: '#4b5563', flexWrap: 'wrap' }}>
          <span>המועדונים שלך:</span>
          {userClubs.length === 0
            ? <span style={{ color: '#9ca3af', fontSize: 12 }}>לא נרשמת למועדונים עדיין</span>
            : userClubs.map(c => (
                <span key={c.id} style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 20, padding: '2px 10px', fontWeight: 600, fontSize: 12 }}>✓ {c.name}</span>
              ))
          }
        </div>
      )}

      {/* שורת קטגוריות רחבות */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 16px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 4, maxWidth: 860, margin: '0 auto', minWidth: 'max-content' }}>
          {BROAD_CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => handleBroadCatClick(cat)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '12px 16px',
                background: 'none', border: 'none',
                borderBottom: activeBroadCat?.label === cat.label ? '2px solid #2563eb' : '2px solid transparent',
                color: activeBroadCat?.label === cat.label ? '#1d4ed8' : '#6b7280',
                cursor: 'pointer', fontSize: 12, fontWeight: activeBroadCat?.label === cat.label ? 700 : 500,
                whiteSpace: 'nowrap', transition: 'all .12s',
              }}
            >
              <span style={{ fontSize: 22 }}>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* תוכן ראשי */}
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '28px 16px' }}>
        {error && (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#ea580c', marginBottom: 20 }}>
            ⚠️ {error}
          </div>
        )}

        {/* מצב טעינה */}
        {searching && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 15 }}>מחפש...</div>
          </div>
        )}

        {/* תוצאות */}
        {results && !searching && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                {lastQuery ? `תוצאות עבור "${results.query}"` : activeBroadCat ? activeBroadCat.label : `קטגוריה: ${filters.category}`}
              </h2>
              <button onClick={() => { setResults(null); setActiveBroadCat(null); setLastQuery(null) }}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer', padding: 0 }}>
                ✕ נקה
              </button>
            </div>

            <SearchFilters
              categories={activeBroadCat?.sub?.length ? activeBroadCat.sub : categories}
              filters={filters}
              onChange={handleFiltersChange}
              resultsCount={results.total}
            />

            {results.total === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#4b5563' }}>
                  {activeBroadCat && activeBroadCat.sub.length === 0 ? 'קטגוריה זו תהיה זמינה בקרוב' : 'לא נמצאו תוצאות'}
                </div>
              </div>
            )}

            {results.total > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {results.results.map(p => (
                  <ProductCard key={p.id} product={p} wishlistIds={wishlistIds} onWishlistChange={handleWishlistChange} />
                ))}
              </div>
            )}
          </>
        )}

        {/* דף בית — ללא חיפוש */}
        {!results && !searching && (
          <>
            {featured?.results?.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: '#111827' }}>🔥 מבצעים מובילים עכשיו</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {featured.results.map(p => (
                    <ProductCard key={p.id} product={p} wishlistIds={wishlistIds} onWishlistChange={handleWishlistChange} />
                  ))}
                </div>
              </div>
            )}

            {(!featured || featured.total === 0) && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#4b5563' }}>חפש מוצר או בחר קטגוריה</div>
                {!user && (
                  <div style={{ marginTop: 24 }}>
                    <button onClick={() => setAuthPage('register')} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                      הירשם לחשבון חינמי ←
                    </button>
                    <div style={{ fontSize: 12, marginTop: 8, color: '#9ca3af' }}>כדי לראות מחירים עם המועדונים שלך</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* מגירת פרופיל */}
      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} onClubsChange={refreshUserClubs} />
      {suggestOpen && <SuggestModal onClose={() => setSuggestOpen(false)} />}

      {/* כפתור צף — הצעת הטבה */}
      <button
        onClick={() => setSuggestOpen(true)}
        title="הצעת הטבה חדשה"
        style={{
          position: 'fixed', bottom: 24, left: 24,
          background: '#2563eb', color: '#fff',
          border: 'none', borderRadius: 50,
          padding: '12px 20px',
          fontSize: 14, fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
          zIndex: 100,
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        💡 הצעת הטבה
      </button>
    </div>
  )
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}
