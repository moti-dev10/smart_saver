import { useState, useEffect } from 'react'
import DealRow from './DealRow'
import { useAuth } from '../context/AuthContext'

export default function ProductCard({ product, wishlistIds, onWishlistChange }) {
  const [expanded, setExpanded] = useState(false)
  const { token } = useAuth()
  const deals = product.all_deals
  const visibleDeals = expanded ? deals : deals.slice(0, 3)
  const totalSaving = product.best_deal.savings
  const savingPct = product.best_deal.savings_pct

  const isSaved = wishlistIds ? wishlistIds.has(product.id) : false

  async function toggleWishlist(e) {
    e.stopPropagation()
    if (!token) return

    const method = isSaved ? 'DELETE' : 'POST'
    try {
      await fetch(`/wishlist/${product.id}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      })
      onWishlistChange?.(product.id, !isSaved)
    } catch { /* שגיאת רשת — מתעלמים */ }
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow)',
      overflow: 'hidden',
    }}>
      {/* כותרת מוצר */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 20px',
        borderBottom: '1px solid var(--gray-100)',
      }}>
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, background: 'var(--gray-50)' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 2 }}>{product.category}</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{product.name}</div>
        </div>

        {/* מחיר + כפתור לב */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green-dark)' }}>
              ₪{product.best_price.toLocaleString()}
            </div>
            {totalSaving > 0 && (
              <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>
                חיסכון עד ₪{totalSaving.toLocaleString()} ({savingPct}%)
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
              {deals.length} הצעות
            </div>
          </div>

          {token && (
            <button
              onClick={toggleWishlist}
              title={isSaved ? 'הסר ממועדפים' : 'הוסף למועדפים'}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 22,
                cursor: 'pointer',
                padding: '2px 4px',
                lineHeight: 1,
                color: isSaved ? '#ef4444' : '#d1d5db',
                transition: 'color .15s, transform .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isSaved ? '❤️' : '🤍'}
            </button>
          )}
        </div>
      </div>

      {/* רשימת עסקאות */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visibleDeals.map((deal, i) => (
          <DealRow key={i} deal={deal} isBest={i === 0} productName={product.name} />
        ))}
        {deals.length > 3 && (
          <button
            onClick={() => setExpanded(x => !x)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--blue)',
              fontSize: 13,
              fontWeight: 600,
              padding: '4px 0',
              textAlign: 'right',
              cursor: 'pointer',
            }}
          >
            {expanded ? '▲ הצג פחות' : `▼ הצג עוד ${deals.length - 3} הצעות`}
          </button>
        )}
      </div>
    </div>
  )
}
