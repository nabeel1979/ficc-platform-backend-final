import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

const API = '/organizations'
const getToken = () => localStorage.getItem('ficc_token')
const authHdrs = () => ({ Authorization: `Bearer ${getToken()}` })

export default function Organizations({ chambers = [] }) {
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [form, setForm] = useState({ name: '', chambers: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      // TODO: استدعاء API
      // const res = await api.get(API, { headers: authHdrs() })
      // setOrganizations(res.data)
      
      // For now, load from localStorage
      const saved = localStorage.getItem('ficc_organizations')
      if (saved) setOrganizations(JSON.parse(saved))
    } catch (err) {
      console.error('Error loading organizations:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveOrganization = async () => {
    if (!form.name.trim()) {
      alert('⚠️ أدخل اسم الجهة')
      return
    }
    if (form.chambers.length === 0) {
      alert('⚠️ اختر غرفة واحدة على الأقل')
      return
    }

    try {
      if (selectedOrg) {
        // Update
        const updated = organizations.map(o => 
          o.id === selectedOrg.id ? { ...form, id: selectedOrg.id } : o
        )
        setOrganizations(updated)
      } else {
        // Create
        const newOrg = { ...form, id: Date.now(), createdAt: new Date().toISOString() }
        setOrganizations([...organizations, newOrg])
      }
      
      // Save to localStorage (TODO: replace with API call)
      localStorage.setItem('ficc_organizations', JSON.stringify(organizations))
      
      setForm({ name: '', chambers: [] })
      setSelectedOrg(null)
      setShowModal(false)
    } catch (err) {
      alert('❌ خطأ في الحفظ: ' + err.message)
    }
  }

  const deleteOrganization = (id) => {
    if (confirm('هل تريد حذف هذه الجهة؟')) {
      const updated = organizations.filter(o => o.id !== id)
      setOrganizations(updated)
      localStorage.setItem('ficc_organizations', JSON.stringify(updated))
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#2C3E6B', fontSize: '20px', fontWeight: '700', margin: 0 }}>🏛️ الجهات</h2>
        <button onClick={() => { setShowModal(true); setSelectedOrg(null); setForm({ name: '', chambers: [] }) }}
          style={{ padding: '10px 20px', background: '#2C3E6B', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', fontFamily: 'Cairo,sans-serif' }}>
          ➕ إضافة جهة جديدة
        </button>
      </div>

      {/* Organizations Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>⏳ جاري التحميل...</div>
      ) : organizations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '12px', color: '#aaa' }}>
          <p style={{ fontSize: '14px' }}>لا توجد جهات محفوظة</p>
          <p style={{ fontSize: '13px' }}>اضغط "إضافة جهة" للبدء</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '16px' }}>
          {organizations.map(org => (
            <div key={org.id} style={{ background: '#fff', border: '1.5px solid #dde3ed', borderRadius: '12px', padding: '16px', transition: 'all 0.3s' }}>
              <h3 style={{ color: '#2C3E6B', fontSize: '15px', fontWeight: '700', marginBottom: '8px', margin: '0 0 8px' }}>{org.name}</h3>
              <p style={{ color: '#666', fontSize: '13px', marginBottom: '12px', margin: '0 0 12px' }}>
                الغرف المختارة: <strong>{org.chambers?.length || 0}</strong>
              </p>
              <div style={{ marginBottom: '12px', padding: '8px', background: '#f8f9fa', borderRadius: '6px', maxHeight: '100px', overflowY: 'auto' }}>
                <div style={{ fontSize: '12px', color: '#555', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {org.chambers?.map((chamberId, idx) => {
                    const chamber = chambers.find(c => c.id === chamberId)
                    return (
                      <span key={idx} style={{ background: '#667eea', color: '#fff', padding: '4px 8px', borderRadius: '4px' }}>
                        {chamber?.name || `الغرفة ${chamberId}`}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setSelectedOrg(org); setForm(org); setShowModal(true) }}
                  style={{ flex: 1, padding: '8px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Cairo,sans-serif' }}>
                  ✏️ تعديل
                </button>
                <button onClick={() => deleteOrganization(org.id)}
                  style={{ flex: 1, padding: '8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Cairo,sans-serif' }}>
                  🗑️ حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '500px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <h2 style={{ color: '#2C3E6B', fontSize: '18px', fontWeight: '700', marginBottom: '16px', fontFamily: 'Cairo,sans-serif', margin: '0 0 16px' }}>
              {selectedOrg ? '✏️ تعديل الجهة' : '➕ إضافة جهة جديدة'}
            </h2>

            {/* Organization Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#2C3E6B', marginBottom: '6px' }}>اسم الجهة</label>
              <input type="text" placeholder="مثال: غرف الوسط" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #dde3ed', borderRadius: '8px', fontSize: '13px', fontFamily: 'Cairo,sans-serif', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* Chambers Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#2C3E6B', marginBottom: '8px' }}>اختر الغرف</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px', maxHeight: '300px', overflowY: 'auto', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                {chambers.map(c => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Cairo,sans-serif' }}>
                    <input type="checkbox" checked={form.chambers?.includes(c.id) || false}
                      onChange={e => {
                        const newChambers = e.target.checked
                          ? [...(form.chambers || []), c.id]
                          : form.chambers.filter(id => id !== c.id)
                        setForm({ ...form, chambers: newChambers })
                      }}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={saveOrganization}
                style={{ flex: 1, padding: '10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', fontFamily: 'Cairo,sans-serif' }}>
                💾 حفظ
              </button>
              <button onClick={() => { setShowModal(false); setSelectedOrg(null); setForm({ name: '', chambers: [] }) }}
                style={{ flex: 1, padding: '10px', background: '#dde3ed', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', fontFamily: 'Cairo,sans-serif' }}>
                ❌ إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
