import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../lib/api'

const API = ''

const entityLabels = { chamber:'غرفة تجارية', member:'عضو مجلس الاتحاد', trader:'دليل الشركات', shipping:'شركة شحن' }
const fieldLabels = {
  fullName:'الاسم الكامل', title:'المنصب', chamberId:'الغرفة', chamberName:'الغرفة',
  phone:'الهاتف', email:'البريد الإلكتروني', bio:'النبذة', facebook:'فيسبوك',
  twitter:'تويتر', instagram:'انستغرام', linkedin:'لينكدإن', youtube:'يوتيوب',
  name:'الاسم', governorate:'المحافظة', address:'العنوان', website:'الموقع',
  description:'الوصف', tradeName:'الاسم التجاري', ownerName:'صاحب العمل',
  businessType:'نوع النشاط', companyName:'اسم الشركة',
}

export default function ReviewPage() {
  const { token } = useParams()
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [done, setDone] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get(`${API}/submissions/review/${token}`)
      .then(r => { setSub(r.data); setLoading(false) })
      .catch(() => { setSub(null); setLoading(false) })
  }, [token])

  const handleAction = async (action) => {
    setSaving(true); setMsg('')
    try {
      await api.post(`${API}/submissions/review/${token}/${action}`, { note })
      setDone(action)
      setMsg(action === 'approve' ? '✅ تمت الموافقة ونشر السجل!' : '❌ تم رفض الطلب')
    } catch(e) {
      setMsg('❌ ' + (e.response?.data?.message || 'حدث خطأ'))
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Cairo,sans-serif'}}>
      <p style={{color:'#888'}}>⏳ جاري التحميل...</p>
    </div>
  )

  if (!sub) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Cairo,sans-serif',direction:'rtl',padding:'20px'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'64px',marginBottom:'16px'}}>❌</div>
        <h2 style={{color:'#dc2626'}}>الرابط غير صحيح أو انتهت صلاحيته</h2>
      </div>
    </div>
  )

  const label = entityLabels[sub.entityType] || sub.entityType
  const statusColor = { pending:'#F59E0B', approved:'#10b981', rejected:'#ef4444' }
  const statusLabel = { pending:'⏳ بانتظار المراجعة', approved:'✅ تمت الموافقة', rejected:'❌ مرفوض' }

  return (
    <div style={{minHeight:'100vh',background:'#F5F7FA',fontFamily:'Cairo,sans-serif',direction:'rtl',padding:'20px'}}>
      <div style={{maxWidth:'640px',margin:'0 auto'}}>
        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',padding:'24px',borderRadius:'16px',textAlign:'center',marginBottom:'20px'}}>
          <img src="/ficc-logo.jpg" alt="FICC" style={{width:'64px',height:'64px',borderRadius:'50%',border:'3px solid #FFC72C',marginBottom:'12px',display:'block',margin:'0 auto 12px'}}/>
          <h1 style={{color:'#fff',fontSize:'18px',fontWeight:'800',margin:'0 0 6px'}}>مراجعة طلب التسجيل</h1>
          <p style={{color:'rgba(255,255,255,0.8)',fontSize:'13px',margin:0}}>اتحاد الغرف التجارية العراقية</p>
        </div>

        {/* Status */}
        <div style={{background:'#fff',borderRadius:'12px',padding:'16px 20px',marginBottom:'16px',display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <div>
            <p style={{color:'#888',fontSize:'12px',margin:'0 0 4px'}}>رقم الطلب</p>
            <p style={{color:'#2C3E6B',fontWeight:'800',fontSize:'16px',margin:0}}>#{sub.id} — {label}</p>
          </div>
          <span style={{background:statusColor[sub.status]+'22',color:statusColor[sub.status],borderRadius:'20px',padding:'6px 14px',fontSize:'13px',fontWeight:'700'}}>
            {statusLabel[sub.status]}
          </span>
        </div>

        {/* Contact Info */}
        <div style={{background:'#fff',borderRadius:'12px',padding:'16px 20px',marginBottom:'16px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'14px',margin:'0 0 12px'}}>📋 مقدم الطلب</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
            <div><p style={{color:'#888',fontSize:'11px',margin:'0 0 2px'}}>الاسم</p><p style={{color:'#333',fontWeight:'700',fontSize:'14px',margin:0}}>{sub.contactName}</p></div>
            <div><p style={{color:'#888',fontSize:'11px',margin:'0 0 2px'}}>الهاتف</p><p style={{color:'#059669',fontWeight:'700',fontSize:'14px',margin:0,direction:'ltr'}}>{sub.contactPhone||'—'}</p></div>
            {sub.contactEmail && <div style={{gridColumn:'1/-1'}}><p style={{color:'#888',fontSize:'11px',margin:'0 0 2px'}}>الإيميل</p><p style={{color:'#4A6FA5',fontSize:'13px',margin:0}}>{sub.contactEmail}</p></div>}
          </div>
        </div>

        {/* Form Data */}
        <div style={{background:'#fff',borderRadius:'12px',padding:'16px 20px',marginBottom:'16px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'14px',margin:'0 0 12px'}}>📝 البيانات المدخلة</h3>
          {Object.entries(sub.formData||{}).map(([k,v]) => {
            if (!v || k==='_photo'||k==='_logo') return null
            if (typeof v === 'string' && v.startsWith('data:image')) return (
              <div key={k} style={{display:'flex',gap:'8px',padding:'6px 0',borderBottom:'1px solid #f5f5f5',alignItems:'center'}}>
                <span style={{color:'#888',fontSize:'12px',minWidth:'120px'}}>صورة شخصية:</span>
                <img src={v} alt="" style={{width:'48px',height:'48px',borderRadius:'50%',objectFit:'cover'}}/>
              </div>
            )
            return (
              <div key={k} style={{display:'flex',gap:'8px',padding:'6px 0',borderBottom:'1px solid #f5f5f5'}}>
                <span style={{color:'#888',fontSize:'12px',minWidth:'120px'}}>{fieldLabels[k]||k}:</span>
                <span style={{color:'#333',fontSize:'13px',fontWeight:'600'}}>{String(v).length>80?String(v).slice(0,80)+'...':String(v)}</span>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        {sub.status === 'pending' && !done && (
          <div style={{background:'#fff',borderRadius:'12px',padding:'16px 20px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'14px',margin:'0 0 12px'}}>⚡ اتخاذ قرار</h3>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="ملاحظة (اختياري)..."
              style={{width:'100%',padding:'10px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'13px',fontFamily:'Cairo,sans-serif',direction:'rtl',resize:'none',boxSizing:'border-box',marginBottom:'12px'}}/>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>handleAction('approve')} disabled={saving}
                style={{flex:1,padding:'14px',borderRadius:'12px',background:'#10b981',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'800',fontSize:'15px'}}>
                {saving?'⏳...':'✅ موافقة ونشر'}
              </button>
              <button onClick={()=>handleAction('reject')} disabled={saving}
                style={{flex:1,padding:'14px',borderRadius:'12px',background:'#ef4444',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'800',fontSize:'15px'}}>
                {saving?'⏳...':'❌ رفض'}
              </button>
            </div>
          </div>
        )}

        {msg && (
          <div style={{background:done==='approve'?'#F0FDF4':'#FEF2F2',color:done==='approve'?'#16a34a':'#dc2626',padding:'16px',borderRadius:'12px',textAlign:'center',fontSize:'16px',fontWeight:'700',marginTop:'12px'}}>
            {msg}
            {done==='approve' && <p style={{fontSize:'13px',fontWeight:'400',margin:'8px 0 0',color:'#555'}}>تم إرسال إشعار بالبريد الإلكتروني للمتقدم ✅</p>}
          </div>
        )}

        <p style={{textAlign:'center',color:'#aaa',fontSize:'11px',marginTop:'20px'}}>اتحاد الغرف التجارية العراقية — ficc.iq</p>
      </div>
    </div>
  )
}
