import React from 'react'
import { Link, useLocation } from 'react-router-dom'

/**
 * Admin Dashboard Sidebar Navigation
 */
export default function AdminSidebar({ navItems, isOpen, onClose }) {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
            display: 'none'
          }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div style={{
        width: '260px',
        background: '#f8f9fa',
        borderRight: '1px solid #e0e0e0',
        overflowY: 'auto',
        height: 'calc(100vh - 80px)',
        padding: '20px 0'
      }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px',
                color: isActive(item.to) ? '#2C3E6B' : '#666',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: isActive(item.to) ? '600' : '500',
                background: isActive(item.to) ? '#e8eef5' : 'transparent',
                borderLeft: isActive(item.to) ? '3px solid #2C3E6B' : '3px solid transparent',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseOver={e => !isActive(item.to) && (e.currentTarget.style.background = '#f0f1f3')}
              onMouseOut={e => !isActive(item.to) && (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
