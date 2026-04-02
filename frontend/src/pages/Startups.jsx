import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'

const API_BASE = ''

function toEnNum(s) { return (s||'').replace(/[٠-٩]/g,d=>d.charCodeAt(0)-1632) }

function OtpVerifyInput({ field, value, onChange, onVerified, verified, channelStatus }) {
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(0)
  const [msg, setMsg] = useState('')
  const isPhone = field.type === 'tel'
  const isDisabled = isPhone ? channelStatus?.smsDisabled : channelStatus?.emailDisabled

  const startTimer = () => {
    setTimer(60)
    const iv = setInterval(() => setTimer(t => { if(t<=1){clearInterval(iv);return 0} return t-1 }), 1000)
  }

  if (isDisabled) {
    return (
      <div style={{padding:'14px',background:'#FEF2F2',border:'1.5px solid #fecaca',borderRadius:'12px',marginBottom:'12px',textAlign:'center'}}>
        <div style={{fontSize:'20px',marginBottom:'4px'}}>🚫</div>
        <div style={{fontWeight:'700',color:'#dc2626',fontSize:'13px',marginBottom:'4px'}}>
          {isPhone ? 'خدمة SMS معطّلة مؤقتاً' : 'خدمة الإيميل معطّلة مؤقتاً'}
        </div>
        <div style={{color:'#7f1d1d',fontSize:'12px'}}>تواصل مع الاتحاد: 📞 5366</div>
      </div>
    )
  }

  const iraqPrefixes = ['078','079','077','075'] // زين:078,079 | آسيا:077 | كورك:075
  const isValidPhone = (v) => {
    const p = (v||'').replace(/\s|-/g,'')
    if ((p.startsWith('+1') && p.length === 12) || (p.startsWith('001') && p.length === 13)) return true
    const local = p.startsWith('+9647') ? '0'+p.slice(4) : p.startsWith('009647') ? '0'+p.slice(5) : p
    return local.length === 11 && iraqPrefixes.some(pre => local.startsWith(pre))
  }

  const sendOtp = async () => {
    if (!value?.trim()) return
    if (isPhone && !isValidPhone(value)) {
      setMsg('❌ رقم غير صحيح — يقبل الأرقام العراقية (07x) والكندية (+1)')
      return
    }
    setLoading(true); setMsg('')
    try {
      const ch = isPhone ? 'sms' : 'email'
      const contact = isPhone ? (value.startsWith('07') ? '+964'+value.slice(1) : value) : value
      await api.post(`${API_BASE}/otp/send-simple`, { value: contact, channel: ch })
      setSent(true); startTimer()
      setMsg('✅ تم الإرسال')
    } catch(e) {
      const _d = e.response?.data; setMsg(_d?.blocked ? '⛔ ' + _d.message : '❌ ' + (_d?.message || 'فشل الإرسال'))
    } finally { setLoading(false) }
  }

  const checkOtp = async () => {
    if (!otp) return
    setLoading(true); setMsg('')
    try {
      const ch = isPhone ? 'sms' : 'email'
      const contact = isPhone ? (value.startsWith('07') ? '+964'+value.slice(1) : value) : value
      await api.post(`${API_BASE}/otp/verify-contact-check`, { value: contact, channel: ch, code: otp })
      setSent(false); setOtp('')
      setMsg('✅ تم التحقق')
      onVerified(field.key, true)
    } catch(e) {
      setMsg('❌ ' + (e.response?.data?.message || 'الرمز غير صحيح'))
    } finally { setLoading(false) }
  }

  const base = {
    flex:1, padding:'12px 16px', borderRadius:'12px',
    border:`1.5px solid ${verified ? '#10b981' : '#dde3ed'}`,
    fontSize:'14px', fontFamily:'Cairo,sans-serif',
    direction: 'ltr', outline:'none',
    background: verified ? '#F0FDF4' : '#FAFBFF', boxSizing:'border-box'
  }

  return (
    <div>
      <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
        <input type={field.type||'text'} value={value||''} placeholder={field.placeholder||field.label}
          onChange={e=>{const v=toEnNum(e.target.value); onChange(v); if(v!==value){onVerified(field.key,false);setSent(false);setMsg('')}}}
          style={base} />
        {verified ? (
          <span style={{fontSize:'22px',flexShrink:0}}>✅</span>
        ) : (
          <button type="button" onClick={sendOtp} disabled={loading||timer>0||!value?.trim()}
            style={{flexShrink:0,padding:'10px 14px',borderRadius:'12px',background:(!value?.trim()||timer>0)?'#ccc':'#2C3E6B',color:'#fff',border:'none',cursor:(!value?.trim()||timer>0)?'not-allowed':'pointer',fontSize:'13px',fontFamily:'Cairo,sans-serif',fontWeight:'700',opacity:!value?.trim()?0.4:1}}>
            {timer>0 ? `${timer}s` : loading ? '...' : '📨 تحقق'}
          </button>
        )}
      </div>
      {sent && !verified && (
        <div style={{display:'flex',gap:'8px',marginTop:'8px',alignItems:'center'}}>
          <input type="text" inputMode="numeric" value={otp}
            onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            onPaste={e => {
              e.preventDefault()
              const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
              setOtp(pasted)
            }}
            maxLength={6} placeholder="● ● ● ● ● ●"
            style={{flex:1,padding:'10px',borderRadius:'10px',border:'1.5px solid #FFC72C',fontSize:'22px',fontFamily:'monospace',textAlign:'center',outline:'none',background:'#FFFBEB',letterSpacing:'8px',direction:'ltr',boxSizing:'border-box'}}
            onKeyDown={e=>e.key==='Enter'&&checkOtp()} />
          <button type="button" onClick={checkOtp} disabled={loading}
            style={{padding:'10px 16px',borderRadius:'10px',background:'#10b981',color:'#fff',border:'none',cursor:'pointer',fontSize:'13px',fontFamily:'Cairo,sans-serif',fontWeight:'700'}}>
            ✓ تأكيد
          </button>
        </div>
      )}
      {msg && <div style={{fontSize:'12px',marginTop:'4px',color:msg.startsWith('✅')?'#10b981':'#dc2626'}}>{msg}</div>}
    </div>
  )
}

