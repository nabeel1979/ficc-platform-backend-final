import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

const STATUS_LABEL = { upcoming:'📅 قادمة', ongoing:'🔴 جارية الآن', completed:'✅ منتهية' }
const STATUS_COLOR = { upcoming:'#10b981', ongoing:'#ef4444', completed:'#6b7280' }

// استخراج YouTube video ID
function getYTId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=|\/shorts\/))([\w-]{11})/)
  return m ? m[1] : null
}

// YouTube Thumbnail
function YTThumb({ url, title, onClick }) {
  const id = getYTId(url)
  if (!id) return null
  return (
    <div onClick={onClick} style={{cursor:'pointer',borderRadius:12,overflow:'hidden',position:'relative',background:'#000',aspectRatio:'16/9'}}>
      <img src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`} alt={title||'فيديو'} style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.85,transition:'opacity 0.2s'}}
        onMouseEnter={e=>e.target.style.opacity=1} onMouseLeave={e=>e.target.style.opacity=0.85} />
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:56,height:56,background:'rgba(255,0,0,0.85)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(0,0,0,0.4)'}}>
          <div style={{width:0,height:0,borderTop:'10px solid transparent',borderBottom:'10px solid transparent',borderLeft:'18px solid white',marginRight:-4}} />
        </div>
      </div>
      {title && <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'8px 12px',background:'linear-gradient(transparent,rgba(0,0,0,0.75))',color:'#fff',fontSize:12,fontWeight:700,direction:'rtl'}}>{title}</div>}
    </div>
  )
}

// Video Modal
function VideoModal({ url, title, onClose }) {
  const id = getYTId(url)
  if (!id) return null
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:'100%',maxWidth:860,position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:-44,left:0,background:'none',border:'none',color:'#fff',fontSize:32,cursor:'pointer',lineHeight:1}}>✕</button>
        {title && <div style={{color:'#fff',fontSize:16,fontWeight:700,marginBottom:12,direction:'rtl',fontFamily:'Cairo,sans-serif'}}>{title}</div>}
        <div style={{position:'relative',paddingBottom:'56.25%',height:0}}>
          <iframe
            src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
            style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none',borderRadius:12}}
            allow="autoplay; encrypted-media" allowFullScreen />
        </div>
      </div>
    </div>
  )
}

// Image Lightbox
function ImageModal({ images, index, onClose }) {
  const [current, setCurrent] = useState(index)
  const prev = () => setCurrent(c => (c - 1 + images.length) % images.length)
  const next = () => setCurrent(c => (c + 1) % images.length)
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.95)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>
      <button onClick={e=>{e.stopPropagation();onClose()}} style={{position:'absolute',top:20,left:20,background:'none',border:'none',color:'#fff',fontSize:32,cursor:'pointer'}}>✕</button>
      {images.length > 1 && <>
        <button onClick={e=>{e.stopPropagation();prev()}} style={{position:'absolute',right:20,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',fontSize:28,cursor:'pointer',borderRadius:'50%',width:50,height:50}}>›</button>
        <button onClick={e=>{e.stopPropagation();next()}} style={{position:'absolute',left:20,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',fontSize:28,cursor:'pointer',borderRadius:'50%',width:50,height:50}}>‹</button>
      </>}
      <div onClick={e=>e.stopPropagation()} style={{maxWidth:'90vw',maxHeight:'85vh',display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
        <img src={images[current].url} alt={images[current].title||''} style={{maxWidth:'90vw',maxHeight:'75vh',objectFit:'contain',borderRadius:12}} />
        {images[current].title && <div style={{color:'#fff',fontSize:14,fontWeight:600,direction:'rtl',fontFamily:'Cairo,sans-serif'}}>{images[current].title}</div>}
        {images.length > 1 && <div style={{color:'rgba(255,255,255,0.5)',fontSize:12}}>{current+1} / {images.length}</div>}
      </div>
    </div>
  )
}

export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [form, setForm] = useState({ fullName:'', phone:'', email:'', company:'', motivation:'' })
  const [msg, setMsg] = useState({ type:'', text:'' })
  const [submitting, setSubmitting] = useState(false)
  const [videoModal, setVideoModal] = useState(null)
  const [imageModal, setImageModal] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${id}`),
      api.get(`/courses/${id}/media`)
    ]).then(([cr, mr]) => {
      // حساب الحالة بحسب التاريخ
      const c = cr.data
      const now = new Date()
      if (new Date(c.endDate) < now) c.status = 'completed'
      else if (new Date(c.startDate) <= now) c.status = 'ongoing'
      setCourse(c)
      setMedia(mr.data || [])
    }).catch(() => navigate('/startups'))
     .finally(() => setLoading(false))
  }, [id])

  const images = media.filter(m => m.type === 'image')
  const videos = media.filter(m => m.type === 'video')

  const submit = async (e) => {
    e.preventDefault(); setSubmitting(true); setMsg({type:'',text:''})
    try {
      await api.post(`/courses/${id}/apply`, form)
      setMsg({ type:'success', text:'✅ تم تسجيل طلبك بنجاح! سيتم التواصل معك قريباً' })
      setApplying(false)
    } catch(err) {
      setMsg({ type:'error', text: err.response?.data?.message || 'حدث خطأ، حاول مرة أخرى' })
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div style={{minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Cairo,sans-serif'}}>
      <div style={{textAlign:'center',color:'#94a3b8'}}>
        <div style={{fontSize:48,marginBottom:12}}>⏳</div>
        <div>جارٍ التحميل...</div>
      </div>
    </div>
  )

  if (!course) return null

  const pct = course.maxParticipants > 0 ? Math.round((course.currentParticipants / course.maxParticipants) * 100) : 0
  const daysLeft = Math.ceil((new Date(course.startDate) - new Date()) / 86400000)

  return (
    <div style={{maxWidth:1000,margin:'0 auto',padding:'24px 16px',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      {videoModal && <VideoModal url={videoModal.url} title={videoModal.title} onClose={() => setVideoModal(null)} />}
      {imageModal !== null && <ImageModal images={images} index={imageModal} onClose={() => setImageModal(null)} />}

      {/* زر الرجوع */}
      <button onClick={() => navigate('/startups')} style={{background:'none',border:'none',cursor:'pointer',color:'#4A6FA5',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:14,marginBottom:16,display:'flex',alignItems:'center',gap:6,padding:0}}>
        ← العودة إلى الدورات
      </button>

      {/* Hero */}
      <div style={{background:'linear-gradient(135deg,#2C3E6B,#1a2a4a)',borderRadius:20,padding:'32px 28px',color:'#fff',marginBottom:24,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-20,left:-20,width:200,height:200,background:'rgba(255,255,255,0.03)',borderRadius:'50%'}} />
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16}}>
          <div style={{flex:1}}>
            <span style={{display:'inline-block',padding:'4px 14px',borderRadius:20,background:STATUS_COLOR[course.status]+'33',color:STATUS_COLOR[course.status] || '#10b981',fontSize:12,fontWeight:800,border:`1px solid ${STATUS_COLOR[course.status]}55`,marginBottom:12}}>
              {STATUS_LABEL[course.status] || course.status}
            </span>
            <h1 style={{fontSize:26,fontWeight:900,margin:'0 0 12px',lineHeight:1.3}}>{course.title}</h1>
            {course.description && <p style={{color:'rgba(255,255,255,0.75)',fontSize:14,lineHeight:1.7,margin:'0 0 16px'}}>{course.description}</p>}
            {course.speaker && (
              <div style={{display:'flex',alignItems:'center',gap:10,background:'rgba(255,255,255,0.08)',borderRadius:12,padding:'10px 16px',width:'fit-content'}}>
                <div style={{width:40,height:40,borderRadius:'50%',background:'rgba(255,199,44,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>👤</div>
                <div>
                  <div style={{fontWeight:800,fontSize:14}}>{course.speaker}</div>
                  {course.speakerTitle && <div style={{color:'rgba(255,255,255,0.6)',fontSize:11}}>{course.speakerTitle}</div>}
                </div>
              </div>
            )}
          </div>
          {/* التسجيل */}
          <div style={{background:'rgba(255,255,255,0.1)',borderRadius:16,padding:'20px',minWidth:220,backdropFilter:'blur(10px)'}}>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.6)',marginBottom:6}}>المقاعد المتاحة</div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontWeight:800,fontSize:20}}>{course.currentParticipants}</span>
              <span style={{color:'rgba(255,255,255,0.5)',fontSize:13}}>/ {course.maxParticipants}</span>
            </div>
            <div style={{background:'rgba(255,255,255,0.15)',borderRadius:10,height:8,overflow:'hidden',marginBottom:16}}>
              <div style={{height:'100%',width:`${pct}%`,background:pct>=90?'#ef4444':'#FFC72C',borderRadius:10,transition:'width 0.5s'}} />
            </div>
            <div style={{fontSize:13,fontWeight:800,color:'#FFC72C',marginBottom:16,textAlign:'center'}}>
              {course.isFree ? '🎁 مجانية' : `💰 ${course.price?.toLocaleString()} د.ع`}
            </div>
            {course.status === 'upcoming' && course.currentParticipants < course.maxParticipants ? (
              <button onClick={() => setApplying(true)} style={{width:'100%',padding:'12px',background:'#FFC72C',color:'#1a2a4a',border:'none',borderRadius:12,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:800,fontSize:14}}>
                📝 سجّل الآن
              </button>
            ) : course.status === 'upcoming' ? (
              <div style={{textAlign:'center',color:'#ef4444',fontWeight:700,fontSize:13}}>اكتمل عدد المشاركين</div>
            ) : null}
            {msg.text && !applying && (
              <div style={{marginTop:10,padding:'8px 12px',borderRadius:8,background:msg.type==='success'?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)',color:msg.type==='success'?'#10b981':'#ef4444',fontSize:12,fontWeight:700,textAlign:'center'}}>
                {msg.text}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* تفاصيل */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:24}}>
        {[
          { icon:'📅', label:'تاريخ البدء', value: new Date(course.startDate).toLocaleDateString('ar-IQ',{year:'numeric',month:'long',day:'numeric'}) },
          { icon:'🏁', label:'تاريخ الانتهاء', value: new Date(course.endDate).toLocaleDateString('ar-IQ',{year:'numeric',month:'long',day:'numeric'}) },
          course.location && { icon:'📍', label:'الموقع', value: course.location },
          course.category && { icon:'🏷️', label:'الفئة', value: course.category },
          course.status === 'upcoming' && daysLeft > 0 && { icon:'⏰', label:'يبدأ بعد', value: `${daysLeft} يوم` },
        ].filter(Boolean).map((item, i) => (
          <div key={i} style={{background:'#fff',borderRadius:14,padding:'16px',boxShadow:'0 2px 8px rgba(44,62,107,0.06)',border:'1px solid #e5e7eb',display:'flex',gap:12,alignItems:'center'}}>
            <div style={{fontSize:24}}>{item.icon}</div>
            <div>
              <div style={{fontSize:11,color:'#94a3b8',fontWeight:600}}>{item.label}</div>
              <div style={{fontSize:13,fontWeight:800,color:'#1e293b'}}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* وصف الدورة */}
      {course.description && (
        <div style={{background:'#fff',borderRadius:20,padding:24,marginBottom:24,boxShadow:'0 2px 12px rgba(44,62,107,0.07)'}}>
          <h2 style={{fontSize:18,fontWeight:800,color:'#2C3E6B',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
            📋 عن الدورة
          </h2>
          <p style={{fontSize:14,lineHeight:2,color:'#374151',whiteSpace:'pre-line'}}>{course.description}</p>
        </div>
      )}

      {/* الصور */}
      {images.length > 0 && (
        <div style={{background:'#fff',borderRadius:20,padding:24,marginBottom:24,boxShadow:'0 2px 12px rgba(44,62,107,0.07)'}}>
          <h2 style={{fontSize:18,fontWeight:800,color:'#2C3E6B',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
            🖼️ صور الدورة <span style={{fontSize:12,color:'#94a3b8',fontWeight:600}}>({images.length})</span>
          </h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
            {images.slice(0,10).map((img, i) => (
              <div key={img.id} onClick={() => setImageModal(i)}
                style={{cursor:'pointer',borderRadius:12,overflow:'hidden',aspectRatio:'4/3',background:'#f1f5f9',position:'relative',boxShadow:'0 2px 8px rgba(0,0,0,0.08)',transition:'transform 0.2s'}}
                onMouseEnter={e=>e.currentTarget.style.transform='scale(1.02)'}
                onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
                <img src={img.url} alt={img.title||''} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
                {img.title && <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'6px 10px',background:'linear-gradient(transparent,rgba(0,0,0,0.65))',color:'#fff',fontSize:11,fontWeight:700}}>{img.title}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* الفيديوهات */}
      {videos.length > 0 && (
        <div style={{background:'#fff',borderRadius:20,padding:24,marginBottom:24,boxShadow:'0 2px 12px rgba(44,62,107,0.07)'}}>
          <h2 style={{fontSize:18,fontWeight:800,color:'#2C3E6B',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
            🎥 فيديوهات الدورة <span style={{fontSize:12,color:'#94a3b8',fontWeight:600}}>({videos.length})</span>
          </h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
            {videos.map(vid => (
              <div key={vid.id}>
                <YTThumb url={vid.url} title={vid.title} onClick={() => setVideoModal(vid)} />
                {vid.description && <p style={{fontSize:12,color:'#64748b',marginTop:6,lineHeight:1.5}}>{vid.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* نموذج التسجيل */}
      {applying && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>e.target===e.currentTarget&&setApplying(false)}>
          <div style={{background:'#fff',borderRadius:20,padding:'28px 24px',width:'100%',maxWidth:480,maxHeight:'90vh',overflowY:'auto',direction:'rtl',fontFamily:'Cairo,sans-serif'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{fontSize:17,fontWeight:800,color:'#2C3E6B'}}>📝 التسجيل في الدورة</h2>
              <button onClick={() => setApplying(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#94a3b8'}}>✕</button>
            </div>
            <form onSubmit={submit}>
              {[
                {k:'fullName', l:'الاسم الكامل *', req:true},
                {k:'phone', l:'رقم الهاتف *', req:true},
                {k:'email', l:'البريد الإلكتروني'},
                {k:'company', l:'اسم الشركة / المؤسسة'},
              ].map(f => (
                <div key={f.k} style={{marginBottom:14}}>
                  <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:4}}>{f.l}</label>
                  <input required={f.req} value={form[f.k]} onChange={e => setForm(p => ({...p,[f.k]:e.target.value}))}
                    style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e5e7eb',borderRadius:10,fontSize:13,fontFamily:'Cairo,sans-serif',outline:'none',boxSizing:'border-box'}} />
                </div>
              ))}
              <div style={{marginBottom:16}}>
                <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:4}}>الدافع من الانضمام</label>
                <textarea value={form.motivation} onChange={e=>setForm(p=>({...p,motivation:e.target.value}))} rows={3}
                  style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e5e7eb',borderRadius:10,fontSize:13,fontFamily:'Cairo,sans-serif',outline:'none',resize:'vertical',boxSizing:'border-box'}} />
              </div>
              {msg.text && <div style={{padding:'10px 14px',borderRadius:10,background:msg.type==='success'?'#d1fae5':'#fee2e2',color:msg.type==='success'?'#065f46':'#b91c1c',fontSize:13,marginBottom:14,fontWeight:700}}>{msg.text}</div>}
              <button type="submit" disabled={submitting} style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',borderRadius:12,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:800,fontSize:15}}>
                {submitting ? '⏳ جارٍ الإرسال...' : '🚀 أرسل طلب التسجيل'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
