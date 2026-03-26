import { useState } from 'react'

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'מחיר: מהנמוך לגבוה' },
  { value: 'price_desc', label: 'מחיר: מהגבוה לנמוך' },
  { value: 'savings_pct', label: 'אחוז חיסכון גבוה' },
]

export default function SearchFilters({ categories, filters, onChange, resultsCount }) {
  const [priceMin, setPriceMin] = useState(filters.min_price || '')
  const [priceMax, setPriceMax] = useState(filters.max_price || '')

  function applyPrice() {
    onChange({
      ...filters,
      min_price: priceMin !== '' ? Number(priceMin) : null,
      max_price: priceMax !== '' ? Number(priceMax) : null,
    })
  }

  function setCategory(cat) {
    onChange({ ...filters, category: cat })
  }

  function setSort(val) {
    onChange({ ...filters, sort_by: val })
  }

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: '14px 16px',
      marginBottom: 20,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      alignItems: 'center',
    }}>
      {/* קטגוריה */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginLeft: 4 }}>קטגוריה:</span>
          <CategoryChip label="הכל" active={!filters.category} onClick={() => setCategory(null)} />
          {categories.map(cat => (
            <CategoryChip
              key={cat}
              label={cat}
              active={filters.category === cat}
              onClick={() => setCategory(cat)}
            />
          ))}
        </div>
      )}

      <div style={{ height: 24, width: 1, background: '#e5e7eb', flexShrink: 0 }} />

      {/* מיון */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>מיון:</span>
        <select
          value={filters.sort_by || 'price_asc'}
          onChange={e => setSort(e.target.value)}
          style={{
            fontSize: 13,
            padding: '4px 8px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            background: '#fff',
            color: '#374151',
            cursor: 'pointer',
          }}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div style={{ height: 24, width: 1, background: '#e5e7eb', flexShrink: 0 }} />

      {/* טווח מחיר */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>מחיר:</span>
        <input
          type="number"
          placeholder="מינימום"
          value={priceMin}
          onChange={e => setPriceMin(e.target.value)}
          onBlur={applyPrice}
          onKeyDown={e => e.key === 'Enter' && applyPrice()}
          style={{ width: 80, padding: '4px 8px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 6 }}
        />
        <span style={{ fontSize: 12, color: '#9ca3af' }}>—</span>
        <input
          type="number"
          placeholder="מקסימום"
          value={priceMax}
          onChange={e => setPriceMax(e.target.value)}
          onBlur={applyPrice}
          onKeyDown={e => e.key === 'Enter' && applyPrice()}
          style={{ width: 80, padding: '4px 8px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 6 }}
        />
        <span style={{ fontSize: 12, color: '#9ca3af' }}>₪</span>
      </div>

      {/* מספר תוצאות */}
      {resultsCount !== null && (
        <div style={{ marginRight: 'auto', fontSize: 13, color: '#9ca3af' }}>
          {resultsCount} מוצרים
        </div>
      )}
    </div>
  )
}

function CategoryChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: active ? 700 : 400,
        border: active ? '1.5px solid #2563eb' : '1px solid #d1d5db',
        background: active ? '#eff6ff' : '#fff',
        color: active ? '#1d4ed8' : '#6b7280',
        cursor: 'pointer',
        transition: 'all .12s',
      }}
    >
      {label}
    </button>
  )
}
