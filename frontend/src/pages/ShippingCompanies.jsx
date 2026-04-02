import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

const types = ['شحن بري','شحن بحري','شحن جوي','شحن دولي','توصيل محلي','خدمات لوجستية','تخليص جمركي','تخزين ومستودعات']
const ShippingTypeBadges = ({types}) => { if (!types) return null; return (<>{types.split(',').filter(Boolean).map(t=><span key={t} style={{background:'rgba(255,255,255,0.2)',color:'#fff',padding:'2px 7px',borderRadius:'10px',fontSize:'11px',fontWeight:'600',marginLeft:'4px'}}>{t.trim()}</span>)}</>)}
const govs = ['بغداد','البصرة','نينوى','أربيل','النجف','كربلاء','الأنبار','بابل','ذي قار','واسط','ميسان','المثنى','صلاح الدين','كركوك','السليمانية','دهوك','القادسية']

const socialBtn = (bg) => ({display:'inline-flex',alignItems:'center',justifyContent:'center',width:'34px',height:'34px',borderRadius:'8px',background:bg,color:'#fff',textDecoration:'none',fontSize:'15px',flexShrink:0})

export default function ShippingCompanies() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [gov, setGov] = useState('')
  const [type, setType] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetch() }, [])

  const fetch = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (gov) params.governorate = gov
      if (type) params.type = type
      const r = await api.get('/shipping', { params })
      setItems(Array.isArray(r.data) ? r.data : [])
    } catch { setItems([]) }
    setLoading(false)
  }

  if (selected) return <Detail item={selected} onBack={() => setSelected(null)} />

  return (
    <div style={{minHeight:'80vh',background:'#F5F7FA',padding:'32px 16px'}}>
      <div style={{maxWidth:'1200px',margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{fontSize:'48px',marginBottom:'8px'}}>🚢</div>
          <h1 style={{fontSize:'28px',fontWeight:'800',color:'#2C3E6B',margin:'0 0 8px'}}>دليل شركات الشحن</h1>
          <p style={{color:'#888',fontSize:'15px',margin:0}}>دليل شركات الشحن والنقل واللوجستيات في العراق</p>
        </div>

        <div style={{background:'#fff',borderRadius:'16px',padding:'20px',boxShadow:'0 4px 20px rgba(44,62,107,0.08)',marginBottom:'24px',display:'flex',gap:'12px',flexWrap:'wrap'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetch()}
            placeholder="🔍 ابحث باسم الشركة..."
            style={{flex:'2',minWidth:'180px',padding:'11px 16px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',direction:'rtl',outline:'none'}}/>
          <select value={type} onChange={e=>setType(e.target.value)} style={{flex:'1',minWidth:'150px',padding:'11px 14px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',outline:'none',background:'#fff'}}>
            <option value="">كل أنواع الشحن</option>
            {types.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <select value={gov} onChange={e=>setGov(e.target.value)} style={{flex:'1',minWidth:'130px',padding:'11px 14px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',outline:'none',background:'#fff'}}>
            <option value="">كل المحافظات</option>
            {govs.map(g=><option key={g} value={g}>{g}</option>)}
          </select>
          <button onClick={fetch} style={{padding:'11px 28px',borderRadius:'10px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px',border:'none',cursor:'pointer'}}>بحث</button>
        </div>

        {!loading && <p style={{color:'#888',fontSize:'13px',marginBottom:'16px',textAlign:'right'}}>{items.length} نتيجة</p>}

        {loading ? (
          <div style={{textAlign:'center',padding:'80px',color:'#aaa'}}>⏳ جاري التحميل...</div>
        ) : items.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px',background:'#fff',borderRadius:'16px'}}><div style={{fontSize:'64px'}}>🚢</div><h3 style={{color:'#2C3E6B'}}>لا توجد نتائج</h3></div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:'20px'}}>
            {items.map(item => (
              <div key={item.id} onClick={()=>setSelected(item)}
                style={{background:'#fff',borderRadius:'16px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)',border:'1px solid #eef0f5',overflow:'hidden',cursor:'pointer',transition:'transform 0.2s,box-shadow 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 8px 32px rgba(44,62,107,0.15)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 4px 16px rgba(44,62,107,0.08)'}}>
                <div style={{background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',padding:'18px 20px',display:'flex',alignItems:'center',gap:'14px'}}>
                  <div style={{width:'50px',height:'50px',background:'rgba(255,255,255,0.2)',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden'}}>
                    {item.logoUrl ? <img src={item.logoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'contain',borderRadius:'10px'}}/> : <span style={{fontSize:'22px'}}>🚢</span>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <h3 style={{color:'#fff',fontWeight:'800',fontSize:'15px',margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.companyName}</h3>
                    {item.shippingType && <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginTop:'4px'}}><ShippingTypeBadges types={item.shippingType}/></div>}
                  </div>
                  {item.isVerified && <span style={{background:'#FFC72C',color:'#1a1a2e',padding:'3px 8px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',flexShrink:0}}>✓ موثّق</span>}
                </div>
                <div style={{padding:'14px 20px'}}>
                  {(item.governorate||item.country) && <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'8px'}}>{item.governorate && <span style={{background:'#FFF8E7',color:'#B8860B',padding:'3px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:'600'}}>📍 {item.governorate}</span>}{item.country && <span style={{background:'#EEF2FF',color:'#2C3E6B',padding:'3px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:'600'}}>🌍 {item.country}</span>}</div>}
                  {item.address && <div style={{display:'flex',alignItems:'flex-start',gap:'6px',marginBottom:'8px',padding:'8px 10px',borderRadius:'10px',background:'#F5F7FA',border:'1px solid #e5e7eb'}}><span style={{fontSize:'13px',flexShrink:0}}>📍</span><p style={{color:'#555',fontSize:'12px',margin:0,wordBreak:'break-word',overflowWrap:'break-word',lineHeight:'1.5'}}>{item.address}</p></div>}
                  {item.description && <p style={{color:'#666',fontSize:'13px',margin:'0 0 10px',lineHeight:'1.6'}}>{item.description.slice(0,80)}{item.description.length>80?'...':''}</p>}
                  {(item.facebook||item.instagram||item.whatsApp||item.telegram) && (
                    <div style={{display:'flex',gap:'6px',marginBottom:'10px'}} onClick={e=>e.stopPropagation()}>
                      {item.facebook  && <a href={item.facebook.startsWith('http')?item.facebook:'https://'+item.facebook}  target="_blank" rel="noreferrer" style={socialBtn('#1877F2')}>📘</a>}
                      {item.instagram && <a href={item.instagram.startsWith('http')?item.instagram:'https://'+item.instagram} target="_blank" rel="noreferrer" style={socialBtn('#E1306C')}>📸</a>}
                      {item.whatsApp  && <a href={`https://wa.me/${item.whatsApp?.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" style={socialBtn('#25D366')}>💬</a>}
                      {item.telegram  && <a href={item.telegram.startsWith('http')?item.telegram:'https://'+item.telegram}  target="_blank" rel="noreferrer" style={socialBtn('#0088cc')}>✈️</a>}
                    </div>
                  )}
                  <div style={{display:'flex',gap:'8px'}} onClick={e=>e.stopPropagation()}>
                    {(item.phone||item.mobile) && <a href={`tel:${item.mobile||item.phone}`} style={{flex:'1',textAlign:'center',padding:'8px',borderRadius:'10px',background:'#F0FDF4',color:'#16a34a',fontSize:'13px',fontWeight:'700',textDecoration:'none',border:'1.5px solid #bbf7d0'}}>📞 اتصال</a>}
                    <button style={{flex:'1',padding:'8px',borderRadius:'10px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',fontSize:'13px',fontWeight:'700',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif'}} onClick={e=>{e.stopPropagation();setSelected(item)}}>📋 تفاصيل</button>
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

function Detail({ item, onBack }) {
  return (
    <div style={{minHeight:'80vh',background:'#F5F7FA',padding:'24px 16px'}}>
      <div style={{maxWidth:'800px',margin:'0 auto'}}>
        <button onClick={onBack} style={{background:'none',border:'none',color:'#2C3E6B',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'14px',fontWeight:'700',marginBottom:'20px',padding:'8px 0'}}>← العودة لدليل الشحن</button>
        <div style={{background:'#fff',borderRadius:'20px',overflow:'hidden',boxShadow:'0 8px 32px rgba(44,62,107,0.12)'}}>
          <div style={{background:'linear-gradient(135deg,#1a1a2e,#2C3E6B,#4A6FA5)',padding:'32px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'20px',marginBottom:'16px'}}>
              <div style={{width:'80px',height:'80px',background:'rgba(255,255,255,0.15)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden'}}>
                {item.logoUrl ? <img src={item.logoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'contain'}}/> : <span style={{fontSize:'40px'}}>🚢</span>}
              </div>
              <div>
                <h1 style={{color:'#fff',fontWeight:'800',fontSize:'22px',margin:'0 0 6px'}}>{item.companyName}</h1>
                {item.shippingType && <span style={{background:'rgba(255,199,44,0.3)',color:'#FFC72C',padding:'4px 12px',borderRadius:'20px',fontSize:'13px',fontWeight:'700'}}>{item.shippingType}</span>}
              </div>
              {item.isVerified && <span style={{background:'#FFC72C',color:'#1a1a2e',padding:'4px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:'700',marginRight:'auto'}}>✓ موثّق</span>}
            </div>
            {item.governorate && <span style={{background:'rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.9)',padding:'6px 14px',borderRadius:'20px',fontSize:'13px'}}>📍 {item.governorate}</span>}
          </div>
          <div style={{padding:'28px 32px'}}>
            {item.description && <div style={{marginBottom:'24px'}}>
              <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'16px',margin:'0 0 10px'}}>📋 نبذة عن الشركة</h3>
              <div style={{color:'#555',fontSize:'14px',lineHeight:'1.8',background:'#FAFBFF',borderRadius:'10px',padding:'14px 16px',border:'1.5px solid #dde3ed'}}>{item.description}</div>
            </div>}
            <div style={{marginBottom:'24px'}}>
              <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'16px',margin:'0 0 12px'}}>📞 معلومات التواصل</h3>
              {/* المحافظة أولاً */}
              {item.governorate && <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'12px',background:'#FFF8E7',border:'1.5px solid #fde68a',marginBottom:'10px'}}>
                <span style={{fontSize:'18px'}}>🏙️</span>
                <div><p style={{color:'#888',fontSize:'11px',margin:0}}>المحافظة</p><p style={{color:'#B8860B',fontWeight:'700',fontSize:'14px',margin:0}}>{item.governorate}</p></div>
              </div>}
              {/* العنوان التفصيلي ثانياً */}
              {item.address && <div style={{display:'flex',alignItems:'flex-start',gap:'10px',padding:'12px',borderRadius:'12px',background:'#F5F7FA',border:'1.5px solid #e5e7eb',marginBottom:'10px'}}>
                <span style={{fontSize:'20px',flexShrink:0}}>📍</span>
                <div style={{minWidth:0,flex:1}}>
                  <p style={{color:'#888',fontSize:'11px',margin:'0 0 4px'}}>العنوان التفصيلي</p>
                  <p style={{color:'#444',fontWeight:'600',fontSize:'13px',margin:0,wordBreak:'break-word',whiteSpace:'pre-wrap',overflowWrap:'break-word',lineHeight:'1.6'}}>{item.address}</p>
                </div>
              </div>}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'10px'}}>
                {(item.phone||item.mobile) && <a href={`tel:${item.mobile||item.phone}`} style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px',borderRadius:'12px',background:'#F0FDF4',border:'1.5px solid #bbf7d0',textDecoration:'none'}}>
                  <span style={{fontSize:'20px'}}>📞</span><div><p style={{color:'#888',fontSize:'11px',margin:0}}>الهاتف</p><p style={{color:'#16a34a',fontWeight:'700',fontSize:'14px',margin:0}}>{item.mobile||item.phone}</p></div>
                </a>}
                {item.email && <a href={`mailto:${item.email}`} style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px',borderRadius:'12px',background:'#EEF2FF',border:'1.5px solid #c7d2fe',textDecoration:'none'}}>
                  <span style={{fontSize:'20px'}}>✉️</span><div><p style={{color:'#888',fontSize:'11px',margin:0}}>البريد</p><p style={{color:'#2C3E6B',fontWeight:'700',fontSize:'13px',margin:0}}>{item.email}</p></div>
                </a>}
                {item.website && <a href={item.website.startsWith('http')?item.website:'https://'+item.website} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px',borderRadius:'12px',background:'#FFF8E7',border:'1.5px solid #fde68a',textDecoration:'none'}}>
                  <span style={{fontSize:'20px'}}>🌐</span><div><p style={{color:'#888',fontSize:'11px',margin:0}}>الموقع</p><p style={{color:'#B8860B',fontWeight:'700',fontSize:'13px',margin:0}}>زيارة الموقع</p></div>
                </a>}
              </div>
            </div>
            {(item.facebook||item.instagram||item.whatsApp||item.telegram||item.youTube) && (
              <div style={{marginBottom:'20px'}}>
                <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'16px',margin:'0 0 12px'}}>🌐 التواصل الاجتماعي</h3>
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                  {item.facebook  && <a href={item.facebook.startsWith('http')?item.facebook:'https://'+item.facebook}   target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 16px',borderRadius:'12px',background:'#1877F2',color:'#fff',textDecoration:'none',fontSize:'14px',fontWeight:'700',fontFamily:'Cairo,sans-serif'}}>📘 فيسبوك</a>}
                  {item.instagram && <a href={item.instagram.startsWith('http')?item.instagram:'https://'+item.instagram} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 16px',borderRadius:'12px',background:'#E1306C',color:'#fff',textDecoration:'none',fontSize:'14px',fontWeight:'700',fontFamily:'Cairo,sans-serif'}}>📸 انستغرام</a>}
                  {item.whatsApp  && <a href={`https://wa.me/${item.whatsApp?.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 16px',borderRadius:'12px',background:'#25D366',color:'#fff',textDecoration:'none',fontSize:'14px',fontWeight:'700',fontFamily:'Cairo,sans-serif'}}>💬 واتساب</a>}
                  {item.telegram  && <a href={item.telegram.startsWith('http')?item.telegram:'https://'+item.telegram}   target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 16px',borderRadius:'12px',background:'#0088cc',color:'#fff',textDecoration:'none',fontSize:'14px',fontWeight:'700',fontFamily:'Cairo,sans-serif'}}>✈️ تيليغرام</a>}
                </div>
              </div>
            )}
            <div style={{background:'#F8F9FA',borderRadius:'14px',padding:'16px 20px'}}>
              <p style={{color:'#888',fontSize:'13px',fontWeight:'700',margin:'0 0 12px'}}>📤 شارك:</p>
              <div style={{display:'flex',gap:'10px'}}>
                <a href={`https://wa.me/?text=${encodeURIComponent(item.companyName+'%0A'+window.location.origin+'/shipping/'+item.id)}`} target="_blank" rel="noreferrer"
                  style={{flex:'1',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',padding:'12px',borderRadius:'12px',background:'#25D366',color:'#fff',fontSize:'14px',fontWeight:'700',textDecoration:'none',fontFamily:'Cairo,sans-serif'}}>💬 واتساب</a>
                <button onClick={()=>{navigator.clipboard.writeText(window.location.origin+'/shipping/'+item.id);alert('✅ تم نسخ الرابط!')}}
                  style={{flex:'1',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',padding:'12px',borderRadius:'12px',background:'#2C3E6B',color:'#fff',border:'none',cursor:'pointer',fontSize:'14px',fontWeight:'700',fontFamily:'Cairo,sans-serif'}}>🔗 نسخ الرابط</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Standalone Detail Page ─── */
export function ShippingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get(`/api/shipping/${id}`)
        .then(r => setItem(r.data))
        .catch(() => navigate('/shipping'))
        .finally(() => setLoading(false))
  }, [id])
  if (loading) return <div style={{minHeight:'80vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#aaa',fontSize:'16px'}}>⏳ جاري التحميل...</div>
  if (!item) return null
  return <Detail item={item} onBack={() => navigate('/shipping')} />
}
