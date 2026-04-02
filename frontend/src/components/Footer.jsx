export default function Footer() {
  const social = [
    { icon: null, imgIcon: '/facebook-icon.jpg', label: 'فيسبوك',   href: 'https://www.facebook.com/share/1CDYF3R52T/?mibextid=wwXIfr', bg: '#1877F2' },
    { icon: null, imgIcon: '/instagram-icon.jpg', label: 'انستغرام', href: 'https://www.instagram.com/ficc.iraq', bg: '#E1306C' },
    { icon: null, imgIcon: '/x-icon.jpg', label: 'تويتر / X', href: 'https://x.com/ficc_iq',             bg: '#000000' },
    { icon: null, imgIcon: '/tiktok-icon.jpg', label: 'تيكتوك',   href: 'https://www.tiktok.com/@ficc.iraq', bg: '#010101' },
    { icon: null, imgIcon: '/whatsapp-icon.jpg', label: 'واتساب',   href: 'https://chat.whatsapp.com/LIJss6nYXw0Iz27tw9ya5D',             bg: '#25D366' },
    { icon: null, imgIcon: '/youtube-icon.jpg', label: 'يوتيوب',   href: 'https://www.youtube.com/channel/UC9CtGm0zD50U7J4PJPOvMog',    bg: '#FF0000' },
  ]

  return (
    <footer className="footer" id="contact">
      <div className="footer-grid">
        {/* العمود 1 — الهوية */}
        <div>
          <div className="footer-brand">
            <img src="/ficc-logo.jpg" alt="FICC" />
            <div>
              <div style={{color:'#C8960C',fontWeight:'800',fontSize:'13px'}}>اتحاد الغرف التجارية العراقية</div>
              <div style={{fontSize:'11px',color:'#6B7280'}}>FICC — Since 1950</div>
            </div>
          </div>
          <p>المرجع الأول للتجارة والأعمال في العراق</p>
          <p style={{marginTop:'8px'}}>📍 بغداد — شارع السعدون، ص.ب 3388 العلوية</p>

          {/* منصات التواصل الاجتماعي */}
          <div style={{marginTop:'16px'}}>
            <p style={{fontSize:'12px',color:'#9CA3AF',marginBottom:'10px',fontWeight:'600'}}>تابعونا على</p>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              {social.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                  title={s.label}
                  style={{
                    display:'flex',alignItems:'center',justifyContent:'center',
                    width:'36px',height:'36px',borderRadius:'10px',
                    background:s.bg,color:'#fff',fontSize:'16px',
                    textDecoration:'none',transition:'transform 0.2s,opacity 0.2s',
                    flexShrink:0
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.15)';e.currentTarget.style.opacity='0.9'}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.opacity='1'}}
                >{s.imgIcon ? <img src={s.imgIcon} alt={s.label} style={{width:'20px',height:'20px',borderRadius:'4px',objectFit:'cover'}} /> : s.icon}</a>
              ))}
            </div>
          </div>
        </div>

        {/* العمود 2 — روابط سريعة */}
        <div>
          <h4>روابط سريعة</h4>
          <div className="footer-links">
            {[['🏛️ الغرف التجارية','/chambers'],['📋 دليل التجار','/directory'],['🏭 وكلاء الإخراج','/customs-agents'],['⚖️ المحامون','/lawyers'],['🎪 المعارض','/exhibitions'],['🎤 المؤتمرات','/conferences']].map(([l,h]) => (
              <a key={h} href={h}>{l}</a>
            ))}
          </div>
        </div>

        {/* العمود 3 — تواصل معنا */}
        <div>
          <h4>تواصل معنا</h4>
          <p>📧 info@ficc.iq</p>
          <p>🌐 ficc.iq</p>
          <p>📞 مكتب رئيس الاتحاد: 07822017598</p>
          <p>📞 الأمانة العامة: 07904360076</p>
          <p>📞 العلاقات العامة: 07702852636</p>
          <p style={{marginTop:'12px',fontSize:'12px',color:'#9CA3AF'}}>الرقم المختصر: <strong style={{color:'#C8960C'}}>5366</strong></p>
        </div>
      </div>

      <div className="footer-bottom">
        مطور النظام المهندس نبيل الخفاجي | © 2026 جميع الحقوق محفوظة
      </div>
    </footer>
  )
}
