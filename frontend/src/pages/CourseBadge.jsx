import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../lib/api'

export default function CourseBadge() {
  const params = useParams()
  const courseId = params.courseId
  const [course, setCourse] = useState(null)
  const [apps, setApps] = useState([])
  const [status, setStatus] = useState('loading') // loading | error | ready
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    if (!courseId) { setStatus('error'); setErrMsg('courseId غير موجود'); return }
    // قرأ التوكن من URL إذا موجود
    const urlToken = new URLSearchParams(window.location.search).get('t')
    if (urlToken) localStorage.setItem('ficc_token', urlToken)

    api.get('/courses/' + courseId)
      .then(r => setCourse(r.data))
      .catch(e => { setStatus('error'); setErrMsg('خطأ course: ' + e?.response?.status) })

    api.get('/courses/' + courseId + '/applications')
      .then(r => { setApps(r.data || []); setStatus('ready') })
      .catch(e => { setStatus('error'); setErrMsg('خطأ applications: ' + (e?.response?.status || e?.message)) })
  }, [courseId])

  if (status === 'loading') {
    return (
      <div style={{padding:40, textAlign:'center', fontFamily:'Cairo,sans-serif', color:'#333', background:'#f0f4f8', minHeight:'100vh'}}>
        <p>⏳ جارٍ التحميل... (courseId: {courseId})</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{padding:40, textAlign:'center', fontFamily:'Cairo,sans-serif', color:'red', background:'#fff', minHeight:'100vh'}}>
        <p>❌ خطأ: {errMsg}</p>
      </div>
    )
  }

  const qr = (url) => `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(url)}&margin=4`
  const fmt = d => {
    try { return d ? new Date(d).toLocaleDateString('ar-IQ', { year:'numeric', month:'long', day:'numeric', timeZone:'Asia/Baghdad' }) : '' } catch { return '' }
  }

  const courseUrl = 'https://ficc.iq/startups/' + courseId

  // تجميع chunks of 4
  const pages = []
  for (let i = 0; i < apps.length; i += 4) pages.push(apps.slice(i, i + 4))

  return (
    <div style={{fontFamily:'Cairo,sans-serif', direction:'rtl', background:'#f0f4f8', minHeight:'100vh'}}>

      {/* شريط التحكم */}
      <div className="no-print" style={{background:'#1a2a5e', padding:'12px 24px', display:'flex', gap:12, alignItems:'center', position:'sticky', top:0, zIndex:100}}>
        <span style={{color:'#FFC72C', fontWeight:800, fontSize:15}}>🪪 Badges — {course?.title || '...'}</span>
        <span style={{color:'rgba(255,255,255,0.6)', fontSize:12}}>{apps.length} مشارك</span>
        <button onClick={() => window.print()}
          style={{marginRight:'auto', padding:'8px 20px', background:'#FFC72C', color:'#1a2a5e', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'Cairo,sans-serif', fontWeight:800, fontSize:13}}>
          🖨️ طباعة
        </button>
        <button onClick={() => window.close()}
          style={{padding:'8px 14px', background:'rgba(255,255,255,0.15)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'Cairo,sans-serif', fontSize:13}}>✕</button>
      </div>

      {apps.length === 0 ? (
        <div style={{textAlign:'center', padding:60, color:'#666', fontSize:14}}>لا يوجد مشاركون بعد</div>
      ) : pages.map((group, pi) => (
        <div key={pi} className="print-page" style={{
          width:'210mm', minHeight:'297mm', background:'#fff',
          margin:'20px auto', padding:'15mm', boxSizing:'border-box',
          display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'auto auto', gap:'12mm',
        }}>
          {group.map((app, i) => {
            const sub = app.subscriber || app
            const name = sub.fullName || app.fullName || app.FullName || ''
            const code = sub.subscriberCode || sub.SubscriberCode || ''
            const photo = sub.profileImage || sub.ProfileImage || ''
            return (
              <div key={i} style={{
                width:'85mm', height:'54mm', background:'linear-gradient(135deg,#1a2a5e,#2C3E6B,#4A6FA5)',
                borderRadius:'8px', padding:'8px', boxSizing:'border-box', display:'flex', flexDirection:'column',
                justifyContent:'space-between', position:'relative', overflow:'hidden',
              }}>
                {/* Header */}
                <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                  <img src="https://ficc.iq/ficc-logo.jpg" style={{width:28, height:28, borderRadius:5, background:'#fff', padding:1, objectFit:'contain'}} />
                  <div>
                    <div style={{color:'#FFC72C', fontWeight:800, fontSize:'7px'}}>اتحاد الغرف التجارية العراقية</div>
                    <div style={{color:'rgba(255,255,255,0.6)', fontSize:'5.5px'}}>Federation of Iraqi Chambers of Commerce</div>
                  </div>
                </div>

                {/* Body */}
                <div style={{display:'flex', gap:'7px', alignItems:'center', flex:1, margin:'4px 0'}}>
                  {/* صورة */}
                  <div style={{width:42, height:42, borderRadius:'50%', overflow:'hidden', border:'2px solid #FFC72C', flexShrink:0, background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                    {photo ? <img src={photo} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <span style={{fontSize:18}}>👤</span>}
                  </div>
                  {/* بيانات */}
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{color:'#fff', fontWeight:800, fontSize:'9px', lineHeight:1.3, marginBottom:2}}>{name}</div>
                    <div style={{color:'#FFC72C', fontWeight:700, fontSize:'7.5px', letterSpacing:'0.5px', marginBottom:3}}>{code}</div>
                    <div style={{color:'rgba(255,255,255,0.75)', fontSize:'6px', lineHeight:1.5}}>
                      <div>🎓 {course?.title}</div>
                      {course?.startDate && <div>📅 {fmt(course.startDate)}{course?.endDate ? ' — ' + fmt(course.endDate) : ''}</div>}
                      {course?.location && <div>📍 {course.location}</div>}
                    </div>
                  </div>
                  {/* QR */}
                  <div style={{background:'#fff', borderRadius:4, padding:2, flexShrink:0}}>
                    <img src={qr(courseUrl)} style={{width:42, height:42, display:'block'}} />
                  </div>
                </div>

                {/* Footer */}
                <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid rgba(255,255,255,0.15)', paddingTop:3}}>
                  <span style={{color:'rgba(255,255,255,0.5)', fontSize:'5px'}}>ficc.iq</span>
                  <span style={{color:'#FFC72C', fontSize:'6px', fontWeight:700}}>✓ عضو مشارك</span>
                  <span style={{color:'rgba(255,255,255,0.5)', fontSize:'5px'}}>{new Date().getFullYear()}</span>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
          .print-page { margin: 0 !important; page-break-after: always; box-shadow: none !important; }
        }
        @page { size: A4; margin: 0; }
      `}</style>
    </div>
  )
}
