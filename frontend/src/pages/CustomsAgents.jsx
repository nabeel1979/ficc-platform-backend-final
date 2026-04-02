import { useState, useEffect } from 'react'
import api from '../lib/api'

const API = ''
const governorates = ['بغداد','البصرة','نينوى','أربيل','النجف','كربلاء','الأنبار','بابل','ذي قار','واسط','ميسان','المثنى','صلاح الدين','كركوك','السليمانية','دهوك','القادسية']

export default function CustomsAgents() {
  const [agents, setAgents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [governorate, setGovernorate] = useState('')

  useEffect(() => { fetchAgents() }, [])

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search)     params.search     = search
      if (governorate) params.governorate = governorate
      const r = await api.get(`${API}/customsagents`, { params })
      setAgents(Array.isArray(r.data) ? r.data : r.data.items || [])
    } catch { setAgents([]) }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'80vh', background:'#F5F7FA', padding:'32px 16px'}}>
      <div style={{maxWidth:'1200px', margin:'0 auto'}}>

        {/* Header */}
        <div style={{textAlign:'center', marginBottom:'32px'}}>
          <div style={{fontSize:'48px', marginBottom:'8px'}}>🏭</div>
          <h1 style={{fontSize:'28px', fontWeight:'800', color:'#2C3E6B', margin:'0 0 8px'}}>دليل وكلاء الإخراج الكمركي</h1>
          <p style={{color:'#888', fontSize:'15px', margin:0}}>ابحث عن وكيل إخراج موثّق في مناقذك الجمركية</p>
        </div>

        {/* Search */}
        <div style={{
          background:'#fff', borderRadius:'16px', padding:'20px',
          boxShadow:'0 4px 20px rgba(44,62,107,0.08)', marginBottom:'24px',
          display:'flex', gap:'12px', flexWrap:'wrap'
        }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key==='Enter' && fetchAgents()}
            placeholder="🔍 ابحث بالاسم أو اسم الشركة..."
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
            <option value="">كل المنافذ</option>
            {governorates.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <button onClick={fetchAgents} style={{
            padding:'11px 28px', borderRadius:'10px',
            background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',
            color:'#fff', fontFamily:'Cairo,sans-serif', fontWeight:'700',
            fontSize:'14px', border:'none', cursor:'pointer'
          }}>بحث</button>
        </div>

        {/* Count */}
        {!loading && (
          <p style={{color:'#888', fontSize:'13px', marginBottom:'16px', textAlign:'right'}}>
            النتائج: {agents.length}
          </p>
        )}

        {/* Cards */}
        {loading ? (
          <div style={{textAlign:'center', padding:'80px', color:'#aaa', fontSize:'16px'}}>⏳ جاري التحميل...</div>
        ) : agents.length === 0 ? (
          <div style={{textAlign:'center', padding:'60px', background:'#fff', borderRadius:'16px', boxShadow:'0 4px 20px rgba(44,62,107,0.07)'}}>
            <div style={{fontSize:'64px', marginBottom:'16px'}}>🏭</div>
            <h3 style={{color:'#2C3E6B', fontWeight:'700', margin:'0 0 8px'}}>لا توجد نتائج</h3>
            <p style={{color:'#aaa', fontSize:'14px', margin:0}}>جرّب تغيير معايير البحث</p>
          </div>
        ) : (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:'20px'}}>
            {agents.map(a => (
              <div key={a.id}
                style={{
                  background:'#fff', borderRadius:'16px',
                  boxShadow:'0 4px 16px rgba(44,62,107,0.08)',
                  border:'1px solid #eef0f5', overflow:'hidden',
                  transition:'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(44,62,107,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 16px rgba(44,62,107,0.08)' }}
              >
                {/* Card Header */}
                <div style={{
                  background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',
                  padding:'18px 20px', display:'flex', alignItems:'center', gap:'14px'
                }}>
                  <div style={{
                    width:'50px', height:'50px', background:'rgba(255,255,255,0.2)',
                    borderRadius:'12px', display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:'24px', flexShrink:0
                  }}>🏭</div>
                  <div style={{flex:1, minWidth:0}}>
                    <h3 style={{color:'#fff', fontWeight:'800', fontSize:'16px', margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                      {a.fullName}
                    </h3>
                    {a.companyName && <p style={{color:'rgba(255,255,255,0.8)', fontSize:'12px', margin:0}}>{a.companyName}</p>}
                  </div>
                  {a.isActive && (
                    <span style={{background:'#FFC72C', color:'#1a1a2e', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', flexShrink:0}}>✓ موثّق</span>
                  )}
                </div>

                {/* Card Body */}
                <div style={{padding:'16px 20px'}}>
                  <div style={{display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'12px'}}>
                    {a.experienceYears > 0 && (
                      <span style={{background:'#EEF2FF', color:'#2C3E6B', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600'}}>
                        ⭐ {a.experienceYears} سنة خبرة
                      </span>
                    )}
                    {a.governorate && (
                      <span style={{background:'#FFF8E7', color:'#B8860B', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600'}}>
                        📍 {a.governorate}
                      </span>
                    )}
                    {a.licenseNo && (
                      <span style={{background:'#f0fdf4', color:'#16a34a', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600'}}>
                        🪪 {a.licenseNo}
                      </span>
                    )}
                  </div>

                  {a.specializations && (
                    <p style={{color:'#666', fontSize:'13px', margin:'0 0 12px', lineHeight:'1.6'}}>
                      🗂️ {a.specializations}
                    </p>
                  )}

                  {a.ports && (
                    <p style={{color:'#555', fontSize:'12px', margin:'0 0 12px'}}>
                      🚢 المنافذ: {a.ports}
                    </p>
                  )}

                  <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                    {a.phone && (
                      <a href={`tel:${a.phone}`} style={{
                        flex:'1', textAlign:'center', padding:'9px 10px', borderRadius:'10px',
                        background:'#F0FDF4', color:'#16a34a', fontSize:'13px', fontWeight:'700',
                        textDecoration:'none', border:'1.5px solid #bbf7d0'
                      }}>📞 تواصل</a>
                    )}
                    {a.email && (
                      <a href={`mailto:${a.email}`} style={{
                        flex:'1', textAlign:'center', padding:'9px 10px', borderRadius:'10px',
                        background:'#EEF2FF', color:'#2C3E6B', fontSize:'13px', fontWeight:'700',
                        textDecoration:'none', border:'1.5px solid #c7d2fe'
                      }}>✉️ مراسلة</a>
                    )}
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
