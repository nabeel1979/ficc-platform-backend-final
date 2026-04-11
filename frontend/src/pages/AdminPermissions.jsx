import React, { useState, useEffect } from 'react'
import PermissionGrid from '../components/Admin/PermissionGrid'
import api from '../lib/api'

export default function AdminPermissions() {
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users')
      setUsers(response.data.data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '30px', color: '#2C3E6B' }}>⚙️ إدارة صلاحيات المستخدمين</h1>

      {/* User Selection */}
      <div style={{
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#2C3E6B' }}>اختيار المستخدم</h3>
        
        <select
          value={selectedUserId || ''}
          onChange={e => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '2px solid #2C3E6B',
            fontSize: '16px',
            fontWeight: '500',
            color: '#2C3E6B'
          }}
        >
          <option value=''>-- اختر المستخدم --</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.fullName || user.username} ({user.role})
            </option>
          ))}
        </select>
      </div>

      {/* Permission Grid */}
      {selectedUserId ? (
        <PermissionGrid userId={selectedUserId} />
      ) : (
        <div style={{
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#666'
        }}>
          <p style={{ fontSize: '16px' }}>👈 اختر مستخدماً لتعديل صلاحياته</p>
        </div>
      )}
    </div>
  )
}
