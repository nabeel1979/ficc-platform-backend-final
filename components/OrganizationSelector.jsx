import { useState, useEffect } from 'react'
import api from '../lib/api'

const getToken = () => localStorage.getItem('ficc_token')
const authHdrs = () => ({ Authorization: `Bearer ${getToken()}` })

export default function OrganizationSelector({ chambers: chambersProp = [], onSelectOrganization, disabled = false }) {
  const [chambers, setChambers] = useState(chambersProp)
  const [chambersLoading, setChambersLoading] = useState(false)
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [selectedChambers, setSelectedChambers] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadOrganizations()
    // جلب الغرف دائماً من الـ API
    setChambersLoading(true)
    api.get('/chambers', { headers: authHdrs() })
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : r.data.items || []
        setChambers(list)
      }).catch(() => {})
      .finally(() => setChambersLoading(false))
  }, [])

  useEffect(() => {
    if (chambersProp.length > 0) setChambers(chambersProp)
  }, [chambersProp.length])

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      const res = await api.get('/organizations', { headers: authHdrs() })
      setOrganizations(res.data || [])
    } catch {
      setOrganizations([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOrganization = (org) => {
    const orgChambers = org.chambers
      .map(chamberId => chambers.find(c => c.id === chamberId))
      .filter(c => c)
    if (onSelectOrganization) onSelectOrganization(orgChambers, org.name)
    setShowModal(false)
  }

  const toggleChamber = (id) => {
    setSelectedChambers(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const [isShared, setIsShared] = useState(false)
  const user = (() => { try { return JSON.parse(localStorage.getItem('ficc_user')||'{}') } catch { return {} } })()
  const isAdmin = user.role === 'Admin' || user.Role === 'Admin' || user.role === 'SuperAdmin' || user.Role === 'SuperAdmin'

  const handleCreateOrg = async () => {
    if (!newOrgName.trim() || selectedChambers.length === 0) return
    // تحقق من عدم تكرار الاسم
    const duplicate = organizations.find(o => o.name?.toLowerCase() === newOrgName.trim().toLowerCase() && o.isOwner !== false)
    if (duplicate) {
      alert('⚠️ اسم الجهة موجود مسبقاً - اختر اسماً مختلفاً')
      return
    }
    setSaving(true)
    const newOrg = { name: newOrgName.trim(), chambers: selectedChambers, isShared: isAdmin && isShared }
    try {
      const res = await api.post('/organizations', newOrg, { headers: authHdrs() })
      setOrganizations(prev => [...prev, res.data])
    } catch {
      setOrganizations(prev => [...prev, { ...newOrg, id: Date.now() }])
    }
    setNewOrgName('')
    setSelectedChambers([])
    setIsShared(false)
    setShowCreateForm(false)
    setSaving(false)
  }

  const handleDeleteOrg = async (orgId) => {
    try {
      await api.delete(`/api/organizations/${orgId}`, { headers: authHdrs() })
    } catch {}
    setOrganizations(prev => prev.filter(o => o.id !== orgId))
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={disabled}
        style={{
          padding: '6px 14px',
          borderRadius: '10px',
          background: '#667eea',
          color: '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          fontWeight: '700',
          border: 'none',
          fontFamily: 'Cairo,sans-serif',
          opacity: disabled ? 0.6 : 1
        }}
      >
        🏛️ اختر من الجهات
      </button>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '24px',
            maxWidth: '520px', width: '90%', maxHeight: '85vh',
            overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            fontFamily: 'Cairo,sans-serif', direction: 'rtl'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ color: '#2C3E6B', fontSize: '18px', fontWeight: '700', margin: 0 }}>
                🏛️ الجهات
              </h2>
              <button onClick={() => { setShowModal(false); setShowCreateForm(false) }}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            {/* Create New Org Button */}
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  width: '100%', padding: '10px', marginBottom: '16px',
                  background: '#2C3E6B', color: '#fff', border: 'none',
                  borderRadius: '10px', cursor: 'pointer', fontSize: '14px',
                  fontWeight: '700', fontFamily: 'Cairo,sans-serif'
                }}
              >
                ➕ إنشاء جهة جديدة
              </button>
            )}

            {/* Create Form */}
            {showCreateForm && (
              <div style={{
                background: '#f8f9ff', border: '1.5px solid #667eea',
                borderRadius: '12px', padding: '16px', marginBottom: '16px'
              }}>
                <h3 style={{ color: '#2C3E6B', fontSize: '15px', fontWeight: '700', margin: '0 0 12px' }}>
                  ➕ إنشاء جهة جديدة
                </h3>
                <input
                  value={newOrgName}
                  onChange={e => setNewOrgName(e.target.value)}
                  placeholder="اسم الجهة (مثال: غرف الوسط)"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1.5px solid #dde3ed', fontSize: '14px',
                    fontFamily: 'Cairo,sans-serif', marginBottom: '12px',
                    boxSizing: 'border-box', direction: 'rtl'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#2C3E6B' }}>اختر الغرف:</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button"
                      onClick={() => setSelectedChambers(chambers.map(c => c.id))}
                      style={{ padding: '3px 10px', borderRadius: '6px', background: '#2C3E6B', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px', fontFamily: 'Cairo,sans-serif', fontWeight: '700' }}>
                      ✅ الكل
                    </button>
                    <button type="button"
                      onClick={() => setSelectedChambers([])}
                      style={{ padding: '3px 10px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontSize: '11px', fontFamily: 'Cairo,sans-serif', fontWeight: '700' }}>
                      ✕ مسح
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', minHeight: '40px' }}>
                  {chambersLoading ? (
                    <span style={{ color: '#aaa', fontSize: '13px', fontFamily: 'Cairo,sans-serif' }}>⏳ جاري تحميل الغرف...</span>
                  ) : chambers.length === 0 ? (
                    <span style={{ color: '#aaa', fontSize: '13px', fontFamily: 'Cairo,sans-serif' }}>⚠️ ما في غرف متاحة</span>
                  ) : null}
                  {!chambersLoading && chambers.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleChamber(c.id)}
                      style={{
                        padding: '5px 12px', borderRadius: '20px',
                        border: `2px solid ${selectedChambers.includes(c.id) ? '#2C3E6B' : '#dde3ed'}`,
                        background: selectedChambers.includes(c.id) ? '#2C3E6B' : '#fff',
                        color: selectedChambers.includes(c.id) ? '#fff' : '#555',
                        cursor: 'pointer', fontSize: '12px', fontFamily: 'Cairo,sans-serif'
                      }}
                    >
                      {selectedChambers.includes(c.id) ? '✓ ' : ''}{c.name}
                    </button>
                  ))}
                </div>
                {/* Checkbox مشتركة - للـ Admin فقط */}
                {isAdmin && (
                  <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',marginBottom:'12px',fontSize:'13px',fontFamily:'Cairo,sans-serif',color:'#2C3E6B',fontWeight:'600'}}>
                    <input
                      type="checkbox"
                      checked={isShared}
                      onChange={e => setIsShared(e.target.checked)}
                      style={{cursor:'pointer',width:'16px',height:'16px'}}
                    />
                    🌐 مشتركة للجميع (Admin)
                  </label>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleCreateOrg}
                    disabled={saving || !newOrgName.trim() || selectedChambers.length === 0}
                    style={{
                      flex: 1, padding: '10px', background: '#16a34a', color: '#fff',
                      border: 'none', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '13px', fontWeight: '700', fontFamily: 'Cairo,sans-serif',
                      opacity: (!newOrgName.trim() || selectedChambers.length === 0) ? 0.5 : 1
                    }}
                  >
                    {saving ? '⏳ جاري الحفظ...' : '💾 حفظ الجهة'}
                  </button>
                  <button
                    onClick={() => { setShowCreateForm(false); setNewOrgName(''); setSelectedChambers([]) }}
                    style={{
                      padding: '10px 16px', background: '#fee2e2', color: '#dc2626',
                      border: 'none', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '13px', fontWeight: '700', fontFamily: 'Cairo,sans-serif'
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {/* Organizations List */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#aaa' }}>⏳ جاري التحميل...</div>
            ) : organizations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#aaa' }}>
                <p style={{ fontSize: '14px' }}>لا توجد جهات محفوظة</p>
                <p style={{ fontSize: '13px', opacity: 0.7 }}>اضغط "إنشاء جهة جديدة" لإضافة جهة</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {organizations.map(org => {
                  // جلب أسماء الغرف المرتبطة (مع تحويل النوع)
                  const orgChamberNames = org.chambers
                    .map(cId => chambers.find(c => String(c.id) === String(cId)))
                    .filter(c => c)
                    .map(c => c.name)

                  return (
                    <div
                      key={org.id}
                      style={{
                        borderRadius: '10px',
                        background: '#f8f9fa', border: '1.5px solid #dde3ed',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                        <button
                          onClick={() => handleSelectOrganization(org)}
                          style={{
                            flex: 1, textAlign: 'right', background: 'none',
                            border: 'none', cursor: 'pointer', fontFamily: 'Cairo,sans-serif'
                          }}
                        >
                          <div style={{ fontWeight: '700', fontSize: '14px', color: '#2C3E6B' }}>{org.name}</div>
                          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                            {org.chambers?.length || 0} غرفة
                          </div>
                        </button>
                        <button
                          onClick={() => handleDeleteOrg(org.id)}
                          style={{
                            background: '#fee2e2', color: '#dc2626', border: 'none',
                            borderRadius: '6px', padding: '4px 8px', cursor: 'pointer',
                            fontSize: '12px', fontFamily: 'Cairo,sans-serif', marginRight: '8px'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                      {/* عرض الغرف المرتبطة */}
                      {orgChamberNames.length > 0 && (
                        <div style={{
                          padding: '8px 16px 12px',
                          borderTop: '1px solid #eee',
                          display: 'flex', flexWrap: 'wrap', gap: '6px'
                        }}>
                          {orgChamberNames.map((name, i) => (
                            <span key={i} style={{
                              padding: '3px 10px', borderRadius: '20px',
                              background: '#e8edf7', color: '#2C3E6B',
                              fontSize: '11px', fontFamily: 'Cairo,sans-serif', fontWeight: '600'
                            }}>
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Close */}
            <button
              onClick={() => { setShowModal(false); setShowCreateForm(false) }}
              style={{
                width: '100%', padding: '10px', marginTop: '16px',
                background: '#dde3ed', color: '#333', border: 'none',
                borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                fontWeight: '700', fontFamily: 'Cairo,sans-serif'
              }}
            >
              ❌ إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  )
}
