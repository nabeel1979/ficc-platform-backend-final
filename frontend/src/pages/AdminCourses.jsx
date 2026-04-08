import { useEffect, useState } from 'react'
import api from '../lib/api'

const STATUS = { upcoming:'📅 قادمة', ongoing:'🔴 جارية', completed:'✅ منتهية' }
const STATUS_COLOR = { upcoming:'#10b981', ongoing:'#ef4444', completed:'#6b7280' }

function CourseForm({ item, onSave, onClose }) {
  const isEdit = !!item?.id
  const [form, setForm] = useState({
    title: item?.title || '',
    description: item?.description || '',
    speaker: item?.speaker || '',
    speakerTitle: item?.speakerTitle || '',
    location: item?.location || '',
    startDate: item?.startDate ? item.startDate.split('T')[0] : '',
    endDate: item?.endDate ? item.endDate.split('T')[0] : '',
    maxParticipants: item?.maxParticipants || 50,
    isFree: item?.isFree !== false,
    price: item?.price || 0,
    category: item?.category || '',
    status: item?.status || 'upcoming',
    isActive: item?.isActive !== false,
  })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const set = (k, v) => setForm(p => ({...p, [k]: v}))

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setMsg('')
    try {
      if (isEdit) await api.put(`/courses/${item.id}`, form)
      else await api.post('/courses', form)
      onSave()
    } catch(err) {
      setMsg(err.response?.data?.message || 'حدث خطأ')
    } finally { setLoading(false) }
  }

  const inp = (label, k, type='text', required=false) => (
    <div style={{marginBottom:14}}>
      <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:4}}>{label}{required&&<span style={{color:'#ef4444'}}>*</span>}</label>
      <input type={type} required={required} value={form[k]} onChange={e => set(k, type==='number' ? +e.target.value : e.target.value)}
        style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e5e7eb',borderRadius:10,fontSize:13,fontFamily:'Cairo,sans-serif',outline:'none',boxSizing:'border-box'}} />
    </div>
  )

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:'#fff',borderRadius:20,padding:'28px 24px',width:'100%',maxWidth:580,maxHeight:'90vh',overflowY:'auto',direction:'rtl',fontFamily:'Cairo,sans-serif'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{fontSize:18,fontWeight:800,color:'#2C3E6B'}}>{isEdit ? '✏️ تعديل دورة' : '➕ إضافة دورة جديدة'}</h2>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#94a3b8'}}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div style={{gridColumn:'1/-1'}}>{inp('عنوان الدورة *','title','text',true)}</div>
            {inp('المحاضر','speaker')}
            {inp('لقب المحاضر','speakerTitle')}
            {inp('تاريخ البدء *','startDate','date',true)}
            {inp('تاريخ الانتهاء *','endDate','date',true)}
            {inp('الموقع','location')}
            {inp('الفئة','category')}
            {inp('عدد المشاركين','maxParticipants','number')}
          </div>

          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:4}}>الوصف</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)}
              style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e5e7eb',borderRadius:10,fontSize:13,fontFamily:'Cairo,sans-serif',outline:'none',boxSizing:'border-box',height:80,resize:'vertical'}} />
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:4}}>الحالة</label>
              <select value={form.status} onChange={e=>set('status',e.target.value)} style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e5e7eb',borderRadius:10,fontSize:13,fontFamily:'Cairo,sans-serif',outline:'none'}}>
                <option value="upcoming">📅 قادمة</option>
                <option value="ongoing">🔴 جارية</option>
                <option value="completed">✅ منتهية</option>
              </select>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10,justifyContent:'center',marginTop:20}}>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13}}>
                <input type="checkbox" checked={form.isFree} onChange={e=>set('isFree',e.target.checked)} />
                <span>مجانية</span>
              </label>
              {!form.isFree && <div>{inp('السعر (د.ع)','price','number')}</div>}
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13}}>
                <input type="checkbox" checked={form.isActive} onChange={e=>set('isActive',e.target.checked)} />
                <span>نشطة</span>
              </label>
            </div>
          </div>

          {msg && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'8px 14px',color:'#ef4444',fontSize:13,marginBottom:12}}>{msg}</div>}
          <div style={{display:'flex',gap:10}}>
            <button type="submit" disabled={loading} style={{flex:1,padding:'12px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',borderRadius:12,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:800,fontSize:14}}>
              {loading ? '⏳ جارٍ الحفظ...' : '💾 حفظ'}
            </button>
            <button type="button" onClick={onClose} style={{padding:'12px 20px',background:'#f1f5f9',border:'none',borderRadius:12,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700}}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ApplicationsModal({ course, onClose }) {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/courses/${course.id}/applications`).then(r => setApps(r.data)).finally(() => setLoading(false))
  }, [course.id])

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:'#fff',borderRadius:20,padding:'28px 24px',width:'100%',maxWidth:700,maxHeight:'90vh',overflowY:'auto',direction:'rtl',fontFamily:'Cairo,sans-serif'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div>
            <h2 style={{fontSize:17,fontWeight:800,color:'#2C3E6B'}}>📋 طلبات التسجيل</h2>
            <p style={{fontSize:12,color:'#64748b',marginTop:2}}>{course.title}</p>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#94a3b8'}}>✕</button>
        </div>
        {loading ? (
          <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>⏳ جارٍ التحميل...</div>
        ) : apps.length === 0 ? (
          <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>لا توجد طلبات بعد</div>
        ) : (
          <>
            <div style={{marginBottom:12,fontSize:13,color:'#64748b',fontWeight:600}}>إجمالي الطلبات: {apps.length}</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#2C3E6B',color:'#fff'}}>
                  {['الاسم','الهاتف','الإيميل','الشركة','التاريخ'].map(h=>(
                    <th key={h} style={{padding:'10px 12px',textAlign:'right',fontWeight:700}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps.map((a,i)=>(
                  <tr key={a.id} style={{borderBottom:'1px solid #f1f5f9',background:i%2===0?'#fff':'#fafbfc'}}>
                    <td style={{padding:'10px 12px',fontWeight:700}}>{a.fullName}</td>
                    <td style={{padding:'10px 12px'}}><a href={`tel:${a.phone}`} style={{color:'#2C3E6B',fontWeight:700}}>{a.phone}</a></td>
                    <td style={{padding:'10px 12px',color:'#64748b'}}>{a.email||'—'}</td>
                    <td style={{padding:'10px 12px'}}>{a.company||'—'}</td>
                    <td style={{padding:'10px 12px',color:'#94a3b8',fontSize:11}}>{new Date(a.createdAt).toLocaleDateString('ar-IQ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | course object
  const [appsModal, setAppsModal] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/courses').then(r => setCourses(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const del = async (id) => {
    if (!confirm('هل تريد حذف هذه الدورة؟')) return
    await api.delete(`/courses/${id}`)
    load()
  }

  return (
    <div style={{direction:'rtl',fontFamily:'Cairo,sans-serif'}}>
      {modal && <CourseForm item={modal === 'new' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />}
      {appsModal && <ApplicationsModal course={appsModal} onClose={() => setAppsModal(null)} />}

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h2 style={{fontSize:20,fontWeight:800,color:'#2C3E6B'}}>🎓 الدورات الريادية</h2>
        <button onClick={() => setModal('new')} style={{padding:'10px 20px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',borderRadius:12,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:13}}>
          ➕ إضافة دورة
        </button>
      </div>

      {loading ? (
        <div style={{textAlign:'center',padding:60,color:'#94a3b8'}}>⏳ جارٍ التحميل...</div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
          {courses.map(c => (
            <div key={c.id} style={{background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 2px 10px rgba(44,62,107,0.07)',border:'1px solid #e5e7eb'}}>
              <div style={{background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',padding:'16px',position:'relative'}}>
                <span style={{position:'absolute',top:10,left:10,padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:800,background:'rgba(255,255,255,0.2)',color:'#fff'}}>
                  {STATUS[c.status]||c.status}
                </span>
                <h3 style={{color:'#fff',fontSize:14,fontWeight:800,marginTop:20,lineHeight:1.4}}>{c.title}</h3>
                {c.speaker && <div style={{color:'rgba(255,255,255,0.75)',fontSize:11,marginTop:4}}>👤 {c.speaker}</div>}
              </div>
              <div style={{padding:'14px 16px'}}>
                <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:12,color:'#64748b',marginBottom:12}}>
                  <span>📅 {new Date(c.startDate).toLocaleDateString('ar-IQ')} — {new Date(c.endDate).toLocaleDateString('ar-IQ')}</span>
                  {c.location && <span>📍 {c.location}</span>}
                  <span>👥 {c.currentParticipants} / {c.maxParticipants} مشارك</span>
                  <span style={{fontWeight:700,color:c.isFree?'#10b981':'#2C3E6B'}}>💰 {c.isFree ? 'مجانية' : `${c.price?.toLocaleString()} د.ع`}</span>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={() => setAppsModal(c)} style={{flex:1,padding:'8px',background:'#e0e7ff',color:'#4338ca',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12}}>
                    📋 الطلبات ({c.currentParticipants})
                  </button>
                  <button onClick={() => setModal(c)} style={{padding:'8px 14px',background:'#FFC72C20',color:'#92400e',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12}}>✏️</button>
                  <button onClick={() => del(c.id)} style={{padding:'8px 14px',background:'#fee2e2',color:'#ef4444',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12}}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
