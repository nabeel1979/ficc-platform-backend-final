import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

const API = ''
const categories = ['تجارة عامة','استيراد وتصدير','مواد غذائية','مواد بناء','إلكترونيات وتقنية','ملابس وأزياء','أثاث ومفروشات','معدات وآليات','أدوية ومستلزمات طبية','مجوهرات وساعات','سيارات وقطع غيار','خدمات مالية','خدمات قانونية','خدمات هندسية','تعليم وتدريب','سياحة وسفر','مطاعم وفنادق','تشييد وبناء','طاقة وكهرباء','زراعة ومواد زراعية','أخرى']
const govs = ['بغداد','البصرة','نينوى','أربيل','النجف','كربلاء','الأنبار','بابل','ذي قار','واسط','ميسان','المثنى','صلاح الدين','كركوك','السليمانية','دهوك','القادسية']

const socialBtn = (bg) => ({
  display:'inline-flex',alignItems:'center',justifyContent:'center',
  width:'34px',height:'34px',borderRadius:'8px',background:bg,
  color:'#fff',textDecoration:'none',fontSize:'15px',flexShrink:0
})

export default function TraderDirectory() {
  const [traders, setTraders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [gov, setGov]         = useState('')
  const [bizType, setBizType] = useState('')
  const [cat, setCat]         = useState('')
  const [selected, setSelected] = useState(null)
  const [bizOptions, setBizOptions] = useState([])
  const [catOptions, setCatOptions] = useState([])

  useEffect(() => {
    // جيب الأنشطة والتصنيفات من الجدول
    api.get(`${API}/constants/trader_business_type`).then(r => setBizOptions((r.data||[]).map(i=>i.value))).catch(()=>{})
    api.get(`${API}/constants/trader_classification`).then(r => setCatOptions((r.data||[]).map(i=>i.value))).catch(()=>{})
  }, [])

  useEffect(() => { fetchTraders() }, [])

  const fetchTraders = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (gov)    params.governorate = gov
      if (cat)    params.category = cat
      if (bizType) params.businessType = bizType
      const r = await api.get(`${API}/traderdirectory`, { params })
      setTraders(Array.isArray(r.data) ? r.data : r.data.items || [])
    } catch { setTraders([]) }
    setLoading(false)
  }

  if (selected) return <TraderDetail t={selected} onBack={() => setSelected(null)} />

  return (
    <div style={{minHeight:'80vh',background:'#F5F7FA',padding:'32px 16px'}}>
      <div style={{maxWidth:'1200px',margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{fontSize:'48px',marginBottom:'8px'}}>🏢</div>
          <h1 style={{fontSize:'28px',fontWeight:'800',color:'#2C3E6B',margin:'0 0 8px'}}>دليل التجار والشركات</h1>
          <p style={{color:'#888',fontSize:'15px',margin:0}}>دليل شامل للشركات والتجار المسجّلين في اتحاد الغرف التجارية العراقية</p>
        </div>

        <div style={{background:'#fff',borderRadius:'16px',padding:'20px',boxShadow:'0 4px 20px rgba(44,62,107,0.08)',marginBottom:'24px',display:'flex',gap:'12px',flexWrap:'wrap'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchTraders()}
            placeholder="🔍 ابحث بالاسم التجاري..."
            style={{flex:'2',minWidth:'180px',padding:'11px 16px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',direction:'rtl',outline:'none'}}/>
          <select value={cat} onChange={e=>setCat(e.target.value)} style={{flex:'1',minWidth:'140px',padding:'11px 14px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',outline:'none',background:'#fff'}}>
            <option value="">كل التصنيفات</option>
            {catOptions.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select value={bizType} onChange={e=>setBizType(e.target.value)} style={{flex:'1',minWidth:'140px',padding:'11px 14px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',outline:'none',background:'#fff'}}>
            <option value="">كل الأنشطة</option>
            {bizOptions.map(b=><option key={b} value={b}>{b}</option>)}
          </select>
          <select value={gov} onChange={e=>setGov(e.target.value)} style={{flex:'1',minWidth:'130px',padding:'11px 14px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',outline:'none',background:'#fff'}}>
            <option value="">كل المحافظات</option>
            {govs.map(g=><option key={g} value={g}>{g}</option>)}
          </select>
          <button onClick={fetchTraders} style={{padding:'11px 28px',borderRadius:'10px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px',border:'none',cursor:'pointer'}}>بحث</button>
        </div>

        {!loading && <p style={{color:'#888',fontSize:'13px',marginBottom:'16px',textAlign:'right'}}>{traders.length} نتيجة</p>}

        {loading ? (
          <div style={{textAlign:'center',padding:'80px',color:'#aaa'}}>⏳ جاري التحميل...</div>
        ) : traders.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px',background:'#fff',borderRadius:'16px'}}>
            <div style={{fontSize:'64px'}}>🏢</div>
            <h3 style={{color:'#2C3E6B'}}>لا توجد نتائج</h3>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:'20px'}}>
            {traders.map(t => (
              <div key={t.id}
                onClick={()=>setSelected(t)}
                style={{background:'#fff',borderRadius:'16px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)',border:'1px solid #eef0f5',overflow:'hidden',cursor:'pointer',transition:'transform 0.2s,box-shadow 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 8px 32px rgba(44,62,107,0.15)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 4px 16px rgba(44,62,107,0.08)'}}
              >
                <div style={{background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',padding:'18px 20px',display:'flex',alignItems:'center',gap:'14px'}}>
                  <div style={{width:'50px',height:'50px',background:'rgba(255,255,255,0.2)',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden',padding:t.logoUrl?'0':'4px'}}>
                    {t.logoUrl ? <img src={t.logoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'contain',borderRadius:'10px'}}/> : <span style={{fontSize:'22px',fontWeight:'800',color:'#fff'}}>{(t.companyName||'?')[0]}</span>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <h3 style={{color:'#fff',fontWeight:'800',fontSize:'15px',margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.tradeName||t.companyName}</h3>
                    {t.businessType && <span style={{background:'rgba(255,255,255,0.2)',color:'#fff',padding:'2px 8px',borderRadius:'10px',fontSize:'11px',fontWeight:'600'}}>{t.businessType}</span>}
                  </div>
                  {t.isVerified && <span style={{background:'#FFC72C',color:'#1a1a2e',padding:'3px 8px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',flexShrink:0}}>✓ موثّق</span>}
                </div>

                <div style={{padding:'14px 20px'}}>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'10px'}}>
                    {t.tradeCategory && <span style={{background:'#EEF2FF',color:'#2C3E6B',padding:'3px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:'600'}}>🏷️ {t.tradeCategory}</span>}
                    {t.chamberName && <span style={{background:'#EEF2FF',color:'#2C3E6B',padding:'3px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:'600'}}>🏛️ {t.chamberName}</span>}
                    {!t.chamberName && t.governorate && <span style={{background:'#FFF8E7',color:'#B8860B',padding:'3px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:'600'}}>📍 {t.governorate}{t.area?'، '+t.area:''}</span>}
                  </div>
                  {t.address && <div style={{display:'flex',alignItems:'flex-start',gap:'6px',marginBottom:'8px',padding:'8px 10px',borderRadius:'10px',background:'#F5F7FA',border:'1px solid #e5e7eb'}}><span style={{fontSize:'13px',flexShrink:0}}>📍</span><p style={{color:'#555',fontSize:'12px',margin:0,wordBreak:'break-word',overflowWrap:'break-word',lineHeight:'1.5'}}>{t.address}</p></div>}
                  {t.description && <p style={{color:'#666',fontSize:'13px',margin:'0 0 10px',lineHeight:'1.6'}}>{t.description.slice(0,80)}{t.description.length>80?'...':''}</p>}

                  {(t.facebook||t.instagram||t.whatsApp||t.telegram) && (
                    <div style={{display:'flex',gap:'6px',marginBottom:'10px'}} onClick={e=>e.stopPropagation()}>
                      {t.facebook  && <a href={t.facebook.startsWith('http')?t.facebook:'https://'+t.facebook}  target="_blank" rel="noreferrer" style={socialBtn('#1877F2')}>📘</a>}
                      {t.instagram && <a href={t.instagram.startsWith('http')?t.instagram:'https://'+t.instagram} target="_blank" rel="noreferrer" style={socialBtn('#E1306C')}>📸</a>}
                      {t.whatsApp  && <a href={`https://wa.me/${t.whatsApp?.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" style={socialBtn('#25D366')}>💬</a>}
                      {t.telegram  && <a href={t.telegram.startsWith('http')?t.telegram:'https://'+t.telegram}  target="_blank" rel="noreferrer" style={socialBtn('#0088cc')}>✈️</a>}
                      {t.youTube   && <a href={t.youTube.startsWith('http')?t.youTube:'https://'+t.youTube}    target="_blank" rel="noreferrer" style={socialBtn('#FF0000')}>📺</a>}
                    </div>
                  )}

                  <div style={{display:'flex',gap:'8px'}} onClick={e=>e.stopPropagation()}>
                    {(t.phone||t.mobile) && <a href={`tel:${t.mobile||t.phone}`} style={{flex:'1',textAlign:'center',padding:'8px',borderRadius:'10px',background:'#F0FDF4',color:'#16a34a',fontSize:'13px',fontWeight:'700',textDecoration:'none',border:'1.5px solid #bbf7d0'}}>📞 اتصال</a>}
                    {t.email && <a href={`mailto:${t.email}`} style={{flex:'1',textAlign:'center',padding:'8px',borderRadius:'10px',background:'#EEF2FF',color:'#2C3E6B',fontSize:'13px',fontWeight:'700',textDecoration:'none',border:'1.5px solid #c7d2fe'}}>✉️ مراسلة</a>}
                    <button style={{flex:'1',padding:'8px',borderRadius:'10px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',fontSize:'13px',fontWeight:'700',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif'}}
                      onClick={e=>{e.stopPropagation();setSelected(t)}}>📋 تفاصيل</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TraderDetail({ t, onBack }) {
  return (
    <div style={{minHeight:'80vh',background:'#F5F7FA',padding:'24px 16px'}}>
      <div style={{maxWidth:'800px',margin:'0 auto'}}>
        <button onClick={onBack} style={{background:'none',border:'none',color:'#2C3E6B',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'14px',fontWeight:'700',marginBottom:'20px',padding:'8px 0',display:'flex',alignItems:'center',gap:'6px'}}>← العودة لدليل التجار</button>
        <div style={{background:'#fff',borderRadius:'20px',overflow:'hidden',boxShadow:'0 8px 32px rgba(44,62,107,0.12)'}}>
          <div style={{background:'linear-gradient(135deg,#1a1a2e,#2C3E6B,#4A6FA5)',padding:'32px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'20px',marginBottom:'16px'}}>
              <div style={{width:'80px',height:'80px',background:'rgba(255,255,255,0.15)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden'}}>
                {t.logoUrl ? <img src={t.logoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'contain'}}/> : <span style={{fontSize:'36px',fontWeight:'800',color:'#fff'}}>{(t.tradeName||t.companyName||'?')[0]}</span>}
              </div>
              <div>
                <h1 style={{color:'#fff',fontWeight:'800',fontSize:'22px',margin:'0 0 6px'}}>{t.tradeName||t.companyName}</h1>
                {t.businessType && <span style={{background:'rgba(255,199,44,0.3)',color:'#FFC72C',padding:'4px 12px',borderRadius:'20px',fontSize:'13px',fontWeight:'700'}}>{t.businessType}</span>}
              </div>
              {t.isVerified && <span style={{background:'#FFC72C',color:'#1a1a2e',padding:'4px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:'700',marginRight:'auto'}}>✓ موثّق</span>}
            </div>
            <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
              {t.tradeCategory && <span style={{background:'rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.9)',padding:'6px 14px',borderRadius:'20px',fontSize:'13px'}}>🏷️ {t.tradeCategory}</span>}
              {t.chamberName   && <span style={{background:'rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.9)',padding:'6px 14px',borderRadius:'20px',fontSize:'13px'}}>🏛️ {t.chamberName}</span>}
              {!t.chamberName && t.governorate && <span style={{background:'rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.9)',padding:'6px 14px',borderRadius:'20px',fontSize:'13px'}}>📍 {t.governorate}{t.area?'، '+t.area:''}</span>}
              {t.ownerName     && <span style={{background:'rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.9)',padding:'6px 14px',borderRadius:'20px',fontSize:'13px'}}>👤 {t.ownerName}</span>}
            </div>
          </div>

          <div style={{padding:'28px 32px'}}>
            {t.description && (
              <div style={{marginBottom:'24px'}}>
                <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'16px',margin:'0 0 10px'}}>📋 نبذة عن النشاط</h3>
                <div style={{color:'#555',fontSize:'14px',lineHeight:'1.8',background:'#FAFBFF',borderRadius:'10px',padding:'14px 16px',border:'1.5px solid #dde3ed',maxHeight:'160px',overflowY:'auto'}}>{t.description}</div>
              </div>
            )}

            <div style={{marginBottom:'24px'}}>
              <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'16px',margin:'0 0 12px'}}>📞 معلومات التواصل</h3>
              {/* صورة المدير */}
              {(t.photoUrl || t.ownerName) && (
                <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px',borderRadius:'12px',background:'#f8fafc',border:'1.5px solid #e2e8f0',marginBottom:'10px'}}>
                  {t.photoUrl ? (
                    <img src={t.photoUrl} alt={t.ownerName} style={{width:'48px',height:'48px',borderRadius:'50%',objectFit:'cover',border:'2px solid #2C3E6B',flexShrink:0}} />
                  ) : (
                    <div style={{width:'48px',height:'48px',borderRadius:'50%',background:'#e0e7ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',flexShrink:0}}>👤</div>
                  )}
                  <div>
                    <p style={{color:'#888',fontSize:'11px',margin:'0 0 2px'}}>المدير / صاحب العمل</p>
                    <p style={{color:'#1e293b',fontWeight:'700',fontSize:'14px',margin:0}}>{t.ownerName||'—'}</p>
                  </div>
                </div>
              )}

              {/* الغرفة التجارية */}
              {t.chamberName && <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'12px',background:'#EEF2FF',border:'1.5px solid #c7d2fe',marginBottom:'10px'}}>
                <span style={{fontSize:'18px'}}>🏛️</span>
                <div><p style={{color:'#888',fontSize:'11px',margin:0}}>الغرفة التجارية</p><p style={{color:'#2C3E6B',fontWeight:'700',fontSize:'14px',margin:0}}>{t.chamberName}</p></div>
              </div>}

              {/* المحافظة (fallback) */}
              {!t.chamberName && t.governorate && <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'12px',background:'#FFF8E7',border:'1.5px solid #fde68a',marginBottom:'10px'}}>
                <span style={{fontSize:'18px'}}>🏙️</span>
                <div><p style={{color:'#888',fontSize:'11px',margin:0}}>المحافظة</p><p style={{color:'#B8860B',fontWeight:'700',fontSize:'14px',margin:0}}>{t.governorate}{t.area?'، '+t.area:''}</p></div>
              </div>}
              {/* العنوان التفصيلي ثانياً */}
              {t.address && <div style={{display:'flex',alignItems:'flex-start',gap:'10px',padding:'12px',borderRadius:'12px',background:'#F5F7FA',border:'1.5px solid #e5e7eb',marginBottom:'10px'}}>
                <span style={{fontSize:'20px',flexShrink:0}}>📍</span>
                <div style={{minWidth:0,flex:1}}>
                  <p style={{color:'#888',fontSize:'11px',margin:'0 0 4px'}}>العنوان التفصيلي</p>
                  <p style={{color:'#444',fontWeight:'600',fontSize:'13px',margin:0,wordBreak:'break-word',whiteSpace:'pre-wrap',overflowWrap:'break-word',lineHeight:'1.6'}}>{t.address}</p>
                </div>
              </div>}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'10px'}}>
                {(t.phone||t.mobile) && <a href={`tel:${t.mobile||t.phone}`} style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px',borderRadius:'12px',background:'#F0FDF4',border:'1.5px solid #bbf7d0',textDecoration:'none'}}>
                  <span style={{fontSize:'20px'}}>📞</span><div><p style={{color:'#888',fontSize:'11px',margin:0}}>الهاتف</p><p style={{color:'#16a34a',fontWeight:'700',fontSize:'14px',margin:0}}>{t.mobile||t.phone}</p></div>
                </a>}
                {t.email && <a href={`mailto:${t.email}`} style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px',borderRadius:'12px',background:'#EEF2FF',border:'1.5px solid #c7d2fe',textDecoration:'none'}}>
                  <span style={{fontSize:'20px'}}>✉️</span><div><p style={{color:'#888',fontSize:'11px',margin:0}}>البريد</p><p style={{color:'#2C3E6B',fontWeight:'700',fontSize:'13px',margin:0}}>{t.email}</p></div>
                </a>}
                {t.website && <a href={t.website.startsWith('http')?t.website:'https://'+t.website} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px',borderRadius:'12px',background:'#FFF8E7',border:'1.5px solid #fde68a',textDecoration:'none'}}>
                  <span style={{fontSize:'20px'}}>🌐</span><div><p style={{color:'#888',fontSize:'11px',margin:0}}>الموقع</p><p style={{color:'#B8860B',fontWeight:'700',fontSize:'13px',margin:0}}>زيارة الموقع</p></div>
                </a>}
              </div>
            </div>

            {(t.facebook||t.twitter||t.instagram||t.whatsApp||t.telegram||t.youTube) && (
              <div style={{marginBottom:'24px'}}>
                <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'16px',margin:'0 0 12px'}}>🌐 التواصل الاجتماعي</h3>
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                  {t.facebook  && <a href={t.facebook.startsWith('http')?t.facebook:'https://'+t.facebook}   target="_blank" rel="noreferrer" style={{...socialBtn('#1877F2'),width:'auto',padding:'8px 16px',gap:'8px',borderRadius:'12px',fontSize:'14px',fontWeight:'700'}}>📘 فيسبوك</a>}
                  {t.instagram && <a href={t.instagram.startsWith('http')?t.instagram:'https://'+t.instagram} target="_blank" rel="noreferrer" style={{...socialBtn('#E1306C'),width:'auto',padding:'8px 16px',gap:'8px',borderRadius:'12px',fontSize:'14px',fontWeight:'700'}}>📸 انستغرام</a>}
                  {t.whatsApp  && <a href={`https://wa.me/${t.whatsApp?.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" style={{...socialBtn('#25D366'),width:'auto',padding:'8px 16px',gap:'8px',borderRadius:'12px',fontSize:'14px',fontWeight:'700'}}>💬 واتساب</a>}
                  {t.telegram  && <a href={t.telegram.startsWith('http')?t.telegram:'https://'+t.telegram}   target="_blank" rel="noreferrer" style={{...socialBtn('#0088cc'),width:'auto',padding:'8px 16px',gap:'8px',borderRadius:'12px',fontSize:'14px',fontWeight:'700'}}>✈️ تيليغرام</a>}
                  {t.youTube   && <a href={t.youTube.startsWith('http')?t.youTube:'https://'+t.youTube}      target="_blank" rel="noreferrer" style={{...socialBtn('#FF0000'),width:'auto',padding:'8px 16px',gap:'8px',borderRadius:'12px',fontSize:'14px',fontWeight:'700'}}>📺 يوتيوب</a>}
                </div>
              </div>
            )}

            {/* Share */}
            <div style={{background:'#F8F9FA',borderRadius:'14px',padding:'16px 20px'}}>
              <p style={{color:'#888',fontSize:'13px',fontWeight:'700',margin:'0 0 12px'}}>📤 شارك:</p>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <a href={`https://wa.me/?text=${encodeURIComponent((t.tradeName||t.companyName||'') + '\n' + window.location.origin + '/og/traders/' + t.id)}`} target="_blank" rel="noreferrer"
                  style={{...socialBtn('#25D366'),width:'auto',padding:'8px 16px',gap:'6px',borderRadius:'10px',fontSize:'13px',fontWeight:'700'}}>💬 واتساب</a>
                <button onClick={()=>{navigator.clipboard.writeText(window.location.origin+'/directory/'+t.id);alert('تم نسخ الرابط!')}}
                  style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',borderRadius:'10px',background:'#2C3E6B',color:'#fff',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:'700',fontFamily:'Cairo,sans-serif'}}>🔗 نسخ الرابط</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Standalone Trader Detail Page ─── */
export function TraderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trader, setTrader] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/traderdirectory/${id}`)
      .then(r => setTrader(r.data))
      .catch(() => navigate('/directory'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{minHeight:'80vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#aaa',fontSize:'16px'}}>
      ⏳ جاري التحميل...
    </div>
  )
  if (!trader) return null
  return <TraderDetail t={trader} onBack={() => navigate('/directory')} />
}
