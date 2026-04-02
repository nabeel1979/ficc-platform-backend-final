import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../lib/api'



const services = [
  { icon: '🏛️', title: 'الغرف التجارية', desc: 'دليل جميع الغرف في المحافظات', link: '/chambers' },
  { icon: '👥', title: 'دليل التجار', desc: 'ابحث عن الشركات والتجار', link: '/directory' },
  { icon: '🏭', title: 'وكلاء الإخراج', desc: 'وكلاء التخليص الكمركي', link: '/customs-agents' },
  { icon: '⚖️', title: 'المحامون', desc: 'دليل المحامين التجاريين', link: '/lawyers' },
  { icon: '📰', title: 'الأخبار', desc: 'آخر أخبار الاتحاد', link: '/news' },
  { icon: '🚢', title: 'شركات الشحن', desc: 'دليل شركات الشحن والنقل', link: '/shipping' },
  { icon: '📝', title: 'الاستمارات', desc: 'خدمات إلكترونية', link: '/forms' },
  { icon: '🎪', title: 'المعارض', desc: 'المعارض التجارية في العراق', link: '/exhibitions' },
  { icon: '🎤', title: 'المؤتمرات', desc: 'المؤتمرات والفعاليات', link: '/conferences' },
]

export default function Home() {
  const [stats, setStats] = useState([
    { label: 'غرفة تجارية', value: '...', icon: '🏛️' },
    { label: 'عضو مسجّل من الهيئة العامة', value: '...', icon: '👥' },
    { label: 'زيارة للموقع', value: '...', icon: '👁️' },
    { label: 'شركة في الدليل', value: '...', icon: '🏢' },
  ])

  useEffect(() => {
    // Track visit
    api.post('/visits/track').catch(()=>{})
    // Load stats
    Promise.all([
      api.get('/chambers/stats').catch(()=>({data:{}})),
      api.get('/visits/count').catch(()=>({data:{count:0}})),
      api.get('/traderdirectory').catch(()=>({data:[]})),
    ]).then(([ch, vis, tr]) => {
      const d = ch.data
      const visits = vis.data?.count || 0
      const traders = Array.isArray(tr.data) ? tr.data.length : (tr.data?.items?.length || 0)
      setStats([
        { label: 'غرفة تجارية', value: d.chamberCount ? d.chamberCount+'+' : '1+', icon: '🏛️' },
        { label: 'عضو مسجّل من الهيئة العامة', value: d.totalAssembly ? d.totalAssembly.toLocaleString('en-US') : '...', icon: '👥' },
        { label: 'زيارة للموقع', value: visits > 999 ? (visits/1000).toFixed(1)+'K' : visits.toLocaleString('en-US'), icon: '👁️' },
        { label: 'شركة في الدليل', value: traders > 0 ? traders+'+' : '...', icon: '🏢' },
      ])
    })
  }, [])

  return (
    <>
      <section className="hero">
        <img src="/ficc-logo.jpg" alt="FICC" />
        <h1>اتحاد الغرف التجارية العراقية</h1>
        <p className="sub-en">FEDERATION OF IRAQI CHAMBERS OF COMMERCE</p>
        <p className="sub-ar">المرجع الأول للتجارة والأعمال في العراق</p>
        <div className="hero-btns">
          <Link to="/subscribe" className="btn-hero-primary" style={{background:'rgba(255,199,44,0.2)',borderColor:'rgba(255,199,44,0.5)',color:'#FFC72C'}}>🔔 سجّل متابعاً</Link>
          <Link to="/register" className="btn-hero-outline">✅ سجّل نشاطك</Link>
          <Link to="/directory" className="btn-hero-outline">🔍 دليل التجار والشركات</Link>
        </div>
      </section>

      <section className="stats">
        <div className="stats-grid">
          {stats.map(s => (
            <div key={s.label}>
              <div style={{fontSize:'26px',marginBottom:'4px'}}>{s.icon}</div>
              <div className="num">{s.value}</div>
              <div className="lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <AboutSection />
      <LatestNewsSection />
      <YouTubeSection />

      <section className="services">
        <div className="section-heading">
          <h2>خدماتنا الإلكترونية</h2>
          <div className="line"></div>
        </div>
        <div className="services-grid">
          {services.map(s => (
            <Link key={s.title} to={s.link} className="service-card">
              <span className="s-icon">{s.icon}</span>
              <span className="s-title">{s.title}</span>
              <span className="s-desc">{s.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* مجلس الاتحاد */}
      <CouncilMembers />
    </>
  )
}

function CouncilMembers() {
  const [members, setMembers] = useState([])
  useEffect(() => {
    api.get('/members').then(r => setMembers((Array.isArray(r.data)?r.data:[]).slice(0,6))).catch(()=>{})
  }, [])
  if (!members.length) return null
  return (
    <section style={{background:'linear-gradient(135deg,#1a1a2e,#2C3E6B)',padding:'48px 20px'}}>
      <div style={{maxWidth:'1100px',margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
            <div style={{width:'40px',height:'2px',background:'rgba(255,199,44,0.5)'}}></div>
            <span style={{color:'#FFC72C',fontSize:'12px',fontWeight:'700',letterSpacing:'2px'}}>COUNCIL MEMBERS</span>
            <div style={{width:'40px',height:'2px',background:'rgba(255,199,44,0.5)'}}></div>
          </div>
          <h2 style={{color:'#fff',fontSize:'24px',fontWeight:'800',margin:'0 0 8px'}}>👥 مجلس الاتحاد</h2>
          <p style={{color:'rgba(255,255,255,0.6)',fontSize:'14px',margin:0}}>ممثلو القطاع الخاص من جميع محافظات العراق</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'16px',marginBottom:'28px'}}>
          {members.map(m => (
            <a key={m.id} href={`/members/${m.id}`} style={{textDecoration:'none'}}>
              <div style={{background:'rgba(255,255,255,0.07)',borderRadius:'16px',padding:'20px 14px',textAlign:'center',border:'1px solid rgba(255,255,255,0.1)',transition:'all 0.2s',cursor:'pointer'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.13)';e.currentTarget.style.transform='translateY(-4px)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.07)';e.currentTarget.style.transform=''}}>
                <div style={{width:'64px',height:'64px',borderRadius:'50%',border:'2px solid rgba(255,199,44,0.5)',overflow:'hidden',margin:'0 auto 12px',background:'rgba(255,255,255,0.1)'}}>
                  {m.photoUrl
                    ? <img src={m.photoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',fontWeight:'800',color:'#FFC72C'}}>{(m.fullName||'?')[0]}</div>
                  }
                </div>
                <p style={{color:'#fff',fontWeight:'700',fontSize:'13px',margin:'0 0 4px'}}>{m.fullName}</p>
                {m.title && <p style={{color:'#FFC72C',fontSize:'11px',fontWeight:'600',margin:'0 0 4px'}}>{m.title}</p>}
                {m.chamberName && <p style={{color:'rgba(255,255,255,0.55)',fontSize:'11px',margin:0}}>{m.chamberName}</p>}
              </div>
            </a>
          ))}
        </div>
        <div style={{textAlign:'center'}}>
          <a href="/members" style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'12px 28px',borderRadius:'10px',background:'rgba(255,199,44,0.15)',color:'#FFC72C',fontWeight:'700',fontSize:'14px',textDecoration:'none',border:'1px solid rgba(255,199,44,0.3)',fontFamily:'Cairo,sans-serif'}}>
            عرض جميع الأعضاء ←
          </a>
        </div>
      </div>
    </section>
  )
}

function LatestNewsSection() {
  const [news, setNews] = useState([])
  useEffect(() => {
    api.get('/news?page=1&pageSize=4').then(r => {
      const items = r.data?.items || r.data || []
      setNews(Array.isArray(items) ? items.slice(0,4) : [])
    }).catch(()=>{})
  }, [])

  if (!news.length) return null

  const timeAgo = d => {
    if (!d) return ''
    try {
      const diff = Date.now() - new Date(d).getTime()
      const h = Math.floor(diff/3600000)
      if (h < 24) return `منذ ${h} ساعة`
      const days = Math.floor(h/24)
      return `منذ ${days} يوم`
    } catch { return '' }
  }

  return (
    <section style={{padding:'40px 16px',background:'#F5F7FA',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      <div style={{maxWidth:'1200px',margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{width:'4px',height:'32px',background:'linear-gradient(#2C3E6B,#FFC72C)',borderRadius:'4px'}}></div>
            <h2 style={{color:'#2C3E6B',fontWeight:'900',fontSize:'22px',margin:0}}>آخر الأخبار</h2>
          </div>
          <a href="/news" style={{color:'#4A6FA5',fontSize:'14px',fontWeight:'700',textDecoration:'none',display:'flex',alignItems:'center',gap:'4px'}}>
            كل الأخبار ←
          </a>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'16px'}}>
          {news.map(n => {
            let img = n.imageUrl
            if (!img && n.images) { try { const imgs = JSON.parse(n.images); if(imgs.length>0) img=imgs[0] } catch {} }
            // تأكد من المسار الكامل
            if (img && img.startsWith('/uploads/')) img = 'https://ficc.iq' + img
            const getYTId = url => { if(!url) return null; const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([^?&\s]+)/); return m?m[1]:null }
            const ytId = getYTId(n.videoUrl)
            const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null
            const finalImg = img || ytThumb
            return (
              <a key={n.id} href={`/news/${n.id}`} style={{background:'#fff',borderRadius:'16px',overflow:'hidden',boxShadow:'0 2px 12px rgba(44,62,107,0.08)',border:'1px solid #eef0f5',textDecoration:'none',display:'flex',flexDirection:'column',transition:'transform 0.2s'}}
                onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'}
                onMouseLeave={e=>e.currentTarget.style.transform=''}>
                {finalImg ? (
                  <div style={{height:'160px',overflow:'hidden',flexShrink:0,position:'relative'}}>
                    <img src={finalImg} alt={n.title} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                    {ytId && <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.3)'}}>
                      <div style={{width:'44px',height:'44px',borderRadius:'50%',background:'rgba(255,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>▶</div>
                    </div>}
                  </div>
                ) : (
                  <div style={{height:'80px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px'}}>📰</div>
                )}
                <div style={{padding:'14px 16px',flex:1,display:'flex',flexDirection:'column',gap:'6px'}}>
                  <h3 style={{color:'#1f2937',fontWeight:'800',fontSize:'14px',margin:0,lineHeight:'1.6'}}>{n.title}</h3>
                  <p style={{color:'#888',fontSize:'12px',margin:0}}>🕐 {timeAgo(n.publishedAt||n.createdAt)}</p>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function AboutSection() {
  const [s, setS] = useState({})
  useEffect(() => {
    api.get('/settings').then(r => setS(r.data||{})).catch(()=>{})
  }, [])

  const g = (k, def='') => s[k] || def

  return (
    <section style={{background:'#fff',padding:'48px 20px'}}>
      <div style={{maxWidth:'1100px',margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'48px',alignItems:'center'}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'18px'}}>
            <div style={{width:'5px',height:'40px',background:'#FFC72C',borderRadius:'4px'}}></div>
            <h2 style={{color:'#2C3E6B',fontSize:'24px',fontWeight:'800',margin:0}}>{g('about_title','نبذة عن الاتحاد')}</h2>
          </div>
          <p style={{color:'#444',fontSize:'15px',lineHeight:'2',marginBottom:'14px',textAlign:'right'}}>{g('about_text1')}</p>
          <p style={{color:'#666',fontSize:'14px',lineHeight:'1.9',marginBottom:'24px',textAlign:'right'}}>{g('about_text2')}</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:'10px'}}>
            {[g('about_badge1'),g('about_badge2'),g('about_badge3'),g('about_badge4')].filter(Boolean).map(t => (
              <span key={t} style={{background:'#EEF2FF',color:'#2C3E6B',padding:'6px 14px',borderRadius:'20px',fontSize:'13px',fontWeight:'600',border:'1px solid #c7d2fe'}}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
          {[
            {icon:'🎯',tk:'vision_title',dk:'vision_text'},
            {icon:'🚀',tk:'mission_title',dk:'mission_text'},
            {icon:'⚖️',tk:'independence_title',dk:'independence_text'},
            {icon:'🤲',tk:'partnership_title',dk:'partnership_text'},
          ].map(c => (
            <div key={c.tk} style={{background:'#F8F9FA',borderRadius:'14px',padding:'16px',border:'1px solid #eef0f5'}}>
              <div style={{fontSize:'28px',marginBottom:'8px'}}>{c.icon}</div>
              <h4 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'14px',margin:'0 0 6px'}}>{g(c.tk)}</h4>
              <p style={{color:'#777',fontSize:'12px',lineHeight:'1.6',margin:0}}>{g(c.dk)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function RegisterSection() {
  const PUBLIC_TYPES = [
    { key: 'trader',   icon: '🏢', label: 'دليل الشركات والتجار', color: '#059669', url: '/register/trader',   bg: 'linear-gradient(135deg,#d1fae5,#a7f3d0)' },
    { key: 'lawyer',   icon: '⚖️', label: 'المحامون',             color: '#7c3aed', url: '/register/lawyer',   bg: 'linear-gradient(135deg,#ede9fe,#ddd6fe)' },
    { key: 'agent',    icon: '🏭', label: 'وكلاء الإخراج',        color: '#ea580c', url: '/register/agent',    bg: 'linear-gradient(135deg,#ffedd5,#fed7aa)' },
    { key: 'shipping', icon: '🚢', label: 'شركات الشحن',          color: '#0369a1', url: '/register/shipping', bg: 'linear-gradient(135deg,#dbeafe,#bfdbfe)' },
  ]
  return (
    <section style={{background:'linear-gradient(160deg,#1a1a2e,#2C3E6B)',padding:'56px 20px'}}>
      <div style={{maxWidth:'1100px',margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:'36px'}}>
          <h2 style={{color:'white',fontWeight:'900',fontSize:'26px',margin:'0 0 8px'}}>📋 سجّل نشاطك التجاري</h2>
          <p style={{color:'rgba(255,255,255,0.65)',fontSize:'15px',margin:0}}>أضف نشاطك إلى قواعد بيانات اتحاد الغرف التجارية العراقية</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:'20px',marginBottom:'28px'}}>
          {PUBLIC_TYPES.map(t => (
            <a key={t.key} href={t.url}
              style={{background:'white',borderRadius:'20px',padding:'28px 20px',textAlign:'center',
                textDecoration:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.2)',
                transition:'all 0.2s',display:'block',overflow:'hidden',position:'relative'}}>
              {/* Background gradient blob */}
              <div style={{position:'absolute',top:0,left:0,right:0,height:'70px',background:t.bg,opacity:0.6}}></div>
              <div style={{position:'relative',zIndex:1}}>
                <div style={{fontSize:'44px',marginBottom:'12px',filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'}}>{t.icon}</div>
                <div style={{fontWeight:'800',color:'#1e293b',fontSize:'15px',marginBottom:'14px',fontFamily:'Cairo,sans-serif'}}>{t.label}</div>
                <div style={{background:`linear-gradient(135deg,${t.color},${t.color}cc)`,color:'white',padding:'10px 16px',borderRadius:'10px',fontSize:'13px',fontWeight:'700',fontFamily:'Cairo,sans-serif',boxShadow:`0 4px 12px ${t.color}40`}}>
                  تقديم الطلب
                </div>
                <div style={{marginTop:'10px'}}>
                  <span onClick={e=>{e.preventDefault();navigator.clipboard.writeText(window.location.origin+t.url);alert('تم نسخ الرابط ✅')}}
                    style={{color:'#94a3b8',fontSize:'11px',cursor:'pointer',textDecoration:'none'}}>
                    🔗 نسخ الرابط المباشر
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div style={{textAlign:'center'}}>
          <a href="/join"
            style={{display:'inline-flex',alignItems:'center',gap:'10px',padding:'14px 36px',borderRadius:'14px',
              background:'#FFC72C',color:'#1a1a2e',textDecoration:'none',
              fontFamily:'Cairo,sans-serif',fontWeight:'800',fontSize:'15px',
              boxShadow:'0 4px 20px rgba(255,199,44,0.4)'}}>
            ✅ انضم كعضو في الاتحاد
          </a>
        </div>
      </div>
    </section>
  )
}

function YouTubeSection() {
  const [videos, setVideos] = useState([])
  const CHANNEL_ID = 'UC9CtGm0zD50U7J4PJPOvMog'

  useEffect(() => {
    // Use YouTube RSS feed via CORS proxy
    fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`)
      .then(r => r.text())
      .then(xml => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(xml, 'text/xml')
        const entries = Array.from(doc.querySelectorAll('entry')).slice(0,6)
        const vids = entries.map(e => ({
          id: e.querySelector('videoId')?.textContent,
          title: e.querySelector('title')?.textContent,
          published: e.querySelector('published')?.textContent,
          thumb: e.querySelector('thumbnail')?.getAttribute('url') || `https://img.youtube.com/vi/${e.querySelector('videoId')?.textContent}/mqdefault.jpg`
        })).filter(v => v.id)
        setVideos(vids)
      }).catch(() => {
        // Fallback: show channel link
        setVideos([])
      })
  }, [])

  return (
    <section style={{background:'linear-gradient(135deg,#1a1a2e,#2C3E6B)',padding:'48px 20px'}}>
      <div style={{maxWidth:'1100px',margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px',flexWrap:'wrap',gap:'12px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{width:'44px',height:'44px',borderRadius:'50%',background:'#FF0000',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0}}>▶</div>
            <div>
              <h2 style={{color:'#fff',fontSize:'20px',fontWeight:'800',margin:0}}>قناتنا على يوتيوب</h2>
              <p style={{color:'rgba(255,255,255,0.6)',fontSize:'13px',margin:0}}>اتحاد الغرف التجارية العراقية</p>
            </div>
          </div>
          <a href={`https://www.youtube.com/channel/${CHANNEL_ID}`} target="_blank" rel="noreferrer"
            style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 20px',borderRadius:'10px',background:'#FF0000',color:'#fff',fontWeight:'700',fontSize:'13px',textDecoration:'none',fontFamily:'Cairo,sans-serif'}}>
            🔔 اشترك بالقناة
          </a>
        </div>

        {videos.length > 0 ? (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'16px'}}>
            {videos.map(v => (
              <a key={v.id} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer"
                style={{background:'rgba(255,255,255,0.07)',borderRadius:'14px',overflow:'hidden',textDecoration:'none',border:'1px solid rgba(255,255,255,0.1)',transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.13)';e.currentTarget.style.transform='translateY(-3px)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.07)';e.currentTarget.style.transform=''}}>
                <div style={{position:'relative',paddingBottom:'56.25%',height:0,overflow:'hidden'}}>
                  <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt={v.title}
                    style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',objectFit:'cover'}} />
                  <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.2)'}}>
                    <div style={{width:'48px',height:'48px',borderRadius:'50%',background:'rgba(255,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',boxShadow:'0 4px 12px rgba(0,0,0,0.4)'}}>▶</div>
                  </div>
                </div>
                <div style={{padding:'12px 14px'}}>
                  <p style={{color:'#fff',fontWeight:'700',fontSize:'13px',margin:0,lineHeight:'1.5',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{v.title}</p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div style={{textAlign:'center',padding:'32px 0'}}>
            <a href={`https://www.youtube.com/channel/${CHANNEL_ID}`} target="_blank" rel="noreferrer"
              style={{display:'inline-flex',alignItems:'center',gap:'10px',padding:'16px 32px',borderRadius:'14px',background:'rgba(255,0,0,0.2)',color:'#fff',fontWeight:'700',fontSize:'15px',textDecoration:'none',fontFamily:'Cairo,sans-serif',border:'2px solid rgba(255,0,0,0.4)'}}>
              ▶ &nbsp; زيارة قناة اتحاد الغرف التجارية العراقية
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
