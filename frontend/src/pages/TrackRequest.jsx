import { useState } from 'react'
import api from '../lib/api'

export default function TrackRequest() {
  const [phone, setPhone] = useState('')
  const [requests, setRequests] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const statusColors = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' }
  const statusLabels = { pending: '⏳ قيد المراجعة', approved: '✅ تمت الموافقة', rejected: '❌ مرفوض' }
  const entityLabels = { chamber: 'غرفة تجارية', member: 'عضو مجلس', trader: 'تاجر', shipping: 'شركة شحن' }
  const entityIcons  = { chamber: '🏛️', member: '👤', trader: '🏢', shipping: '🚢' }

  const search = async (e) => {
    e.preventDefault()
    if (!phone.trim()) return
    setLoading(true); setError('')
    try {
      const normalized = phone.startsWith('07') ? '+964' + phone.slice(1) : phone
      const res = await api.get(`/submissions/track?phone=${encodeURIComponent(normalized)}`)
      setRequests(res.data)
      if (!res.data.length) setError('لم يتم العثور على طلبات بهذا الرقم')
    } catch {
      setError('حدث خطأ — يرجى المحاولة ثانية')
    } finally { setLoading(false) }
  }

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#2C3E6B,#1a2a4a)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      <div style={{width:'100%',maxWidth:'520px'}}>

        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <div style={{fontSize:'48px',marginBottom:'8px'}}>🔍</div>
          <h1 style={{color:'white',fontWeight:'800',fontSize:'24px',margin:'0 0 6px'}}>متابعة حالة الطلب</h1>
          <p style={{color:'rgba(255,255,255,0.6)',margin:0,fontSize:'14px'}}>أدخل رقم هاتفك للاطلاع على حالة طلبك</p>
        </div>

        {/* Search Form */}
        <div style={{background:'white',borderRadius:'20px',padding:'28px',boxShadow:'0 20px 40px rgba(0,0,0,0.3)'}}>
          <form onSubmit={search} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            <label style={{fontSize:'13px',fontWeight:'700',color:'#374151'}}>رقم الهاتف المسجّل في الطلب</label>
            <div style={{display:'flex',gap:'8px'}}>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="07xxxxxxxxx"
                style={{flex:1,padding:'12px 16px',border:'1.5px solid #e5e7eb',borderRadius:'12px',fontSize:'15px',fontFamily:'Cairo,sans-serif',direction:'ltr',outline:'none'}}
              />
              <button type="submit" disabled={loading}
                style={{padding:'12px 20px',background:'#2C3E6B',color:'white',border:'none',borderRadius:'12px',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px',whiteSpace:'nowrap'}}>
                {loading ? '⏳' : '🔍 بحث'}
              </button>
            </div>
          </form>

          {error && (
            <div style={{marginTop:'16px',padding:'12px',background:'#FEF2F2',borderRadius:'10px',color:'#dc2626',fontSize:'13px',textAlign:'center',fontWeight:'600'}}>
              {error}
            </div>
          )}

          {/* Results */}
          {requests && requests.length > 0 && (
            <div style={{marginTop:'20px',display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{fontSize:'13px',fontWeight:'700',color:'#374151',borderBottom:'1px solid #e5e7eb',paddingBottom:'8px'}}>
                تم العثور على {requests.length} طلب
              </div>
              {requests.map(r => (
                <div key={r.id} style={{padding:'14px',borderRadius:'12px',border:`1.5px solid ${statusColors[r.status]}40`,background:`${statusColors[r.status]}08`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:'6px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <span style={{fontSize:'20px'}}>{entityIcons[r.entityType]||'📋'}</span>
                      <div>
                        <div style={{fontSize:'14px',fontWeight:'800',color:'#1e293b'}}>{r.contactName}</div>
                        <div style={{fontSize:'11px',color:'#94a3b8'}}>#{r.id} · {new Date(r.createdAt).toLocaleDateString('ar-IQ')}</div>
                      </div>
                    </div>
                    <span style={{background:statusColors[r.status],color:'white',padding:'4px 12px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',flexShrink:0}}>
                      {statusLabels[r.status]}
                    </span>
                  </div>
                  <div style={{fontSize:'12px',color:'#64748b',display:'flex',gap:'12px',marginTop:'4px'}}>
                    <span>{entityLabels[r.entityType]||r.entityType}</span>
                    {r.reviewNote && <span>📝 {r.reviewNote}</span>}
                  </div>
                  {r.status === 'pending' && (
                    <div style={{marginTop:'8px',padding:'8px 10px',background:'#fffbeb',borderRadius:'8px',fontSize:'12px',color:'#92400e',border:'1px solid #fde68a'}}>
                      ⏳ طلبك قيد المراجعة — سيتم التواصل معك قريباً
                    </div>
                  )}
                  {r.status === 'approved' && (
                    <div style={{marginTop:'8px',padding:'8px 10px',background:'#f0fdf4',borderRadius:'8px',fontSize:'12px',color:'#15803d',border:'1px solid #bbf7d0'}}>
                      🎉 تهانينا! تمت الموافقة على طلبك
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{marginTop:'20px',textAlign:'center'}}>
            <a href="/register" style={{color:'#2C3E6B',fontSize:'13px',fontWeight:'700',textDecoration:'none'}}>
              + تقديم طلب جديد
            </a>
          </div>
        </div>

        <div style={{marginTop:'20px',textAlign:'center'}}>
          <a href="/" style={{color:'rgba(255,255,255,0.5)',fontSize:'13px',textDecoration:'none'}}>
            ← العودة للموقع الرئيسي
          </a>
        </div>
      </div>
    </div>
  )
}
