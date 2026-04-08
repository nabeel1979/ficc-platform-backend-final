import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const navLinks = [
  { to: '/', icon: '🏠', title: 'الرئيسية', exact: true },
  { to: '/chambers', icon: '🏛️', title: 'الغرف' },
  { to: '/members', icon: '👥', title: 'أعضاء المجلس' },
  { to: '/shipping', icon: '🚢', title: 'شركات الشحن' },
  { to: '/directory', icon: '📋', title: 'دليل التجار' },
  { to: '/customs-agents', icon: '🏭', title: 'وكلاء الإخراج' },
  { to: '/lawyers', icon: '⚖️', title: 'المحامون' },
  { to: '/news', icon: '📰', title: 'الأخبار' },
  { to: '/startups', icon: '🚀', title: 'ريادة الأعمال' },
  { to: '/courses', icon: '🎓', title: 'الدورات' },
  { to: '/exhibitions', icon: '🎪', title: 'المعارض' },
  { to: '/conferences', icon: '🎤', title: 'المؤتمرات' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const isActive = (l) => l.exact ? loc.pathname === l.to : loc.pathname.startsWith(l.to)

  return (
    <div className="nav-wrapper">
      <div className="nav-top">
        <Link to="/" className="nav-brand">
          <img src="/ficc-logo.jpg" alt="FICC" />
          <div className="nav-brand-text">
            <span className="ar">اتحاد الغرف التجارية العراقية</span>
            <span className="en">Federation of Iraqi Chambers of Commerce</span>
          </div>
        </Link>
        <button className="nav-ham" onClick={() => setOpen(!open)}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      <div className="nav-bar">
        <div className="nav-bar-inner">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} className={`nav-link ${isActive(l) ? 'active' : ''}`}>
              <span className="nav-icon">{l.icon}</span>
              {l.title}
            </Link>
          ))}

          <Link to="/contact"
            style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',borderRadius:'8px',background:'rgba(255,199,44,0.15)',color:'#FFC72C',fontWeight:'700',fontSize:'13px',textDecoration:'none',border:'1px solid rgba(255,199,44,0.3)',fontFamily:'Cairo,sans-serif'}}>
            📞 اتصل بنا
          </Link>
          <Link to="/login" className="nav-login">🔐 دخول</Link>
        </div>
      </div>

      <div className={`nav-mobile ${open ? 'open' : ''}`}>
        <div className="nav-mobile-grid">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
              className={`nav-mobile-item ${isActive(l) ? 'active' : ''}`}>
              <span className="icon">{l.icon}</span>
              {l.title}
            </Link>
          ))}
        </div>
        <div style={{display:'flex',gap:'8px',padding:'0 12px 12px',flexWrap:'wrap'}}>
          <Link to="/register" onClick={() => setOpen(false)}
            style={{flex:1,padding:'10px',borderRadius:'10px',background:'rgba(16,185,129,0.15)',color:'#10b981',fontWeight:'700',fontSize:'13px',textDecoration:'none',border:'1px solid rgba(16,185,129,0.3)',textAlign:'center',fontFamily:'Cairo,sans-serif'}}>
            سجّل نشاطك
          </Link>
          <Link to="/contact" onClick={() => setOpen(false)}
            style={{flex:1,padding:'10px',borderRadius:'10px',background:'rgba(255,199,44,0.15)',color:'#FFC72C',fontWeight:'700',fontSize:'13px',textDecoration:'none',border:'1px solid rgba(255,199,44,0.3)',textAlign:'center',fontFamily:'Cairo,sans-serif'}}>
            📞 اتصل بنا
          </Link>
        </div>
        <Link to="/login" onClick={() => setOpen(false)} className="nav-mobile-login">🔐 تسجيل الدخول</Link>
      </div>
    </div>
  )
}
