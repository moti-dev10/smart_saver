import { useState, useEffect, useRef } from 'react'

export default function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/search/suggestions?q=${encodeURIComponent(query.trim())}`)
        if (!res.ok) return
        const data = await res.json()
        setSuggestions(data.suggestions || [])
        setShowSuggestions((data.suggestions || []).length > 0)
      } catch {
        setSuggestions([])
      }
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query])

  function submit(e) {
    e.preventDefault()
    if (query.trim()) {
      setShowSuggestions(false)
      onSearch(query.trim())
    }
  }

  function selectSuggestion(s) {
    setQuery(s)
    setShowSuggestions(false)
    onSearch(s)
  }

  const POPULAR = ['מקרר', 'טלוויזיה', 'מכונת כביסה', 'מזגן', 'אייפון', 'מחשב נייד']

  return (
    <div style={{ width: '100%', maxWidth: 680 }}>
      <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="חפש מוצר — מקרר, טלוויזיה, מזגן..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '14px 18px',
              fontSize: 16,
              border: '2px solid var(--gray-200)',
              borderRadius: 'var(--radius)',
              outline: 'none',
              transition: 'border-color .15s',
              background: '#fff',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--blue)'; suggestions.length > 0 && setShowSuggestions(true) }}
            onBlur={e => { e.target.style.borderColor = 'var(--gray-200)'; setTimeout(() => setShowSuggestions(false), 150) }}
          />
          {showSuggestions && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              right: 0,
              left: 0,
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 100,
              overflow: 'hidden',
            }}>
              {suggestions.map(s => (
                <SuggestionRow key={s} text={s} onSelect={selectSuggestion} />
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            padding: '14px 28px',
            background: loading ? 'var(--gray-400)' : 'var(--blue)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius)',
            fontSize: 15,
            fontWeight: 600,
            transition: 'background .15s',
            cursor: loading || !query.trim() ? 'default' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'מחפש...' : 'חפש'}
        </button>
      </form>

      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: '28px' }}>חיפושים נפוצים:</span>
        {POPULAR.map(s => (
          <button
            key={s}
            onClick={() => { setQuery(s); onSearch(s) }}
            style={{
              padding: '4px 12px',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: 20,
              fontSize: 13,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

function SuggestionRow({ text, onSelect }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseDown={() => onSelect(text)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '10px 16px',
        cursor: 'pointer',
        fontSize: 14,
        color: '#374151',
        background: hovered ? '#f3f4f6' : '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: '1px solid #f9fafb',
      }}
    >
      <span style={{ opacity: 0.4, fontSize: 13 }}>🔍</span>
      {text}
    </div>
  )
}
