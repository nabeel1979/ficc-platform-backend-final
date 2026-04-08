import { useState, useEffect } from 'react'
import api from '../lib/api'

const API = ''
const governorates = ['بغداد','البصرة','نينوى','أربيل','النجف','كربلاء','الأنبار','بابل','ذي قار','واسط','ميسان','المثنى','صلاح الدين','كركوك','السليمانية','دهوك','القادسية']

export default function Lawyers() {
  const [lawyers, setLawyers]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [governorate, setGovernorate] = useState('')
  const [onlineOnly, setOnlineOnly] = useState(false)

  useEffect(() => { fetchLawyers() }, [])

  const fetchLawyers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search)     params.search     = search
      if (governorate) params.governorate = governorate
      if (onlineOnly) params.onlineConsultation = true
      const r = await api.get(`${API}/lawyers`, { params })
      setLawyers(Array.isArray(r.data) ? r.data : r.data.items || [])
    } catch { setLawyers([]) }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'80vh', background:'#F5F7FA', padding:'32px 16px'}}>
      <div style={{maxWidth:'1200px', margin:'0 auto'}}>

        {/* Header */}
        <div style={{textAlign:'center', marginBottom:'32px'}}>
          <div style={{fontSize:'48px', marginBottom:'8px'}}>⚖️</div>
          <h1 style={{fontSize:'28px', fontWeight:'800', color:'#2C3E6B', margin:'0 0 8px'}}>دليل المحامين التجاريين</h1>
          <p style={{color:'#888', fontSize:'15px', margin:0}}>ابحث عن محامٍ متخصص في القانون التجاري والجمركي</p>
        </div>

        {/* Search */}
        <div style={{
          background:'#fff', borderRadius:'16px', padding:'20px',
          boxShadow:'0 4px 20px rgba(44,62,107,0.08)', marginBottom:'24px',
        }}>
          <div style={{display:'flex', gap:'12px', flexWrap:'wrap', marginBottom:'12px'}}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key==='Enter' && fetchLawyers()}
              placeholder="🔍 ابحث بالاسم أو التخصص..."
              style={{
                flex:'2', minWidth:'200px', padding:'11px 16px', borderRadius:'10px',
                border:'1.5px solid #dde3ed', fontSize:'14px',
                fontFamily:'Cairo,sans-serif', direction:'rtl', outline:'none'
              }}
            />
            <select value={governorate} onChange={e => setGovernorate(e.target.value)} style={{
              flex:'1', minWidth:'150px', padding:'11px 14px', borderRadius:'10px',
              border:'1.5px solid #dde3ed', fontSize:'14px',
              fontFamily:'Cairo,sans-serif', outline:'none', background:'#fff'
            }}>
              <option value="">كل المحافظات</option>
              {governorates.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <button onClick={fetchLawyers} style={{
              padding:'11px 28px', borderRadius:'10px',
              background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',
              color:'#fff', fontFamily:'Cairo,sans-serif', fontWeight:'700',
              fontSize:'14px', border:'none', cursor:'pointer'
            }}>بحث</button>
          </div>
          {/* Online filter */}
          <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontSize:'13px', color:'#555'}}>
            <input type="checkbox" checked={onlineOnly} onChange={e => setOnlineOnly(e.target.checked)}
              style={{width:'16px', height:'16px', cursor:'pointer'}} />
            استشارة إلكترونية فقط
          </label>
        </div>

        {/* Count */}
        {!loading && (
          <p style={{color:'#888', fontSize:'13px', marginBottom:'16px', textAlign:'right'}}>
            النتائج: {lawyers.length}
          </p>
        )}

        {/* Cards */}
        {loading ? (
          <div style={{textAlign:'center', padding:'80px', color:'#aaa', fontSize:'16px'}}>⏳ جاري التحميل...</div>
        ) : lawyers.length === 0 ? (
          <div style={{textAlign:'center', padding:'60px', background:'#fff', borderRadius:'16px', boxShadow:'0 4px 20px rgba(44,62,107,0.07)'}}>
            <div style={{fontSize:'64px', marginBottom:'16px'}}>⚖️</div>
            <h3 style={{color:'#2C3E6B', fontWeight:'700', margin:'0 0 8px'}}>لا توجد نتائج</h3>
            <p style={{color:'#aaa', fontSize:'14px', margin:0}}>جرّب تغيير معايير البحث</p>
          </div>
        ) : (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:'20px'}}>
            {lawyers.map(l => (
              <div key={l.id}
                style={{
                  background:'#fff', borderRadius:'16px',
                  boxShadow:'0 4px 16px rgba(44,62,107,0.08)',
                  border:'1px solid #eef0f5', overflow:'hidden',
                  transition:'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(44,62,107,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 16px rgba(44,62,107,0.08)' }}
              >
                {/* Header */}
                <div style={{background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)', padding:'18px 20px', display:'flex', alignItems:'center', gap:'14px'}}>
                  <div style={{
                    width:'50px', height:'50px', background:'rgba(255,255,255,0.2)',
                    borderRadius:'50%', display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:'22px', fontWeight:'800',
                    color:'#fff', flexShrink:0
                  }}>⚖️</div>
                  <div style={{flex:1, minWidth:0}}>
                    <h3 style={{color:'#fff', fontWeight:'800', fontSize:'16px', margin:'0 0 4px'}}>{l.fullName}</h3>
                    {l.barAssociation && <p style={{color:'rgba(255,255,255,0.8)', fontSize:'12px', margin:0}}>🏛️ {l.barAssociation}</p>}
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'4px', flexShrink:0}}>
                    {l.isVerified && <span style={{background:'#FFC72C', color:'#1a1a2e', padding:'3px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:'700'}}>✓ موثّق</span>}
                    {l.onlineConsultation && <span style={{background:'#10b981', color:'#fff', padding:'3px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:'700'}}>💻 إلكتروني</span>}
                  </div>
                </div>

                {/* Body */}
                <div style={{padding:'16px 20px'}}>
                  <div style={{display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'12px'}}>
                    {l.specialization && (
                      <span style={{background:'#EEF2FF', color:'#2C3E6B', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600'}}>
                        📚 {l.specialization}
                      </span>
                    )}
                    {l.governorate && (
                      <span style={{background:'#FFF8E7', color:'#B8860B', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600'}}>
                        📍 {l.city ? `${l.city}، ` : ''}{l.governorate}
                      </span>
                    )}
                    {l.experienceYears > 0 && (
                      <span style={{background:'#f0fdf4', color:'#16a34a', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600'}}>
                        ⭐ {l.experienceYears} سنة
                      </span>
                    )}
                  </div>

                  {l.languages && (
                    <p style={{color:'#666', fontSize:'12px', margin:'0 0 8px'}}>🌐 {l.languages}</p>
                  )}

                  {l.consultationFee > 0 && (
                    <p style={{color:'#2C3E6B', fontSize:'13px', fontWeight:'700', margin:'0 0 12px'}}>
                      💰 أتعاب الاستشارة: {l.consultationFee.toLocaleString()} د.ع
                    </p>
                  )}

                  <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                    {l.phone && (
                      <a href={`tel:${l.phone}`} style={{
                        flex:'1', textAlign:'center', padding:'9px 10px', borderRadius:'10px',
                        background:'#F0FDF4', color:'#16a34a', fontSize:'13px', fontWeight:'700',
                        textDecoration:'none', border:'1.5px solid #bbf7d0'
                      }}>📞 تواصل</a>
                    )}
                    {l.email && (
                      <a href={`mailto:${l.email}`} style={{
                        flex:'1', textAlign:'center', padding:'9px 10px', borderRadius:'10px',
                        background:'#EEF2FF', color:'#2C3E6B', fontSize:'13px', fontWeight:'700',
                        textDecoration:'none', border:'1.5px solid #c7d2fe'
                      }}>✉️ مراسلة</a>
                    )}
                    <button style={{
                      flex:'1', padding:'9px 10px', borderRadius:'10px',
                      background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)', color:'#fff',
                      fontSize:'13px', fontWeight:'700', border:'none', cursor:'pointer',
                      fontFamily:'Cairo,sans-serif'
                    }}>📋 طلب استشارة</button>
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
