import { Routes, Route, Navigate } from 'react-router-dom'

// Global spinner style
const spinnerStyle = document.createElement('style')
spinnerStyle.textContent = `@keyframes spin { to { transform: rotate(360deg) } } .ficc-spinner { display:inline-block;width:36px;height:36px;border:4px solid #e2e8f0;border-top-color:#2C3E6B;border-radius:50%;animation:spin 0.8s linear infinite; }`
document.head.appendChild(spinnerStyle)
import Startups from './pages/Startups'
import Courses from './pages/Courses'
import TrackRequest from './pages/TrackRequest'
import JoinPage from './pages/JoinPage'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Chambers, { ChamberDetailPage } from './pages/Chambers'
import Members, { MemberDetailPage } from './pages/Members'
import ShippingCompanies, { ShippingDetailPage } from './pages/ShippingCompanies'
import News, { NewsDetailPage } from './pages/News'
import Reports from './pages/Reports'
import Exhibitions from './pages/Exhibitions'
import Conferences from './pages/Conferences'
import TraderDirectory, { TraderDetailPage } from './pages/TraderDirectory'
import CustomsAgents from './pages/CustomsAgents'
import Lawyers from './pages/Lawyers'
import FormsPage, { FormFiller } from './pages/Forms'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import RegisterRequest from './pages/RegisterRequest'
import ReviewPage from './pages/ReviewPage'
import Correspondence from './pages/Correspondence'
import Contact from './pages/Contact'
import Subscribe from './pages/Subscribe'
import Chat from './pages/Chat'

import { useState, useEffect } from 'react'
import api from './lib/api'

const STATIC_SOCIAL = [
  { icon: '📘', bg: '#1877F2', key: 'facebook_url',   default: 'https://www.facebook.com/share/1CDYF3R52T/?mibextid=wwXIfr', label: 'فيسبوك' },
  { icon: '📸', bg: '#E1306C', key: 'instagram_url',  default: 'https://www.instagram.com/ficc.iraq', label: 'انستغرام' },
  { icon: '🐦', bg: '#000000', key: 'twitter_url',    default: 'https://x.com/ficc_iq', label: 'تويتر' },
  { icon: '🎵', bg: '#010101', key: 'tiktok_url',     default: 'https://www.tiktok.com/@ficc.iraq', label: 'تيكتوك' },
  { icon: '💬', bg: '#25D366', key: 'whatsapp_url',   default: 'https://chat.whatsapp.com/LIJss6nYXw0Iz27tw9ya5D', label: 'واتساب' },
  { icon: '▶️', bg: '#FF0000', key: 'youtube_channel_id', default: 'UC9CtGm0zD50U7J4PJPOvMog', label: 'يوتيوب', isYoutube: true },
]

function SocialSidebar() {
  const [settings, setSettings] = useState({})
  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data||{})).catch(()=>{})
  }, [])

  const links = STATIC_SOCIAL.map(s => ({
    ...s,
    href: s.isYoutube
      ? `https://www.youtube.com/channel/${settings[s.key] || s.default}`
      : (settings[s.key] || s.default)
  }))

  return (
    <div style={{
      position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)',
      zIndex: 999, display: 'flex', flexDirection: 'column', gap: '4px'
    }}>
      {links.map((s, i) => (
        <a key={i} href={s.href} target="_blank" rel="noreferrer" title={s.label}
          style={{
            width: '40px', height: '40px', background: s.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', textDecoration: 'none', borderRadius: '0 8px 8px 0',
            boxShadow: '2px 2px 8px rgba(0,0,0,0.2)', transition: 'width 0.2s, transform 0.2s',
            overflow: 'hidden'
          }}
          onMouseEnter={e => { e.currentTarget.style.width='100px'; e.currentTarget.style.paddingLeft='10px'; e.currentTarget.style.justifyContent='flex-start'; e.currentTarget.style.gap='8px' }}
          onMouseLeave={e => { e.currentTarget.style.width='40px'; e.currentTarget.style.paddingLeft='0'; e.currentTarget.style.justifyContent='center'; e.currentTarget.style.gap='0' }}
        >
          <span style={{flexShrink:0}}>{s.icon}</span>
          <span style={{color:'#fff',fontSize:'12px',fontWeight:'700',fontFamily:'Cairo,sans-serif',whiteSpace:'nowrap',opacity:0.9}}>{s.label}</span>
        </a>
      ))}
    </div>
  )
}

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      {/* <SocialSidebar /> */}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}


// Helper: فحص صلاحية Admin أو SuperAdmin
export function isAdminUser(user) {
  const role = user?.role || user?.Role || ''
  return role === 'Admin' || role === 'SuperAdmin'
}
export function isSuperAdmin(user) {
  const role = user?.role || user?.Role || ''
  return role === 'SuperAdmin'
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem('ficc_token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public pages with Navbar */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/chambers" element={<Layout><Chambers /></Layout>} />
      <Route path="/chambers/:id" element={<Layout><ChamberDetailPage /></Layout>} />
      <Route path="/members" element={<Layout><Members /></Layout>} />
      <Route path="/members/:id" element={<Layout><MemberDetailPage /></Layout>} />
      <Route path="/shipping" element={<Layout><ShippingCompanies /></Layout>} />
      <Route path="/shipping/:id" element={<Layout><ShippingDetailPage /></Layout>} />
      <Route path="/news" element={<Layout><News /></Layout>} />
      <Route path="/news/:id" element={<Layout><NewsDetailPage /></Layout>} />
      <Route path="/reports" element={<Layout><Reports /></Layout>} />
      <Route path="/exhibitions" element={<Layout><Exhibitions /></Layout>} />
      <Route path="/conferences" element={<Layout><Conferences /></Layout>} />
      <Route path="/directory" element={<Layout><TraderDirectory /></Layout>} />
      <Route path="/directory/:id" element={<Layout><TraderDetailPage /></Layout>} />
      <Route path="/customs-agents" element={<Layout><CustomsAgents /></Layout>} />
      <Route path="/lawyers" element={<Layout><Lawyers /></Layout>} />
      <Route path="/courses" element={<Courses />} />
          <Route path="/startups" element={<Layout><Startups /></Layout>} />
      <Route path="/track-request" element={<TrackRequest />} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/contact" element={<Layout><Contact /></Layout>} />
      <Route path="/subscribe" element={<Layout><Subscribe /></Layout>} />
      <Route path="/chat" element={<Layout><Chat /></Layout>} />
      <Route path="/register" element={<Layout><RegisterRequest /></Layout>} />
      <Route path="/register/:entityType" element={<Layout><RegisterRequest /></Layout>} />
      <Route path="/forms" element={<Layout><FormsPage /></Layout>} />
      <Route path="/forms/:token" element={<Layout><FormFillerRoute /></Layout>} />

      {/* Auth & Admin (no footer) */}
      <Route path="/login" element={<Login />} />
      <Route path="/review/:token" element={<ReviewPage />} />
      <Route path="/register" element={<RegisterRequest />} />
      <Route path="/register/:entityType" element={<RegisterRequest />} />
      <Route path="/admin/*" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
      <Route path="/correspondence/*" element={<PrivateRoute><Layout><Correspondence /></Layout></PrivateRoute>} />
    </Routes>
  )
}

function FormFillerRoute() {
  const token = window.location.pathname.split('/').pop()
  return <FormFiller token={token} />
}
