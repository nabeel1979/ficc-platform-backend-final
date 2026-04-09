import { useState } from 'react'

/**
 * ShareButtons — زرين فقط: نسخ الرابط + مشاركة
 * الاستخدام: <ShareButtons url="https://ficc.iq/courses/4" title="اسم الصفحة" label="شارك الورشة" />
 */
export default function ShareButtons({ url, title = '', label = 'شارك' }) {
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({ title, url })
    } else {
      copyLink()
    }
  }

  return (
    <div style={{marginBottom:24, background:'#F8F9FA', borderRadius:14, padding:'16px 20px'}}>
      <p style={{color:'#888', fontSize:13, fontWeight:700, margin:'0 0 12px'}}>📤 {label}:</p>
      <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
        {/* مشاركة */}
        <button onClick={shareLink}
          style={{display:'flex',alignItems:'center',gap:6,padding:'8px 20px',borderRadius:10,background:'#25D366',color:'#fff',border:'none',cursor:'pointer',fontSize:13,fontWeight:700,fontFamily:'Cairo,sans-serif'}}>
          📤 مشاركة
        </button>
        {/* نسخ الرابط */}
        <button onClick={copyLink}
          style={{display:'flex',alignItems:'center',gap:6,padding:'8px 20px',borderRadius:10,background:'#2C3E6B',color:'#fff',border:'none',cursor:'pointer',fontSize:13,fontWeight:700,fontFamily:'Cairo,sans-serif'}}>
          {copied ? '✅ تم النسخ!' : '🔗 نسخ الرابط'}
        </button>
      </div>
    </div>
  )
}
