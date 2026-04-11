import React from 'react'

/**
 * Reusable Refresh Button Component
 * @param {function} onClick - Click callback
 * @param {boolean} spinning - Is loading/spinning
 */
export default function RefreshBtn({ onClick, spinning = false }) {
  return (
    <button 
      onClick={onClick} 
      title="تحديث"
      style={{
        padding: '10px',
        borderRadius: '50%',
        background: '#2C3E6B',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        width: '42px',
        height: '42px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(44,62,107,0.3)',
        flexShrink: 0,
        transition: 'background 0.2s'
      }}
      onMouseOver={e => !spinning && (e.target.style.background = '#1a2949')}
      onMouseOut={e => !spinning && (e.target.style.background = '#2C3E6B')}
      disabled={spinning}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 0.6s linear infinite;
        }
      `}</style>
      <span style={{
        display: 'inline-block',
        animation: spinning ? 'spin 0.6s linear infinite' : 'none',
        fontSize: '22px',
        lineHeight: 1
      }}>
        ↻
      </span>
    </button>
  )
}
