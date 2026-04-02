import { useState, useEffect } from 'react'
import api from '../lib/api'

const API = ''
const SECTORS = ['تجارة عامة','استيراد وتصدير','صناعة وتصنيع','مقاولات وإنشاءات','خدمات مهنية','تكنولوجيا ومعلوماتية','نقل ولوجستيات','زراعة وأغذية','صحة وصيدلة','تعليم وتدريب','سياحة وفنادق','عقارات','مالية وتأمين','طاقة وكهرباء','أخرى']
const NOTIFY_OPTIONS = [
  { key: 'whatsapp', label: 'واتساب 💬' },
  { key: 'sms',      label: 'رسالة نصية 📱' },
  { key: 'email',    label: 'بريد إلكتروني 📧' },
]

export default function Subscribe() {
  const [mode, setMode] = useState(null) // 'new' | 'existing'
  const [step, setStep] = useState(1) // تسجيل جديد: 1=البيانات→2=OTP→3=القطاعات، مسجّل سابق: 1=الهاتف→2=OTP→3=تعديل
  const [form, setForm] = useState({ fullName:'', phone:'', whatsApp:'', email:'', sectors:[], notifyBy:[] })
  const [otp, setOtp] = useState('')
  const [phone, setPhone] = useState('')
  const [subscriber, setSubscriber] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)

  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  const toggleSector = s => {
    const arr = form.sectors.includes(s) ? form.sectors.filter(x=>x!==s) : [...form.sectors, s]
    set('sectors', arr)
  }
  const toggleNotify = k => {
    const arr = form.notifyBy.includes(k) ? form.notifyBy.filter(x=>x!==k) : [...form.notifyBy, k]
    set('notifyBy', arr)
  }
  const selectAll = () => set('notifyBy', NOTIFY_OPTIONS.map(o=>o.key))

  // تسجيل جديد - الخطوة 1: البيانات الأساسية
  const stepNewSubmit = async () => {
    if (!form.fullName || !form.phone) { setErr('الاسم ورقم الهاتف مطلوبان'); return }
    setLoading(true); setErr(''); setMsg('')
    try {
      await api.post(`${API}/subscribers/send-otp-new`, { phone: form.phone })
      setStep(2); setOtp('')
      setMsg('تم إرسال رمز التأكيد على رقمك 📱')
    } catch(e) { setErr(e?.response?.data?.message || 'حدث خطأ') }
    setLoading(false)
  }

  // تسجيل جديد - الخطوة 2: تحقق OTP
  const stepNewVerifyOtp = async () => {
    if (!otp) { setErr('أدخل رمز التأكيد'); return }
    setLoading(true); setErr('')
    try {
      await api.post(`${API}/subscribers/verify-otp-new`, { phone: form.phone, code: otp })
      setOtpVerified(true); setStep(3)
      setMsg('✅ تم تحقق رقمك بنجاح')
    } catch(e) { setErr(e?.response?.data?.message || 'رمز خاطئ') }
    setLoading(false)
  }

  // تسجيل جديد - الخطوة 3: اختيار القطاعات والإشعارات
  const register = async () => {
    if (form.sectors.length === 0) { setErr('اختر قطاعاً واحداً على الأقل'); return }
    if (form.notifyBy.length === 0) { setErr('اختر طريقة إشعار واحدة على الأقل'); return }
    setLoading(true); setErr('')
    try {
      await api.post(`${API}/subscribers`, {
        fullName: form.fullName, phone: form.phone,
        whatsApp: form.whatsApp || form.phone, email: form.email,
        sectors: JSON.stringify(form.sectors),
        notifyBy: JSON.stringify(form.notifyBy)
      })
      setMsg('🎉 تم التسجيل بنجاح! سنبلّغك بكل ما هو جديد.')
      setStep(99)
    } catch(e) { setErr(e?.response?.data?.message || 'حدث خطأ') }
    setLoading(false)
  }

  // طلب OTP للمسجّل السابق
  const sendOtp = async () => {
    if (!phone) { setErr('أدخل رقم الهاتف'); return }
    setLoading(true); setErr('')
    try {
      await api.post(`${API}/subscribers/send-otp`, { phone })
      setStep(2)
      setMsg('تم إرسال رمز التأكيد على رقمك')
    } catch(e) { setErr(e?.response?.data?.message || 'الرقم غير مسجّل') }
    setLoading(false)
  }

  // تحقق OTP
  const verifyOtp = async () => {
    if (!otp) { setErr('أدخل رمز التأكيد'); return }
    setLoading(true); setErr('')
    try {
      const r = await api.post(`${API}/subscribers/verify-otp`, { phone, code: otp })
      setSubscriber(r.data)
      const s = r.data
      const sec = (() => { try { return JSON.parse(s.sectors||'[]') } catch { return [] } })()
      const ntf = (() => { try { return JSON.parse(s.notifyBy||'[]') } catch { return [] } })()
      setForm({ fullName: s.fullName, phone: s.phone, whatsApp: s.whatsApp||'', email: s.email||'', sectors: sec, notifyBy: ntf })
      setStep(3)
      setMsg('')
    } catch(e) { setErr(e?.response?.data?.message || 'رمز خاطئ') }
    setLoading(false)
  }

  // تحديث بيانات المسجّل
  const update = async () => {
    if (form.sectors.length === 0) { setErr('اختر قطاعاً على الأقل'); return }
    setLoading(true); setErr('')
    try {
      await api.put(`${API}/subscribers/${subscriber.id}`, {
        fullName: form.fullName, phone: form.phone,
        whatsApp: form.whatsApp||form.phone, email: form.email,
        sectors: JSON.stringify(form.sectors), notifyBy: JSON.stringify(form.notifyBy)
      })
      setMsg('✅ تم تحديث بياناتك بنجاح!')
      setStep(99)
    } catch(e) { setErr(e?.response?.data?.message || 'حدث خطأ') }
    setLoading(false)
  }

  const inp = { width:'100%', padding:'11px 14px', borderRadius:'10px', border:'1.5px solid #dde3ed', fontSize:'14px', fontFamily:'Cairo,sans-serif', direction:'rtl', outline:'none', boxSizing:'border-box' }
  const lbl = { display:'block', fontSize:'13px', fontWeight:'700', color:'#2C3E6B', marginBottom:'6px' }

  return (
    <div style={{minHeight:'80vh',background:'#F5F7FA',padding:'32px 16px',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      <div style={{maxWidth:'540px',margin:'0 auto'}}>

        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#1a1a2e,#2C3E6B)',borderRadius:'20px',padding:'32px',textAlign:'center',marginBottom:'24px'}}>
          <div style={{fontSize:'48px',marginBottom:'12px'}}>🔔</div>
          <h1 style={{color:'#fff',fontWeight:'800',fontSize:'22px',margin:'0 0 8px'}}>سجّل متابعاً</h1>
          <p style={{color:'rgba(255,255,255,0.7)',fontSize:'14px',margin:0}}>ليصلك كل ما هو جديد من اتحاد الغرف التجارية العراقية</p>
        </div>

        {/* Success */}
        {step === 99 && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'40px',textAlign:'center',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
            <div style={{fontSize:'64px',marginBottom:'16px'}}>🎉</div>
            <p style={{color:'#16a34a',fontSize:'16px',fontWeight:'700'}}>{msg}</p>
            <button onClick={()=>{setMode(null);setStep(1);setMsg('');setErr('')}}
              style={{marginTop:'20px',padding:'12px 32px',borderRadius:'10px',background:'#2C3E6B',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px'}}>
              العودة
            </button>
          </div>
        )}

        {/* اختيار النوع */}
        {step === 1 && !mode && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'28px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
              <button onClick={()=>setMode('new')}
                style={{padding:'24px 16px',borderRadius:'14px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',textAlign:'center'}}>
                <div style={{fontSize:'36px',marginBottom:'8px'}}>✨</div>
                <div style={{fontWeight:'800',fontSize:'15px'}}>تسجيل جديد</div>
                <div style={{fontSize:'12px',opacity:0.8,marginTop:'4px'}}>أنشئ حساباً جديداً</div>
              </button>
              <button onClick={()=>setMode('existing')}
                style={{padding:'24px 16px',borderRadius:'14px',background:'linear-gradient(135deg,#059669,#047857)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',textAlign:'center'}}>
                <div style={{fontSize:'36px',marginBottom:'8px'}}>🔑</div>
                <div style={{fontWeight:'800',fontSize:'15px'}}>مسجّل سابقاً</div>
                <div style={{fontSize:'12px',opacity:0.8,marginTop:'4px'}}>ادخل وعدّل بياناتك</div>
              </button>
            </div>
          </div>
        )}

        {/* تسجيل جديد - الخطوة 1: البيانات الأساسية */}
        {mode === 'new' && step === 1 && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'28px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
            <h2 style={{color:'#2C3E6B',fontWeight:'800',margin:'0 0 8px',fontSize:'18px'}}>✨ تسجيل جديد</h2>
            <p style={{color:'#888',fontSize:'13px',margin:'0 0 20px'}}>الخطوة 1 من 3: البيانات الأساسية</p>
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              <div><label style={lbl}>الاسم الكامل *</label><input value={form.fullName} onChange={e=>set('fullName',e.target.value)} placeholder="الاسم والكنية" style={inp}/></div>
              <div><label style={lbl}>رقم الهاتف *</label><input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="07xxxxxxxxx" style={{...inp,direction:'ltr'}}/></div>
              <div><label style={lbl}>رقم الواتساب</label><input value={form.whatsApp} onChange={e=>set('whatsApp',e.target.value)} placeholder="نفس الهاتف إذا فارغ" style={{...inp,direction:'ltr'}}/></div>
              <div><label style={lbl}>البريد الإلكتروني</label><input value={form.email} onChange={e=>set('email',e.target.value)} placeholder="email@example.com" style={{...inp,direction:'ltr'}}/></div>

              {err && <div style={{background:'#fee2e2',color:'#dc2626',padding:'10px 14px',borderRadius:'10px',fontSize:'13px'}}>{err}</div>}
              <button onClick={stepNewSubmit} disabled={loading}
                style={{padding:'14px',borderRadius:'12px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'800',fontSize:'15px'}}>
                {loading ? '⏳ جاري الإرسال...' : '➜ التالي: تحقق الهاتف'}
              </button>
              <button onClick={()=>setMode(null)} style={{padding:'10px',borderRadius:'10px',background:'none',border:'none',color:'#888',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'13px'}}>← رجوع</button>
            </div>
          </div>
        )}

        {/* تسجيل جديد - الخطوة 2: تحقق OTP */}
        {mode === 'new' && step === 2 && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'28px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
            <h2 style={{color:'#2C3E6B',fontWeight:'800',margin:'0 0 8px',fontSize:'18px'}}>📲 تحقق رقم الهاتف</h2>
            <p style={{color:'#888',fontSize:'13px',margin:'0 0 8px'}}>الخطوة 2 من 3: تأكيد OTP</p>
            {msg && <p style={{color:'#059669',fontSize:'13px',margin:'0 0 16px',background:'#f0fdf4',padding:'10px',borderRadius:'8px'}}>{msg}</p>}
            <label style={lbl}>أدخل الرمز المرسل على {form.phone}</label>
            <input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="000000" style={{...inp,letterSpacing:'8px',textAlign:'center',fontSize:'20px',fontWeight:'800'}} maxLength={6}/>
            {err && <div style={{background:'#fee2e2',color:'#dc2626',padding:'10px 14px',borderRadius:'10px',fontSize:'13px',marginTop:'12px'}}>{err}</div>}
            <button onClick={stepNewVerifyOtp} disabled={loading} style={{width:'100%',marginTop:'16px',padding:'14px',borderRadius:'12px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'800',fontSize:'15px'}}>
              {loading ? '⏳...' : '✅ التالي: اختر القطاعات'}
            </button>
            <button onClick={stepNewSubmit} disabled={loading} style={{width:'100%',marginTop:'8px',padding:'10px',borderRadius:'10px',background:'#f5f7fa',color:'#2C3E6B',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'13px'}}>
              🔄 أرسل رمز جديد
            </button>
          </div>
        )}

        {/* تسجيل جديد - الخطوة 3: اختيار القطاعات والإشعارات */}
        {mode === 'new' && step === 3 && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'28px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
            <h2 style={{color:'#2C3E6B',fontWeight:'800',margin:'0 0 8px',fontSize:'18px'}}>🎯 اختر اهتماماتك</h2>
            <p style={{color:'#888',fontSize:'13px',margin:'0 0 20px'}}>الخطوة 3 من 3: القطاعات وطرق الإشعار</p>
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              <div>
                <label style={lbl}>القطاعات المهتم بها * <span style={{color:'#888',fontWeight:'400'}}>(اختر واحداً أو أكثر)</span></label>
                <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                  {SECTORS.map(s => (
                    <button key={s} type="button" onClick={()=>toggleSector(s)}
                      style={{padding:'6px 14px',borderRadius:'20px',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:'600',
                        background:form.sectors.includes(s)?'#2C3E6B':'#EEF2FF',
                        color:form.sectors.includes(s)?'#fff':'#2C3E6B',transition:'all 0.15s'}}>
                      {form.sectors.includes(s)?'✓ ':''}{s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={lbl}>طريقة الإشعار *</label>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'8px'}}>
                  {NOTIFY_OPTIONS.map(o => (
                    <button key={o.key} type="button" onClick={()=>toggleNotify(o.key)}
                      style={{padding:'8px 16px',borderRadius:'10px',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'13px',fontWeight:'700',
                        background:form.notifyBy.includes(o.key)?'#059669':'#F0FDF4',
                        color:form.notifyBy.includes(o.key)?'#fff':'#059669',transition:'all 0.15s'}}>
                      {form.notifyBy.includes(o.key)?'✓ ':''}{o.label}
                    </button>
                  ))}
                </div>
                <button onClick={selectAll} type="button" style={{padding:'6px 14px',borderRadius:'8px',background:'#FFF8E7',color:'#B8860B',border:'1px solid #fde68a',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:'700'}}>
                  ✅ كل الطرق
                </button>
              </div>

              {err && <div style={{background:'#fee2e2',color:'#dc2626',padding:'10px 14px',borderRadius:'10px',fontSize:'13px'}}>{err}</div>}
              <button onClick={register} disabled={loading}
                style={{padding:'14px',borderRadius:'12px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'800',fontSize:'15px'}}>
                {loading ? '⏳ جاري التسجيل...' : '🎉 أكمل التسجيل'}
              </button>
            </div>
          </div>
        )}

        {/* مسجّل سابق — إدخال رقم */}
        {mode === 'existing' && step === 1 && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'28px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
            <h2 style={{color:'#2C3E6B',fontWeight:'800',margin:'0 0 20px',fontSize:'18px'}}>🔑 الدخول برقم الهاتف</h2>
            <div><label style={lbl}>رقم الهاتف المسجّل</label>
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="07xxxxxxxxx" style={{...inp,direction:'ltr'}}/>
            </div>
            {err && <div style={{background:'#fee2e2',color:'#dc2626',padding:'10px 14px',borderRadius:'10px',fontSize:'13px',marginTop:'12px'}}>{err}</div>}
            <button onClick={sendOtp} disabled={loading} style={{width:'100%',marginTop:'16px',padding:'14px',borderRadius:'12px',background:'linear-gradient(135deg,#059669,#047857)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'800',fontSize:'15px'}}>
              {loading ? '⏳...' : '📱 أرسل رمز التأكيد'}
            </button>
            <button onClick={()=>setMode(null)} style={{width:'100%',marginTop:'8px',padding:'10px',borderRadius:'10px',background:'none',border:'none',color:'#888',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'13px'}}>← رجوع</button>
          </div>
        )}

        {/* تحقق OTP */}
        {mode === 'existing' && step === 2 && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'28px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
            <h2 style={{color:'#2C3E6B',fontWeight:'800',margin:'0 0 8px',fontSize:'18px'}}>📲 رمز التأكيد</h2>
            {msg && <p style={{color:'#059669',fontSize:'13px',margin:'0 0 16px'}}>{msg}</p>}
            <input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="أدخل الرمز المرسل" style={{...inp,letterSpacing:'8px',textAlign:'center',fontSize:'20px',fontWeight:'800'}} maxLength={6}/>
            {err && <div style={{background:'#fee2e2',color:'#dc2626',padding:'10px 14px',borderRadius:'10px',fontSize:'13px',marginTop:'12px'}}>{err}</div>}
            <button onClick={verifyOtp} disabled={loading} style={{width:'100%',marginTop:'16px',padding:'14px',borderRadius:'12px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'800',fontSize:'15px'}}>
              {loading ? '⏳...' : '✅ تأكيد الدخول'}
            </button>
          </div>
        )}

        {/* تعديل البيانات */}
        {mode === 'existing' && step === 3 && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'28px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
            <h2 style={{color:'#2C3E6B',fontWeight:'800',margin:'0 0 20px',fontSize:'18px'}}>✏️ تعديل بياناتك</h2>
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              <div><label style={lbl}>الاسم الكامل</label><input value={form.fullName} onChange={e=>set('fullName',e.target.value)} style={inp}/></div>
              <div><label style={lbl}>رقم الواتساب</label><input value={form.whatsApp} onChange={e=>set('whatsApp',e.target.value)} style={{...inp,direction:'ltr'}}/></div>
              <div><label style={lbl}>البريد الإلكتروني</label><input value={form.email} onChange={e=>set('email',e.target.value)} style={{...inp,direction:'ltr'}}/></div>
              <div>
                <label style={lbl}>القطاعات</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                  {SECTORS.map(s => (
                    <button key={s} type="button" onClick={()=>toggleSector(s)}
                      style={{padding:'6px 14px',borderRadius:'20px',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:'600',
                        background:form.sectors.includes(s)?'#2C3E6B':'#EEF2FF',color:form.sectors.includes(s)?'#fff':'#2C3E6B'}}>
                      {form.sectors.includes(s)?'✓ ':''}{s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>طريقة الإشعار</label>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  {NOTIFY_OPTIONS.map(o => (
                    <button key={o.key} type="button" onClick={()=>toggleNotify(o.key)}
                      style={{padding:'8px 16px',borderRadius:'10px',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'13px',fontWeight:'700',
                        background:form.notifyBy.includes(o.key)?'#059669':'#F0FDF4',color:form.notifyBy.includes(o.key)?'#fff':'#059669'}}>
                      {form.notifyBy.includes(o.key)?'✓ ':''}{o.label}
                    </button>
                  ))}
                  <button onClick={selectAll} type="button" style={{padding:'8px 14px',borderRadius:'10px',background:'#FFF8E7',color:'#B8860B',border:'1px solid #fde68a',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:'700'}}>كل الطرق</button>
                </div>
              </div>
              {err && <div style={{background:'#fee2e2',color:'#dc2626',padding:'10px 14px',borderRadius:'10px',fontSize:'13px'}}>{err}</div>}
              {msg && <div style={{background:'#d1fae5',color:'#065f46',padding:'10px 14px',borderRadius:'10px',fontSize:'13px'}}>{msg}</div>}
              <button onClick={update} disabled={loading}
                style={{padding:'14px',borderRadius:'12px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'800',fontSize:'15px'}}>
                {loading ? '⏳...' : '💾 حفظ التعديلات'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
