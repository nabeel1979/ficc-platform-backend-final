import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import api from '../lib/api'

// Badge واحد للطباعة
function BadgeCard({ subscriber, course }) {
  const courseUrl = `https://ficc.iq/startups/${course?.id}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(courseUrl)}&margin=4&color=1a2a5e`
  const fmt = d => d ? new Date(d).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Baghdad' }) : ''

  return (
    <div style={{
      width: '85mm', height: '54mm',
      background: 'linear-gradient(135deg,#1a2a5e 0%,#2C3E6B 60%,#4A6FA5 100%)',
      borderRadius: '8px',
      padding: '8px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Cairo, sans-serif',
    }}>
      {/* خلفية زخرفية */}
      <div style={{position:'absolute',top:-20,left:-20,width:100,height:100,borderRadius:'50%',background:'rgba(255,199,44,0.08)'}} />
      <div style={{position:'absolute',bottom:-30,right:-30,width:120,height:120,borderRadius:'50%',background:'rgba(255,255,255,0.05)'}} />

      {/* الجزء العلوي */}
      <div style={{display:'flex',alignItems:'center',gap:'6px',zIndex:1}}>
        {/* لوقو */}
        <img src="https://ficc.iq/ficc-logo.jpg" alt="FICC"
          style={{width:32,height:32,borderRadius:6,objectFit:'contain',background:'#fff',padding:2}} />
        <div>
          <div style={{color:'#FFC72C',fontWeight:800,fontSize:'7px',lineHeight:1.2}}>اتحاد الغرف التجارية العراقية</div>
          <div style={{color:'rgba(255,255,255,0.7)',fontSize:'6px'}}>Federation of Iraqi Chambers of Commerce</div>
        </div>
      </div>

      {/* الجزء الأوسط */}
      <div style={{display:'flex',gap:'8px',alignItems:'center',zIndex:1,flex:1,margin:'4px 0'}}>
        {/* صورة العضو */}
        <div style={{width:44,height:44,borderRadius:'50%',overflow:'hidden',border:'2px solid #FFC72C',flexShrink:0,background:'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          {subscriber?.profileImage
            ? <img src={subscriber.profileImage} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
            : <span style={{fontSize:18}}>👤</span>
          }
        </div>
        {/* البيانات */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:'#fff',fontWeight:800,fontSize:'9px',lineHeight:1.3,marginBottom:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
            {subscriber?.fullName}
          </div>
          <div style={{color:'#FFC72C',fontWeight:700,fontSize:'8px',letterSpacing:'0.5px',marginBottom:3}}>
            {subscriber?.subscriberCode || subscriber?.SubscriberCode}
          </div>
          <div style={{color:'rgba(255,255,255,0.8)',fontSize:'6.5px',lineHeight:1.4}}>
            <div>🎓 {course?.title}</div>
            {course?.startDate && <div>📅 {fmt(course.startDate)}{course?.endDate ? ` — ${fmt(course.endDate)}` : ''}</div>}
            {course?.location && <div>📍 {course.location}</div>}
          </div>
        </div>
        {/* QR */}
        <div style={{flexShrink:0,background:'#fff',borderRadius:4,padding:2}}>
          <img src={qrUrl} alt="QR" style={{width:44,height:44,display:'block'}} />
        </div>
      </div>

      {/* الجزء السفلي */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:'1px solid rgba(255,255,255,0.15)',paddingTop:4,zIndex:1}}>
        <div style={{color:'rgba(255,255,255,0.6)',fontSize:'5.5px'}}>ficc.iq</div>
        <div style={{color:'#FFC72C',fontSize:'6px',fontWeight:700}}>✓ عضو مشارك</div>
        <div style={{color:'rgba(255,255,255,0.6)',fontSize:'5.5px',direction:'ltr'}}>{new Date(subscriber?.createdAt||Date.now()).toLocaleDateString('en-GB')}</div>
      </div>
    </div>
  )
}

// صفحة A4 تحتوي 4 badges
export default function CourseBadge() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([]) // IDs المختارين

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${courseId}`),
      api.get(`/courses/${courseId}/applications`)
    ]).then(([cr, ar]) => {
      setCourse(cr.data)
      // جلب بيانات المتابعين من الطلبات
      const apps = ar.data || []
      setSubscribers(apps)
      setSelected(apps.map(a => a.id))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [courseId])

  const printAll = () => window.print()

  const filtered = subscribers.filter(s => selected.includes(s.id))

  // تقسيم إلى مجموعات كل 4
  const pages = []
  for (let i = 0; i < filtered.length; i += 4) {
    pages.push(filtered.slice(i, i + 4))
  }

  if (loading) return (
    <div style={{textAlign:'center',padding:60,fontFamily:'Cairo,sans-serif',color:'#64748b'}}>⏳ جارٍ التحميل...</div>
  )

  return (
    <div style={{fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      {/* شريط التحكم — لا يُطبع */}
      <div className="no-print" style={{background:'#1a2a5e',padding:'12px 24px',display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{color:'#FFC72C',fontWeight:800,fontSize:15}}>🪪 Badges — {course?.title}</div>
        <div style={{color:'rgba(255,255,255,0.7)',fontSize:12}}>{filtered.length} عضو • {pages.length} صفحة</div>
        <button onClick={printAll}
          style={{marginRight:'auto',padding:'8px 20px',background:'#FFC72C',color:'#1a2a5e',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:800,fontSize:13}}>
          🖨️ طباعة الكل
        </button>
        <button onClick={() => window.close()}
          style={{padding:'8px 16px',background:'rgba(255,255,255,0.1)',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:13}}>
          ✕ إغلاق
        </button>
      </div>

      {/* الصفحات */}
      {pages.length === 0 ? (
        <div style={{textAlign:'center',padding:60,color:'#94a3b8',fontSize:14}}>لا يوجد مشاركون مسجلون</div>
      ) : pages.map((group, pi) => (
        <div key={pi} className="print-page" style={{
          width:'210mm', minHeight:'297mm',
          background:'#fff',
          padding:'15mm',
          boxSizing:'border-box',
          display:'grid',
          gridTemplateColumns:'1fr 1fr',
          gridTemplateRows:'1fr 1fr',
          gap:'10mm',
          alignContent:'start',
          pageBreakAfter: pi < pages.length-1 ? 'always' : 'auto'
        }}>
          {group.map((sub, i) => (
            <div key={sub.id || i} style={{display:'flex',justifyContent:'center',alignItems:'center'}}>
              <BadgeCard subscriber={sub.subscriber || sub} course={course} />
            </div>
          ))}
        </div>
      ))}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { page-break-after: always; }
          body { margin: 0; padding: 0; }
        }
        @page { size: A4; margin: 0; }
      `}</style>
    </div>
  )
}
