import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

const API = ''

export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchMembers() }, [])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      const r = await api.get(`${API}/members`, { params })
      setMembers(Array.isArray(r.data) ? r.data : (r.data?.items || []))
    } catch { setMembers([]) }
    setLoading(false)
  }

  if (selected) return <MemberDetail m={selected} onBack={() => setSelected(null)} />

  return (
    <div style={{minHeight:'80vh',background:'#F5F7FA',padding:'32px 16px'}}>
      <div style={{maxWidth:'1100px',margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{fontSize:'48px',marginBottom:'8px'}}>👥</div>
          <h1 style={{fontSize:'28px',fontWeight:'800',color:'#2C3E6B',margin:'0 0 8px'}}>مجلس الاتحاد</h1>
          <p style={{color:'#888',fontSize:'15px',margin:0}}>أعضاء مجلس اتحاد الغرف التجارية العراقية</p>
        </div>

        <div style={{background:'#fff',borderRadius:'14px',padding:'16px 20px',boxShadow:'0 4px 20px rgba(44,62,107,0.08)',marginBottom:'24px',display:'flex',gap:'12px'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchMembers()}
            placeholder="🔍 ابحث بالاسم أو الغرفة..."
            style={{flex:1,padding:'11px 16px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',direction:'rtl',outline:'none'}}/>
          <button onClick={fetchMembers} style={{padding:'11px 28px',borderRadius:'10px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px',border:'none',cursor:'pointer'}}>بحث</button>
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:'80px',color:'#aaa'}}>⏳ جاري التحميل...</div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'20px'}}>
            {members.map(m => (
              <div key={m.id} onClick={() => setSelected(m)}
                style={{background:'#fff',borderRadius:'18px',boxShadow:'0 4px 16px rgba(44,62,107,0.09)',border:'1px solid #eef0f5',overflow:'hidden',cursor:'pointer',transition:'transform 0.2s,box-shadow 0.2s',textAlign:'center'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-5px)';e.currentTarget.style.boxShadow='0 10px 32px rgba(44,62,107,0.18)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 4px 16px rgba(44,62,107,0.09)'}}
              >
                {/* Header gradient */}
                <div style={{background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',padding:'28px 20px 50px',position:'relative'}}>
                  <div style={{position:'absolute',bottom:'-36px',left:'50%',transform:'translateX(-50%)',width:'72px',height:'72px',borderRadius:'50%',border:'4px solid #fff',overflow:'hidden',background:'#e8edf5',boxShadow:'0 4px 16px rgba(0,0,0,0.15)'}}>
                    {m.photoUrl
                      ? <img src={m.photoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',fontWeight:'800',color:'#2C3E6B'}}>{(m.fullName||'?')[0]}</div>
                    }
                  </div>
                </div>

                <div style={{padding:'44px 16px 20px'}}>
                  <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'16px',margin:'0 0 6px'}}>{m.fullName}</h3>
                  {m.title && <span style={{background:'#FFF8E7',color:'#B8860B',padding:'4px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:'700',display:'inline-block',marginBottom:'8px'}}>{m.title}</span>}
                  {m.chamberName && <p style={{color:'#4A6FA5',fontSize:'13px',fontWeight:'600',margin:'0 0 10px'}}>🏛️ {m.chamberName}</p>}
                  {m.bio && <p style={{color:'#777',fontSize:'12px',lineHeight:'1.6',margin:'0 0 12px'}}>{m.bio.slice(0,80)}{m.bio.length>80?'...':''}</p>}
                  <button style={{padding:'8px 20px',borderRadius:'10px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',fontSize:'13px',fontWeight:'700',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif'}}>عرض التفاصيل</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && members.length === 0 && (
          <div style={{textAlign:'center',padding:'60px',background:'#fff',borderRadius:'16px'}}>
            <div style={{fontSize:'64px'}}>👥</div>
            <h3 style={{color:'#2C3E6B'}}>لا توجد نتائج</h3>
          </div>
        )}
      </div>
    </div>
  )
}

function MemberDetail({ m, onBack }) {
  return (
    <div style={{minHeight:'80vh',background:'#F5F7FA',padding:'24px 16px'}}>
      <div style={{maxWidth:'700px',margin:'0 auto'}}>
        <button onClick={onBack} style={{background:'none',border:'none',color:'#2C3E6B',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'14px',fontWeight:'700',marginBottom:'20px',padding:'8px 0'}}>← العودة للأعضاء</button>
        <div style={{background:'#fff',borderRadius:'20px',overflow:'hidden',boxShadow:'0 8px 32px rgba(44,62,107,0.12)'}}>
          {/* Header */}
          <div style={{background:'linear-gradient(135deg,#1a1a2e,#2C3E6B,#4A6FA5)',padding:'36px',textAlign:'center'}}>
            <div style={{width:'100px',height:'100px',borderRadius:'50%',border:'4px solid rgba(255,255,255,0.4)',overflow:'hidden',background:'rgba(255,255,255,0.15)',margin:'0 auto 16px',boxShadow:'0 8px 24px rgba(0,0,0,0.2)'}}>
              {m.photoUrl
                ? <img src={m.photoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'40px',fontWeight:'800',color:'#fff'}}>{(m.fullName||'?')[0]}</div>
              }
            </div>
            <h1 style={{color:'#fff',fontWeight:'800',fontSize:'22px',margin:'0 0 8px'}}>{m.fullName}</h1>
            {m.title && <span style={{background:'rgba(255,199,44,0.3)',color:'#FFC72C',padding:'5px 14px',borderRadius:'20px',fontSize:'14px',fontWeight:'700',display:'inline-block',marginBottom:'8px'}}>{m.title}</span>}
            {m.chamberName && <p style={{color:'rgba(255,255,255,0.8)',fontSize:'14px',margin:0}}>🏛️ {m.chamberName}</p>}
          </div>

          <div style={{padding:'28px 32px'}}>
            {m.bio && (
              <div style={{marginBottom:'24px'}}>
                <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'16px',margin:'0 0 10px'}}>📋 نبذة تعريفية</h3>
                <div style={{color:'#555',fontSize:'14px',lineHeight:'1.9',background:'#FAFBFF',borderRadius:'12px',padding:'16px',border:'1.5px solid #dde3ed'}}>{m.bio}</div>
              </div>
            )}

            {(m.phone || m.email) && (
              <div style={{marginBottom:'24px'}}>
                <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'16px',margin:'0 0 12px'}}>📞 التواصل</h3>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'10px'}}>
                  {m.phone && <a href={`tel:${m.phone}`} style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px',borderRadius:'12px',background:'#F0FDF4',border:'1.5px solid #bbf7d0',textDecoration:'none'}}>
                    <span style={{fontSize:'20px'}}>📞</span><div><p style={{color:'#888',fontSize:'11px',margin:0}}>الهاتف</p><p style={{color:'#16a34a',fontWeight:'700',fontSize:'14px',margin:0}}>{m.phone}</p></div>
                  </a>}
                  {m.email && <a href={`mailto:${m.email}`} style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px',borderRadius:'12px',background:'#EEF2FF',border:'1.5px solid #c7d2fe',textDecoration:'none'}}>
                    <span style={{fontSize:'20px'}}>✉️</span><div><p style={{color:'#888',fontSize:'11px',margin:0}}>البريد</p><p style={{color:'#2C3E6B',fontWeight:'700',fontSize:'13px',margin:0,direction:'ltr',textAlign:'left'}}>{m.email}</p></div>
                  </a>}
                </div>
              </div>
            )}

            {(m.facebook || m.twitter) && (
              <div style={{marginBottom:'20px'}}>
                <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'16px',margin:'0 0 12px'}}>🌐 التواصل الاجتماعي</h3>
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                  {m.facebook && <a href={m.facebook.startsWith('http')?m.facebook:'https://'+m.facebook} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 18px',borderRadius:'12px',background:'#1877F2',color:'#fff',textDecoration:'none',fontSize:'14px',fontWeight:'700',fontFamily:'Cairo,sans-serif'}}>📘 فيسبوك</a>}
                  {m.twitter && <a href={m.twitter.startsWith('http')?m.twitter:'https://'+m.twitter} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 18px',borderRadius:'12px',background:'#1DA1F2',color:'#fff',textDecoration:'none',fontSize:'14px',fontWeight:'700',fontFamily:'Cairo,sans-serif'}}>🐦 تويتر</a>}
                </div>
              </div>
            )}

            {/* Share */}
            <div style={{background:'#F8F9FA',borderRadius:'14px',padding:'16px 20px'}}>
              <p style={{color:'#888',fontSize:'13px',fontWeight:'700',margin:'0 0 12px'}}>📤 شارك:</p>
              <div style={{display:'flex',gap:'10px'}}>
                <a href={`https://wa.me/?text=${encodeURIComponent(m.fullName + (m.title?' — '+m.title:'') + '\n' + window.location.origin + '/members/' + m.id)}`}
                  target="_blank" rel="noreferrer"
                  style={{flex:'1',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',padding:'12px',borderRadius:'12px',background:'#25D366',color:'#fff',fontSize:'14px',fontWeight:'700',textDecoration:'none',fontFamily:'Cairo,sans-serif'}}>💬 واتساب</a>
                <button onClick={()=>{navigator.clipboard.writeText(window.location.origin+'/members/'+m.id);alert('✅ تم نسخ الرابط!')}}
                  style={{flex:'1',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',padding:'12px',borderRadius:'12px',background:'#2C3E6B',color:'#fff',border:'none',cursor:'pointer',fontSize:'14px',fontWeight:'700',fontFamily:'Cairo,sans-serif'}}>🔗 نسخ الرابط</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Standalone Member Detail Page ─── */

export function MemberDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/members/${id}`)
      .then(r => setMember(r.data))
      .catch(() => navigate('/members'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{minHeight:'80vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#aaa',fontSize:'16px'}}>⏳ جاري التحميل...</div>
  if (!member) return null
  return <MemberDetail m={member} onBack={() => navigate('/members')} />
}
