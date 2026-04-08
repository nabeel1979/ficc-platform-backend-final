import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || '/api'
const C = { primary: '#2C3E6B', gold: '#FFC72C', bg: '#F0F2F8' }

export default function Reports() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const loadReports = async () => {
    setLoading(true); setMsg('')
    try {
      const { data } = await axios.get(`${API}/archive/reports/${year}`)
      setReports(data.content || [])
      setMsg('✅ تم جلب التقارير')
    } catch(e) {
      setMsg('❌ ' + (e.response?.data?.error || 'خطأ'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [year])

  return (
    <div style={{ padding: '24px', fontFamily: 'Cairo,sans-serif', direction: 'rtl', background: C.bg, minHeight: '100%' }}>
      <div style={{ background: `linear-gradient(135deg,${C.primary},#4A6FA5)`, borderRadius: '16px', padding: '20px 24px', marginBottom: '20px' }}>
        <h2 style={{ color: 'white', margin: '0 0 12px', fontWeight: '800' }}>📊 الأرشيف والتقارير</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '13px' }}>تقارير سنة 2026 من نظام الأرشفة</p>
      </div>

      {/* السنة */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#666', marginBottom: '8px' }}>السنة</label>
        <select value={year} onChange={e => setYear(+e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'Cairo,sans-serif', fontSize: '14px' }}>
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {msg && (
        <div style={{ background: msg.startsWith('✅') ? '#F0FDF4' : '#FEF2F2', color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
          {msg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>⏳ جاري التحميل...</div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#666', fontSize: '13px' }}>📋 التقارير المتاحة لسنة {year}</p>
          <div style={{ marginTop: '12px', padding: '12px', background: '#F5F7FA', borderRadius: '8px', fontSize: '12px', color: '#666' }}>
            — جاري تحميل التقارير من نظام الأرشفة...
          </div>
        </div>
      )}
    </div>
  )
}
