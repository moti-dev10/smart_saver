import { useState } from 'react'
import ClubBadge from './ClubBadge'
import ReportModal from './ReportModal'
import { useAuth } from '../context/AuthContext'

export default function DealRow({ deal, isBest, productName }) {
  const [showReport, setShowReport] = useState(false)
  const { token } = useAuth()

  function trackClick() {
    if (!token || !deal.id) return
    fetch(`/profile/click/${deal.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 8,
        background: isBest ? 'var(--green-light)' : '#fff',
        border: `1px solid ${isBest ? '#86efac' : 'var(--gray-200)'}`,
        flexWrap: 'wrap',
      }}>
        {/* רשת */}
        <div style={{ minWidth: 110, fontWeight: 600, fontSize: 14 }}>
          {deal.retailer_logo && (
            <img
              src={deal.retailer_logo}
              alt=""
              style={{ width: 16, height: 16, marginLeft: 4, verticalAlign: 'middle' }}
              onError={e => { e.target.style.display = 'none' }}
            />
          )}
          {deal.retailer_name}
          {isBest && (
            <span style={{ marginRight: 6, fontSize: 11, background: 'var(--green)', color: '#fff', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
              זול ביותר
            </span>
          )}
        </div>

        {/* מועדון */}
        <div style={{ minWidth: 130 }}>
          <ClubBadge clubName={deal.club_name} userHasClub={deal.user_has_club} />
          {!deal.club_name && <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>ללא מועדון</span>}
        </div>

        {/* מחירים */}
        <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {deal.savings > 0 && (
            <span style={{ fontSize: 12, color: 'var(--gray-400)', textDecoration: 'line-through' }}>
              ₪{deal.regular_price.toLocaleString()}
            </span>
          )}
          <span style={{ fontSize: 18, fontWeight: 700, color: isBest ? 'var(--green-dark)' : 'var(--gray-800)' }}>
            ₪{deal.deal_price.toLocaleString()}
          </span>
          {deal.savings > 0 && (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green-dark)', background: 'var(--green-light)', padding: '2px 7px', borderRadius: 10 }}>
              חיסכון ₪{deal.savings.toLocaleString()} ({deal.savings_pct}%)
            </span>
          )}
        </div>

        {/* פעולות */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => setShowReport(true)}
            title="דווח על הטבה שגויה"
            style={{
              background: 'none',
              border: '1px solid var(--gray-200)',
              borderRadius: 6,
              padding: '5px 8px',
              fontSize: 14,
              cursor: 'pointer',
              color: 'var(--gray-400)',
              lineHeight: 1,
            }}
          >
            🚩
          </button>
          <a
            href={deal.affiliate_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackClick}
            style={{ padding: '6px 14px', background: 'var(--blue)', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            לאתר ←
          </a>
        </div>
      </div>

      {showReport && (
        <ReportModal
          deal={deal}
          productName={productName}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  )
}
