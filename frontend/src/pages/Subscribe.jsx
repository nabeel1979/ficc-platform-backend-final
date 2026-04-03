import { useState } from 'react'
import api from '../lib/api'

const API = ''

const maskPhone = (p='') => {
  if (!p) return ''
  const s = p.replace(/\s/g,'')
  if (s.length <= 7) return s
  return s.slice(0,3) + '****' + s.slice(-3)
}
const SECTORS = ['الكمارك','المصارف','الغرف التجارية','الاستثمار','تجارة عامة','استيراد وتصدير','صناعة وتصنيع','مقاولات وإنشاءات','خدمات مهنية','تكنولوجيا ومعلوماتية','نقل ولوجستيات','زراعة وأغذية','صحة وصيدلة','تعليم وتدريب','سياحة وفنادق','عقارات','مالية وتأمين','طاقة وكهرباء','أخرى']
const NOTIFY_OPTIONS = [
  { key: 'whatsapp', label: 'واتساب 💬' },
  { key: 'email',    label: 'بريد إلكتروني 📧' },
]

// مكوّن حقل مع تحقق OTP
function VerifiedField({ label, value, onChange, placeholder, isLtr, required, field, onVerified, verified }) {
  const [showOtp, setShowOtp] = useState(false)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [sent, setSent] = useState(false)

  const lbl = { display:'block', fontSize:'13px', fontWeight:'700', color:'#2C3E6B', marginBottom:'6px' }
  const inp = { width:'100%', padding:'11px 14px', borderRadius:'10px', border:'1.5px solid #dde3ed', fontSize:'14px', fontFamily:'Cairo,sans-serif', outline:'none', boxSizing:'border-box' }

  const sendOtp = async () => {
    if (!value || value.trim().length < 3) { setErr('أدخل القيمة أولاً'); return }
    setLoading(true); setErr('')
    try {
      const r = await api.post(`${API}/subscribers/send-field-otp`, { field, value })
      setShowOtp(true); setSent(true); setOtp('')
      if (r.data?.attemptsInfo) setErr('⚠️ ' + r.data.attemptsInfo)
    } catch(e) {
      const msg = e?.response?.data?.message || 'حدث خطأ'
      setErr(e?.response?.status === 429 ? '⛔ ' + msg : msg)
    }
    setLoading(false)
  }

  const verifyOtp = async () => {
    if (!otp) { setErr('أدخل الرمز'); return }
    setLoading(true); setErr('')
    try {
      await api.post(`${API}/subscribers/verify-field-otp`, { field, value, code: otp })
      setShowOtp(false); onVerified(true)
    } catch(e) { setErr(e?.response?.data?.message || 'رمز خاطئ') }
    setLoading(false)
  }

  return (
    <div>
      <label style={lbl}>{label}{required ? ' *' : ''} {verified && <span style={{color:'#16a34a',fontSize:'12px'}}>✅ تم التحقق</span>}</label>
      <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
        <input value={value} onChange={e=>{onChange(e.target.value); onVerified(false); setShowOtp(false); setSent(false)}}
          placeholder={placeholder} disabled={verified}
          style={{...inp, flex:1, direction: isLtr?'ltr':'rtl', background: verified?'#f0fdf4':'#fff', borderColor: verified?'#86efac':'#dde3ed'}}/>
        {!verified && value && value.trim().length >= 3 && (
          <button type="button" onClick={sendOtp} disabled={loading}
            style={{padding:'11px 14px',borderRadius:'10px',background:sent?'#f0fdf4':'#2C3E6B',color:sent?'#16a34a':'#fff',border:sent?'1px solid #86efac':'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:'700',whiteSpace:'nowrap',flexShrink:0}}>
            {loading ? '⏳' : sent ? '🔄 إعادة إرسال' : '📲 تحقق'}
          </button>
        )}
      </div>
      {showOtp && !verified && (
        <div style={{marginTop:'10px',padding:'14px',background:'#EEF2FF',borderRadius:'10px',border:'1px solid #c7d2fe'}}>
          <p style={{margin:'0 0 8px',fontSize:'12px',color:'#4338ca',fontWeight:'600'}}>💬 سيصل الرمز عبر الواتساب — أدخله هنا</p>
          <div style={{display:'flex',gap:'8px'}}>
            <input value={otp}
              onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
              onPaste={e=>{e.preventDefault();const t=e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);setOtp(t)}}
              maxLength={6} placeholder="000000" inputMode="numeric" autoComplete="one-time-code"
              style={{flex:1,padding:'10px',borderRadius:'8px',border:'1.5px solid #c7d2fe',fontSize:'18px',fontWeight:'800',letterSpacing:'6px',textAlign:'center',fontFamily:'monospace',outline:'none'}}/>
            <button type="button" onClick={verifyOtp} disabled={loading}
              style={{padding:'10px 16px',borderRadius:'8px',background:'#16a34a',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'13px',fontWeight:'800'}}>
              {loading ? '⏳' : '✅ تأكيد'}
            </button>
          </div>
        </div>
      )}
      {err && <p style={{color:'#dc2626',fontSize:'12px',margin:'6px 0 0'}}>{err}</p>}
    </div>
  )
}

export default function Subscribe() {
  const [mode, setMode] = useState(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ fullName:'', phone:'', whatsApp:'', email:'', sectors:[], notifyBy:[] })
  const [verified, setVerified] = useState({ phone: false, whatsApp: false, email: false })
  const [loginPhone, setLoginPhone] = useState('')
  const [loginOtp, setLoginOtp] = useState('')
  const [subscriber, setSubscriber] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const set = (k,v) => setForm(p=>({...p,[k]:v}))
  const setV = (k,v) => setVerified(p=>({...p,[k]:v}))

  const toggleSector = s => set('sectors', form.sectors.includes(s) ? form.sectors.filter(x=>x!==s) : [...form.sectors, s])
  const toggleNotify = k => set('notifyBy', form.notifyBy.includes(k) ? form.notifyBy.filter(x=>x!==k) : [...form.notifyBy, k])
  const selectAll = () => set('notifyBy', NOTIFY_OPTIONS.map(o=>o.key))

  // تسجيل جديد - الخطوة 1 → 2
  const goStep2 = () => {
    if (!form.fullName) { setErr('الاسم مطلوب'); return }
    if (!form.phone) { setErr('رقم الهاتف مطلوب'); return }
    if (!verified.phone) { setErr('⚠️ رقم الهاتف مطلوب — اضغط 📲 تحقق وأدخل الرمز المرسل على واتساب'); return }
    setErr(''); setStep(2)
  }

  // تسجيل جديد - الخطوة 2: حفظ
  const register = async () => {
    if (form.sectors.length === 0) { setErr('اختر قطاعاً واحداً على الأقل'); return }
    if (form.notifyBy.length === 0) { setErr('اختر طريقة إشعار واحدة على الأقل'); return }
    setLoading(true); setErr('')
    try {
      await api.post(`${API}/subscribers`, {
        fullName: form.fullName, phone: form.phone,
        whatsApp: form.whatsApp || form.phone, email: form.email,
        sectors: JSON.stringify(form.sectors), notifyBy: JSON.stringify(form.notifyBy)
      })
      setMsg('🎉 تم التسجيل بنجاح! سنبلّغك بكل ما هو جديد.')
      setStep(99)
    } catch(e) { setErr(e?.response?.data?.message || 'حدث خطأ') }
    setLoading(false)
  }

  // مسجّل سابق - إرسال OTP
  const sendLoginOtp = async () => {
    if (!loginPhone) { setErr('أدخل رقم الهاتف'); return }
    setLoading(true); setErr('')
    try {
      await api.post(`${API}/subscribers/send-otp`, { phone: loginPhone })
      setStep(2); setLoginOtp(''); setMsg('💬 سيصل الرمز عبر الواتساب')
    } catch(e) { setErr(e?.response?.data?.message || 'الرقم غير مسجّل') }
    setLoading(false)
  }

  // مسجّل سابق - تحقق OTP
  const verifyLogin = async () => {
    if (!loginOtp) { setErr('أدخل الرمز'); return }
    setLoading(true); setErr('')
    try {
      const r = await api.post(`${API}/subscribers/verify-otp`, { phone: loginPhone, code: loginOtp })
      setSubscriber(r.data)
      const s = r.data
      const sec = (() => { try { return JSON.parse(s.sectors||'[]') } catch { return [] } })()
      const ntf = (() => { try { return JSON.parse(s.notifyBy||'[]') } catch { return [] } })()
      setForm({ fullName: s.fullName, phone: s.phone, whatsApp: s.whatsApp||'', email: s.email||'', sectors: sec, notifyBy: ntf })
      setVerified({ phone: true, whatsApp: !!s.whatsApp, email: !!s.email })
      setStep(3); setMsg('')
    } catch(e) { setErr(e?.response?.data?.message || 'رمز خاطئ') }
    setLoading(false)
  }

  // مسجّل سابق - تحديث
  const update = async () => {
    if (form.sectors.length === 0) { setErr('اختر قطاعاً على الأقل'); return }
    setLoading(true); setErr('')
    try {
      await api.put(`${API}/subscribers/${subscriber.id}`, {
        fullName: form.fullName, phone: form.phone,
        whatsApp: form.whatsApp||form.phone, email: form.email,
        sectors: JSON.stringify(form.sectors), notifyBy: JSON.stringify(form.notifyBy)
      })
      setMsg('✅ تم تحديث بياناتك بنجاح!'); setStep(99)
    } catch(e) { setErr(e?.response?.data?.message || 'حدث خطأ') }
    setLoading(false)
  }

  const btnPrimary = { padding:'14px', borderRadius:'12px', background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)', color:'#fff', border:'none', cursor:'pointer', fontFamily:'Cairo,sans-serif', fontWeight:'800', fontSize:'15px', width:'100%' }
  const btnBack = { padding:'10px', borderRadius:'10px', background:'none', border:'none', color:'#888', cursor:'pointer', fontFamily:'Cairo,sans-serif', fontSize:'13px', width:'100%' }

  return (
    <div style={{minHeight:'80vh',background:'#F5F7FA',padding:'32px 16px',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      <div style={{maxWidth:'540px',margin:'0 auto'}}>

        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#1a1a2e,#2C3E6B)',borderRadius:'20px',padding:'32px',textAlign:'center',marginBottom:'24px'}}>
          <div style={{fontSize:'48px',marginBottom:'12px'}}>🔔</div>
          <h1 style={{color:'#fff',fontWeight:'800',fontSize:'22px',margin:'0 0 8px'}}>سجّل متابعاً</h1>
          <p style={{color:'rgba(255,255,255,0.7)',fontSize:'14px',margin:0}}>ليصلك كل ما هو جديد من اتحاد الغرف التجارية العراقية</p>
        </div>

        {/* نجاح */}
        {step === 99 && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'40px',textAlign:'center',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
            <div style={{fontSize:'64px',marginBottom:'16px'}}>🎉</div>
            <p style={{color:'#16a34a',fontSize:'16px',fontWeight:'700'}}>{msg}</p>
            <button onClick={()=>{setMode(null);setStep(1);setMsg('');setErr('');setVerified({phone:false,whatsApp:false,email:false});setForm({fullName:'',phone:'',whatsApp:'',email:'',sectors:[],notifyBy:[]})}} style={{...btnPrimary,marginTop:'20px',width:'auto',padding:'12px 32px'}}>
              العودة
            </button>
          </div>
        )}

        {/* اختيار النوع */}
        {step === 1 && !mode && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'28px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
              <button onClick={()=>setMode('new')} style={{padding:'24px 16px',borderRadius:'14px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',textAlign:'center'}}>
                <div style={{fontSize:'36px',marginBottom:'8px'}}>✨</div>
                <div style={{fontWeight:'800',fontSize:'15px'}}>تسجيل جديد</div>
                <div style={{fontSize:'12px',opacity:0.8,marginTop:'4px'}}>أنشئ حساباً جديداً</div>
              </button>
              <button onClick={()=>setMode('existing')} style={{padding:'24px 16px',borderRadius:'14px',background:'linear-gradient(135deg,#059669,#047857)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',textAlign:'center'}}>
                <div style={{fontSize:'36px',marginBottom:'8px'}}>🔑</div>
                <div style={{fontWeight:'800',fontSize:'15px'}}>مسجّل سابقاً</div>
                <div style={{fontSize:'12px',opacity:0.8,marginTop:'4px'}}>ادخل وعدّل بياناتك</div>
              </button>
            </div>
          </div>
        )}

        {/* تسجيل جديد - خطوة 1: البيانات + تحقق */}
        {mode === 'new' && step === 1 && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'28px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
            <h2 style={{color:'#2C3E6B',fontWeight:'800',margin:'0 0 4px',fontSize:'18px'}}>✨ تسجيل جديد</h2>
            <p style={{color:'#888',fontSize:'13px',margin:'0 0 20px'}}>الخطوة 1 من 2: بياناتك الأساسية</p>
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              <div>
                <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#2C3E6B',marginBottom:'6px'}}>الاسم الكامل *</label>
                <input value={form.fullName} onChange={e=>set('fullName',e.target.value)} placeholder="الاسم والكنية"
                  style={{width:'100%',padding:'11px 14px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',outline:'none',boxSizing:'border-box'}}/>
              </div>

              <VerifiedField label="رقم الهاتف" value={form.phone} onChange={v=>set('phone',v)}
                placeholder="07xxxxxxxxx — لغاية تسجيل الحساب" isLtr field="phone" required
                verified={verified.phone} onVerified={v=>setV('phone',v)}/>

              <VerifiedField label="رقم الواتساب" value={form.whatsApp} onChange={v=>set('whatsApp',v)}
                placeholder="07xxxxxxxxx — لغاية إرسال التبليغات" isLtr field="whatsapp"
                verified={verified.whatsApp} onVerified={v=>setV('whatsApp',v)}/>

              <VerifiedField label="البريد الإلكتروني" value={form.email} onChange={v=>set('email',v)}
                placeholder="email@example.com — لغاية إرسال التبليغات" isLtr field="email"
                verified={verified.email} onVerified={v=>setV('email',v)}/>

              {err && <div style={{background:'#fee2e2',color:'#dc2626',padding:'10px 14px',borderRadius:'10px',fontSize:'13px'}}>{err}</div>}
              <button onClick={goStep2} style={btnPrimary}>➜ التالي: اختر القطاعات</button>
              <button onClick={()=>setMode(null)} style={btnBack}>← رجوع</button>
            </div>
          </div>
        )}

        {/* تسجيل جديد - خطوة 2: القطاعات */}
        {mode === 'new' && step === 2 && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'28px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
            <h2 style={{color:'#2C3E6B',fontWeight:'800',margin:'0 0 4px',fontSize:'18px'}}>🎯 اختر اهتماماتك</h2>
            <p style={{color:'#888',fontSize:'13px',margin:'0 0 20px'}}>الخطوة 2 من 2: القطاعات وطرق الإشعار</p>
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              <div>
                <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#2C3E6B',marginBottom:'8px'}}>القطاعات * <span style={{color:'#888',fontWeight:'400'}}>(اختر واحداً أو أكثر)</span></label>
                <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'8px'}}>
                  {SECTORS.map(s=>(
                    <button key={s} type="button" onClick={()=>toggleSector(s)}
                      style={{padding:'6px 14px',borderRadius:'20px',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:'600',
                        background:form.sectors.includes(s)?'#2C3E6B':'#EEF2FF',color:form.sectors.includes(s)?'#fff':'#2C3E6B'}}>
                      {form.sectors.includes(s)?'✓ ':''}{s}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={()=>set('sectors', form.sectors.length===SECTORS.length ? [] : [...SECTORS])}
                  style={{padding:'6px 14px',borderRadius:'8px',background:'#FFF8E7',color:'#B8860B',border:'1px solid #fde68a',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:'700'}}>
                  {form.sectors.length===SECTORS.length ? '❌ إلغاء الكل' : '✅ اختر الكل'}
                </button>
              </div>
              <div>
                <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#2C3E6B',marginBottom:'8px'}}>طريقة الإشعار *</label>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'8px'}}>
                  {NOTIFY_OPTIONS.map(o=>{
                    const disabled = (o.key==='whatsapp' && !form.whatsApp) || (o.key==='email' && !form.email)
                    return (
                      <button key={o.key} type="button"
                        onClick={()=>!disabled && toggleNotify(o.key)}
                        title={disabled ? (o.key==='whatsapp' ? 'أضف رقم الواتساب أولاً' : 'أضف البريد الإلكتروني أولاً') : ''}
                        style={{padding:'8px 16px',borderRadius:'10px',border:'none',cursor:disabled?'not-allowed':'pointer',fontFamily:'Cairo,sans-serif',fontSize:'13px',fontWeight:'700',opacity:disabled?0.4:1,
                          background:form.notifyBy.includes(o.key)?'#059669':'#F0FDF4',color:form.notifyBy.includes(o.key)?'#fff':'#059669'}}>
                        {form.notifyBy.includes(o.key)?'✓ ':''}{o.label}
                        {disabled && <span style={{fontSize:'10px',display:'block',marginTop:'2px'}}>يتطلب إضافة</span>}
                      </button>
                    )
                  })}
                  <button onClick={selectAll} type="button" style={{padding:'8px 14px',borderRadius:'10px',background:'#FFF8E7',color:'#B8860B',border:'1px solid #fde68a',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:'700'}}>
                    ✅ كل الطرق
                  </button>
                </div>
                {(!form.whatsApp && !form.email) && (
                  <div style={{background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:'10px',padding:'10px 14px',fontSize:'12px',color:'#c2410c',marginBottom:'8px'}}>
                    ⚠️ يجب إضافة رقم الواتساب أو البريد الإلكتروني للاستفادة من خدمة التبليغات
                  </div>
                )}
              </div>
              {err && <div style={{background:'#fee2e2',color:'#dc2626',padding:'10px 14px',borderRadius:'10px',fontSize:'13px'}}>{err}</div>}
              <button onClick={register} disabled={loading} style={btnPrimary}>{loading?'⏳ جاري التسجيل...':'🎉 أكمل التسجيل'}</button>
              <button onClick={()=>setStep(1)} style={btnBack}>← رجوع</button>
            </div>
          </div>
        )}

        {/* مسجّل سابق - خطوة 1: رقم الهاتف */}
        {mode === 'existing' && step === 1 && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'28px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
            <h2 style={{color:'#2C3E6B',fontWeight:'800',margin:'0 0 20px',fontSize:'18px'}}>🔑 الدخول برقم الهاتف</h2>
            <input value={loginPhone} onChange={e=>setLoginPhone(e.target.value)} placeholder="07xxxxxxxxx"
              style={{width:'100%',padding:'11px 14px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'14px',direction:'ltr',fontFamily:'Cairo,sans-serif',outline:'none',boxSizing:'border-box'}}/>
            {err && <div style={{background:'#fee2e2',color:'#dc2626',padding:'10px 14px',borderRadius:'10px',fontSize:'13px',marginTop:'12px'}}>{err}</div>}
            <button onClick={sendLoginOtp} disabled={loading} style={{...btnPrimary,marginTop:'16px'}}>{loading?'⏳...':'📱 أرسل رمز التأكيد'}</button>
            <button onClick={()=>setMode(null)} style={{...btnBack,marginTop:'8px'}}>← رجوع</button>
          </div>
        )}

        {/* مسجّل سابق - خطوة 2: OTP */}
        {mode === 'existing' && step === 2 && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'28px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
            <h2 style={{color:'#2C3E6B',fontWeight:'800',margin:'0 0 8px',fontSize:'18px'}}>📲 رمز التأكيد</h2>
            <p style={{color:'#059669',fontSize:'13px',margin:'0 0 12px',background:'#f0fdf4',padding:'10px',borderRadius:'8px',fontWeight:'700'}}>💬 سيصل الرمز عبر الواتساب</p>
            {msg && <p style={{color:'#059669',fontSize:'13px',margin:'0 0 12px',background:'#f0fdf4',padding:'10px',borderRadius:'8px'}}>{msg}</p>}
            <input value={loginOtp}
              onChange={e=>setLoginOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
              onPaste={e=>{e.preventDefault();const t=e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);setLoginOtp(t)}}
              placeholder="000000" inputMode="numeric" autoComplete="one-time-code"
              style={{width:'100%',padding:'12px',border:'1.5px solid #c7d2fe',borderRadius:'10px',fontSize:'22px',fontWeight:'800',letterSpacing:'8px',textAlign:'center',fontFamily:'monospace',outline:'none',boxSizing:'border-box'}} maxLength={6}/>
            {err && <div style={{background:'#fee2e2',color:'#dc2626',padding:'10px 14px',borderRadius:'10px',fontSize:'13px',marginTop:'12px'}}>{err}</div>}
            <button onClick={verifyLogin} disabled={loading} style={{...btnPrimary,marginTop:'16px'}}>{loading?'⏳...':'✅ تأكيد الدخول'}</button>
            <button onClick={sendLoginOtp} disabled={loading} style={{...btnPrimary,marginTop:'8px',background:'#f5f7fa',color:'#2C3E6B'}}>🔄 أرسل رمز جديد</button>
          </div>
        )}

        {/* مسجّل سابق - خطوة 3: تعديل */}
        {mode === 'existing' && step === 3 && (
          <div style={{fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
            {/* Header بروفايل */}
            <div style={{background:'linear-gradient(135deg,#1a1a2e,#2C3E6B)',borderRadius:'20px',padding:'28px',textAlign:'center',marginBottom:'16px',position:'relative'}}>
              <div style={{width:'72px',height:'72px',borderRadius:'50%',background:'linear-gradient(135deg,#FFC72C,#f59e0b)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'32px',margin:'0 auto 12px',boxShadow:'0 4px 16px rgba(0,0,0,0.3)'}}>
                {form.fullName?.charAt(0) || '👤'}
              </div>
              <h2 style={{color:'#fff',fontWeight:'900',fontSize:'20px',margin:'0 0 4px'}}>{form.fullName}</h2>
              <div style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'rgba(255,255,255,0.1)',padding:'5px 14px',borderRadius:'20px',marginTop:'6px'}}>
                <span style={{fontSize:'14px'}}>📱</span>
                <span style={{color:'#FFC72C',fontWeight:'700',fontSize:'14px',direction:'ltr'}}>{form.phone}</span>
              </div>
            </div>

            {/* البيانات */}
            <div style={{background:'#fff',borderRadius:'16px',padding:'20px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)',marginBottom:'12px'}}>
              <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'15px',margin:'0 0 16px',paddingBottom:'10px',borderBottom:'2px solid #FFC72C'}}>👤 البيانات الشخصية</h3>
              <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                <div>
                  <label style={{display:'block',fontSize:'12px',fontWeight:'700',color:'#888',marginBottom:'5px'}}>الاسم الكامل</label>
                  <input value={form.fullName} onChange={e=>set('fullName',e.target.value)}
                    style={{width:'100%',padding:'11px 14px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',outline:'none',boxSizing:'border-box',background:'#fafbff'}}/>
                </div>
                <VerifiedField label="رقم الواتساب" value={form.whatsApp} onChange={v=>set('whatsApp',v)}
                  placeholder="07xxxxxxxxx — لغاية إرسال التبليغات" isLtr field="whatsapp"
                  verified={verified.whatsApp} onVerified={v=>setV('whatsApp',v)}/>
                <VerifiedField label="البريد الإلكتروني" value={form.email} onChange={v=>set('email',v)}
                  placeholder="email@example.com — لغاية إرسال التبليغات" isLtr field="email"
                  verified={verified.email} onVerified={v=>setV('email',v)}/>
              </div>
            </div>

            {/* القطاعات */}
            <div style={{background:'#fff',borderRadius:'16px',padding:'20px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)',marginBottom:'12px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px',paddingBottom:'10px',borderBottom:'2px solid #FFC72C'}}>
                <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'15px',margin:0}}>🏭 القطاعات</h3>
                <button type="button" onClick={()=>set('sectors', form.sectors.length===SECTORS.length ? [] : [...SECTORS])}
                  style={{padding:'5px 12px',borderRadius:'8px',background:'#FFF8E7',color:'#B8860B',border:'1px solid #fde68a',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'11px',fontWeight:'700'}}>
                  {form.sectors.length===SECTORS.length ? '❌ إلغاء الكل' : '✅ اختر الكل'}
                </button>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                {SECTORS.map(s=>(
                  <button key={s} type="button" onClick={()=>toggleSector(s)}
                    style={{padding:'7px 14px',borderRadius:'20px',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:'600',transition:'all 0.15s',
                      background:form.sectors.includes(s)?'#2C3E6B':'#EEF2FF',color:form.sectors.includes(s)?'#fff':'#2C3E6B',
                      boxShadow:form.sectors.includes(s)?'0 2px 8px rgba(44,62,107,0.25)':'none'}}>
                    {form.sectors.includes(s)?'✓ ':''}{s}
                  </button>
                ))}
              </div>
            </div>

            {/* طريقة الإشعار */}
            <div style={{background:'#fff',borderRadius:'16px',padding:'20px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)',marginBottom:'16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px',paddingBottom:'10px',borderBottom:'2px solid #FFC72C'}}>
                <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'15px',margin:0}}>📢 طريقة الإشعار</h3>
                <button onClick={selectAll} type="button" style={{padding:'5px 12px',borderRadius:'8px',background:'#F0FDF4',color:'#16a34a',border:'1px solid #86efac',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'11px',fontWeight:'700'}}>
                  ✅ كل الطرق
                </button>
              </div>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                {NOTIFY_OPTIONS.map(o=>(
                  <button key={o.key} type="button" onClick={()=>toggleNotify(o.key)}
                    style={{flex:1,minWidth:'100px',padding:'12px 8px',borderRadius:'12px',border:'2px solid',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'13px',fontWeight:'700',textAlign:'center',transition:'all 0.15s',
                      background:form.notifyBy.includes(o.key)?'#059669':'#fff',
                      color:form.notifyBy.includes(o.key)?'#fff':'#059669',
                      borderColor:form.notifyBy.includes(o.key)?'#059669':'#86efac'}}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {err && <div style={{background:'#fee2e2',color:'#dc2626',padding:'12px 16px',borderRadius:'12px',fontSize:'13px',marginBottom:'12px',fontWeight:'700'}}>{err}</div>}
            {msg && <div style={{background:'#d1fae5',color:'#065f46',padding:'12px 16px',borderRadius:'12px',fontSize:'13px',marginBottom:'12px',fontWeight:'700'}}>{msg}</div>}
            <button onClick={update} disabled={loading} style={{...btnPrimary,borderRadius:'14px',fontSize:'16px',padding:'15px'}}>
              {loading?'⏳ جاري الحفظ...':'💾 حفظ التعديلات'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