const API = '/startups'
const SECTORS = ['تجارة','صناعة','زراعة','خدمات','تقنية','سياحة','نقل','بناء','صحة','تعليم','أخرى']
const STAGES = ['فكرة','نموذج أولي','مشروع ناشئ','شركة قائمة']

export default function Startups() {
  const [startups, setStartups] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [files, setFiles] = useState([])
  const [createdId, setCreatedId] = useState(null)
  const fileRef = useRef()
  const photoRef = useRef()
  const [ownerPhoto, setOwnerPhoto] = useState(null)
  const [ownerPhotoPreview, setOwnerPhotoPreview] = useState(null)
  const [channelStatus, setChannelStatus] = useState({ smsDisabled: false, emailDisabled: false })

  const [form, setForm] = useState({
    name: '', description: '', ownerName: '', ownerEmail: '',
    ownerPhone: '', sector: 'تجارة', fundingNeeded: '', stage: 'فكرة',
    ownerBirthdate: '', ownerGender: ''
  })

  // OTP verified state
  const [verified, setVerified] = useState({})
  const onVerified = (key, val) => setVerified(p => ({...p, [key]: val}))

  useEffect(() => {
    api.get(API).then(r => setStartups(r.data)).finally(() => setLoading(false))
    api.get('/security/channels').then(r => setChannelStatus(r.data)).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.ownerName || !form.ownerPhone) {
      alert('يرجى ملء الحقول المطلوبة')
      return
    }
    if (!verified.ownerPhone) {
      alert('يرجى التحقق من رقم الهاتف أولاً')
      return
    }
    if (form.ownerEmail && !verified.ownerEmail) {
      alert('يرجى التحقق من البريد الإلكتروني أو احذفه')
      return
    }
    setSubmitting(true)
    try {
      const res = await api.post(API, {
        name: form.name, description: form.description,
        ownerName: form.ownerName, ownerEmail: form.ownerEmail,
        ownerPhone: form.ownerPhone, sector: form.sector,
        fundingNeeded: form.fundingNeeded, stage: form.stage,
        ownerBirthdate: form.ownerBirthdate, ownerGender: form.ownerGender
      })
      const id = res.data.id
      setCreatedId(id)

      // رفع الصورة الشخصية
      if (ownerPhoto) {
        const fd = new FormData()
        fd.append('file', ownerPhoto)
        await api.post(`${API}/${id}/attach`, fd).catch(() => {})
      }

      // رفع الملفات
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        await api.post(`${API}/${id}/attach`, fd).catch(() => {})
      }

      setSuccess('✅ تم تقديم مشروعك بنجاح! سيتم مراجعته من قبل الاتحاد.')
      setShowForm(false)
      setForm({ name:'',description:'',ownerName:'',ownerEmail:'',ownerPhone:'',sector:'تجارة',fundingNeeded:'',stage:'فكرة' })
      setFiles([])
    } catch (err) {
      alert('حدث خطأ — يرجى المحاولة ثانية')
    } finally {
      setSubmitting(false)
    }
  }

  const sectorColors = {
    'تجارة':'#3b82f6','صناعة':'#f59e0b','زراعة':'#10b981','خدمات':'#8b5cf6',
    'تقنية':'#6366f1','سياحة':'#ec4899','نقل':'#f97316','بناء':'#78716c',
    'صحة':'#ef4444','تعليم':'#14b8a6','أخرى':'#94a3b8'
  }

  return (
    <div style={{maxWidth:'1100px',margin:'0 auto',padding:'24px 16px',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>

      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#2C3E6B,#1a2a4a)',borderRadius:'20px',padding:'32px',color:'white',marginBottom:'24px',textAlign:'center'}}>
        <div style={{fontSize:'48px',marginBottom:'12px'}}>🚀</div>
        <h1 style={{fontSize:'28px',fontWeight:'800',margin:'0 0 8px'}}>ريادة الأعمال</h1>
        <p style={{opacity:0.8,margin:'0 0 20px',fontSize:'16px'}}>منصة اتحاد الغرف التجارية العراقية لدعم المشاريع الريادية</p>
        <button onClick={() => setShowForm(true)}
          style={{background:'#FFC72C',color:'#1a2a4a',border:'none',padding:'14px 32px',borderRadius:'12px',fontSize:'16px',fontWeight:'800',cursor:'pointer'}}>
          📝 قدّم مشروعك الآن
        </button>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'12px',marginBottom:'24px'}}>
        {[
          {label:'مشروع مقدّم',value:startups.length,icon:'📊'},
          {label:'قطاع متاح',value:SECTORS.length,icon:'🏭'},
          {label:'مرحلة تطوير',value:STAGES.length,icon:'📈'},
          {label:'دعم الاتحاد',value:'100%',icon:'🤝'}
        ].map((s,i) => (
          <div key={i} style={{background:'white',borderRadius:'14px',padding:'16px',textAlign:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.06)',border:'1px solid #e2e8f0'}}>
            <div style={{fontSize:'28px'}}>{s.icon}</div>
            <div style={{fontSize:'24px',fontWeight:'800',color:'#2C3E6B'}}>{s.value}</div>
            <div style={{fontSize:'12px',color:'#94a3b8'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Success message */}
      {success && (
        <div style={{background:'#F0FDF4',border:'1px solid #bbf7d0',borderRadius:'12px',padding:'16px',marginBottom:'16px',color:'#16a34a',fontWeight:'700'}}>
          {success}
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div style={{textAlign:'center',padding:'40px',color:'#94a3b8'}}>⏳ جاري التحميل...</div>
      ) : startups.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px',background:'white',borderRadius:'16px',border:'2px dashed #e2e8f0'}}>
          <div style={{fontSize:'48px',marginBottom:'16px'}}>🚀</div>
          <p style={{color:'#94a3b8',fontSize:'16px'}}>لا توجد مشاريع بعد — كن أول من يقدّم!</p>
          <button onClick={() => setShowForm(true)}
            style={{background:'#2C3E6B',color:'white',border:'none',padding:'12px 24px',borderRadius:'10px',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',marginTop:'12px'}}>
            قدّم مشروعك
          </button>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'16px'}}>
          {startups.map(s => (
            <div key={s.id} style={{background:'white',borderRadius:'16px',overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',border:'1px solid #e2e8f0'}}>
              <div style={{background:`${sectorColors[s.sector]||'#3b82f6'}15`,padding:'20px',borderBottom:'1px solid #f0f4f8'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'start'}}>
                  <span style={{background:sectorColors[s.sector]||'#3b82f6',color:'white',padding:'4px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:'700'}}>
                    {s.sector}
                  </span>
                  <span style={{fontSize:'11px',color:'#94a3b8'}}>{s.stage}</span>
                </div>
                <h3 style={{fontSize:'18px',fontWeight:'800',color:'#1a2a4a',margin:'12px 0 4px'}}>{s.name}</h3>
                <p style={{fontSize:'13px',color:'#64748b',margin:0,lineHeight:'1.5'}}>
                  {s.description?.substring(0,100)}{s.description?.length > 100 ? '...' : ''}
                </p>
              </div>
              <div style={{padding:'16px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                  {s.attachments?.[0]?.filePath?.match(/\.(jpg|jpeg|png|gif)/i) ? (
                    <img src={s.attachments[0].filePath} alt={s.ownerName}
                      style={{width:'36px',height:'36px',borderRadius:'50%',objectFit:'cover',border:'2px solid #e2e8f0',flexShrink:0}} />
                  ) : (
                    <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'#e0e7ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>👤</div>
                  )}
                  <span style={{fontSize:'13px',color:'#475569',fontWeight:'600'}}>{s.ownerName}</span>
                </div>
                {s.fundingNeeded && (
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <span style={{fontSize:'14px'}}>💰</span>
                    <span style={{fontSize:'13px',color:'#475569'}}>{s.fundingNeeded}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Form Modal */}
      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{background:'white',borderRadius:'20px',width:'100%',maxWidth:'600px',maxHeight:'90vh',overflow:'auto'}}>
            {/* Modal Header */}
            <div style={{background:'linear-gradient(135deg,#2C3E6B,#1a2a4a)',padding:'20px 24px',borderRadius:'20px 20px 0 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 style={{color:'white',margin:0,fontSize:'18px',fontWeight:'800'}}>🚀 تقديم مشروع ريادي</h2>
              <button onClick={() => setShowForm(false)}
                style={{background:'rgba(255,255,255,0.2)',border:'none',color:'white',width:'32px',height:'32px',borderRadius:'50%',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{padding:'24px',display:'flex',flexDirection:'column',gap:'16px'}}>

              {/* اسم المشروع */}
              <div>
                <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#374151',marginBottom:'6px'}}>
                  اسم المشروع <span style={{color:'red'}}>*</span>
                </label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="مثال: تطبيق توصيل البضائع"
                  style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:'10px',fontSize:'14px',fontFamily:'Cairo,sans-serif',boxSizing:'border-box'}} />
              </div>

              {/* وصف الفكرة */}
              <div>
                <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#374151',marginBottom:'6px'}}>وصف الفكرة</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="اشرح فكرة مشروعك باختصار..."
                  rows={3}
                  style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:'10px',fontSize:'14px',fontFamily:'Cairo,sans-serif',resize:'vertical',boxSizing:'border-box'}} />
              </div>

              {/* القطاع والمرحلة */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                <div>
                  <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#374151',marginBottom:'6px'}}>القطاع</label>
                  <select value={form.sector} onChange={e => setForm({...form, sector: e.target.value})}
                    style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:'10px',fontSize:'14px',fontFamily:'Cairo,sans-serif',boxSizing:'border-box'}}>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#374151',marginBottom:'6px'}}>مرحلة المشروع</label>
                  <select value={form.stage} onChange={e => setForm({...form, stage: e.target.value})}
                    style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:'10px',fontSize:'14px',fontFamily:'Cairo,sans-serif',boxSizing:'border-box'}}>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* صورة صاحب المشروع */}
              <div>
                <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#374151',marginBottom:'8px'}}>
                  الصورة الشخصية لصاحب المشروع
                </label>
                <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                  {/* معاينة الصورة */}
                  <div onClick={() => photoRef.current?.click()}
                    style={{width:'80px',height:'80px',borderRadius:'50%',overflow:'hidden',cursor:'pointer',flexShrink:0,
                      border:`2px dashed ${ownerPhoto?'#2C3E6B':'#cbd5e1'}`,
                      background: ownerPhotoPreview ? 'transparent' : '#f1f5f9',
                      display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                    {ownerPhotoPreview ? (
                      <img src={ownerPhotoPreview} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                    ) : (
                      <span style={{fontSize:'28px'}}>👤</span>
                    )}
                    <div style={{position:'absolute',bottom:0,right:0,background:'#2C3E6B',borderRadius:'50%',width:'22px',height:'22px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px'}}>
                      📷
                    </div>
                  </div>
                  <div style={{flex:1}}>
                    <input ref={photoRef} type="file" accept="image/*" style={{display:'none'}}
                      onChange={e => {
                        const f = e.target.files[0]
                        if (f) {
                          setOwnerPhoto(f)
                          setOwnerPhotoPreview(URL.createObjectURL(f))
                        }
                      }} />
                    <button type="button" onClick={() => photoRef.current?.click()}
                      style={{padding:'8px 16px',background:'#f1f5f9',color:'#2C3E6B',border:'1.5px solid #e2e8f0',borderRadius:'10px',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'13px'}}>
                      📷 اختار صورة
                    </button>
                    {ownerPhoto && (
                      <button type="button" onClick={() => {setOwnerPhoto(null); setOwnerPhotoPreview(null)}}
                        style={{marginRight:'8px',padding:'8px 12px',background:'#fee2e2',color:'#dc2626',border:'none',borderRadius:'10px',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'13px'}}>
                        ✕ حذف
                      </button>
                    )}
                    <p style={{fontSize:'11px',color:'#94a3b8',margin:'6px 0 0'}}>JPG, PNG — حتى 5MB</p>
                  </div>
                </div>
              </div>

              {/* اسم صاحب المشروع */}
              <div>
                <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#374151',marginBottom:'6px'}}>
                  اسم صاحب المشروع <span style={{color:'red'}}>*</span>
                </label>
                <input value={form.ownerName} onChange={e => setForm({...form, ownerName: e.target.value})}
                  placeholder="الاسم الكامل"
                  style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:'10px',fontSize:'14px',fontFamily:'Cairo,sans-serif',boxSizing:'border-box'}} />
              </div>

              {/* تاريخ الميلاد والجنس */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                <div>
                  <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#374151',marginBottom:'6px'}}>
                    تاريخ الميلاد
                  </label>
                  <input type="date" value={form.ownerBirthdate} onChange={e => setForm({...form, ownerBirthdate: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                    style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:'10px',fontSize:'14px',fontFamily:'Cairo,sans-serif',boxSizing:'border-box',direction:'ltr'}} />
                </div>
                <div>
                  <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#374151',marginBottom:'6px'}}>
                    الجنس
                  </label>
                  <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                    {['ذكر','أنثى'].map(g => (
                      <button key={g} type="button" onClick={() => setForm({...form, ownerGender: g})}
                        style={{flex:1,padding:'10px',borderRadius:'10px',border:`1.5px solid ${form.ownerGender===g?'#2C3E6B':'#e5e7eb'}`,
                          background: form.ownerGender===g ? '#2C3E6B' : 'white',
                          color: form.ownerGender===g ? 'white' : '#374151',
                          cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px'}}>
                        {g === 'ذكر' ? '👨 ذكر' : '👩 أنثى'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* رقم الهاتف + OTP */}
              <div>
                <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#374151',marginBottom:'6px'}}>
                  رقم الهاتف <span style={{color:'red'}}>*</span>
                </label>
                <OtpVerifyInput
                  field={{key:'ownerPhone', type:'tel', label:'رقم الهاتف', placeholder:'07xxxxxxxxx'}}
                  value={form.ownerPhone}
                  onChange={v => setForm({...form, ownerPhone: v})}
                  onVerified={onVerified}
                  verified={!!verified.ownerPhone}
                  channelStatus={channelStatus}
                />
              </div>

              {/* البريد الإلكتروني + OTP */}
              <div>
                <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#374151',marginBottom:'6px'}}>
                  البريد الإلكتروني
                </label>
                <OtpVerifyInput
                  field={{key:'ownerEmail', type:'email', label:'البريد الإلكتروني', placeholder:'example@email.com'}}
                  value={form.ownerEmail}
                  onChange={v => setForm({...form, ownerEmail: v})}
                  onVerified={onVerified}
                  verified={!!verified.ownerEmail}
                  channelStatus={channelStatus}
                />
              </div>

              {/* التمويل المطلوب */}
              <div>
                <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#374151',marginBottom:'6px'}}>التمويل المطلوب (اختياري)</label>
                <input value={form.fundingNeeded} onChange={e => setForm({...form, fundingNeeded: e.target.value})}
                  placeholder="مثال: 50,000 دولار"
                  style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:'10px',fontSize:'14px',fontFamily:'Cairo,sans-serif',boxSizing:'border-box'}} />
              </div>

              {/* المرفقات */}
              <div>
                <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#374151',marginBottom:'6px'}}>المرفقات (PDF، صور)</label>
                <div style={{border:'2px dashed #e2e8f0',borderRadius:'10px',padding:'16px',textAlign:'center',cursor:'pointer',background:'#f8fafc'}}
                  onClick={() => fileRef.current?.click()}>
                  <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
                    style={{display:'none'}} onChange={e => setFiles(Array.from(e.target.files))} />
                  <div style={{fontSize:'24px',marginBottom:'8px'}}>📎</div>
                  <p style={{color:'#94a3b8',margin:0,fontSize:'13px'}}>اضغط لإضافة ملفات</p>
                </div>
                {files.length > 0 && (
                  <div style={{marginTop:'8px',display:'flex',flexDirection:'column',gap:'4px'}}>
                    {files.map((f,i) => (
                      <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 10px',background:'#f0f9ff',borderRadius:'8px',fontSize:'13px'}}>
                        <span>📄 {f.name}</span>
                        <button type="button" onClick={() => setFiles(files.filter((_,j)=>j!==i))}
                          style={{background:'none',border:'none',color:'#dc2626',cursor:'pointer'}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* زر الإرسال */}
              {/* حالة التحقق */}
              {(!verified.ownerPhone || (form.ownerEmail && !verified.ownerEmail)) && (
                <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'10px',padding:'10px 14px',fontSize:'13px',color:'#92400e'}}>
                  ⚠️ {!verified.ownerPhone ? 'تحقق من رقم الهاتف' : 'تحقق من البريد الإلكتروني أو احذفه'}
                </div>
              )}

              <button type="submit" disabled={submitting || !verified.ownerPhone || (form.ownerEmail && !verified.ownerEmail)}
                style={{
                  background: (submitting || !verified.ownerPhone || (form.ownerEmail && !verified.ownerEmail)) ? '#94a3b8' : '#2C3E6B',
                  color:'white',border:'none',padding:'14px',borderRadius:'12px',fontSize:'16px',fontWeight:'800',
                  cursor: (submitting || !verified.ownerPhone) ? 'not-allowed' : 'pointer',
                  fontFamily:'Cairo,sans-serif', opacity: !verified.ownerPhone ? 0.6 : 1
                }}>
                {submitting ? '⏳ جاري الإرسال...' : '🚀 تقديم المشروع'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
