import { useEffect, useState } from 'react'
import api from '../lib/api'

const API = import.meta.env.VITE_API_URL || '/api'
const h = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
const C = { primary: '#2C3E6B', gold: '#FFC72C', bg: '#F0F2F8' }

const CATEGORIES = [
  { key: 'trader_classification', label: '🏢 تصنيف التاجر', section: 'دليل التجار' },
  { key: 'trader_sector',        label: '🏭 القطاع',         section: 'دليل التجار' },
  { key: 'trader_business_type', label: '📦 نوع النشاط',    section: 'دليل التجار' },
  { key: 'news_type',            label: '📰 تصنيف الخبر',    section: 'الأخبار' },
  { key: 'news_category',        label: '🗂️ فئة الخبر',      section: 'الأخبار' },
]

export default function SystemConstants() {
  const [selected, setSelected] = useState(CATEGORIES[0].key)
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ value: '', label: '', sortOrder: 0, isActive: true })
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () =>
    api.get(`${API}/constants`, h()).then(r =>
      setItems(r.data.filter(i => i.category === selected))
    )

  useEffect(() => { load() }, [selected])

  const save = async e => {
    e.preventDefault(); setMsg('')
    try {
      if (editing) {
        await api.put(`${API}/constants/${editing}`, { ...form, category: selected }, h())
      } else {
        await api.post(`${API}/constants`, { ...form, category: selected }, h())
      }
      setShowForm(false); setEditing(null)
      setForm({ value: '', label: '', sortOrder: 0, isActive: true })
      load()
    } catch(e) { setMsg(e.response?.data?.message || 'خطأ') }
  }

  const del = async id => {
    if (!confirm('حذف هذا العنصر؟')) return
    await api.delete(`${API}/constants/${id}`, h()); load()
  }

  const startEdit = item => {
    setForm({ value: item.value, label: item.label||'', sortOrder: item.sortOrder, isActive: item.isActive })
    setEditing(item.id); setShowForm(true)
  }

  const cat = CATEGORIES.find(c => c.key === selected)
  const sections = [...new Set(CATEGORIES.map(c => c.section))]

  return (
    <div style={{ padding: 32, fontFamily: 'Cairo,sans-serif', direction: 'rtl' }}>
      <h2 style={{ margin: '0 0 24px', color: C.primary, fontSize: 22, fontWeight: 900 }}>
        ⚙️ ثوابت النظام
      </h2>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Sidebar */}
        <div style={{ width: 220, flexShrink: 0 }}>
          {sections.map(sec => (
            <div key={sec} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#888', padding: '4px 12px', textTransform: 'uppercase' }}>{sec}</div>
              {CATEGORIES.filter(c => c.section === sec).map(c => (
                <div key={c.key} onClick={() => { setSelected(c.key); setShowForm(false) }}
                  style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                    background: selected === c.key ? C.primary : '#fff',
                    color: selected === c.key ? '#fff' : '#333',
                    fontWeight: selected === c.key ? 700 : 400,
                    fontSize: 13,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  {c.label}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: C.primary, fontSize: 17 }}>{cat?.label}</h3>
            <button onClick={() => { setShowForm(true); setEditing(null); setForm({ value: '', label: '', sortOrder: 0, isActive: true }) }}
              style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontWeight: 700 }}>
              + إضافة
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <form onSubmit={save}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12 }}>
                  <div>
                    <label style={lbl}>القيمة (Value)</label>
                    <input style={inp} value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required placeholder="مثال: retail" />
                  </div>
                  <div>
                    <label style={lbl}>الاسم المعروض (Label)</label>
                    <input style={inp} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="مثال: تجارة مفرد" />
                  </div>
                  <div>
                    <label style={lbl}>الترتيب</label>
                    <input style={inp} type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: +e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} id="isActive" />
                  <label htmlFor="isActive" style={{ fontSize: 13 }}>نشط</label>
                </div>
                {msg && <p style={{ color: 'red', fontSize: 12, margin: '8px 0' }}>{msg}</p>}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button type="submit" style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontWeight: 700 }}>
                    {editing ? 'تحديث' : 'حفظ'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditing(null) }}
                    style={{ background: '#f0f0f0', color: '#333', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 60px 60px 100px', padding: '10px 16px', background: '#f8f8f8', fontSize: 12, fontWeight: 700, color: '#666', borderBottom: '2px solid #eee' }}>
              <span>#</span><span>القيمة</span><span>الاسم المعروض</span><span>الترتيب</span><span>الحالة</span><span>إجراءات</span>
            </div>
            {items.length === 0 ?
              <p style={{ textAlign: 'center', padding: 40, color: '#999' }}>لا توجد عناصر — اضغط "+ إضافة"</p> :
              items.map((item, i) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 60px 60px 100px', padding: '11px 16px', borderBottom: '1px solid #f5f5f5', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: '#aaa' }}>{i + 1}</span>
                  <span style={{ fontWeight: 600, color: '#222', fontFamily: 'monospace', direction: 'ltr', fontSize: 12 }}>{item.value}</span>
                  <span style={{ color: '#444' }}>{item.label || '—'}</span>
                  <span style={{ color: '#888', textAlign: 'center' }}>{item.sortOrder}</span>
                  <span style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: item.isActive ? '#d1fae5' : '#fee2e2', color: item.isActive ? '#065f46' : '#991b1b' }}>
                      {item.isActive ? 'نشط' : 'موقوف'}
                    </span>
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => startEdit(item)} style={ab('#7c3aed')}>✏️</button>
                    <button onClick={() => del(item.id)} style={ab('#dc2626')}>🗑️</button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}

const lbl = { display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 4 }
const inp = { width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontFamily: 'Cairo,sans-serif', boxSizing: 'border-box', fontSize: 13 }
const ab = (color) => ({ background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 13 })
