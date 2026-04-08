import { useEffect, useState, useRef } from 'react'
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


function MediaManager({ course, onClose }) {
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('image')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ url:'', title:'', description:'', displayOrder:0 })
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const load = () => {
    setLoading(true)
    api.get(`/courses/${course.id}/media`).then(r => setMedia(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [course.id])

  const imgs = media.filter(m => m.type === 'image')
  const vids = media.filter(m => m.type === 'video')

  const addMedia = async (e) => {
    e.preventDefault(); setMsg('')
    try {
      await api.post(`/courses/${course.id}/media`, { ...form, type: tab })
      setForm({ url:'', title:'', description:'', displayOrder:0 })
      setAdding(false); load()
    } catch(err) { setMsg(err.response?.data?.message || 'خطأ') }
  }

  const delMedia = async (id) => {
    if (!confirm('حذف؟')) return
    await api.delete(`/courses/${course.id}/media/${id}`)
    load()
  }

  const uploadImage = async (file) => {
    if (!file) return
    setUploading(true)
    const fd = new FormData(); fd.append('file', file); fd.append('folder', 'courses')
    try {
      const r = await api.post('/upload', fd, { headers: { 'Content-Type':'multipart/form-data' } })
      setForm(p => ({ ...p, url: r.data.url }))
    } catch { setMsg('فشل رفع الصورة') }
    setUploading(false)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:'#fff',borderRadius:20,padding:'24px',width:'100%',maxWidth:680,maxHeight:'90vh',overflowY:'auto',direction:'rtl',fontFamily:'Cairo,sans-serif'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div>
            <h2 style={{fontSize:17,fontWeight:800,color:'#2C3E6B',margin:0}}>🖼️ صور وفيديوهات الدورة</h2>
            <p style={{fontSize:12,color:'#64748b',margin:'4px 0 0'}}>{course.title}</p>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#94a3b8'}}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {[{k:'image',l:'🖼️ الصور',c:imgs.length},{k:'video',l:'🎥 الفيديوهات',c:vids.length}].map(t=>(
            <button key={t.k} onClick={()=>{setTab(t.k);setAdding(false)}} style={{padding:'7px 16px',borderRadius:20,border:'1.5px solid',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12,borderColor:tab===t.k?'#2C3E6B':'#e5e7eb',background:tab===t.k?'#2C3E6B':'#fff',color:tab===t.k?'#fff':'#374151'}}>
              {t.l} ({t.c})
            </button>
          ))}
          <button onClick={()=>setAdding(p=>!p)} style={{marginRight:'auto',padding:'7px 16px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',borderRadius:20,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12}}>
            ➕ {tab==='image'?'إضافة صورة':'إضافة فيديو'}
          </button>
        </div>

        {/* Add Form */}
        {adding && (
          <form onSubmit={addMedia} style={{background:'#f8fafc',borderRadius:14,padding:16,marginBottom:16}}>
            {tab === 'image' ? (
              <div style={{marginBottom:12}}>
                <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:4}}>رفع صورة أو إدخال رابط</label>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <input type="file" accept="image/*" ref={fileRef} onChange={e=>uploadImage(e.target.files[0])} style={{display:'none'}} />
                  <button type="button" onClick={()=>fileRef.current?.click()} disabled={uploading} style={{padding:'8px 14px',background:'#e0e7ff',color:'#4338ca',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12}}>
                    {uploading ? '⏳ جارٍ الرفع...' : '📁 رفع صورة'}
                  </button>
                  <span style={{color:'#94a3b8',fontSize:12}}>أو</span>
                  <input value={form.url} onChange={e=>setForm(p=>({...p,url:e.target.value}))} placeholder="رابط الصورة (URL)" required
                    style={{flex:1,padding:'8px 12px',border:'1.5px solid #e5e7eb',borderRadius:8,fontSize:12,fontFamily:'Cairo,sans-serif'}} />
                </div>
                {form.url && <img src={form.url} alt="" style={{marginTop:8,height:80,borderRadius:8,objectFit:'cover'}} onError={e=>e.target.style.display='none'} />}
              </div>
            ) : (
              <div style={{marginBottom:12}}>
                <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:4}}>رابط YouTube *</label>
                <input value={form.url} onChange={e=>setForm(p=>({...p,url:e.target.value}))} placeholder="https://www.youtube.com/watch?v=..." required
                  style={{width:'100%',padding:'8px 12px',border:'1.5px solid #e5e7eb',borderRadius:8,fontSize:12,fontFamily:'Cairo,sans-serif',boxSizing:'border-box'}} />
              </div>
            )}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:4}}>العنوان</label>
                <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}
                  style={{width:'100%',padding:'8px 12px',border:'1.5px solid #e5e7eb',borderRadius:8,fontSize:12,fontFamily:'Cairo,sans-serif',boxSizing:'border-box'}} />
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:4}}>الترتيب</label>
                <input type="number" value={form.displayOrder} onChange={e=>setForm(p=>({...p,displayOrder:+e.target.value}))}
                  style={{width:'100%',padding:'8px 12px',border:'1.5px solid #e5e7eb',borderRadius:8,fontSize:12,fontFamily:'Cairo,sans-serif',boxSizing:'border-box'}} />
              </div>
            </div>
            {msg && <div style={{color:'#ef4444',fontSize:12,marginTop:8}}>{msg}</div>}
            <div style={{display:'flex',gap:8,marginTop:12}}>
              <button type="submit" style={{padding:'8px 20px',background:'#2C3E6B',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12}}>💾 حفظ</button>
              <button type="button" onClick={()=>setAdding(false)} style={{padding:'8px 16px',background:'#f1f5f9',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12}}>إلغاء</button>
            </div>
          </form>
        )}

        {loading ? <div style={{textAlign:'center',padding:30,color:'#94a3b8'}}>⏳ جارٍ التحميل...</div> : (
          <div>
            {tab === 'image' && (
              imgs.length === 0 ? <div style={{textAlign:'center',padding:30,color:'#94a3b8',fontSize:13}}>لا توجد صور بعد</div> :
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10}}>
                {imgs.map(img => (
                  <div key={img.id} style={{position:'relative',borderRadius:12,overflow:'hidden',aspectRatio:'4/3',background:'#f1f5f9'}}>
                    <img src={img.url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                    <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'6px 8px',background:'linear-gradient(transparent,rgba(0,0,0,0.75))',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{color:'#fff',fontSize:10,fontWeight:600}}>{img.title||''}</span>
                      <button onClick={()=>delMedia(img.id)} style={{background:'rgba(239,68,68,0.8)',border:'none',color:'#fff',borderRadius:6,padding:'2px 6px',cursor:'pointer',fontSize:10}}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {tab === 'video' && (
              vids.length === 0 ? <div style={{textAlign:'center',padding:30,color:'#94a3b8',fontSize:13}}>لا توجد فيديوهات بعد</div> :
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {vids.map(vid => {
                  const ytId = vid.url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/)?.[1]
                  return (
                    <div key={vid.id} style={{display:'flex',gap:12,alignItems:'center',background:'#f8fafc',borderRadius:12,padding:10}}>
                      {ytId && <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" style={{width:100,height:60,objectFit:'cover',borderRadius:8,flexShrink:0}} />}
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:13,color:'#1e293b'}}>{vid.title||'بدون عنوان'}</div>
                        <div style={{fontSize:11,color:'#64748b',wordBreak:'break-all'}}>{vid.url}</div>
                      </div>
                      <button onClick={()=>delMedia(vid.id)} style={{background:'#fee2e2',border:'none',color:'#ef4444',borderRadius:8,padding:'6px 10px',cursor:'pointer',fontSize:12}}>🗑️</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
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
  const [mediaModal, setMediaModal] = useState(null)

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
      {mediaModal && <MediaManager course={mediaModal} onClose={() => setMediaModal(null)} />}

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
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <button onClick={() => setMediaModal(c)} style={{flex:1,padding:'8px',background:'#f0fdf4',color:'#166534',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12}}>🖼️ الصور والفيديو</button>
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
