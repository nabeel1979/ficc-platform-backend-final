import { useState, useEffect } from 'react'
import api from '../lib/api'

const API = ''

const statusConfig = {
  Upcoming:  { label: '🔜 قادم',    bg: '#EEF2FF', color: '#2C3E6B', dot: '#4A6FA5' },
  Active:    { label: '🟢 جارٍ',    bg: '#f0fdf4', color: '#16a34a', dot: '#16a34a' },
  Completed: { label: '✅ منتهي',   bg: '#f9fafb', color: '#6b7280', dot: '#9ca3af' },
  Cancelled: { label: '🚫 ملغي',   bg: '#fee2e2', color: '#dc2626', dot: '#dc2626' },
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ar-IQ', { year:'numeric', month:'long', day:'numeric' })
}

function daysDiff(start, end) {
  const s = new Date(start), e = new Date(end)
  return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1
}

export default function Exhibitions() {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusF, setStatusF]   = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search)  params.search = search
      if (statusF) params.status = statusF
      const r = await api.get(`${API}/exhibitions`, { params })
      setItems(Array.isArray(r.data) ? r.data : r.data.items || [])
    } catch { setItems([]) }
    setLoading(false)
  }

  const upcoming = items.filter(i => i.status === 'Upcoming' || i.status === 'Active')
  const past     = items.filter(i => i.status === 'Completed' || i.status === 'Cancelled')

  return (
    <div style={{minHeight:'80vh', background:'#F5F7FA', padding:'32px 16px'}}>
      <div style={{maxWidth:'1200px', margin:'0 auto'}}>

        {/* Hero Header */}
        <div style={{
          background:'linear-gradient(135deg,#1a1a2e 0%,#2C3E6B 60%,#4A6FA5 100%)',
          borderRadius:'20px', padding:'40px', marginBottom:'32px', textAlign:'center',
          position:'relative', overflow:'hidden'
        }}>
          <div style={{position:'absolute', top:'-40px', left:'-40px', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(255,199,44,0.05)'}}/>
          <div style={{position:'absolute', bottom:'-60px', right:'-40px', width:'250px', height:'250px', borderRadius:'50%', background:'rgba(74,111,165,0.1)'}}/>
          <div style={{fontSize:'56px', marginBottom:'12px'}}>🎪</div>
          <h1 style={{fontSize:'30px', fontWeight:'800', color:'#fff', margin:'0 0 10px'}}>المعارض التجارية</h1>
          <p style={{color:'rgba(255,255,255,0.7)', fontSize:'15px', margin:'0 0 24px'}}>
            اكتشف أبرز المعارض التجارية في العراق وسجّل مشاركتك
          </p>
          {/* Stats */}
          <div style={{display:'flex', justifyContent:'center', gap:'32px', flexWrap:'wrap'}}>
            {[
              { n: items.filter(i=>i.status==='Upcoming').length, l:'معرض قادم' },
              { n: items.filter(i=>i.status==='Active').length,   l:'معرض جارٍ' },
              { n: items.filter(i=>i.status==='Completed').length,l:'معرض منتهي' },
            ].map((s,i) => (
              <div key={i} style={{textAlign:'center'}}>
                <p style={{color:'#FFC72C', fontSize:'28px', fontWeight:'800', margin:0}}>{s.n}</p>
                <p style={{color:'rgba(255,255,255,0.6)', fontSize:'12px', margin:0}}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{
          background:'#fff', borderRadius:'16px', padding:'20px',
          boxShadow:'0 4px 20px rgba(44,62,107,0.08)', marginBottom:'28px',
          display:'flex', gap:'12px', flexWrap:'wrap'
        }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key==='Enter' && fetchData()}
            placeholder="🔍 ابحث باسم المعرض أو الموقع..."
            style={{flex:'2', minWidth:'200px', padding:'11px 16px', borderRadius:'10px', border:'1.5px solid #dde3ed', fontSize:'14px', fontFamily:'Cairo,sans-serif', direction:'rtl', outline:'none'}}
          />
          <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{flex:'1', minWidth:'140px', padding:'11px 14px', borderRadius:'10px', border:'1.5px solid #dde3ed', fontSize:'14px', fontFamily:'Cairo,sans-serif', outline:'none', background:'#fff'}}>
            <option value="">كل الحالات</option>
            <option value="Upcoming">قادمة</option>
            <option value="Active">جارية</option>
            <option value="Completed">منتهية</option>
          </select>
          <button onClick={fetchData} style={{padding:'11px 28px', borderRadius:'10px', background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)', color:'#fff', fontFamily:'Cairo,sans-serif', fontWeight:'700', fontSize:'14px', border:'none', cursor:'pointer'}}>بحث</button>
        </div>

        {loading ? (
          <div style={{textAlign:'center', padding:'80px', color:'#aaa'}}>⏳ جاري التحميل...</div>
        ) : items.length === 0 ? (
          <div style={{textAlign:'center', padding:'60px', background:'#fff', borderRadius:'16px'}}>
            <div style={{fontSize:'64px', marginBottom:'16px'}}>🎪</div>
            <h3 style={{color:'#2C3E6B', fontWeight:'700', margin:'0 0 8px'}}>لا توجد معارض</h3>
          </div>
        ) : (
          <>
            {/* Upcoming / Active */}
            {upcoming.length > 0 && (
              <>
                <h2 style={{color:'#2C3E6B', fontWeight:'800', fontSize:'20px', margin:'0 0 16px', display:'flex', alignItems:'center', gap:'8px'}}>
                  🔜 المعارض القادمة والجارية
                  <span style={{background:'#EEF2FF', color:'#2C3E6B', padding:'2px 12px', borderRadius:'20px', fontSize:'13px'}}>{upcoming.length}</span>
                </h2>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px,1fr))', gap:'20px', marginBottom:'36px'}}>
                  {upcoming.map(ex => <ExhibitionCard key={ex.id} ex={ex} />)}
                </div>
              </>
            )}

            {/* Past */}
            {past.length > 0 && (
              <>
                <h2 style={{color:'#888', fontWeight:'700', fontSize:'18px', margin:'0 0 16px', display:'flex', alignItems:'center', gap:'8px'}}>
                  ✅ المعارض السابقة
                  <span style={{background:'#f3f4f6', color:'#888', padding:'2px 12px', borderRadius:'20px', fontSize:'13px'}}>{past.length}</span>
                </h2>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px,1fr))', gap:'20px'}}>
                  {past.map(ex => <ExhibitionCard key={ex.id} ex={ex} faded />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ExhibitionCard({ ex, faded }) {
  const st = statusConfig[ex.status] || statusConfig.Upcoming
  const days = ex.startDate && ex.endDate ? daysDiff(ex.startDate, ex.endDate) : null
  const daysLeft = ex.startDate ? Math.ceil((new Date(ex.startDate) - new Date()) / (1000*60*60*24)) : null

  return (
    <div style={{
      background: faded ? '#f9fafb' : '#fff',
      borderRadius:'16px',
      boxShadow: faded ? 'none' : '0 4px 20px rgba(44,62,107,0.10)',
      border: faded ? '1px solid #e5e7eb' : '1px solid #eef0f5',
      overflow:'hidden', transition:'transform 0.2s, box-shadow 0.2s'
    }}
    onMouseEnter={e => { if(!faded){ e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(44,62,107,0.15)' }}}
    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow = faded ? 'none' : '0 4px 20px rgba(44,62,107,0.10)' }}
    >
      {/* Top Banner */}
      <div style={{
        background: faded ? 'linear-gradient(135deg,#6b7280,#9ca3af)' : 'linear-gradient(135deg,#2C3E6B,#4A6FA5)',
        padding:'20px', position:'relative'
      }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
          <span style={{fontSize:'36px'}}>🎪</span>
          <span style={{background: st.bg, color: st.color, padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'700'}}>{st.label}</span>
        </div>
        <h3 style={{color:'#fff', fontWeight:'800', fontSize:'17px', margin:'12px 0 4px', lineHeight:'1.4'}}>{ex.name}</h3>
        <p style={{color:'rgba(255,255,255,0.75)', fontSize:'13px', margin:0}}>📍 {ex.location}</p>
      </div>

      {/* Body */}
      <div style={{padding:'16px 20px'}}>
        {/* Dates */}
        <div style={{
          background:'#F5F7FA', borderRadius:'10px', padding:'12px 16px',
          marginBottom:'14px', display:'flex', gap:'16px', flexWrap:'wrap'
        }}>
          <div>
            <p style={{color:'#aaa', fontSize:'11px', margin:'0 0 2px'}}>تاريخ البدء</p>
            <p style={{color:'#2C3E6B', fontWeight:'700', fontSize:'13px', margin:0}}>{formatDate(ex.startDate)}</p>
          </div>
          <div>
            <p style={{color:'#aaa', fontSize:'11px', margin:'0 0 2px'}}>تاريخ الانتهاء</p>
            <p style={{color:'#2C3E6B', fontWeight:'700', fontSize:'13px', margin:0}}>{formatDate(ex.endDate)}</p>
          </div>
          {days && <div>
            <p style={{color:'#aaa', fontSize:'11px', margin:'0 0 2px'}}>المدة</p>
            <p style={{color:'#FFC72C', fontWeight:'700', fontSize:'13px', margin:0}}>{days} أيام</p>
          </div>}
        </div>

        {/* Badges */}
        <div style={{display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'12px'}}>
          {ex.maxParticipants > 0 && (
            <span style={{background:'#EEF2FF', color:'#2C3E6B', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600'}}>
              👥 {ex.maxParticipants} مشارك
            </span>
          )}
          {daysLeft !== null && daysLeft > 0 && !faded && (
            <span style={{background:'#FFF8E7', color:'#B8860B', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600'}}>
              ⏰ بعد {daysLeft} يوم
            </span>
          )}
        </div>

        {ex.description && (
          <p style={{color:'#666', fontSize:'13px', margin:'0 0 14px', lineHeight:'1.7'}}>
            {ex.description.slice(0,120)}{ex.description.length > 120 ? '...' : ''}
          </p>
        )}

        {!faded && (
          <button style={{
            width:'100%', padding:'11px', borderRadius:'12px',
            background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',
            color:'#fff', fontFamily:'Cairo,sans-serif', fontWeight:'700',
            fontSize:'14px', border:'none', cursor:'pointer'
          }}>📝 سجّل مشاركتك</button>
        )}
      </div>
    </div>
  )
}
