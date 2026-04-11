import React from 'react'

/**
 * Dashboard Statistics Cards
 */
export default function AdminStats({ stats = {} }) {
  const cards = [
    { label: 'المستخدمون', value: stats.users || 0, icon: '👥', color: '#3498db' },
    { label: 'الأخبار', value: stats.news || 0, icon: '📰', color: '#e74c3c' },
    { label: 'الدورات', value: stats.courses || 0, icon: '🎓', color: '#2ecc71' },
    { label: 'الطلبات', value: stats.submissions || 0, icon: '📬', color: '#f39c12' }
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    }}>
      {cards.map((card, idx) => (
        <div
          key={idx}
          style={{
            background: '#fff',
            border: `2px solid ${card.color}`,
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                {card.label}
              </p>
              <p style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: '700',
                color: card.color
              }}>
                {card.value.toLocaleString()}
              </p>
            </div>
            <span style={{ fontSize: '40px' }}>{card.icon}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
