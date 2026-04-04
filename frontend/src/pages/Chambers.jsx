import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

const API = ''
const governorates = ['بغداد','البصرة','نينوى','أربيل','النجف','كربلاء','الأنبار','بابل','ذي قار','واسط','ميسان','المثنى','صلاح الدين','كركوك','السليمانية','دهوك','القادسية']

const socialBtn = (bg) => ({
  display:'inline-flex', alignItems:'center', justifyContent:'center',
  width:'36px', height:'36px', borderRadius:'10px', background:bg,
  color:'#fff', textDecoration:'none', fontSize:'16px', flexShrink:0
})

/* ─── Chamber Detail Page ─── */
function ChamberDetail({ chamber: c, onBack }) {
  return (
    <div style={{minHeight:'80vh', background:'#F5F7FA', padding:'24px 16px'}}>
      <div style={{maxWidth:'800px', margin:'0 auto'}}>
        <button onClick={onBack} style={{background:'none',border:'none',color:'#2C3E6B',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'14px',fontWeight:'700',marginBottom:'20px',padding:'8px 0',display:'flex',alignItems:'center',gap:'6px'}}>
          ← العودة لقائمة الغرف
        </button>

        <div style={{background:'#fff', borderRadius:'20px', overflow:'hidden', boxShadow:'0 8px 32px rgba(44,62,107,0.12)'}}>
          {/* Header */}
          <div style={{background:'linear-gradient(135deg,#1a1a2e,#2C3E6B,#4A6FA5)', padding:'32px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'20px', marginBottom:'16px'}}>
              <div style={{width:'80px',height:'80px',background:'rgba(255,255,255,0.15)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden'}}>
                {c.logoUrl
                  ? <img src={c.logoUrl} alt={c.name} style={{width:'100%',height:'100%',objectFit:'contain'}} />
                  : <span style={{fontSize:'36px'}}>🏛️</span>
                }
              </div>
              <div>
                <h1 style={{color:'#fff',fontWeight:'800',fontSize:'22px',margin:'0 0 6px'}}>{c.name}</h1>
                <p style={{color:'rgba(255,255,255,0.8)',fontSize:'14px',margin:0}}>📍 {c.governorate}{c.city ? '، ' + c.city : ''}</p>
              </div>
            </div>
            {/* Stats */}
            <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
              {c.establishedYear && (
                <div style={{background:'rgba(255,255,255,0.1)',borderRadius:'10px',padding:'8px 16px',textAlign:'center'}}>
                  <p style={{color:'#FFC72C',fontWeight:'800',fontSize:'20px',margin:0}}>{c.establishedYear}</p>
                  <p style={{color:'rgba(255,255,255,0.7)',fontSize:'12px',margin:0}}>سنة التأسيس</p>
                </div>
              )}
              {(c.generalAssemblyCount || c.memberCount) > 0 && (
                <div style={{background:'rgba(255,255,255,0.1)',borderRadius:'10px',padding:'8px 16px',textAlign:'center'}}>
                  <p style={{color:'#FFC72C',fontWeight:'800',fontSize:'20px',margin:0}}>{(c.generalAssemblyCount || c.memberCount).toLocaleString()}</p>
                  <p style={{color:'rgba(255,255,255,0.7)',fontSize:'12px',margin:0}}>الهيئة العامة</p>
                </div>
              )}
              {c.boardMembersCount > 0 && (
                <div style={{background:'rgba(255,255,255,0.1)',borderRadius:'10px',padding:'8px 16px',textAlign:'center'}}>
                  <p style={{color:'#FFC72C',fontWeight:'800',fontSize:'20px',margin:0}}>{c.boardMembersCount}</p>
                  <p style={{color:'rgba(255,255,255,0.7)',fontSize:'12px',margin:0}}>مجلس الإدارة</p>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div style={{padding:'28px 32px'}}>
            {/* Description */}
            {c.description && (
              <div style={{marginBottom:'24px'}}>
                <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'16px',margin:'0 0 10px',display:'flex',alignItems:'center',gap:'8px'}}>📋 نبذة عن الغرفة</h3>
                <div style={{color:'#555',fontSize:'14px',lineHeight:'1.8',background:'#FAFBFF',borderRadius:'10px',padding:'12px 16px',maxHeight:'160px',overflowY:'auto',overflowX:'hidden',border:'1.5px solid #dde3ed',direction:'rtl',wordBreak:'break-word',whiteSpace:'pre-wrap'}}>{c.description}</div>
              </div>
            )}

            {/* Contact */}
            <div style={{marginBottom:'24px'}}>
              <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'16px',margin:'0 0 12px',display:'flex',alignItems:'center',gap:'8px'}}>📞 معلومات التواصل</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'12px'}}>
                {c.phone && <a href={`tel:${c.phone}`} style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px 16px',borderRadius:'12px',background:'#F0FDF4',border:'1.5px solid #bbf7d0',textDecoration:'none'}}>
                  <span style={{fontSize:'20px'}}>📞</span>
                  <div><p style={{color:'#888',fontSize:'11px',margin:0}}>الهاتف</p><p style={{color:'#16a34a',fontWeight:'700',fontSize:'14px',margin:0}}>{c.phone}</p></div>
                </a>}
                {c.email && <a href={`mailto:${c.email}`} style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px 16px',borderRadius:'12px',background:'#EEF2FF',border:'1.5px solid #c7d2fe',textDecoration:'none'}}>
                  <span style={{fontSize:'20px'}}>✉️</span>
                  <div><p style={{color:'#888',fontSize:'11px',margin:0}}>البريد</p><p style={{color:'#2C3E6B',fontWeight:'700',fontSize:'13px',margin:0}}>{c.email}</p></div>
                </a>}
                {c.website && <a href={c.website} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px 16px',borderRadius:'12px',background:'#FFF8E7',border:'1.5px solid #fde68a',textDecoration:'none'}}>
                  <span style={{fontSize:'20px'}}>🌐</span>
                  <div><p style={{color:'#888',fontSize:'11px',margin:0}}>الموقع</p><p style={{color:'#B8860B',fontWeight:'700',fontSize:'13px',margin:0}}>زيارة الموقع</p></div>
                </a>}
                {c.poBox && <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px 16px',borderRadius:'12px',background:'#F0F9FF',border:'1.5px solid #bae6fd'}}>
                  <span style={{fontSize:'20px'}}>📬</span>
                  <div><p style={{color:'#888',fontSize:'11px',margin:0}}>صندوق البريد</p><p style={{color:'#0369a1',fontWeight:'700',fontSize:'13px',margin:0}}>{c.poBox}</p></div>
                </div>}
                {(c.city || c.address) && <div style={{display:'flex',alignItems:'flex-start',gap:'10px',padding:'12px 16px',borderRadius:'12px',background:'#F5F7FA',border:'1.5px solid #e5e7eb'}}>
                  <span style={{fontSize:'20px',flexShrink:0}}>📍</span>
                  <div style={{minWidth:0,flex:1}}>
                    <p style={{color:'#888',fontSize:'11px',margin:'0 0 4px'}}>العنوان التفصيلي</p>
                    {c.city && <p style={{color:'#2C3E6B',fontWeight:'700',fontSize:'13px',margin:'0 0 2px'}}>{c.city}</p>}
                    {c.address && <p style={{color:'#444',fontWeight:'600',fontSize:'13px',margin:0,wordBreak:'break-word',lineHeight:'1.6'}}>{c.address}</p>}
                  </div>
                </div>}
              </div>
            </div>

            {/* Share Buttons */}
            <div style={{marginBottom:'24px',background:'#F8F9FA',borderRadius:'14px',padding:'16px 20px'}}>
              <p style={{color:'#888',fontSize:'13px',fontWeight:'700',margin:'0 0 12px'}}>📤 شارك صفحة الغرفة:</p>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <a href={`https://wa.me/?text=${encodeURIComponent(c.name + '\n' + window.location.origin + '/chambers/' + c.id)}`}
                  target="_blank" rel="noreferrer"
                  style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',borderRadius:'10px',background:'#25D366',color:'#fff',textDecoration:'none',fontSize:'13px',fontWeight:'700'}}>
                  💬 واتساب
                </a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/chambers/' + c.id)}`}
                  target="_blank" rel="noreferrer"
                  style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',borderRadius:'10px',background:'#1877F2',color:'#fff',textDecoration:'none',fontSize:'13px',fontWeight:'700'}}>
                  📘 فيسبوك
                </a>
                <a href={`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '/chambers/' + c.id)}&text=${encodeURIComponent(c.name)}`}
                  target="_blank" rel="noreferrer"
                  style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',borderRadius:'10px',background:'#0088cc',color:'#fff',textDecoration:'none',fontSize:'13px',fontWeight:'700'}}>
                  ✈️ تيليغرام
                </a>
                <button onClick={() => { navigator.clipboard.writeText(window.location.origin + '/chambers/' + c.id); alert('تم نسخ الرابط!') }}
                  style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',borderRadius:'10px',background:'#2C3E6B',color:'#fff',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:'700',fontFamily:'Cairo,sans-serif'}}>
                  🔗 نسخ الرابط
                </button>
              </div>
            </div>

            {/* Social Media */}
            {(c.facebook || c.twitter || c.instagram || c.whatsApp || c.telegram || c.youTube || c.linkedIn) && (
              <div>
                <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'16px',margin:'0 0 12px',display:'flex',alignItems:'center',gap:'8px'}}>🌐 التواصل الاجتماعي</h3>
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                  {c.facebook  && <a href={c.facebook}  target="_blank" rel="noreferrer" style={{...socialBtn('#1877F2'),width:'auto',padding:'8px 16px',gap:'8px',borderRadius:'12px',fontSize:'14px',fontWeight:'700'}}>📘 فيسبوك</a>}
                  {c.twitter   && <a href={c.twitter}   target="_blank" rel="noreferrer" style={{...socialBtn('#000'),width:'auto',padding:'8px 16px',gap:'8px',borderRadius:'12px',fontSize:'14px',fontWeight:'700'}}>𝕏 تويتر</a>}
                  {c.instagram && <a href={c.instagram} target="_blank" rel="noreferrer" style={{...socialBtn('#E1306C'),width:'auto',padding:'8px 16px',gap:'8px',borderRadius:'12px',fontSize:'14px',fontWeight:'700'}}>📸 انستغرام</a>}
                  {c.whatsApp  && <a href={`https://wa.me/${c.whatsApp?.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" style={{...socialBtn('#25D366'),width:'auto',padding:'8px 16px',gap:'8px',borderRadius:'12px',fontSize:'14px',fontWeight:'700'}}>💬 واتساب</a>}
                  {c.telegram  && <a href={c.telegram}  target="_blank" rel="noreferrer" style={{...socialBtn('#0088cc'),width:'auto',padding:'8px 16px',gap:'8px',borderRadius:'12px',fontSize:'14px',fontWeight:'700'}}>✈️ تيليغرام</a>}
                  {c.youTube   && <a href={c.youTube}   target="_blank" rel="noreferrer" style={{...socialBtn('#FF0000'),width:'auto',padding:'8px 16px',gap:'8px',borderRadius:'12px',fontSize:'14px',fontWeight:'700'}}>📺 يوتيوب</a>}
                  {c.linkedIn  && <a href={c.linkedIn}  target="_blank" rel="noreferrer" style={{...socialBtn('#0077B5'),width:'auto',padding:'8px 16px',gap:'8px',borderRadius:'12px',fontSize:'14px',fontWeight:'700'}}>💼 لينكدإن</a>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Chambers Page ─── */
export default function Chambers() {
  const [chambers, setChambers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [governorate, setGovernorate] = useState('')
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchChambers() }, [])

  const fetchChambers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search)      params.search      = search
      if (governorate) params.governorate = governorate
      const r = await api.get(`${API}/chambers`, { params })
      setChambers(Array.isArray(r.data) ? r.data : (r.data?.items ?? r.data ?? []))
    } catch { setChambers([]) }
    setLoading(false)
  }

  if (selected) return <ChamberDetail chamber={selected} onBack={() => setSelected(null)} />

  return (
    <div style={{minHeight:'80vh', background:'#F5F7FA', padding:'32px 16px'}}>
      <div style={{maxWidth:'1200px', margin:'0 auto'}}>

        {/* Header */}
        <div style={{textAlign:'center', marginBottom:'32px'}}>
          <div style={{fontSize:'48px', marginBottom:'8px'}}>🏛️</div>
          <h1 style={{fontSize:'28px', fontWeight:'800', color:'#2C3E6B', margin:'0 0 8px'}}>الغرف التجارية العراقية</h1>
          <p style={{color:'#888', fontSize:'15px', margin:0}}>دليل جميع الغرف التجارية في المحافظات</p>
        </div>

        {/* Search Bar */}
        <div style={{background:'#fff', borderRadius:'16px', padding:'20px', boxShadow:'0 4px 20px rgba(44,62,107,0.08)', marginBottom:'24px', display:'flex', gap:'12px', flexWrap:'wrap'}}>
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && fetchChambers()}
            placeholder="🔍 ابحث باسم الغرفة..."
            style={{flex:'1', minWidth:'200px', padding:'11px 16px', borderRadius:'10px', border:'1.5px solid #dde3ed', fontSize:'14px', fontFamily:'Cairo,sans-serif', direction:'rtl', outline:'none'}}
          />
          <select value={governorate} onChange={e => setGovernorate(e.target.value)}
            style={{padding:'11px 16px', borderRadius:'10px', border:'1.5px solid #dde3ed', fontSize:'14px', fontFamily:'Cairo,sans-serif', outline:'none', background:'#fff'}}>
            <option value="">كل المحافظات</option>
            {governorates.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <button onClick={fetchChambers} style={{padding:'11px 28px', borderRadius:'10px', background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)', color:'#fff', fontFamily:'Cairo,sans-serif', fontWeight:'700', fontSize:'14px', border:'none', cursor:'pointer'}}>بحث</button>
        </div>

        {!loading && <p style={{color:'#888', fontSize:'13px', marginBottom:'16px', textAlign:'right'}}>{chambers.length} غرفة تجارية</p>}

        {loading ? (
          <div style={{textAlign:'center', padding:'60px', color:'#aaa', fontSize:'16px'}}>⏳ جاري التحميل...</div>
        ) : chambers.length === 0 ? (
          <div style={{textAlign:'center', padding:'60px', background:'#fff', borderRadius:'16px'}}>
            <div style={{fontSize:'64px'}}>🏛️</div>
            <h3 style={{color:'#2C3E6B'}}>لا توجد نتائج</h3>
          </div>
        ) : (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:'20px'}}>
            {chambers.map(c => (
              <div key={c.id}
                onClick={() => navigate(`/chambers/${c.id}`)}
                style={{background:'#fff', borderRadius:'16px', boxShadow:'0 4px 16px rgba(44,62,107,0.08)', border:'1px solid #eef0f5', overflow:'hidden', cursor:'pointer', transition:'transform 0.2s, box-shadow 0.2s'}}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(44,62,107,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 16px rgba(44,62,107,0.08)' }}
              >
                {/* Header */}
                <div style={{background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)', padding:'18px 20px', display:'flex', alignItems:'center', gap:'14px'}}>
                  <div style={{width:'50px', height:'50px', background:'rgba(255,255,255,0.2)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', flexShrink:0, overflow:'hidden', padding: c.logoUrl?'0':'4px'}}>
                    {c.logoUrl ? <img src={c.logoUrl} alt={c.name} style={{width:'100%',height:'100%',objectFit:'contain',borderRadius:'10px'}} /> : '🏛️'}
                  </div>
                  <div>
                    <h3 style={{color:'#fff', fontWeight:'800', fontSize:'16px', margin:'0 0 4px'}}>{c.name}</h3>
                    <p style={{color:'rgba(255,255,255,0.8)', fontSize:'13px', margin:0}}>📍 {c.governorate}{c.city && c.city !== c.governorate ? '، ' + c.city : ''}</p>
                  </div>
                </div>

                {/* Body */}
                <div style={{padding:'16px 20px'}}>
                  <div style={{display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'12px'}}>
                    {c.memberCount > 0 && <span style={{background:'#EEF2FF', color:'#2C3E6B', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600'}}>👥 {c.memberCount.toLocaleString()} عضو</span>}
                    {c.establishedYear && <span style={{background:'#FFF8E7', color:'#B8860B', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600'}}>📅 تأسست {c.establishedYear}</span>}
                  </div>

                  {c.description && <p style={{color:'#666', fontSize:'13px', margin:'0 0 12px', lineHeight:'1.6'}}>{c.description.slice(0,80)}{c.description.length>80?'...':''}</p>}

                  {/* Social icons */}
                  {(c.facebook||c.twitter||c.instagram||c.whatsApp||c.telegram||c.youTube) && (
                    <div style={{display:'flex', gap:'6px', marginBottom:'12px'}} onClick={e=>e.stopPropagation()}>
                      {c.facebook  && <a href={c.facebook}  target="_blank" rel="noreferrer" style={socialBtn('#1877F2')}>📘</a>}
                      {c.twitter   && <a href={c.twitter}   target="_blank" rel="noreferrer" style={socialBtn('#000')}>𝕏</a>}
                      {c.instagram && <a href={c.instagram} target="_blank" rel="noreferrer" style={socialBtn('#E1306C')}>📸</a>}
                      {c.whatsApp  && <a href={`https://wa.me/${c.whatsApp?.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" style={socialBtn('#25D366')}>💬</a>}
                      {c.telegram  && <a href={c.telegram}  target="_blank" rel="noreferrer" style={socialBtn('#0088cc')}>✈️</a>}
                      {c.youTube   && <a href={c.youTube}   target="_blank" rel="noreferrer" style={socialBtn('#FF0000')}>📺</a>}
                    </div>
                  )}

                  <div style={{display:'flex', gap:'8px'}} onClick={e=>e.stopPropagation()}>
                    {c.phone && <a href={`tel:${c.phone}`} style={{flex:'1', textAlign:'center', padding:'9px 10px', borderRadius:'10px', background:'#F0FDF4', color:'#16a34a', fontSize:'13px', fontWeight:'700', textDecoration:'none', border:'1.5px solid #bbf7d0'}}>📞 اتصال</a>}
                    {c.email && <a href={`mailto:${c.email}`} style={{flex:'1', textAlign:'center', padding:'9px 10px', borderRadius:'10px', background:'#EEF2FF', color:'#2C3E6B', fontSize:'13px', fontWeight:'700', textDecoration:'none', border:'1.5px solid #c7d2fe'}}>✉️ مراسلة</a>}
                    <button style={{flex:'1', padding:'9px 10px', borderRadius:'10px', background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)', color:'#fff', fontSize:'13px', fontWeight:'700', border:'none', cursor:'pointer', fontFamily:'Cairo,sans-serif'}}
                      onClick={e=>{e.stopPropagation();navigate(`/chambers/${c.id}`)}}>
                      📋 التفاصيل
                    </button>
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


/* ─── Standalone Chamber Detail Page ─── */
export function ChamberDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [chamber, setChamber] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`${API}/chambers/${id}`)
      .then(r => setChamber(r.data))
      .catch(() => navigate('/chambers'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{minHeight:'80vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#aaa',fontSize:'16px'}}>
      ⏳ جاري التحميل...
    </div>
  )
  if (!chamber) return null
  return <ChamberDetail chamber={chamber} onBack={() => navigate('/chambers')} />
}
