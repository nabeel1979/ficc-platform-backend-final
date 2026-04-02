import React from 'react'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

const API = ''

const categoryColors = {
  'أخبار الاتحاد': { bg:'#EEF2FF', color:'#2C3E6B' },
  'تقنية':         { bg:'#f0fdf4', color:'#16a34a' },
  'شراكات':        { bg:'#FFF8E7', color:'#B8860B' },
  'تدريب':         { bg:'#fdf4ff', color:'#9333ea' },
  'اقتصاد':        { bg:'#fff1f2', color:'#e11d48' },
  'قانون':         { bg:'#f0f9ff', color:'#0284c7' },
}

function timeAgo(d) {
  if (!d) return ''
  const diff = Math.floor((new Date() - new Date(d)) / (1000*60*60*24))
  if (diff === 0) return 'اليوم'
  if (diff === 1) return 'أمس'
  if (diff < 7)  return `منذ ${diff} أيام`
  return new Date(d).toLocaleDateString('ar-IQ', {year:'numeric', month:'long', day:'numeric'})
}

function getCatStyle(cat) {
  return categoryColors[cat] || { bg:'#f3f4f6', color:'#6b7280' }
}

export default function News() {
  const [news, setNews]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('')
  const [selected, setSelected] = useState(null)
  const shareUrl = selected ? `${window.location.origin}/news/${selected.id}` : ''

  useEffect(() => { fetchNews() }, [])

  const fetchNews = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search)   params.search   = search
      if (category) params.category = category
      const r = await api.get(`${API}/news`, { params })
      setNews(Array.isArray(r.data) ? r.data : r.data.items || [])
    } catch { setNews([]) }
    setLoading(false)
  }

  const featured = news.filter(n => n.isFeatured)
  const regular  = news.filter(n => !n.isFeatured)
  const cats = [...new Set(news.map(n => n.category).filter(Boolean))]

  if (selected) return <NewsDetail item={selected} onBack={() => setSelected(null)} />

  return (
    <div style={{minHeight:'80vh', background:'#F5F7FA', padding:'32px 16px'}}>
      <div style={{maxWidth:'1200px', margin:'0 auto'}}>

        {/* Header */}
        <div style={{textAlign:'center', marginBottom:'32px'}}>
          <div style={{fontSize:'48px', marginBottom:'8px'}}>📰</div>
          <h1 style={{fontSize:'28px', fontWeight:'800', color:'#2C3E6B', margin:'0 0 8px'}}>الأخبار والإعلانات</h1>
          <p style={{color:'#888', fontSize:'15px', margin:0}}>آخر أخبار اتحاد الغرف التجارية العراقية</p>
        </div>

        {/* Search */}
        <div style={{background:'#fff', borderRadius:'16px', padding:'20px', boxShadow:'0 4px 20px rgba(44,62,107,0.08)', marginBottom:'28px', display:'flex', gap:'12px', flexWrap:'wrap'}}>
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && fetchNews()}
            placeholder="🔍 ابحث في الأخبار..."
            style={{flex:'2', minWidth:'200px', padding:'11px 16px', borderRadius:'10px', border:'1.5px solid #dde3ed', fontSize:'14px', fontFamily:'Cairo,sans-serif', direction:'rtl', outline:'none'}}
          />
          <select value={category} onChange={e => setCategory(e.target.value)} style={{flex:'1', minWidth:'140px', padding:'11px 14px', borderRadius:'10px', border:'1.5px solid #dde3ed', fontSize:'14px', fontFamily:'Cairo,sans-serif', outline:'none', background:'#fff'}}>
            <option value="">كل التصنيفات</option>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={fetchNews} style={{padding:'11px 28px', borderRadius:'10px', background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)', color:'#fff', fontFamily:'Cairo,sans-serif', fontWeight:'700', fontSize:'14px', border:'none', cursor:'pointer'}}>بحث</button>
        </div>

        {loading ? (
          <div style={{textAlign:'center', padding:'80px', color:'#aaa'}}>⏳ جاري التحميل...</div>
        ) : news.length === 0 ? (
          <div style={{textAlign:'center', padding:'60px', background:'#fff', borderRadius:'16px'}}>
            <div style={{fontSize:'64px', marginBottom:'16px'}}>📰</div>
            <h3 style={{color:'#2C3E6B', fontWeight:'700', margin:'0 0 8px'}}>لا توجد أخبار</h3>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured.length > 0 && !search && !category && (
              <div style={{marginBottom:'32px'}}>
                <h2 style={{color:'#2C3E6B', fontWeight:'800', fontSize:'18px', margin:'0 0 16px', display:'flex', alignItems:'center', gap:'8px'}}>
                  ⭐ الأخبار المميزة
                </h2>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(400px,1fr))', gap:'20px'}}>
                  {featured.map(n => <NewsCard key={n.id} item={n} featured onClick={() => setSelected(n)} />)}
                </div>
              </div>
            )}

            {/* Regular */}
            <div>
              {(featured.length > 0 && !search && !category) && (
                <h2 style={{color:'#2C3E6B', fontWeight:'800', fontSize:'18px', margin:'0 0 16px'}}>📋 آخر الأخبار</h2>
              )}
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px,1fr))', gap:'20px'}}>
                {(search || category ? news : regular).map(n => <NewsCard key={n.id} item={n} onClick={() => setSelected(n)} />)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function NewsCard({ item: n, featured, onClick }) {
  const cs = getCatStyle(n.category)
  return (
    <div onClick={onClick} style={{
      background:'#fff', borderRadius:'16px',
      boxShadow: featured ? '0 6px 24px rgba(44,62,107,0.12)' : '0 4px 16px rgba(44,62,107,0.07)',
      border: featured ? '2px solid #FFC72C' : '1px solid #eef0f5',
      overflow:'hidden', cursor:'pointer', transition:'transform 0.2s, box-shadow 0.2s'
    }}
    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(44,62,107,0.15)' }}
    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow = featured ? '0 6px 24px rgba(44,62,107,0.12)' : '0 4px 16px rgba(44,62,107,0.07)' }}
    >
      {/* Top - Video / Image / Gradient */}
      {(() => {
        const getYTId = url => { if(!url) return null; const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([^?&\s]+)/); return m?m[1]:null }
        const ytId = getYTId(n.videoUrl)
        let mainImg = n.imageUrl
        if (!mainImg && n.images) { try { const imgs = JSON.parse(n.images); if(imgs.length>0) mainImg = imgs[0] } catch {} }
        const imgH = featured ? '240px' : '200px'

        // Show YouTube embed if video exists
        if (ytId) return (
          <div style={{position:'relative',flexShrink:0}} onClick={e=>e.stopPropagation()}>
            <div style={{position:'relative',paddingBottom:'56.25%',height:0,overflow:'hidden',background:'#000'}}>
              <iframe src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen title={n.title} />
            </div>
            {featured && <span style={{position:'absolute',top:'8px',left:'8px',background:'#FFC72C',color:'#1a1a2e',padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',zIndex:2}}>⭐ مميز</span>}
          </div>
        )

        return mainImg ? (
          <div style={{position:'relative',height:imgH,overflow:'hidden',flexShrink:0}}>
            <img src={mainImg} alt={n.title} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{ e.target.parentElement.style.background='linear-gradient(135deg,#2C3E6B,#4A6FA5)'; e.target.style.display='none' }} />
            {featured && <span style={{position:'absolute',top:'12px',left:'12px',background:'#FFC72C',color:'#1a1a2e',padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700'}}>⭐ مميز</span>}
            <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(transparent,rgba(0,0,0,0.8))',padding:'20px 20px 16px'}}>
              <h3 style={{color:'#fff',fontWeight:'800',fontSize:featured?'17px':'15px',margin:0,lineHeight:'1.5'}}>{n.title}</h3>
            </div>
          </div>
        ) : (
          <div style={{background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',height:imgH,padding:'20px',position:'relative',display:'flex',flexDirection:'column',justifyContent:'flex-end',flexShrink:0}}>
            {featured && <span style={{position:'absolute',top:'12px',left:'12px',background:'#FFC72C',color:'#1a1a2e',padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700'}}>⭐ مميز</span>}
            <div style={{fontSize:'32px',marginBottom:'10px',opacity:0.3,position:'absolute',top:'20px',right:'20px'}}>📰</div>
            <h3 style={{color:'#fff',fontWeight:'800',fontSize:featured?'17px':'15px',margin:0,lineHeight:'1.5'}}>{n.title}</h3>
          </div>
        )
      })()}

      {/* Body */}
      <div style={{padding:'16px 20px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px', flexWrap:'wrap', gap:'8px'}}>
          {n.category && (
            <span style={{background: cs.bg, color: cs.color, padding:'3px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600'}}>{n.category}</span>
          )}
          <span style={{color:'#aaa', fontSize:'12px'}}>🕐 {timeAgo(n.publishedAt)}</span>
        </div>
        <p style={{color:'#666', fontSize:'13px', lineHeight:'1.7', margin:'0 0 12px'}}>
          {n.body?.slice(0,120)}{n.body?.length > 120 ? '...' : ''}
        </p>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          {n.author && <span style={{color:'#888', fontSize:'12px'}}>✍️ {n.author}</span>}
          {n.viewCount > 0 && <span style={{color:'#aaa', fontSize:'12px'}}>👁️ {n.viewCount} مشاهدة</span>}
        </div>
      </div>
    </div>
  )
}

function NewsDetail({ item: n, onBack }) {
  const cs = getCatStyle(n.category)
  const [activeImg, setActiveImg] = React.useState(0)
  
  // Parse images array
  let imgs = []
  try { if (n.images) imgs = JSON.parse(n.images) } catch {}
  if (imgs.length === 0 && n.imageUrl) imgs = [n.imageUrl]

  return (
    <div style={{minHeight:'80vh', background:'#F5F7FA', padding:'32px 16px'}}>
      <div style={{maxWidth:'850px', margin:'0 auto'}}>
        <button onClick={onBack} style={{background:'none', border:'none', color:'#2C3E6B', cursor:'pointer', fontFamily:'Cairo,sans-serif', fontSize:'14px', fontWeight:'700', marginBottom:'20px', padding:'8px 0', display:'flex', alignItems:'center', gap:'6px'}}>
          ← العودة للأخبار
        </button>
        <div style={{background:'#fff', borderRadius:'20px', overflow:'hidden', boxShadow:'0 8px 32px rgba(44,62,107,0.12)'}}>
          {/* Header */}
          <div style={{background:'linear-gradient(135deg,#1a1a2e,#2C3E6B,#4A6FA5)', padding:'32px 40px'}}>
            <div style={{fontSize:'40px', marginBottom:'12px'}}>📰</div>
            <h1 style={{color:'#fff', fontWeight:'800', fontSize:'22px', margin:'0 0 14px', lineHeight:'1.5'}}>{n.title}</h1>
            <div style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
              {n.category && <span style={{background: cs.bg, color: cs.color, padding:'4px 14px', borderRadius:'20px', fontSize:'13px', fontWeight:'600'}}>{n.category}</span>}
              <span style={{color:'rgba(255,255,255,0.7)', fontSize:'13px'}}>✍️ {n.author}</span>
              <span style={{color:'rgba(255,255,255,0.7)', fontSize:'13px'}}>🕐 {timeAgo(n.publishedAt)}</span>
              {n.viewCount > 0 && <span style={{color:'rgba(255,255,255,0.7)', fontSize:'13px'}}>👁️ {n.viewCount}</span>}
            </div>
          </div>

          {/* Image Gallery */}
          {imgs.length > 0 && (
            <div style={{padding:'24px 40px 0'}}>
              {/* Main Image */}
              <div style={{borderRadius:'14px', overflow:'hidden', marginBottom:'10px', background:'#f5f5f5', maxHeight:'420px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <img src={imgs[activeImg]} alt="صورة الخبر" style={{width:'100%', maxHeight:'420px', objectFit:'cover', display:'block'}} />
              </div>
              {/* Thumbnails */}
              {imgs.length > 1 && (
                <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                  {imgs.map((img, i) => (
                    <div key={i} onClick={() => setActiveImg(i)} style={{
                      width:'70px', height:'70px', borderRadius:'10px', overflow:'hidden',
                      border: i===activeImg ? '3px solid #2C3E6B' : '3px solid transparent',
                      cursor:'pointer', flexShrink:0, opacity: i===activeImg ? 1 : 0.65, transition:'all 0.2s'
                    }}>
                      <img src={img} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    </div>
                  ))}
                  <span style={{color:'#aaa', fontSize:'12px', alignSelf:'center', marginRight:'4px'}}>
                    {activeImg+1} / {imgs.length}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* YouTube Video */}
          {n.videoUrl && (() => {
            const getYouTubeId = url => {
              const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([^?&\s]+)/)
              return m ? m[1] : null
            }
            const vid = getYouTubeId(n.videoUrl)
            return vid ? (
              <div style={{padding:'24px 40px 0'}}>
                <div style={{position:'relative',paddingBottom:'56.25%',height:0,overflow:'hidden',borderRadius:'16px',background:'#000',boxShadow:'0 8px 24px rgba(0,0,0,0.2)'}}>
                  <iframe
                    src={`https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1`}
                    style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen title={n.title}
                  />
                </div>
              </div>
            ) : null
          })()}

          {/* Body */}
          <div style={{padding:'28px 40px 36px'}}>
            <p style={{color:'#444', fontSize:'16px', lineHeight:'2', margin:'0 0 32px', whiteSpace:'pre-wrap'}}>{n.body}</p>

            {/* Share Buttons */}
            <div style={{borderTop:'2px solid #f0f2f8', paddingTop:'24px'}}>
              <p style={{color:'#888', fontSize:'13px', fontWeight:'700', margin:'0 0 12px'}}>📤 شارك هذا الخبر:</p>
              <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                {/* WhatsApp */}
                <a href={`https://wa.me/?text=${encodeURIComponent(n.title + '\n\n' + (n.body?.slice(0,200)||'') + '...\n\n🔗 ' + `${window.location.origin}/og/news/${n.id}`)}`}
                  target="_blank" rel="noreferrer"
                  style={{display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'12px', background:'#25D366', color:'#fff', textDecoration:'none', fontSize:'14px', fontWeight:'700'}}>
                  <span style={{fontSize:'18px'}}>💬</span> واتساب
                </a>
                {/* Facebook */}
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/og/news/${n.id}`)}`}
                  target="_blank" rel="noreferrer"
                  style={{display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'12px', background:'#1877F2', color:'#fff', textDecoration:'none', fontSize:'14px', fontWeight:'700'}}>
                  <span style={{fontSize:'18px'}}>📘</span> فيسبوك
                </a>
                {/* Telegram */}
                <a href={`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/og/news/${n.id}`)}&text=${encodeURIComponent(n.title)}`}
                  target="_blank" rel="noreferrer"
                  style={{display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'12px', background:'#0088cc', color:'#fff', textDecoration:'none', fontSize:'14px', fontWeight:'700'}}>
                  <span style={{fontSize:'18px'}}>✈️</span> تيليگرام
                </a>
                {/* Twitter/X */}
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(n.title)}&url=${encodeURIComponent(`${window.location.origin}/og/news/${n.id}`)}`}
                  target="_blank" rel="noreferrer"
                  style={{display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'12px', background:'#000', color:'#fff', textDecoration:'none', fontSize:'14px', fontWeight:'700'}}>
                  <span style={{fontSize:'18px'}}>𝕏</span> تويتر
                </a>
                {/* Copy Link */}
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/og/news/${n.id}`); alert('تم نسخ الرابط!') }}
                  style={{display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'12px', background:'#f3f4f6', color:'#444', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'700', fontFamily:'Cairo,sans-serif'}}>
                  <span style={{fontSize:'18px'}}>🔗</span> نسخ الرابط
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


/* ─── Standalone News Detail Page (for /news/:id URL) ─── */
export function NewsDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/news/${id}`)
      .then(r => setItem(r.data))
      .catch(() => navigate('/news'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#aaa', fontSize:'16px'}}>
      ⏳ جاري التحميل...
    </div>
  )
  if (!item) return null

  return <NewsDetail item={item} onBack={() => navigate('/news')} />
}
