import React, { useState, useEffect } from 'react'
import api from '../../lib/api'

export default function PermissionGrid({ userId, initialPermissions }) {
  const [organizations, setOrganizations] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [permissions, setPermissions] = useState({})
  const [selectedOrgId, setSelectedOrgId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch data on mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [orgRes, menuRes, permRes] = await Promise.all([
        api.get('/permissions/organizational-structures'),
        api.get('/permissions/menu-items'),
        api.get(`/permissions/user/${userId}`)
      ])

      setOrganizations(orgRes.data.data || [])
      setMenuItems(menuRes.data.data || [])
      
      if (permRes.data.data) {
        setSelectedOrgId(permRes.data.data.organizationalStructureId)
        // Convert permissions to object
        const perms = {}
        Object.entries(permRes.data.data.permissions).forEach(([menuId, perm]) => {
          perms[menuId] = {
            create: perm.canCreate,
            read: perm.canRead,
            update: perm.canUpdate,
            delete: perm.canDelete
          }
        })
        setPermissions(perms)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Select all pages
  const selectAllPages = (checked) => {
    const updated = {}
    menuItems.forEach(menu => {
      updated[menu.id] = {
        create: checked,
        read: checked,
        update: checked,
        delete: checked
      }
    })
    setPermissions(updated)
  }

  // Select all permissions for one page
  const selectPageAll = (menuId, checked) => {
    setPermissions({
      ...permissions,
      [menuId]: {
        create: checked,
        read: checked,
        update: checked,
        delete: checked
      }
    })
  }

  // Toggle single permission
  const togglePermission = (menuId, action) => {
    setPermissions({
      ...permissions,
      [menuId]: {
        ...permissions[menuId] || { create: false, read: false, update: false, delete: false },
        [action]: !permissions[menuId]?.[action]
      }
    })
  }

  // Check if all permissions are selected for a page
  const isPageAllSelected = (menuId) => {
    const perm = permissions[menuId]
    return perm && perm.create && perm.read && perm.update && perm.delete
  }

  // Check if all pages are selected
  const isAllSelected = menuItems.every(menu => isPageAllSelected(menu.id))

  // Save permissions
  const handleSave = async () => {
    try {
      setSaving(true)
      const menuPermissions = {}
      Object.entries(permissions).forEach(([menuId, flags]) => {
        if (flags.create || flags.read || flags.update || flags.delete) {
          menuPermissions[menuId] = flags
        }
      })

      await api.post('/permissions/assign', {
        userId,
        organizationalStructureId: selectedOrgId,
        menuPermissions
      })

      alert('تم حفظ الصلاحيات بنجاح')
    } catch (error) {
      console.error('Error saving permissions:', error)
      alert('خطأ في حفظ الصلاحيات')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Organizational Structure Selection */}
      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          الهيكل التنظيمي
        </label>
        <select
          value={selectedOrgId || ''}
          onChange={e => setSelectedOrgId(e.target.value ? parseInt(e.target.value) : null)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '14px'
          }}
        >
          <option value=''>-- اختر الهيكل التنظيمي --</option>
          {organizations.map(org => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      {/* Select All Pages */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        borderLeft: '4px solid #2C3E6B'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
          <input
            type='checkbox'
            checked={isAllSelected}
            onChange={e => selectAllPages(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          اختيار جميع الصفحات
        </label>
      </div>

      {/* Permissions Grid */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#2C3E6B', color: '#fff' }}>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>الصفحة</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>الكل</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>إضافة</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>قراءة</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>تعديل</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>حذف</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map(menu => (
              <tr key={menu.id} style={{
                borderBottom: '1px solid #eee',
                backgroundColor: permissions[menu.id]?.create || permissions[menu.id]?.read || permissions[menu.id]?.update || permissions[menu.id]?.delete ? '#f0f7ff' : '#fff'
              }}>
                <td style={{ padding: '12px', fontWeight: '500' }}>
                  <span style={{ marginRight: '8px' }}>{menu.icon}</span>
                  {menu.name}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <input
                    type='checkbox'
                    checked={isPageAllSelected(menu.id)}
                    onChange={e => selectPageAll(menu.id, e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </td>
                {['create', 'read', 'update', 'delete'].map(action => (
                  <td key={action} style={{ padding: '12px', textAlign: 'center' }}>
                    <input
                      type='checkbox'
                      checked={permissions[menu.id]?.[action] || false}
                      onChange={() => togglePermission(menu.id, action)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 30px',
            backgroundColor: '#27ae60',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? 'جاري الحفظ...' : '💾 حفظ الصلاحيات'}
        </button>
      </div>
    </div>
  )
}
