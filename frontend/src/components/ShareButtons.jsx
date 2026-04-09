import { useState } from 'react'

/**
 * ShareButtons — نفس طريقة صفحة الغرف التجارية
 * الاستخدام: <ShareButtons url="https://ficc.iq/courses/4" title="اسم الصفحة" label="شارك الورشة" />
 */
export default function ShareButtons({ url, title = '', label = 'شارك هذه الصفحة' }) {
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div style={{marginBottom:24, background:'#F8F9FA', borderRadius:14, padding:'16px 20px'}}>
      <p style={{color:'#888', fontSize:13, fontWeight:700, margin:'0 0 12px'}}>📤 {label}:</p>
      <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
        {/* واتساب */}
        <a href={`https://wa.me/?text=${encodeURIComponent(title + '\n' + url)}`}
          target="_blank" rel="noreferrer"
          style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:10,background:'#25D366',color:'#fff',textDecoration:'none',fontSize:13,fontWeight:700}}>
          💬 واتساب
        </a>
        {/* فيسبوك */}
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank" rel="noreferrer"
          style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:10,background:'#1877F2',color:'#fff',textDecoration:'none',fontSize:13,fontWeight:700}}>
          📘 فيسبوك
        </a>
        {/* تيليغرام */}
        <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
          target="_blank" rel="noreferrer"
          style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:10,background:'#0088cc',color:'#fff',textDecoration:'none',fontSize:13,fontWeight:700}}>
          ✈️ تيليغرام
        </a>
        {/* نسخ الرابط */}
        <button onClick={copyLink}
          style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:10,background:'#2C3E6B',color:'#fff',border:'none',cursor:'pointer',fontSize:13,fontWeight:700,fontFamily:'Cairo,sans-serif'}}>
          {copied ? '✅ تم النسخ!' : '🔗 نسخ الرابط'}
        </button>
      </div>
    </div>
  )
}
