import React from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Admin Dashboard Header
 */
export default function AdminHeader({ user, onLogout }) {
  const navigate = useNavigate()

  return (
    <div style={{
      background: 'linear-gradient(135deg, #2C3E6B 0%, #4A6FA5 100%)',
      color: '#fff',
      padding: '20px 30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderBottom: '3px solid #1a2949'
    }}>
      {/* Left: Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        cursor: 'pointer'
      }}
        onClick={() => navigate('/admin')}
      >
        <span style={{ fontSize: '28px' }}>🏛️</span>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
            FICC
          </h2>
          <p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>
            لوحة التحكم
          </p>
        </div>
      </div>

      {/* Right: User Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
            {user?.fullName || user?.username}
          </p>
          <p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>
            {user?.role === 'Admin' ? '🔐 مدير' : '👤 عضو'}
          </p>
        </div>

        <button
          onClick={onLogout}
          style={{
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.3)'}
          onMouseOut={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
        >
          🚪 تسجيل الخروج
        </button>
      </div>
    </div>
  )
}
