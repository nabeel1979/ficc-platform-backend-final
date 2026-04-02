import { Link } from 'react-router-dom'

const social = [
  { icon: null, imgIcon: '/facebook-icon.jpg', label: 'فيسبوك',    href: 'https://www.facebook.com/share/1CDYF3R52T/?mibextid=wwXIfr', bg: '#1877F2', color: '#fff' },
  { icon: null, imgIcon: '/instagram-icon.jpg', label: 'انستغرام',  href: 'https://www.instagram.com/ficc.iraq', bg: '#E1306C', color: '#fff' },
  { icon: null, imgIcon: '/x-icon.jpg', label: 'تويتر / X', href: 'https://x.com/ficc_iq',              bg: '#000000', color: '#fff' },
  { icon: null, imgIcon: '/tiktok-icon.jpg', label: 'تيكتوك',    href: 'https://www.tiktok.com/@ficc.iraq', bg: '#010101', color: '#fff' },
  { icon: null, imgIcon: '/whatsapp-icon.jpg', label: 'واتساب',    href: 'https://chat.whatsapp.com/LIJss6nYXw0Iz27tw9ya5D',             bg: '#25D366', color: '#fff' },
  { icon: null, imgIcon: '/youtube-icon.jpg', label: 'يوتيوب',    href: 'https://www.youtube.com/channel/UC9CtGm0zD50U7J4PJPOvMog',    bg: '#FF0000', color: '#fff' },
]

const phones = [
  { label: 'مكتب رئيس الاتحاد',  number: '07822017598' },
  { label: 'الأمانة العامة',      number: '07904360076' },
  { label: 'العلاقات العامة',     number: '07702852636' },
]

export default function Contact() {
  return (
    <div style={{ fontFamily: 'Cairo,sans-serif', direction: 'rtl', background: '#F0F2F8', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#2C3E6B)', padding: '60px 20px 50px', textAlign: 'center' }}>
        <div style={{ fontSize: '52px', marginBottom: '12px' }}>📞</div>
        <h1 style={{ color: '#FFC72C', fontSize: '28px', fontWeight: '800', margin: '0 0 8px' }}>اتصل بنا</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: 0 }}>
          اتحاد الغرف التجارية العراقية — نحن هنا لخدمتكم
        </p>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>

        {/* الرقم المختصر */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '18px', color: '#555', marginBottom: '8px', fontWeight: '600' }}>الرقم المختصر</div>
          <a href="tel:5366" style={{ fontSize: '56px', fontWeight: '900', color: '#2C3E6B', textDecoration: 'none', letterSpacing: '4px' }}>
            5366
          </a>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '8px' }}>متاح خلال أوقات الدوام الرسمي</div>
        </div>

        {/* أرقام الهاتف */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#2C3E6B', margin: '0 0 16px', borderBottom: '2px solid #FFC72C', paddingBottom: '10px' }}>
            📱 أرقام الهاتف
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {phones.map(p => (
              <div key={p.number} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>{p.label}</span>
                <a href={`tel:${p.number}`} style={{ color: '#2C3E6B', fontWeight: '800', fontSize: '16px', textDecoration: 'none', direction: 'ltr' }}>
                  📞 {p.number}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* الإيميل والعنوان */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>✉️</div>
            <div style={{ fontWeight: '700', color: '#374151', marginBottom: '6px' }}>البريد الإلكتروني</div>
            <a href="mailto:info@ficc.iq" style={{ color: '#2C3E6B', fontWeight: '800', fontSize: '15px', textDecoration: 'none' }}>
              info@ficc.iq
            </a>
          </div>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>📍</div>
            <div style={{ fontWeight: '700', color: '#374151', marginBottom: '6px' }}>العنوان</div>
            <div style={{ color: '#555', fontSize: '13px', lineHeight: '1.7' }}>
              بغداد — شارع السعدون<br />ص.ب 3388 العلوية
            </div>
          </div>
        </div>

        {/* الموقع الإلكتروني */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🌐</span>
          <div>
            <div style={{ fontWeight: '700', color: '#374151', fontSize: '14px' }}>الموقع الإلكتروني</div>
            <a href="https://ficc.iq" style={{ color: '#2C3E6B', fontWeight: '800', fontSize: '15px', textDecoration: 'none' }}>ficc.iq</a>
          </div>
        </div>

        {/* منصات التواصل */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#2C3E6B', margin: '0 0 16px', borderBottom: '2px solid #FFC72C', paddingBottom: '10px' }}>
            🌍 تابعونا على منصات التواصل
          </h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {social.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', background: s.bg, color: s.color, textDecoration: 'none', fontWeight: '700', fontSize: '13px', transition: 'transform 0.2s, opacity 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.opacity = '1' }}
              >
                {s.imgIcon
                  ? <img src={s.imgIcon} alt={s.label} style={{width:'20px',height:'20px',borderRadius:'4px',objectFit:'cover'}} />
                  : <span style={{ fontSize: '18px' }}>{s.icon}</span>}
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* زر الرجوع */}
        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <Link to="/" style={{ display: 'inline-block', padding: '12px 32px', background: '#2C3E6B', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>
            ← العودة للرئيسية
          </Link>
        </div>

      </div>
    </div>
  )
}
