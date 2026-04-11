import React, { useState } from 'react'

/**
 * Social Media Fields Component
 * @param {object} value - Current social media values
 * @param {function} onChange - Change callback
 */
export default function SocialField({ value = {}, onChange }) {
  const [vals, setVals] = useState({
    facebook: value?.facebook || '',
    twitter: value?.twitter || '',
    instagram: value?.instagram || '',
    linkedin: value?.linkedin || value?.linkedIn || '',
    whatsapp: value?.whatsapp || value?.whatsApp || '',
    telegram: value?.telegram || '',
    youtube: value?.youtube || value?.youTube || ''
  })

  const socials = [
    { key: 'facebook', label: 'فيسبوك', icon: '📘', placeholder: 'https://facebook.com/...' },
    { key: 'twitter', label: 'تويتر X', icon: '𝕏', placeholder: 'https://twitter.com/...' },
    { key: 'instagram', label: 'انستغرام', icon: '📸', placeholder: 'https://instagram.com/...' },
    { key: 'linkedin', label: 'لينكدإن', icon: '💼', placeholder: 'https://linkedin.com/...' },
    { key: 'whatsapp', label: 'واتساب', icon: '💬', placeholder: '07xxxxxxxxxx' },
    { key: 'telegram', label: 'تيليغرام', icon: '✈️', placeholder: 'https://t.me/...' },
    { key: 'youtube', label: 'يوتيوب', icon: '📺', placeholder: 'https://youtube.com/...' }
  ]

  const handleUpdate = (key, val) => {
    const updated = { ...vals, [key]: val }
    setVals(updated)
    onChange(updated)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {socials.map(s => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px', width: '28px', textAlign: 'center', flexShrink: 0 }}>
            {s.icon}
          </span>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '3px' }}>
              {s.label}
            </label>
            <input
              type="text"
              value={vals[s.key]}
              onChange={e => handleUpdate(s.key, e.target.value)}
              placeholder={s.placeholder}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
