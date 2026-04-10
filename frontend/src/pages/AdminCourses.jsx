import { useEffect, useState, useRef } from 'react'
import api from '../lib/api'

const STATUS = { upcoming:'📅 قادمة', ongoing:'🔴 جارية', completed:'✅ منتهية' }

function CourseForm({ item, onSave, onClose }) {
  const isEdit = !!item?.id
  const [form, setForm] = useState({
    title: item?.title || '', description: item?.description || '',
    speaker: item?.speaker || '', speakerTitle: item?.speakerTitle || '', speakerImage: item?.speakerImage || '',
    workshopType: item?.workshopType || 'field',
    speakers: item?.speakersJson ? JSON.parse(item.speakersJson) : [{name: item?.speaker||'', title: item?.speakerTitle||'', image: item?.speakerImage||''}],
    location: item?.location || '',
    startDate: item?.startDate ? item.startDate.split('T')[0] : '',
    endDate: item?.endDate ? item.endDate.split('T')[0] : '',
    maxParticipants: item?.maxParticipants || 50,
    isFree: item?.isFree !== false, price: item?.price || 0,
    category: item?.category || '', status: item?.status || 'upcoming', isActive: item?.isActive !== false,
  })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const set = (k, v) => setForm(p => ({...p, [k]: v}))

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setMsg('')
    try {
      const validSpeakers = form.speakers.filter(s => s.name.trim())
      const payload = {
        ...form,
        speaker: validSpeakers[0]?.name || '',
        speakerTitle: validSpeakers[0]?.title || '',
        speakerImage: validSpeakers[0]?.image || '',
        speakersJson: JSON.stringify(validSpeakers)
      }
      if (isEdit) await api.put(`/courses/${item.id}`, payload)
      else await api.post('/courses', payload)
      onSave()
    } catch(err) { setMsg(err.response?.data?.message || 'حدث خطأ') }
    finally { setLoading(false) }
  }

  const inp = (label, k, type='text', req=false) => (
    <div style={{marginBottom:14}}>
      <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:4}}>{label}{req&&<span style={{color:'#ef4444'}}>*</span>}</label>
      <input type={type} required={req} value={form[k]} onChange={e => set(k, type==='number' ? +e.target.value : e.target.value)}
        style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e5e7eb',borderRadius:10,fontSize:13,fontFamily:'Cairo,sans-serif',outline:'none',boxSizing:'border-box'}} />
    </div>
  )

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:'#fff',borderRadius:20,padding:'28px 24px',width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto',direction:'rtl',fontFamily:'Cairo,sans-serif'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{fontSize:18,fontWeight:800,color:'#2C3E6B'}}>{isEdit ? '✏️ تعديل دورة' : '➕ إضافة دورة'}</h2>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#94a3b8'}}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div style={{gridColumn:'1/-1'}}>{inp('عنوان الدورة *','title','text',true)}</div>
            {/* المحاضرون — حتى 4 */}
            <div style={{gridColumn:'1/-1'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <label style={{fontSize:12,fontWeight:700,color:'#374151'}}>المحاضرون ({form.speakers.length}/4)</label>
                {form.speakers.length < 4 && (
                  <button type="button" onClick={() => set('speakers', [...form.speakers, {name:'',title:'',image:''}])}
                    style={{padding:'4px 12px',background:'#e0e7ff',color:'#4338ca',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>
                    ➕ إضافة محاضر
                  </button>
                )}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {form.speakers.map((sp, idx) => (
                  <div key={idx} style={{background:'#f8fafc',borderRadius:12,padding:12,border:'1.5px solid #e5e7eb'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <span style={{fontSize:11,fontWeight:700,color:'#64748b'}}>محاضر {idx+1}</span>
                      {idx > 0 && (
                        <button type="button" onClick={() => set('speakers', form.speakers.filter((_,i)=>i!==idx))}
                          style={{background:'#fee2e2',border:'none',color:'#ef4444',borderRadius:6,padding:'2px 8px',cursor:'pointer',fontSize:11}}>✕ حذف</button>
                      )}
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                      <input value={sp.name} onChange={e => set('speakers', form.speakers.map((s,i)=>i===idx?{...s,name:e.target.value}:s))}
                        placeholder="اسم المحاضر *"
                        style={{padding:'8px 12px',border:'1.5px solid #e5e7eb',borderRadius:8,fontSize:12,fontFamily:'Cairo,sans-serif'}} />
                      <input value={sp.title} onChange={e => set('speakers', form.speakers.map((s,i)=>i===idx?{...s,title:e.target.value}:s))}
                        placeholder="اللقب / التخصص"
                        style={{padding:'8px 12px',border:'1.5px solid #e5e7eb',borderRadius:8,fontSize:12,fontFamily:'Cairo,sans-serif'}} />
                    </div>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <input type="file" accept="image/*" id={`spImg_${idx}`} style={{display:'none'}}
                        onChange={async e => {
                          const file = e.target.files[0]; if (!file) return
                          const fd = new FormData(); fd.append('file', file); fd.append('folder', 'speakers')
                          try {
                            const r = await api.post('/upload', fd, { headers: {'Content-Type':'multipart/form-data'} })
                            set('speakers', form.speakers.map((s,i)=>i===idx?{...s,image:r.data.url}:s))
                          } catch { alert('فشل رفع الصورة') }
                        }} />
                      <button type="button" onClick={() => document.getElementById(`spImg_${idx}`).click()}
                        style={{padding:'6px 12px',background:'#e0e7ff',color:'#4338ca',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>
                        📁 صورة
                      </button>
                      <input value={sp.image} onChange={e => set('speakers', form.speakers.map((s,i)=>i===idx?{...s,image:e.target.value}:s))}
                        placeholder="أو رابط الصورة"
                        style={{flex:1,padding:'6px 10px',border:'1.5px solid #e5e7eb',borderRadius:8,fontSize:11,fontFamily:'Cairo,sans-serif'}} />
                      {sp.image && <img src={sp.image} alt="" style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',border:'2px solid #e5e7eb',flexShrink:0}} onError={e=>e.target.style.display='none'} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {inp('تاريخ البدء *','startDate','date',true)} {inp('تاريخ الانتهاء *','endDate','date',true)}
            {inp('الموقع','location')} {inp('الفئة','category')}
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:4}}>نوع الورشة</label>
              <div style={{display:'flex',gap:8}}>
                {[{v:'field',l:'🏢 ميدانية'},{v:'online',l:'💻 إلكترونية'}].map(t => (
                  <label key={t.v} style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',padding:'8px 14px',border:`1.5px solid ${form.workshopType===t.v?'#2C3E6B':'#e5e7eb'}`,borderRadius:8,background:form.workshopType===t.v?'#eef2ff':'#fff',fontSize:12,fontWeight:700,color:form.workshopType===t.v?'#2C3E6B':'#6b7280',flex:1,justifyContent:'center'}}>
                    <input type="radio" name="workshopType" value={t.v} checked={form.workshopType===t.v} onChange={()=>set('workshopType',t.v)} style={{display:'none'}} />
                    {t.l}
                  </label>
                ))}
              </div>
            </div>
            {inp('عدد المشاركين','maxParticipants','number')}
          </div>
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:4}}>الوصف</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={3}
              style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e5e7eb',borderRadius:10,fontSize:13,fontFamily:'Cairo,sans-serif',outline:'none',boxSizing:'border-box',resize:'vertical'}} />
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
                <input type="checkbox" checked={form.isFree} onChange={e=>set('isFree',e.target.checked)} />مجانية
              </label>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13}}>
                <input type="checkbox" checked={form.isActive} onChange={e=>set('isActive',e.target.checked)} />نشطة
              </label>
            </div>
          </div>
          {!form.isFree && inp('السعر (د.ع)','price','number')}
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
  useEffect(() => { api.get(`/courses/${course.id}/applications`).then(r => setApps(r.data)).finally(() => setLoading(false)) }, [course.id])
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:'#fff',borderRadius:20,padding:'24px',width:'100%',maxWidth:700,maxHeight:'90vh',overflowY:'auto',direction:'rtl',fontFamily:'Cairo,sans-serif'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div>
            <h2 style={{fontSize:17,fontWeight:800,color:'#2C3E6B',margin:0}}>📋 طلبات التسجيل</h2>
            <p style={{fontSize:12,color:'#64748b',margin:'4px 0 0'}}>{course.title}</p>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#94a3b8'}}>✕</button>
        </div>
        {loading ? <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>⏳ جارٍ التحميل...</div>
        : apps.length === 0 ? <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>لا توجد طلبات بعد</div>
        : <>
          <div style={{marginBottom:12,fontSize:13,color:'#64748b',fontWeight:600}}>إجمالي الطلبات: {apps.length}</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:500}}>
              <thead><tr style={{background:'#2C3E6B',color:'#fff'}}>
                {['الاسم','الهاتف','الإيميل','الشركة','التاريخ'].map(h=><th key={h} style={{padding:'10px 12px',textAlign:'right',fontWeight:700}}>{h}</th>)}
              </tr></thead>
              <tbody>{apps.map((a,i)=>(
                <tr key={a.id} style={{borderBottom:'1px solid #f1f5f9',background:i%2===0?'#fff':'#fafbfc'}}>
                  <td style={{padding:'10px 12px',fontWeight:700}}>{a.fullName}</td>
                  <td style={{padding:'10px 12px'}}><a href={`tel:${a.phone}`} style={{color:'#2C3E6B',fontWeight:700}}>{a.phone}</a></td>
                  <td style={{padding:'10px 12px',color:'#64748b'}}>{a.email||'—'}</td>
                  <td style={{padding:'10px 12px'}}>{a.company||'—'}</td>
                  <td style={{padding:'10px 12px',color:'#94a3b8',fontSize:11}}>{new Date(a.createdAt).toLocaleDateString('ar-IQ')}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>}
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
  const [uploadProgress, setUploadProgress] = useState([]) // [{name, status: 'pending'|'uploading'|'done'|'error'}]
  const [dragOverId, setDragOverId] = useState(null)
  const [localImgs, setLocalImgs] = useState([])
  const [editingVid, setEditingVid] = useState(null) // {id, title}
  const dragItem = useRef(null)
  const fileRef = useRef(null)
  const multiFileRef = useRef(null)

  const load = () => { setLoading(true); api.get(`/courses/${course.id}/media`).then(r => { setMedia(r.data||[]); setLocalImgs(r.data?.filter(m=>m.type==='image')||[]) }).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [course.id])

  const imgs = localImgs
  const vids = media.filter(m => m.type === 'video')

  const addMedia = async (e) => {
    e.preventDefault(); setMsg('')
    // تحقق من الحد الأقصى
    if (tab === 'video' && vids.length >= 10) { setMsg('⚠️ وصلت الحد الأقصى (10 فيديوهات)'); return }
    if (tab === 'image' && imgs.length >= 10) { setMsg('⚠️ وصلت الحد الأقصى (10 صور)'); return }
    try {
      await api.post(`/courses/${course.id}/media`, { ...form, type: tab })
      setForm({ url:'', title:'', description:'', displayOrder:0 }); setAdding(false); load()
    } catch(err) { setMsg(err.response?.data?.message || 'خطأ') }
  }

  const delMedia = async (id) => {
    if (!confirm('حذف؟')) return
    await api.delete(`/courses/${course.id}/media/${id}`); load()
  }

  const uploadImage = async (file) => {
    if (!file) return; setUploading(true)
    const fd = new FormData(); fd.append('file', file); fd.append('folder', 'courses')
    try {
      const r = await api.post('/upload', fd, { headers: { 'Content-Type':'multipart/form-data' } })
      setForm(p => ({ ...p, url: r.data.url }))
    } catch { setMsg('فشل رفع الصورة') }
    setUploading(false)
  }

  // Drag & Drop reorder
  const onDragStart = (id) => { dragItem.current = id }
  const onDragOver = (e, id) => { e.preventDefault(); setDragOverId(id) }
  const onDrop = async (e, targetId) => {
    e.preventDefault(); setDragOverId(null)
    if (dragItem.current === targetId) return
    const from = localImgs.findIndex(i => i.id === dragItem.current)
    const to   = localImgs.findIndex(i => i.id === targetId)
    if (from < 0 || to < 0) return

    // Reorder locally first
    const newOrder = [...localImgs]
    const [moved] = newOrder.splice(from, 1)
    newOrder.splice(to, 0, moved)
    setLocalImgs(newOrder)

    // Save new displayOrder to backend
    try {
      await Promise.all(newOrder.map((img, idx) =>
        api.put(`/courses/${course.id}/media/${img.id}`, { ...img, displayOrder: idx })
      ))
    } catch { load() } // rollback on error
  }
  const onDragEnd = () => { dragItem.current = null; setDragOverId(null) }

  // رفع مجموعة صور دفعة واحدة (حتى 10)
  const uploadMultiple = async (files) => {
    const MAX = 10
    const remaining = MAX - imgs.length
    if (remaining <= 0) { setMsg('⚠️ وصلت الحد الأقصى (10 صور)'); return }
    const selected = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, remaining)
    if (selected.length === 0) return
    if (Array.from(files).length > remaining) setMsg(`⚠️ تم رفع ${selected.length} صورة فقط (الحد المتبقي ${remaining})`)
    else setMsg('')
    if (selected.length === 0) return

    setUploadProgress(selected.map(f => ({ name: f.name, status: 'pending' })))
    setAdding(false)
    let done = 0

    for (let i = 0; i < selected.length; i++) {
      const file = selected[i]
      setUploadProgress(p => p.map((x, idx) => idx === i ? { ...x, status: 'uploading' } : x))
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('folder', 'courses')
        console.log(`[Upload] Uploading file ${i+1}/${selected.length}: ${file.name}`)
        const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        console.log(`[Upload] File uploaded: ${r.data.url}`)
        await api.post(`/courses/${course.id}/media`, { url: r.data.url, type: 'image', title: '', displayOrder: i })
        console.log(`[Upload] Media saved for course ${course.id}`)
        setUploadProgress(p => p.map((x, idx) => idx === i ? { ...x, status: 'done' } : x))
        done++
      } catch(err) {
        console.error(`[Upload] Error:`, err?.response?.data || err?.message || err)
        setUploadProgress(p => p.map((x, idx) => idx === i ? { ...x, status: 'error' } : x))
      }
    }

    console.log(`[Upload] All done: ${done}/${selected.length} succeeded`)
    load() // reload immediately
    setTimeout(() => {
      setUploadProgress([])
    }, 3000) // keep progress visible for 3 seconds
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
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {[{k:'image',l:'🖼️ الصور',c:imgs.length},{k:'video',l:'🎥 الفيديوهات',c:vids.length}].map(t=>(
            <button key={t.k} onClick={()=>{setTab(t.k);setAdding(false)}} style={{padding:'7px 16px',borderRadius:20,border:'1.5px solid',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12,borderColor:tab===t.k?'#2C3E6B':'#e5e7eb',background:tab===t.k?'#2C3E6B':'#fff',color:tab===t.k?'#fff':'#374151'}}>
              {t.l} ({t.c})
            </button>
          ))}
          {tab === 'image' && (
            <>
              <input type="file" accept="image/*" multiple ref={multiFileRef}
                onChange={e => uploadMultiple(e.target.files)} style={{display:'none'}} />
              <button type="button"
                onClick={()=> imgs.length >= 10 ? null : multiFileRef.current?.click()}
                disabled={uploadProgress.length > 0 || imgs.length >= 10}
                title={imgs.length >= 10 ? 'وصلت الحد الأقصى (10 صور)' : ''}
                style={{padding:'7px 16px',background: imgs.length >= 10 ? '#e5e7eb' : 'linear-gradient(135deg,#059669,#10b981)',color: imgs.length >= 10 ? '#9ca3af' : '#fff',border:'none',borderRadius:20,cursor: imgs.length >= 10 ? 'not-allowed' : 'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12}}>
                {imgs.length >= 10 ? '🔒 الحد الأقصى 10 صور' : `📁 اختر صور (${imgs.length}/10)`}
              </button>
            </>
          )}
          {tab === 'video' && (
            vids.length >= 10
              ? <button disabled style={{marginRight:'auto',padding:'7px 16px',background:'#e5e7eb',color:'#9ca3af',border:'none',borderRadius:20,fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12,cursor:'not-allowed'}}>🔒 الحد الأقصى 10 فيديوهات</button>
              : <button onClick={()=>setAdding(p=>!p)} style={{marginRight:'auto',padding:'7px 16px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',borderRadius:20,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12}}>
                  ➕ إضافة فيديو ({vids.length}/10)
                </button>
          )}
          {tab === 'image' && (
            <button onClick={()=>setAdding(p=>!p)} style={{marginRight:'auto',padding:'7px 16px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',borderRadius:20,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12}}>
              ➕ إضافة صورة
            </button>
          )}
        </div>

        {/* Progress bar للـ multi-upload */}
        {uploadProgress.length > 0 && (
          <div style={{background:'#f8fafc',borderRadius:14,padding:16,marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:13,color:'#2C3E6B',marginBottom:10}}>
              ⏳ جارٍ رفع {uploadProgress.length} صورة...
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {uploadProgress.map((f, i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:12}}>
                  <span style={{
                    width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                    background: f.status==='done' ? '#d1fae5' : f.status==='error' ? '#fee2e2' : f.status==='uploading' ? '#dbeafe' : '#f1f5f9',
                    fontSize:11
                  }}>
                    {f.status==='done' ? '✅' : f.status==='error' ? '❌' : f.status==='uploading' ? '⏳' : '○'}
                  </span>
                  <span style={{color:'#374151',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</span>
                  <span style={{color: f.status==='done'?'#059669': f.status==='error'?'#ef4444':'#64748b', fontWeight:600}}>
                    {f.status==='done'?'تم':f.status==='error'?'فشل':f.status==='uploading'?'يرفع...':'انتظار'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {adding && (
          <form onSubmit={addMedia} style={{background:'#f8fafc',borderRadius:14,padding:16,marginBottom:16}}>
            {tab === 'image' ? (
              <div style={{marginBottom:12}}>
                <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:4}}>رفع صورة أو رابط</label>
                <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                  <input type="file" accept="image/*" ref={fileRef} onChange={e=>uploadImage(e.target.files[0])} style={{display:'none'}} />
                  <button type="button" onClick={()=>fileRef.current?.click()} disabled={uploading} style={{padding:'8px 14px',background:'#e0e7ff',color:'#4338ca',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12}}>
                    {uploading ? '⏳ جارٍ الرفع...' : '📁 رفع صورة'}
                  </button>
                  <input value={form.url} onChange={e=>setForm(p=>({...p,url:e.target.value}))} placeholder="أو رابط الصورة (URL)" required
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
            <div style={{display:'grid',gridTemplateColumns:'1fr 80px',gap:10}}>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:4}}>العنوان</label>
                <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} style={{width:'100%',padding:'8px 12px',border:'1.5px solid #e5e7eb',borderRadius:8,fontSize:12,fontFamily:'Cairo,sans-serif',boxSizing:'border-box'}} />
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:4}}>الترتيب</label>
                <input type="number" value={form.displayOrder} onChange={e=>setForm(p=>({...p,displayOrder:+e.target.value}))} style={{width:'100%',padding:'8px 12px',border:'1.5px solid #e5e7eb',borderRadius:8,fontSize:12,fontFamily:'Cairo,sans-serif',boxSizing:'border-box'}} />
              </div>
            </div>
            {msg && <div style={{color:'#ef4444',fontSize:12,marginTop:8}}>{msg}</div>}
            <div style={{display:'flex',gap:8,marginTop:12}}>
              <button type="submit" style={{padding:'8px 20px',background:'#2C3E6B',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12}}>💾 حفظ</button>
              <button type="button" onClick={()=>setAdding(false)} style={{padding:'8px 16px',background:'#f1f5f9',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12}}>إلغاء</button>
            </div>
          </form>
        )}

        {/* Drop Zone — اسحب الصور من Windows مباشرة */}
        {tab === 'image' && uploadProgress.length === 0 && (
          imgs.length >= 10 ? (
            <div style={{border:'2px dashed #e5e7eb',borderRadius:14,padding:'20px 16px',textAlign:'center',marginBottom:16,background:'#f9fafb'}}>
              <div style={{fontSize:24,marginBottom:6}}>🔒</div>
              <div style={{fontWeight:700,fontSize:13,color:'#9ca3af'}}>وصلت الحد الأقصى (10 صور)</div>
              <div style={{fontSize:11,color:'#d1d5db',marginTop:4}}>احذف صورة لإضافة صورة جديدة</div>
            </div>
          ) : (
          <div
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='#2C3E6B'; e.currentTarget.style.background='#eef2ff' }}
            onDragLeave={e => { e.currentTarget.style.borderColor='#cbd5e1'; e.currentTarget.style.background='#f8fafc' }}
            onDrop={e => {
              e.preventDefault()
              e.currentTarget.style.borderColor='#cbd5e1'
              e.currentTarget.style.background='#f8fafc'
              const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
              if (files.length > 0) uploadMultiple(files)
            }}
            onClick={() => multiFileRef.current?.click()}
            style={{
              border:'2px dashed #cbd5e1', borderRadius:14, padding:'24px 16px',
              textAlign:'center', cursor:'pointer', marginBottom:16, background:'#f8fafc',
              transition:'all 0.2s', userSelect:'none'
            }}>
            <div style={{fontSize:28, marginBottom:6}}>🖼️</div>
            <div style={{fontWeight:700, fontSize:13, color:'#2C3E6B', marginBottom:4}}>
              اسحب الصور هنا أو اضغط للاختيار
            </div>
            <div style={{fontSize:11, color:'#94a3b8'}}>
              متبقي {10 - imgs.length} صورة من أصل 10 (JPG, PNG, WebP)
            </div>
          </div>
          )
        )}

        {loading ? <div style={{textAlign:'center',padding:30,color:'#94a3b8'}}>⏳ جارٍ التحميل...</div> : (
          <div>
            {tab === 'image' && (
              imgs.length === 0 ? <div style={{textAlign:'center',padding:30,color:'#94a3b8',fontSize:13}}>لا توجد صور بعد</div> :
              <>
                <div style={{fontSize:11,color:'#94a3b8',marginBottom:8,textAlign:'center'}}>
                  ✋ اسحب الصور لتغيير الترتيب
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10}}>
                  {imgs.slice(0,10).map((img, idx) => (
                    <div key={img.id}
                      draggable
                      onDragStart={() => onDragStart(img.id)}
                      onDragOver={e => onDragOver(e, img.id)}
                      onDrop={e => onDrop(e, img.id)}
                      onDragEnd={onDragEnd}
                      style={{
                        position:'relative', borderRadius:12, overflow:'hidden', aspectRatio:'4/3', background:'#f1f5f9',
                        cursor:'grab', transition:'transform 0.15s, box-shadow 0.15s',
                        transform: dragOverId===img.id ? 'scale(1.04)' : 'scale(1)',
                        boxShadow: dragOverId===img.id ? '0 0 0 3px #2C3E6B' : 'none',
                        opacity: dragItem.current===img.id ? 0.5 : 1
                      }}>
                      {/* رقم الترتيب */}
                      <div style={{position:'absolute',top:6,right:6,background:'rgba(0,0,0,0.55)',color:'#fff',borderRadius:6,padding:'2px 7px',fontSize:10,fontWeight:700,zIndex:2}}>
                        {idx + 1}
                      </div>
                      <img src={img.url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}} />
                      <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'6px 8px',background:'linear-gradient(transparent,rgba(0,0,0,0.75))',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{color:'#fff',fontSize:10,fontWeight:600}}>{img.title||''}</span>
                        <button onClick={()=>delMedia(img.id)} style={{background:'rgba(239,68,68,0.8)',border:'none',color:'#fff',borderRadius:6,padding:'2px 6px',cursor:'pointer',fontSize:10}}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
                {imgs.length > 10 && (
                  <div style={{textAlign:'center',marginTop:10,fontSize:12,color:'#64748b',padding:'8px',background:'#f1f5f9',borderRadius:8}}>
                    يتم عرض أول 10 صور من أصل {imgs.length} — احذف الزايدة لعرض الكل
                  </div>
                )}
              </>
            )}
            {tab === 'video' && (
              vids.length === 0 ? <div style={{textAlign:'center',padding:30,color:'#94a3b8',fontSize:13}}>لا توجد فيديوهات بعد — أضف حتى 10 فيديوهات</div> :

              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                {vids.map(vid => {
                  const getYTId = (url) => {
                    try {
                      const u = new URL(url)
                      if (u.searchParams.get('v')) return u.searchParams.get('v').slice(0,11)
                      const m = u.pathname.match(/\/(?:shorts|embed|v)\/([\w-]{11})/) || u.pathname.match(/^\/([\w-]{11})$/)
                      if (m) return m[1]
                    } catch {}
                    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts|embed|v)\/)([^?&\s]{11})/)
                    return m ? m[1] : null
                  }
                  const ytId = getYTId(vid.url)
                  return (
                    <div key={vid.id} style={{background:'#f8fafc',borderRadius:14,overflow:'hidden',border:'1.5px solid #e5e7eb'}}>
                      {/* YouTube Player */}
                      {ytId ? (
                        <div style={{position:'relative',paddingBottom:'56.25%',height:0,background:'#000'}}>
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                            title={vid.title||'فيديو'}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{position:'absolute',top:0,left:0,width:'100%',height:'100%'}}
                          />
                        </div>
                      ) : (
                        <div style={{background:'#1e293b',padding:'20px',textAlign:'center',color:'#94a3b8',fontSize:12}}>
                          ⚠️ رابط غير مدعوم
                        </div>
                      )}
                      {/* Info + Edit + Delete */}
                      <div style={{padding:'10px 12px'}}>
                        {editingVid?.id === vid.id ? (
                          <div style={{display:'flex',gap:6,alignItems:'center'}}>
                            <input
                              value={editingVid.title}
                              onChange={e => setEditingVid(p => ({...p, title: e.target.value}))}
                              autoFocus
                              style={{flex:1,padding:'6px 10px',border:'1.5px solid #2C3E6B',borderRadius:8,fontSize:12,fontFamily:'Cairo,sans-serif'}}
                            />
                            <button onClick={async () => {
                              await api.put(`/courses/${course.id}/media/${vid.id}`, {...vid, title: editingVid.title})
                              setEditingVid(null); load()
                            }} style={{padding:'6px 12px',background:'#2C3E6B',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700}}>✅</button>
                            <button onClick={() => setEditingVid(null)} style={{padding:'6px 10px',background:'#f1f5f9',border:'none',borderRadius:8,cursor:'pointer',fontSize:12}}>✕</button>
                          </div>
                        ) : (
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:700,fontSize:13,color:'#1e293b'}}>{vid.title||'بدون عنوان'}</div>
                              <a href={vid.url} target="_blank" rel="noreferrer" style={{fontSize:10,color:'#64748b',wordBreak:'break-all'}}>{vid.url}</a>
                            </div>
                            <div style={{display:'flex',gap:6,flexShrink:0}}>
                              <button onClick={() => setEditingVid({id: vid.id, title: vid.title||''})}
                                style={{background:'#e0e7ff',border:'none',color:'#4338ca',borderRadius:8,padding:'6px 10px',cursor:'pointer',fontSize:12}}>✏️</button>
                              <button onClick={()=>delMedia(vid.id)}
                                style={{background:'#fee2e2',border:'none',color:'#ef4444',borderRadius:8,padding:'6px 10px',cursor:'pointer',fontSize:12}}>🗑️</button>
                            </div>
                          </div>
                        )}
                      </div>
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

function BroadcastModal({ course, onClose }) {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')
  // فلاتر
  const [channelFilter, setChannelFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [selectedSectors, setSelectedSectors] = useState([])
  const [traderSectorsList, setTraderSectorsList] = useState([])
  const [showSectors, setShowSectors] = useState(false)
  const [alreadySent, setAlreadySent] = useState([]) // IDs من أُرسل إليهم
  const [newOnly, setNewOnly] = useState(false) // فلتر المتابعين الجدد فقط

  useEffect(() => {
    api.get('/sectors/1/subscribers')
      .then(r => {
        setSubscribers(r.data || [])
        setSelected((r.data || []).map(s => s.id))
      })
      .finally(() => setLoading(false))
    api.get('/constants/trader_sector').then(r => setTraderSectorsList(r.data || [])).catch(()=>{})
    // جلب من أُرسل إليهم مسبقاً
    if (course?.id) {
      api.get(`/subscribers/broadcast-log/${course.id}`).then(r => setAlreadySent(r.data || [])).catch(()=>{})
    }
  }, [])

  // فلترة المتابعين
  const filtered = subscribers.filter(s => {
    // فلتر القناة
    if (channelFilter === 'whatsapp' && !s.phone && !s.whatsApp) return false
    if (channelFilter === 'email' && !s.email) return false
    if (channelFilter === 'both' && (!s.email || (!s.phone && !s.whatsApp))) return false
    // فلتر الجدد فقط
    if (newOnly && alreadySent.includes(s.id)) return false
    // فلتر القطاعات — يشمل المتابع إذا عنده أي قطاع من المختارة
    if (selectedSectors.length > 0) {
      try {
        const sub_sectors = JSON.parse(s.traderSectors || '[]')
        if (!selectedSectors.some(id => sub_sectors.includes(id))) return false
      } catch { return false }
    }
    // بحث نصي
    if (searchText) {
      const q = searchText.toLowerCase()
      if (!s.fullName?.toLowerCase().includes(q) &&
          !s.phone?.includes(q) &&
          !s.whatsApp?.includes(q) &&
          !s.email?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const toggleAll = () => {
    if (selected.length === filtered.length && filtered.every(s => selected.includes(s.id)))
      setSelected(p => p.filter(id => !filtered.map(s=>s.id).includes(id)))
    else setSelected(p => [...new Set([...p, ...filtered.map(s=>s.id)])])
  }

  const toggleOne = (id) => {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every(s => selected.includes(s.id))

  const send = async () => {
    if (selected.length === 0) return
    setSending(true); setMsg('')
    const targets = subscribers.filter(s => selected.includes(s.id))
    try {
      const fmt = d => new Date(d).toLocaleDateString('ar-IQ',{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Baghdad'})
      const channel = channelFilter === 'email' ? 'email' : channelFilter === 'both' ? 'both' : 'whatsapp'
      const dates = course.startDate
        ? (course.endDate
          ? `📅 من ${fmt(course.startDate)} إلى ${fmt(course.endDate)}`
          : `📅 ${fmt(course.startDate)}`)
        : ''
      const itemUrl = `${window.location.origin}/startups/${course.id}`
      await api.post('/subscribers/broadcast', {
        subscriberIds: selected,
        message: `📢 دورة جديدة: ${course.title}\n${dates}\n📍 ${course.location||''}`,
        imageUrl: course.imageUrl || course.bannerUrl || course.thumbnailUrl || null,
        itemUrl,
        courseId: course.id,
        channel
      })
      setMsg(`✅ تم الإرسال لـ ${selected.length} متابع`)
      setAlreadySent(p => [...new Set([...p, ...selected])])
      setTimeout(() => onClose(), 2000)
    } catch {
      setMsg('❌ حدث خطأ أثناء الإرسال')
    }
    setSending(false)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:'#fff',borderRadius:20,padding:24,width:'100%',maxWidth:680,maxHeight:'90vh',overflowY:'auto',direction:'rtl',fontFamily:'Cairo,sans-serif'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div>
            <h2 style={{fontSize:17,fontWeight:800,color:'#2C3E6B',margin:0}}>📢 تعميم على المتابعين</h2>
            <p style={{fontSize:12,color:'#64748b',margin:'4px 0 0'}}>{course.title}</p>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#94a3b8'}}>✕</button>
        </div>

        {loading ? <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>⏳ جارٍ التحميل...</div> : (
          <>
            {/* إحصائيات */}
            <div style={{display:'flex',gap:10,marginBottom:12}}>
              <div style={{flex:1,background:'#eef2ff',borderRadius:12,padding:'10px 16px',textAlign:'center'}}>
                <div style={{fontSize:20,fontWeight:800,color:'#2C3E6B'}}>{subscribers.length}</div>
                <div style={{fontSize:11,color:'#64748b'}}>إجمالي المتابعين</div>
              </div>
              <div style={{flex:1,background:'#fefce8',borderRadius:12,padding:'10px 16px',textAlign:'center'}}>
                <div style={{fontSize:20,fontWeight:800,color:'#ca8a04'}}>{filtered.length}</div>
                <div style={{fontSize:11,color:'#64748b'}}>بعد الفلتر</div>
              </div>
              <div style={{flex:1,background:'#f0fdf4',borderRadius:12,padding:'10px 16px',textAlign:'center'}}>
                <div style={{fontSize:20,fontWeight:800,color:'#059669'}}>{selected.length}</div>
                <div style={{fontSize:11,color:'#64748b'}}>المحددون</div>
              </div>
            </div>

            {/* فلاتر */}
            <div style={{background:'#f8fafc',borderRadius:12,padding:12,marginBottom:12,display:'flex',flexDirection:'column',gap:8}}>
              {/* فلتر الجدد */}
              {alreadySent.length > 0 && (
                <label style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:8,background:newOnly?'#fef3c7':'#fff',border:`1.5px solid ${newOnly?'#f59e0b':'#e5e7eb'}`,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:12,fontWeight:700}}>
                  <input type="checkbox" checked={newOnly} onChange={e=>setNewOnly(e.target.checked)} />
                  🆕 متابعون جدد فقط ({subscribers.filter(s=>!alreadySent.includes(s.id)).length} لم يصلهم)
                </label>
              )}
              {/* فلتر القناة */}
              <div style={{display:'flex',gap:6}}>
                {[{k:'all',l:'الكل'},{k:'whatsapp',l:'📱 هاتف'},{k:'email',l:'📧 إيميل'},{k:'both',l:'✅ كلاهما'}].map(c=>(
                  <button key={c.k} onClick={()=>setChannelFilter(c.k)}
                    style={{flex:1,padding:'6px 4px',borderRadius:7,border:`1.5px solid ${channelFilter===c.k?'#2C3E6B':'#e5e7eb'}`,background:channelFilter===c.k?'#2C3E6B':'#fff',color:channelFilter===c.k?'#fff':'#374151',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>
                    {c.l}
                  </button>
                ))}
              </div>
              {/* بحث */}
              <input value={searchText} onChange={e=>setSearchText(e.target.value)}
                placeholder="🔍 اسم أو هاتف أو إيميل"
                style={{width:'100%',padding:'7px 10px',borderRadius:7,border:'1.5px solid #e5e7eb',fontFamily:'Cairo,sans-serif',fontSize:12,outline:'none',boxSizing:'border-box'}} />
              {/* فلتر القطاعات */}
              <div>
                <button onClick={()=>setShowSectors(p=>!p)}
                  style={{width:'100%',padding:'7px 12px',borderRadius:7,border:'1.5px solid #e5e7eb',background:'#fff',fontFamily:'Cairo,sans-serif',fontSize:12,fontWeight:700,cursor:'pointer',textAlign:'right',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span>📂 القطاعات {selectedSectors.length>0?`(${selectedSectors.length} مختار)`:''}</span>
                  <span>{showSectors?'▲':'▼'}</span>
                </button>
                {showSectors && (
                  <div style={{background:'#fff',border:'1.5px solid #e5e7eb',borderRadius:8,padding:10,marginTop:4,maxHeight:200,overflowY:'auto',display:'flex',flexDirection:'column',gap:4}}>
                    <div style={{display:'flex',gap:6,marginBottom:4}}>
                      <button onClick={()=>setSelectedSectors(traderSectorsList.map(s=>s.id))}
                        style={{fontSize:11,padding:'3px 8px',borderRadius:5,border:'none',background:'#e0e7ff',color:'#4338ca',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700}}>✅ كل</button>
                      <button onClick={()=>setSelectedSectors([])}
                        style={{fontSize:11,padding:'3px 8px',borderRadius:5,border:'none',background:'#fee2e2',color:'#dc2626',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700}}>✕ مسح</button>
                    </div>
                    {traderSectorsList.map(s=>(
                      <label key={s.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',borderRadius:6,background:selectedSectors.includes(s.id)?'#eef2ff':'#fff',cursor:'pointer',fontSize:12}}>
                        <input type="checkbox" checked={selectedSectors.includes(s.id)}
                          onChange={()=>setSelectedSectors(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p,s.id])} />
                        {s.value}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* اختيار الكل */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <span style={{fontSize:12,fontWeight:700,color:'#374151'}}>النتائج ({filtered.length})</span>
              <button onClick={toggleAll}
                style={{padding:'5px 12px',borderRadius:7,border:'1.5px solid #2C3E6B',background:allFilteredSelected?'#2C3E6B':'#fff',color:allFilteredSelected?'#fff':'#2C3E6B',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>
                {allFilteredSelected ? '❌ إلغاء الكل' : '✅ اختيار الكل'}
              </button>
            </div>

            {/* القائمة */}
            {subscribers.length === 0 ? (
              <div style={{textAlign:'center',padding:30,color:'#94a3b8',fontSize:13}}>لا يوجد متابعون لقسم الريادة بعد</div>
            ) : filtered.length === 0 ? (
              <div style={{textAlign:'center',padding:20,color:'#94a3b8',fontSize:12}}>لا توجد نتائج للفلتر المحدد</div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:320,overflowY:'auto',marginBottom:16}}>
                {filtered.map(s => {
                    const wasSent = alreadySent.includes(s.id)
                    const isSelected = selected.includes(s.id)
                    return (
                    <div key={s.id}
                      onClick={() => !wasSent && toggleOne(s.id)}
                      style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:12,
                        border:`1.5px solid ${wasSent?'#fde68a':isSelected?'#2C3E6B':'#e5e7eb'}`,
                        background:wasSent?'#fefce8':isSelected?'#eef2ff':'#fafafa',
                        cursor:wasSent?'default':'pointer',opacity:wasSent?0.7:1,transition:'all 0.15s'}}>
                      <div style={{width:38,height:38,borderRadius:'50%',overflow:'hidden',background:'#f1f5f9',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>
                        {s.profileImage ? <img src={s.profileImage} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '👤'}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:13,color:'#1e293b'}}>{s.fullName}</div>
                        <div style={{fontSize:11,color:'#64748b',direction:'ltr'}}>{s.phone} {s.email ? `• ${s.email}` : ''}</div>
                        {wasSent && <div style={{fontSize:10,color:'#d97706',fontWeight:700}}>✅ تم الإرسال مسبقاً</div>}
                      </div>
                      <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${wasSent?'#fde68a':isSelected?'#2C3E6B':'#cbd5e1'}`,
                        background:wasSent?'#fef3c7':isSelected?'#2C3E6B':'#fff',
                        display:'flex',alignItems:'center',justifyContent:'center',color:wasSent?'#d97706':'#fff',fontSize:13,flexShrink:0}}>
                        {wasSent ? '✓' : isSelected ? '✓' : ''}
                      </div>
                    </div>
                    )
                  })}
              </div>
            )}

            {/* رسالة النتيجة */}
            {msg && <div style={{padding:'10px 14px',borderRadius:10,background:msg.includes('✅')?'#f0fdf4':'#fef2f2',color:msg.includes('✅')?'#059669':'#ef4444',fontWeight:700,fontSize:13,marginBottom:12}}>{msg}</div>}

            {/* زر الإرسال */}
            <button onClick={send} disabled={sending || selected.length === 0}
              style={{width:'100%',padding:14,background:selected.length===0?'#e5e7eb':'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:selected.length===0?'#9ca3af':'#fff',border:'none',borderRadius:14,cursor:selected.length===0?'not-allowed':'pointer',fontFamily:'Cairo,sans-serif',fontWeight:800,fontSize:15}}>
              {sending ? '⏳ جارٍ الإرسال...' : `📢 إرسال لـ ${selected.length} متابع`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [mediaCounts, setMediaCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [appsModal, setAppsModal] = useState(null)
  const [mediaModal, setMediaModal] = useState(null)
  const [broadcastModal, setBroadcastModal] = useState(null)
  // فلاتر
  const [statusFilter, setStatusFilter] = useState(['upcoming','ongoing'])
  const [searchText, setSearchText] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const load = () => {
    setLoading(true)
    api.get('/courses').then(async r => {
      setCourses(r.data)
      // جلب عدد الصور لكل دورة
      const counts = {}
      await Promise.all(r.data.map(async c => {
        try {
          const mr = await api.get(`/courses/${c.id}/media`)
          counts[c.id] = (mr.data || []).filter(m => m.type === 'image').length
        } catch { counts[c.id] = 0 }
      }))
      setMediaCounts(counts)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const del = async (id) => {
    if (!confirm('هل تريد حذف هذه الدورة؟')) return
    await api.delete(`/courses/${id}`); load()
  }

  // إحصائيات
  const stats = {
    all: courses.length,
    upcoming: courses.filter(c=>c.status==='upcoming').length,
    ongoing: courses.filter(c=>c.status==='ongoing').length,
    completed: courses.filter(c=>c.status==='completed').length,
    totalParticipants: courses.reduce((s,c)=>s+(c.currentParticipants||0),0),
  }

  // فلترة
  const toggleStatus = (s) => { setStatusFilter(p => p.includes(s) ? p.filter(x=>x!==s) : [...p,s]); setPage(1) }
  const filtered = courses.filter(c => {
    if (statusFilter.length > 0 && !statusFilter.includes(c.status)) return false
    if (searchText && !c.title?.includes(searchText) && !c.speaker?.includes(searchText) && !c.location?.includes(searchText)) return false
    return true
  })
  const totalPages = pageSize >= 1000 ? 1 : Math.ceil(filtered.length / pageSize)
  const paginated = pageSize >= 1000 ? filtered : filtered.slice((page-1)*pageSize, page*pageSize)

  const fmt = d => d ? new Date(d).toLocaleDateString('ar-IQ',{year:'numeric',month:'numeric',day:'numeric',timeZone:'Asia/Baghdad'}) : ''

  return (
    <div style={{direction:'rtl',fontFamily:'Cairo,sans-serif'}}>
      {modal && <CourseForm item={modal === 'new' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />}
      {appsModal && <ApplicationsModal course={appsModal} onClose={() => setAppsModal(null)} />}
      {mediaModal && <MediaManager course={mediaModal} onClose={() => { setMediaModal(null); load() }} />}
      {broadcastModal && <BroadcastModal course={broadcastModal} onClose={() => setBroadcastModal(null)} />}

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h2 style={{fontSize:20,fontWeight:800,color:'#2C3E6B',margin:0}}>🎓 الدورات الريادية</h2>
        <button onClick={() => setModal('new')} style={{padding:'10px 20px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',borderRadius:12,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:13}}>
          ➕ إضافة دورة
        </button>
      </div>

      {/* إحصائيات */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:16}}>
        {[
          {label:'الكل',val:stats.all,color:'#2C3E6B',bg:'#eef2ff',icon:'📚'},
          {label:'قادمة',val:stats.upcoming,color:'#0369a1',bg:'#e0f2fe',icon:'🟢'},
          {label:'جارية',val:stats.ongoing,color:'#dc2626',bg:'#fee2e2',icon:'🔴'},
          {label:'منتهية',val:stats.completed,color:'#16a34a',bg:'#dcfce7',icon:'✅'},
          {label:'مشاركون',val:stats.totalParticipants,color:'#7c3aed',bg:'#f3e8ff',icon:'👥'},
        ].map(s=>(
          <div key={s.label} style={{background:s.bg,borderRadius:12,padding:'12px 10px',textAlign:'center'}}>
            <div style={{fontSize:20,marginBottom:2}}>{s.icon}</div>
            <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.val}</div>
            <div style={{fontSize:11,color:'#64748b',fontWeight:600}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* فلاتر */}
      <div style={{background:'#fff',borderRadius:12,padding:'12px 14px',marginBottom:16,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',border:'1px solid #e5e7eb'}}>
        {/* أزرار الحالة */}
        {[{k:'upcoming',l:'🟢 قادمة'},{k:'ongoing',l:'🔴 جارية'},{k:'completed',l:'✅ منتهية'}].map(f=>(
          <button key={f.k} onClick={()=>toggleStatus(f.k)}
            style={{padding:'6px 14px',borderRadius:20,border:'1.5px solid',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12,
              borderColor:statusFilter.includes(f.k)?'#2C3E6B':'#e5e7eb',
              background:statusFilter.includes(f.k)?'#2C3E6B':'#fff',
              color:statusFilter.includes(f.k)?'#fff':'#374151'}}>
            {f.l}
          </button>
        ))}
        <button onClick={()=>setStatusFilter([])}
          style={{padding:'6px 14px',borderRadius:20,border:'1.5px solid #e5e7eb',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12,background:'#f8fafc',color:'#374151'}}>
          الكل
        </button>
        <div style={{flex:1,minWidth:160}}>
          <input value={searchText} onChange={e=>setSearchText(e.target.value)}
            placeholder="🔍 بحث بالاسم أو المتحدث"
            style={{width:'100%',padding:'7px 12px',borderRadius:8,border:'1.5px solid #e5e7eb',fontFamily:'Cairo,sans-serif',fontSize:12,outline:'none',boxSizing:'border-box'}} />
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:12,color:'#94a3b8',fontWeight:600}}>{filtered.length} دورة</span>
          <select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1)}}
            style={{padding:'5px 8px',borderRadius:7,border:'1.5px solid #e5e7eb',fontFamily:'Cairo,sans-serif',fontSize:12,outline:'none',background:'#f8fafc'}}>
            {[10,20,50,100,1000].map(n=><option key={n} value={n}>{n === 1000 ? 'الكل' : n} / صفحة</option>)}
          </select>
        </div>
      </div>

      {loading ? <div style={{textAlign:'center',padding:60,color:'#94a3b8'}}>⏳ جارٍ التحميل...</div> : filtered.length === 0 ? (
        <div style={{textAlign:'center',padding:40,color:'#94a3b8',fontSize:14}}>لا توجد دورات للفلتر المحدد</div>
      ) : (
        <>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
          {paginated.map(c => {
            const pct = c.maxParticipants > 0 ? Math.round((c.currentParticipants / c.maxParticipants) * 100) : 0
            return (
              <div key={c.id} style={{background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 2px 10px rgba(44,62,107,0.07)',border:'1px solid #e5e7eb'}}>
                <div style={{background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',padding:'16px',position:'relative'}}>
                  <span style={{position:'absolute',top:10,left:10,padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:800,
                    background:c.status==='upcoming'?'#dcfce7':c.status==='ongoing'?'#fee2e2':'#f3f4f6',
                    color:c.status==='upcoming'?'#166534':c.status==='ongoing'?'#991b1b':'#374151'}}>
                    {c.status==='upcoming'?'🟢 قادمة':c.status==='ongoing'?'🔴 جارية':'✅ منتهية'}
                  </span>
                  <h3 style={{color:'#fff',fontSize:14,fontWeight:800,marginTop:20,lineHeight:1.4}}>{c.title}</h3>
                  {c.speaker && <div style={{color:'rgba(255,255,255,0.75)',fontSize:11,marginTop:4}}>👤 {c.speaker}</div>}
                </div>
                <div style={{padding:'14px 16px'}}>
                  <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:12,color:'#64748b',marginBottom:12}}>
                    <span>📅 {fmt(c.startDate)} — {fmt(c.endDate)}</span>
                    {c.location && <span>📍 {c.location}</span>}
                    <span>👥 {c.currentParticipants} / {c.maxParticipants} مشارك</span>
                    <div style={{background:'#e5e7eb',borderRadius:10,height:6,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${pct}%`,background:pct>=90?'#ef4444':'#2C3E6B',borderRadius:10}} />
                    </div>
                    <span style={{fontWeight:700,color:c.isFree?'#10b981':'#2C3E6B'}}>💰 {c.isFree ? 'مجانية' : `${c.price?.toLocaleString()} د.ع`}</span>
                  </div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    <button onClick={() => setMediaModal(c)} style={{flex:1,padding:'7px',background:'#f0fdf4',color:'#166534',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>
                      🖼️ الصور {mediaCounts[c.id] > 0 ? `(${mediaCounts[c.id]})` : ''}
                    </button>
                    <button onClick={() => setAppsModal(c)} style={{flex:1,padding:'7px',background:'#e0e7ff',color:'#4338ca',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>📋 الطلبات ({c.currentParticipants})</button>
                    <button onClick={() => setBroadcastModal(c)} style={{flex:1,padding:'7px',background:'#fff7ed',color:'#c2410c',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>📢 تعميم</button>
                    <button onClick={() => window.open(`/admin/courses/${c.id}/badges`, '_blank')} style={{flex:1,padding:'7px',background:'#f0f9ff',color:'#0369a1',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>🪪 Badges</button>
                    <button onClick={() => setModal(c)} style={{padding:'7px 12px',background:'#FFC72C20',color:'#92400e',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>✏️</button>
                    <button onClick={() => del(c.id)} style={{padding:'7px 12px',background:'#fee2e2',color:'#ef4444',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>🗑️</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,marginTop:20,flexWrap:'wrap'}}>
            <button onClick={()=>setPage(1)} disabled={page===1}
              style={{padding:'6px 12px',borderRadius:7,border:'1.5px solid #e5e7eb',background:page===1?'#f1f5f9':'#fff',cursor:page===1?'default':'pointer',fontFamily:'Cairo,sans-serif',fontSize:12,fontWeight:700,color:'#374151'}}>⏮ أول</button>
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
              style={{padding:'6px 12px',borderRadius:7,border:'1.5px solid #e5e7eb',background:page===1?'#f1f5f9':'#fff',cursor:page===1?'default':'pointer',fontFamily:'Cairo,sans-serif',fontSize:12,fontWeight:700,color:'#374151'}}>← السابق</button>
            {Array.from({length:Math.min(totalPages,5)}, (_,i) => {
              const p = totalPages <= 5 ? i+1 : page <= 3 ? i+1 : page >= totalPages-2 ? totalPages-4+i : page-2+i
              return (
                <button key={p} onClick={()=>setPage(p)}
                  style={{padding:'6px 12px',borderRadius:7,border:'1.5px solid',fontFamily:'Cairo,sans-serif',fontSize:12,fontWeight:700,cursor:'pointer',
                    borderColor:page===p?'#2C3E6B':'#e5e7eb',background:page===p?'#2C3E6B':'#fff',color:page===p?'#fff':'#374151'}}>
                  {p}
                </button>
              )
            })}
            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
              style={{padding:'6px 12px',borderRadius:7,border:'1.5px solid #e5e7eb',background:page===totalPages?'#f1f5f9':'#fff',cursor:page===totalPages?'default':'pointer',fontFamily:'Cairo,sans-serif',fontSize:12,fontWeight:700,color:'#374151'}}>التالي ←</button>
            <button onClick={()=>setPage(totalPages)} disabled={page===totalPages}
              style={{padding:'6px 12px',borderRadius:7,border:'1.5px solid #e5e7eb',background:page===totalPages?'#f1f5f9':'#fff',cursor:page===totalPages?'default':'pointer',fontFamily:'Cairo,sans-serif',fontSize:12,fontWeight:700,color:'#374151'}}>آخر ⏭</button>
            <span style={{fontSize:12,color:'#94a3b8'}}>صفحة {page} من {totalPages}</span>
          </div>
        )}
        </>
      )}
    </div>
  )
}
