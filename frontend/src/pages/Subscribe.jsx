import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const [hint, setHint] = useState('')

  const lbl = { display:'block', fontSize:'13px', fontWeight:'700', color:'#2C3E6B', marginBottom:'6px' }
  const inp = { width:'100%', padding:'11px 14px', borderRadius:'10px', border:'1.5px solid #dde3ed', fontSize:'14px', fontFamily:'Cairo,sans-serif', outline:'none', boxSizing:'border-box' }

  const sendOtp = async () => {
    if (!value || value.trim().length < 3) { setErr('أدخل القيمة أولاً'); return }
    setLoading(true); setErr('')
    try {
      const r = await api.post(`${API}/subscribers/send-field-otp`, { field, value })
      setShowOtp(true); setSent(true); setOtp('')
      if (r.data?.attemptsInfo) setHint('⚠️ ' + r.data.attemptsInfo); else setHint('')
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
      {hint && <p style={{color:'#b45309',fontSize:'11px',margin:'4px 0 0',fontWeight:'600'}}>{hint}</p>}
      {err && <p style={{color:'#dc2626',fontSize:'12px',margin:'6px 0 0'}}>{err}</p>}
    </div>
  )
}

// Component لتعديل حقل مع OTP
function ChangeFieldRow({ label, icon, currentValue, field, subscriberId, onUpdated, canDelete = false }) {
  const [editing, setEditing] = useState(false)
  const [newVal, setNewVal] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState(1) // 1=input 2=otp
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [deleting, setDeleting] = useState(false)

  const sendOtp = async () => {
    if (!newVal.trim()) return setMsg('أدخل القيمة الجديدة')
    setLoading(true); setMsg('')
    try {
      await api.post('/subscribers/send-field-otp', { field, value: newVal })
      setStep(2)
    } catch(e) { setMsg(e?.response?.data?.message || 'حدث خطأ') }
    setLoading(false)
  }

  const verify = async () => {
    if (!otp) return setMsg('أدخل رمز التأكيد')
    setLoading(true); setMsg('')
    try {
      await api.post('/subscribers/verify-field-otp', { field, value: newVal, code: otp })
      // حدّث الحقل في الـ backend
      await api.put(`/subscribers/${subscriberId}`, { [field === 'phone' ? 'phone' : 'email']: newVal })
      onUpdated(newVal)
      setEditing(false); setStep(1); setNewVal(''); setOtp('')
      setMsg('')
    } catch(e) { setMsg(e?.response?.data?.message || 'رمز خاطئ') }
    setLoading(false)
  }

  const deleteField = async () => {
    if (!confirm(`هل تريد حذف ${label}؟`)) return
    setDeleting(true)
    try {
      await api.put(`/subscribers/${subscriberId}`, { email: null })
      onUpdated('')
    } catch { }
    setDeleting(false)
  }

  if (editing) return (
    <div style={{background:'#fff',borderRadius:12,padding:12,border:'1.5px solid #2C3E6B'}}>
      <div style={{fontWeight:700,fontSize:12,color:'#2C3E6B',marginBottom:8}}>{icon} تعديل {label}</div>
      {step === 1 ? (
        <>
          <input value={newVal} onChange={e=>setNewVal(e.target.value)} placeholder={`أدخل ${label} الجديد`}
            style={{width:'100%',padding:'8px 12px',border:'1.5px solid #e5e7eb',borderRadius:8,fontSize:12,fontFamily:'Cairo,sans-serif',direction: field==='email'?'ltr':'ltr',outline:'none',boxSizing:'border-box',marginBottom:8}} />
          {msg && <div style={{color:'#ef4444',fontSize:11,marginBottom:8}}>{msg}</div>}
          <div style={{display:'flex',gap:6}}>
            <button onClick={sendOtp} disabled={loading} style={{flex:1,padding:'7px',background:'#2C3E6B',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>
              {loading?'⏳...':'📤 أرسل رمز'}
            </button>
            <button onClick={()=>{setEditing(false);setMsg('')}} style={{padding:'7px 12px',background:'#f1f5f9',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>✕</button>
          </div>
        </>
      ) : (
        <>
          <div style={{fontSize:11,color:'#059669',marginBottom:8}}>✅ تم إرسال رمز التأكيد</div>
          <input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000000"
            maxLength={6} inputMode="numeric"
            style={{width:'100%',padding:'8px 12px',border:'1.5px solid #e5e7eb',borderRadius:8,fontSize:18,fontFamily:'monospace',letterSpacing:6,textAlign:'center',outline:'none',boxSizing:'border-box',marginBottom:8}} />
          {msg && <div style={{color:'#ef4444',fontSize:11,marginBottom:8}}>{msg}</div>}
          <div style={{display:'flex',gap:6}}>
            <button onClick={verify} disabled={loading} style={{flex:1,padding:'7px',background:'#059669',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>
              {loading?'⏳...':'✅ تأكيد'}
            </button>
            <button onClick={()=>{setStep(1);setOtp('');setMsg('')}} style={{padding:'7px 12px',background:'#f1f5f9',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>← رجوع</button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'#fff',borderRadius:10,border:'1px solid #e5e7eb'}}>
      <span style={{fontSize:16}}>{icon}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:11,color:'#94a3b8',fontWeight:600}}>{label}</div>
        <div style={{fontSize:13,fontWeight:700,color: currentValue ? '#1e293b' : '#94a3b8'}}>{currentValue || 'غير محدد'}</div>
      </div>
      <button onClick={()=>{setEditing(true);setNewVal(currentValue||'');setStep(1)}}
        style={{padding:'5px 10px',background:'#e0e7ff',color:'#4338ca',border:'none',borderRadius:7,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>✏️ تعديل</button>
      {canDelete && currentValue && (
        <button onClick={deleteField} disabled={deleting}
          style={{padding:'5px 10px',background:'#fee2e2',color:'#ef4444',border:'none',borderRadius:7,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>🗑️</button>
      )}
    </div>
  )
}

// Component لتجميد/تنشيط الحساب
function AccountStatusRow({ isActive, subscriberId, onToggle }) {
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const toggle = async () => {
    setLoading(true)
    try {
      await api.put(`/subscribers/${subscriberId}`, { isActive: !isActive })
      onToggle(!isActive)
      setConfirm(false)
    } catch { }
    setLoading(false)
  }

  if (confirm) return (
    <div style={{background: isActive ? '#fef2f2' : '#f0fdf4', borderRadius:10, padding:'10px 12px', border:`1px solid ${isActive?'#fecaca':'#bbf7d0'}`}}>
      <div style={{fontWeight:700,fontSize:12,color: isActive?'#ef4444':'#059669',marginBottom:8}}>
        {isActive ? '⚠️ تأكيد تجميد الحساب' : '✅ تأكيد تنشيط الحساب'}
      </div>
      <div style={{fontSize:11,color:'#64748b',marginBottom:8}}>
        {isActive ? 'لن تستطيع تسجيل الدخول بعد التجميد' : 'سيصبح حسابك نشطاً مجدداً'}
      </div>
      <div style={{display:'flex',gap:6}}>
        <button onClick={toggle} disabled={loading}
          style={{flex:1,padding:'7px',background: isActive?'#ef4444':'#059669',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>
          {loading ? '⏳...' : isActive ? '🔒 تجميد' : '✅ تنشيط'}
        </button>
        <button onClick={()=>setConfirm(false)} style={{padding:'7px 12px',background:'#f1f5f9',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>إلغاء</button>
      </div>
    </div>
  )

  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'#fff',borderRadius:10,border:'1px solid #e5e7eb'}}>
      <span style={{fontSize:16}}>{isActive ? '✅' : '🔒'}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:11,color:'#94a3b8',fontWeight:600}}>حالة الحساب</div>
        <div style={{fontSize:13,fontWeight:700,color: isActive?'#059669':'#ef4444'}}>
          {isActive ? 'نشط' : 'مجمّد'}
        </div>
      </div>
      <button onClick={()=>setConfirm(true)}
        style={{padding:'5px 10px',background: isActive?'#fef2f2':'#f0fdf4',color: isActive?'#ef4444':'#059669',border:`1px solid ${isActive?'#fecaca':'#bbf7d0'}`,borderRadius:7,cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11}}>
        {isActive ? '🔒 تجميد' : '✅ تنشيط'}
      </button>
    </div>
  )
}

// Component للقطاعات من ثوابت النظام
function TraderSectorsTab({ profileForm, setProfileForm, externalItems }) {
  const [items, setItems] = useState([])
  useEffect(() => {
    if (externalItems && externalItems.length > 0) {
      setItems(externalItems)
      return
    }
    api.get('/constants/trader_sector').then(r => {
      const data = Array.isArray(r.data) ? r.data : []
      setItems(data)
    }).catch(() => {})
  }, [externalItems])
  const toggle = (id) => {
    const curr = profileForm.traderSectors || []
    setProfileForm(p => ({...p, traderSectors: curr.includes(id) ? curr.filter(x=>x!==id) : [...curr, id]}))
  }
  if (items.length === 0) return <div style={{textAlign:'center',padding:20,color:'#94a3b8',fontSize:13}}>⏳ جارٍ التحميل...</div>
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
      {items.map(s => {
        const sel = (profileForm.traderSectors||[]).includes(s.id)
        return (
          <button key={s.id} type="button" onClick={()=>toggle(s.id)}
            style={{padding:'7px 14px',borderRadius:20,border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:12,fontWeight:600,
              background:sel?'#2C3E6B':'#eef2ff',color:sel?'#fff':'#2C3E6B'}}>
            {sel?'✓ ':''}{s.label||s.value}
          </button>
        )
      })}
    </div>
  )
}

export default function Subscribe() {
  const navigate = useNavigate()
  const [mode, setMode] = useState(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ fullName:'', phone:'', whatsApp:'', email:'', sectors:[], notifyBy:[] })
  const [verified, setVerified] = useState({ phone: false, whatsApp: false, email: false })
  const [loginPhone, setLoginPhone] = useState('')
  const [loginChannel, setLoginChannel] = useState('phone') // phone | email
  const [loginOtp, setLoginOtp] = useState('')
  const [subscriber, setSubscriber] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [profileTab, setProfileTab] = useState('info') // info | docs | social | interests
  const [sectors, setSectors] = useState([])
  const [traderSectorsList, setTraderSectorsList] = useState([]) // قائمة القطاعات من ثوابت النظام
  const [profileForm, setProfileForm] = useState({})
  const [profileMsg, setProfileMsg] = useState('')
  const [uploading, setUploading] = useState({})

  useEffect(() => {
    api.get('/sectors').then(r => {
      console.log('[sectors]', r.data)
      setSectors(r.data || [])
    }).catch(e => console.error('[sectors error]', e))
  }, [])

  // إعادة تحميل الأقسام عند تغيّر الـ step
  useEffect(() => {
    if (step === 3 && sectors.length === 0) {
      api.get('/sectors').then(r => setSectors(r.data || [])).catch(() => {})
    }
    // تحميل القطاعات من ثوابت النظام
    if (step === 3 && traderSectorsList.length === 0) {
      api.get('/constants/trader_sector').then(r => {
        setTraderSectorsList(Array.isArray(r.data) ? r.data : [])
      }).catch(() => {})
    }
  }, [step])

  const uploadDoc = async (field, file) => {
    if (!file) return
    setUploading(p => ({...p, [field]: true}))
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'subscribers')
    try {
      const r = await api.post('/upload', fd, { headers: {'Content-Type':'multipart/form-data'} })
      setProfileForm(p => ({...p, [field]: r.data.url}))
    } catch { alert('فشل رفع الملف') }
    setUploading(p => ({...p, [field]: false}))
  }

  const saveProfile = async () => {
    setProfileMsg('')
    // دالة مساعدة — تحوّل التاب وتصعد الصفحة
    const failWith = (tab, msg) => {
      setProfileTab(tab)
      setProfileMsg(msg)
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
    }

    // التحقق من الحقول الإلزامية مع التوجيه للـ tab الصحيح
    if (!form.fullName?.trim())       return failWith('info',        '❌ الاسم الكامل مطلوب')
    if (!form.whatsApp?.trim())        return failWith('info',        '❌ رقم الواتساب مطلوب')
    if (!form.email?.trim() && !form.whatsApp?.trim())
      return failWith('info', '❌ يجب إضافة إيميل أو رقم واتساب على الأقل')
    if (!form.notifyBy?.length)       return failWith('info',        '❌ اختر طريقة إشعار واحدة على الأقل')
    if (!(profileForm.interests||[]).length)     return failWith('interests',    '❌ اختر قسماً واحداً على الأقل')
    if (!(profileForm.traderSectors||[]).length) return failWith('sectors_tab',  '❌ اختر قطاعاً واحداً على الأقل')

    setProfileMsg('⏳ جارٍ الحفظ...')
    try {
      // أولاً: حفظ البيانات الأساسية (update)
      await api.put(`${API}/subscribers/${subscriber.id}`, {
        fullName: form.fullName,
        whatsApp: form.whatsApp,
        email: form.email,
        sectors: JSON.stringify(form.sectors || []),
        notifyBy: JSON.stringify(form.notifyBy || [])
      })

      // ثانياً: حفظ الملف الشخصي (profile)
      const payload = {
        // وثائق
        profileImage:    profileForm.profileImage    || null,
        nationalIdFront: profileForm.nationalIdFront || null,
        nationalIdBack:  profileForm.nationalIdBack  || null,
        passport:        profileForm.passport        || null,
        tradeIdFront:    profileForm.tradeIdFront    || null,
        tradeIdBack:     profileForm.tradeIdBack     || null,
        cv:              profileForm.cv || profileForm.cV || null,
        // تواصل اجتماعي
        facebook:  profileForm.facebook  || null,
        instagram: profileForm.instagram || null,
        twitter:   profileForm.twitter   || null,
        linkedIn:  profileForm.linkedIn  || null,
        tikTok:    profileForm.tikTok    || null,
        // الأقسام (IDs للتعميم)
        interests: profileForm.interests || [],
        // القطاعات من ثوابت النظام
        traderSectors: profileForm.traderSectors || [],
      }
      await api.put(`/subscribers/${subscriber.id}/profile`, payload)
      setSubscriber(p => ({...p, ...payload}))
      setProfileMsg('✅ تم حفظ جميع البيانات بنجاح')
      // الرجوع لصفحة سجّل متابعاً بعد ثانيتين
      setTimeout(() => {
        setMode(null)
        setStep(1)
        setSubscriber(null)
      }, 2000)
    } catch(err) {
      setProfileMsg('❌ حدث خطأ: ' + (err?.response?.data?.message || err?.message || 'تأكد من تسجيل الدخول'))
    }
  }

  const toggleInterest = (id) => {
    const curr = profileForm.interests || []
    const updated = curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id]
    setProfileForm(p => ({...p, interests: updated}))
  }

  const set = (k,v) => setForm(p=>({...p,[k]:v}))
  const setV = (k,v) => setVerified(p=>({...p,[k]:v}))

  const toggleSector = s => set('sectors', form.sectors.includes(s) ? form.sectors.filter(x=>x!==s) : [...form.sectors, s])
  const toggleNotify = k => set('notifyBy', form.notifyBy.includes(k) ? form.notifyBy.filter(x=>x!==k) : [...form.notifyBy, k])
  const selectAll = () => set('notifyBy', NOTIFY_OPTIONS.map(o=>o.key))

  // تسجيل جديد - الخطوة 1 → 2
  const goStep2 = () => {
    if (!form.fullName) { setErr('الاسم مطلوب'); return }
    if (!form.whatsApp) { setErr('رقم الواتساب مطلوب'); return }
    if (!verified.whatsApp) { setErr('⚠️ تحقق من رقم الواتساب أولاً — اضغط 📲 تحقق'); return }
    setErr(''); setStep(2)
  }

  // تسجيل جديد - الخطوة 2: حفظ
  const register = async () => {
    if ((form.sectors||[]).length === 0) { setErr('اختر قسماً واحداً على الأقل'); return }
    if (!form.email?.trim() && !form.whatsApp?.trim()) { setErr('❌ يجب إضافة إيميل أو رقم واتساب على الأقل'); return }
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
    if (!loginPhone) { setErr(loginChannel==='email' ? 'أدخل البريد الإلكتروني' : 'أدخل رقم الهاتف'); return }
    setLoading(true); setErr('')
    try {
      await api.post(`${API}/subscribers/send-otp`, loginChannel === 'email' ? { email: loginPhone } : { phone: loginPhone })
      setStep(2); setLoginOtp(''); setMsg('💬 سيصل الرمز عبر الواتساب')
    } catch(e) { setErr(e?.response?.data?.message || 'الرقم غير مسجّل') }
    setLoading(false)
  }

  // مسجّل سابق - تحقق OTP
  const verifyLogin = async () => {
    if (!loginOtp) { setErr('أدخل الرمز'); return }
    setLoading(true); setErr('')
    try {
      const r = await api.post(`${API}/subscribers/verify-otp`, loginChannel === 'email' ? { email: loginPhone, code: loginOtp } : { phone: loginPhone, code: loginOtp })
      setSubscriber(r.data)
      const s = r.data
      const sec = (() => { try { return JSON.parse(s.sectors||'[]') } catch { return [] } })()
      const ntf = (() => { try { return JSON.parse(s.notifyBy||'[]') } catch { return [] } })()
      const interests = (() => { try { return JSON.parse(s.interests||'[]') } catch { return [] } })()
      setForm({ fullName: s.fullName, phone: s.phone, whatsApp: s.whatsApp||'', email: s.email||'', sectors: sec, notifyBy: ntf })
      setProfileForm({
        profileImage: s.profileImage||'',
        nationalIdFront: s.nationalIdFront||'',
        nationalIdBack: s.nationalIdBack||'',
        passport: s.passport||'',
        tradeIdFront: s.tradeIdFront||'',
        tradeIdBack: s.tradeIdBack||'',
        cv: s.cv||s.cV||'',
        facebook: s.facebook||'',
        instagram: s.instagram||'',
        twitter: s.twitter||'',
        linkedIn: s.linkedIn||'',
        tikTok: s.tikTok||'',
        interests: interests,
        traderSectors: (() => { try { return JSON.parse(s.traderSectors||'[]') } catch { return [] } })()
      })
      setVerified({ phone: true, whatsApp: !!s.whatsApp, email: !!s.email })
      setStep(3); setMsg('')
    } catch(e) { setErr(e?.response?.data?.message || 'رمز خاطئ') }
    setLoading(false)
  }

  // مسجّل سابق - تحديث
  const update = async () => {
    if ((form.sectors||[]).length === 0) { setErr('اختر قسماً على الأقل'); return }
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
                  autoComplete="off" name="subscriber-name"
                  style={{width:'100%',padding:'11px 14px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',outline:'none',boxSizing:'border-box'}}/>
              </div>

              {/* رقم الواتساب = رقم الهاتف الرئيسي */}
              <VerifiedField label="رقم الواتساب *" value={form.whatsApp} onChange={v=>{ set('whatsApp',v); set('phone',v) }}
                placeholder="07xxxxxxxxx" isLtr field="whatsapp" required
                verified={verified.whatsApp} onVerified={v=>{ setV('whatsApp',v); setV('phone',v) }}/>

              <VerifiedField label="البريد الإلكتروني" value={form.email} onChange={v=>set('email',v)}
                placeholder="email@example.com — اختياري" isLtr field="email"
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
                <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:8}}>
                  {sectors.map(s=>(
                    <div key={s.id} onClick={()=>{
                      const curr = form.sectors || []
                      set('sectors', curr.includes(s.id) ? curr.filter(x=>x!==s.id) : [...curr, s.id])
                    }}
                      style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:12,border:`1.5px solid ${(form.sectors||[]).includes(s.id)?'#2C3E6B':'#e5e7eb'}`,background:(form.sectors||[]).includes(s.id)?'#eef2ff':'#fafafa',cursor:'pointer'}}>
                      <span style={{fontSize:20}}>{s.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:13,color:(form.sectors||[]).includes(s.id)?'#2C3E6B':'#374151'}}>{s.name}</div>
                        {s.description && <div style={{fontSize:11,color:'#64748b'}}>{s.description}</div>}
                      </div>
                      <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${(form.sectors||[]).includes(s.id)?'#2C3E6B':'#cbd5e1'}`,background:(form.sectors||[]).includes(s.id)?'#2C3E6B':'#fff',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:12}}>
                        {(form.sectors||[]).includes(s.id)?'✓':''}
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={()=>set('sectors', (form.sectors||[]).length===sectors.length ? [] : sectors.map(s=>s.id))}
                  style={{padding:'6px 14px',borderRadius:'8px',background:'#FFF8E7',color:'#B8860B',border:'1px solid #fde68a',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:'700'}}>
                  {(form.sectors||[]).length===sectors.length ? '❌ إلغاء الكل' : '✅ اختر الكل'}
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

        {/* مسجّل سابق - خطوة 1: هاتف أو إيميل */}
        {mode === 'existing' && step === 1 && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'28px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
            <h2 style={{color:'#2C3E6B',fontWeight:'800',margin:'0 0 20px',fontSize:'18px'}}>🔑 تسجيل الدخول</h2>

            {/* اختيار الطريقة */}
            <div style={{display:'flex',gap:8,marginBottom:16}}>
              {[{k:'phone',l:'📱 رقم الهاتف'},{k:'email',l:'📧 البريد الإلكتروني'}].map(c=>(
                <button key={c.k} type="button" onClick={()=>{setLoginChannel(c.k); setLoginPhone(''); setErr('')}}
                  style={{flex:1,padding:'10px',borderRadius:10,border:`1.5px solid ${loginChannel===c.k?'#2C3E6B':'#e5e7eb'}`,background:loginChannel===c.k?'#eef2ff':'#fafafa',color:loginChannel===c.k?'#2C3E6B':'#64748b',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:12}}>
                  {c.l}
                </button>
              ))}
            </div>

            <input value={loginPhone} onChange={e=>setLoginPhone(e.target.value)}
              placeholder={loginChannel==='email' ? 'example@email.com' : '07xxxxxxxxx'}
              type={loginChannel==='email' ? 'email' : 'tel'}
              style={{width:'100%',padding:'11px 14px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'14px',direction:'ltr',fontFamily:'Cairo,sans-serif',outline:'none',boxSizing:'border-box'}}/>
            {err && <div style={{background:'#fee2e2',color:'#dc2626',padding:'10px 14px',borderRadius:'10px',fontSize:'13px',marginTop:'12px'}}>{err}</div>}
            <button onClick={sendLoginOtp} disabled={loading} style={{...btnPrimary,marginTop:'16px'}}>
              {loading?'⏳...': loginChannel==='email' ? '📧 أرسل رمز التأكيد' : '📱 أرسل رمز التأكيد'}
            </button>
            <button onClick={()=>setMode(null)} style={{...btnBack,marginTop:'8px'}}>← رجوع</button>
          </div>
        )}

        {/* مسجّل سابق - خطوة 2: OTP */}
        {mode === 'existing' && step === 2 && (
          <div style={{background:'#fff',borderRadius:'16px',padding:'28px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
            <h2 style={{color:'#2C3E6B',fontWeight:'800',margin:'0 0 8px',fontSize:'18px'}}>📲 رمز التأكيد</h2>
            {msg && <p style={{color:'#059669',fontSize:'13px',margin:'0 0 12px',background:'#f0fdf4',padding:'10px',borderRadius:'8px',fontWeight:'700'}}>{msg}</p>}
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

        {/* مسجّل سابق - خطوة 3: الملف الشخصي */}
        {mode === 'existing' && step === 3 && (
          <div style={{fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
            {/* Header بروفايل */}
            <div style={{background:'linear-gradient(135deg,#1a1a2e,#2C3E6B)',borderRadius:'20px',padding:'28px',textAlign:'center',marginBottom:'16px',position:'relative'}}>
              <div style={{width:'72px',height:'72px',borderRadius:'50%',overflow:'hidden',background:'linear-gradient(135deg,#FFC72C,#f59e0b)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'32px',margin:'0 auto 12px',boxShadow:'0 4px 16px rgba(0,0,0,0.3)'}}>
                {subscriber?.profileImage
                  ? <img src={subscriber.profileImage} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  : (form.fullName?.charAt(0) || '👤')
                }
              </div>
              <h2 style={{color:'#fff',fontWeight:'900',fontSize:'20px',margin:'0 0 4px'}}>{form.fullName}</h2>
              <div style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'rgba(255,255,255,0.1)',padding:'5px 14px',borderRadius:'20px',marginTop:'6px'}}>
                <span style={{fontSize:'14px'}}>📱</span>
                <span style={{color:'#FFC72C',fontWeight:'700',fontSize:'14px',direction:'ltr'}}>{form.phone}</span>
              </div>
            </div>

            {/* Tabs — 5 صفحات */}
            <div style={{display:'flex',gap:6,marginBottom:16,overflowX:'auto',paddingBottom:4,flexWrap:'wrap'}}>
              {[
                {key:'info',      label:'👤 بياناتي'},
                {key:'interests', label:'🎯 الأقسام'},
                {key:'sectors_tab', label:'🏭 القطاعات'},
                {key:'social',    label:'🌐 التواصل'},
                {key:'docs',      label:'📄 الوثائق'},
              ].map(t => (
                <button key={t.key} onClick={() => setProfileTab(t.key)}
                  style={{padding:'7px 14px',borderRadius:20,border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700,fontSize:11,whiteSpace:'nowrap',
                    background: profileTab===t.key ? '#2C3E6B' : '#f1f5f9',
                    color: profileTab===t.key ? '#fff' : '#374151'
                  }}>{t.label}</button>
              ))}
            </div>



            {/* Tab: بياناتي */}
            {profileTab === 'info' && (
            <div style={{background:'#fff',borderRadius:'16px',padding:'20px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)',marginBottom:'12px'}}>

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

            {/* طريقة الإشعار */}
            <div style={{background:'#fff',borderRadius:'16px',padding:'20px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)',marginBottom:'16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px',paddingBottom:'10px',borderBottom:'2px solid #FFC72C'}}>
                <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'15px',margin:0}}>📢 طريقة الإشعار</h3>
                <button onClick={selectAll} type="button" style={{padding:'5px 12px',borderRadius:'8px',background:'#F0FDF4',color:'#16a34a',border:'1px solid #86efac',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'11px',fontWeight:'700'}}>
                  ✅ كل الطرق
                </button>
              </div>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                {NOTIFY_OPTIONS.map(o=>{
                  // الواتساب يشتغل إذا عنده واتساب أو هاتف (يرسل عليهم)
                  const disabled = (o.key==='email' && !form.email) || (o.key==='whatsapp' && !form.whatsApp && !form.phone)
                  // إذا الإيميل فارغ وكان مختاراً — أزله تلقائياً
                  if (disabled && form.notifyBy.includes(o.key)) {
                    setTimeout(() => set('notifyBy', form.notifyBy.filter(x=>x!==o.key)), 0)
                  }
                  return (
                  <button key={o.key} type="button"
                    onClick={()=>!disabled && toggleNotify(o.key)}
                    disabled={disabled}
                    title={disabled ? `يتطلب إضافة ${o.key==='email'?'البريد الإلكتروني':'رقم الهاتف أو الواتساب'} أولاً` : ''}
                    style={{flex:1,minWidth:'100px',padding:'12px 8px',borderRadius:'12px',border:'2px solid',fontFamily:'Cairo,sans-serif',fontSize:'13px',fontWeight:'700',textAlign:'center',transition:'all 0.15s',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.4 : 1,
                      background: disabled ? '#f1f5f9' : form.notifyBy.includes(o.key)?'#059669':'#fff',
                      color: disabled ? '#94a3b8' : form.notifyBy.includes(o.key)?'#fff':'#059669',
                      borderColor: disabled ? '#e2e8f0' : form.notifyBy.includes(o.key)?'#059669':'#86efac'}}>
                    {o.label}
                    {disabled && <span style={{fontSize:'10px',display:'block',marginTop:'2px',fontWeight:400}}>يتطلب إضافة أولاً</span>}
                  </button>
                )})}
              </div>
            </div>

            {err && <div style={{background:'#fee2e2',color:'#dc2626',padding:'12px 16px',borderRadius:'12px',fontSize:'13px',marginBottom:'12px',fontWeight:'700'}}>{err}</div>}
            {msg && <div style={{background:'#d1fae5',color:'#065f46',padding:'12px 16px',borderRadius:'12px',fontSize:'13px',marginBottom:'12px',fontWeight:'700'}}>{msg}</div>}

            {/* تعديل الهاتف + الإيميل + تجميد/تنشيط */}
            <div style={{background:'#f8fafc',borderRadius:14,padding:16,marginTop:8}}>
              <h4 style={{color:'#374151',fontWeight:800,fontSize:13,margin:'0 0 12px'}}>⚙️ إعدادات الحساب</h4>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>

                {/* تعديل رقم الهاتف */}
                <ChangeFieldRow label="رقم الهاتف" icon="📱" currentValue={form.phone} field="phone"
                  subscriberId={subscriber?.id} onUpdated={v => { setForm(p=>({...p, phone:v})); setSubscriber(p=>({...p, phone:v})) }} />

                {/* تعديل الإيميل */}
                <ChangeFieldRow label="البريد الإلكتروني" icon="📧" currentValue={form.email} field="email"
                  subscriberId={subscriber?.id} onUpdated={v => { setForm(p=>({...p, email:v})); setSubscriber(p=>({...p, email:v})) }} canDelete />

                {/* تجميد / تنشيط */}
                <AccountStatusRow
                  isActive={subscriber?.isActive !== false}
                  subscriberId={subscriber?.id}
                  onToggle={(active) => setSubscriber(p=>({...p, isActive: active}))}
                />
              </div>
            </div>

            </div>)} {/* نهاية tab info */}

            {/* Tab: الأقسام */}
            {profileTab === 'interests' && (
            <div style={{background:'#fff',borderRadius:16,padding:20,boxShadow:'0 4px 16px rgba(44,62,107,0.08)',marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,paddingBottom:10,borderBottom:'2px solid #FFC72C'}}>
                <h3 style={{color:'#2C3E6B',fontWeight:800,fontSize:15,margin:0}}>🎯 الأقسام التي تريد متابعتها</h3>
                <button type="button"
                  onClick={() => setProfileForm(p => ({...p, interests: (p.interests||[]).length===sectors.length ? [] : sectors.map(s=>s.id)}))}
                  style={{padding:'5px 12px',borderRadius:8,background:'#FFF8E7',color:'#B8860B',border:'1px solid #fde68a',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:11,fontWeight:700}}>
                  {(profileForm.interests||[]).length===sectors.length ? '❌ إلغاء الكل' : '✅ اختيار الكل'}
                </button>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {sectors.map(s => {
                  const selected = (profileForm.interests||[]).includes(s.id)
                  return (
                    <div key={s.id} onClick={() => toggleInterest(s.id)}
                      style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderRadius:12,border:`2px solid ${selected?'#2C3E6B':'#e5e7eb'}`,background:selected?'#eef2ff':'#fafafa',cursor:'pointer',transition:'all 0.2s'}}>
                      <div style={{width:40,height:40,borderRadius:'50%',background:selected?'#2C3E6B':'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                        {s.icon}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:800,fontSize:14,color:selected?'#2C3E6B':'#374151'}}>{s.name}</div>
                        {s.description && <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{s.description}</div>}
                      </div>
                      <div style={{width:24,height:24,borderRadius:'50%',background:selected?'#2C3E6B':'#e5e7eb',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14,flexShrink:0}}>
                        {selected ? '✓' : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* التواصل — في نفس الـ tab */}
            </div>
            )}

            {/* Tab: القطاعات (trader_sector من ثوابت النظام) */}
            {profileTab === 'sectors_tab' && (
            <div style={{background:'#fff',borderRadius:16,padding:20,boxShadow:'0 4px 16px rgba(44,62,107,0.08)',marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,paddingBottom:10,borderBottom:'2px solid #FFC72C'}}>
                <h3 style={{color:'#2C3E6B',fontWeight:800,fontSize:15,margin:0}}>🏭 القطاعات</h3>
                <button type="button" onClick={()=>{
                  const allIds = traderSectorsList.map(s=>s.id)
                  setProfileForm(p=>({...p, traderSectors: (p.traderSectors||[]).length===allIds.length ? [] : allIds}))
                }} style={{padding:'5px 12px',borderRadius:8,background:'#FFF8E7',color:'#B8860B',border:'1px solid #fde68a',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:11,fontWeight:700}}>
                  {(profileForm.traderSectors||[]).length===traderSectorsList.length && traderSectorsList.length > 0 ? '❌ إلغاء الكل' : '✅ اختيار الكل'}
                </button>
              </div>
              <TraderSectorsTab profileForm={profileForm} setProfileForm={setProfileForm} externalItems={traderSectorsList} />
            </div>
            )}

            {/* Tab: التواصل */}
            {profileTab === 'social' && (
            <div style={{background:'#fff',borderRadius:16,padding:20,boxShadow:'0 4px 16px rgba(44,62,107,0.08)',marginBottom:12}}>
              <h3 style={{color:'#2C3E6B',fontWeight:800,fontSize:15,margin:'0 0 16px',paddingBottom:10,borderBottom:'2px solid #FFC72C'}}>🌐 منصات التواصل الاجتماعي</h3>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {[
                  {key:'facebook', label:'فيسبوك', icon:'📘', placeholder:'https://facebook.com/username'},
                  {key:'instagram', label:'إنستغرام', icon:'📸', placeholder:'https://instagram.com/username'},
                  {key:'twitter', label:'تويتر/X', icon:'𝕏', placeholder:'https://x.com/username'},
                  {key:'linkedIn', label:'لينكدإن', icon:'💼', placeholder:'https://linkedin.com/in/username'},
                  {key:'tikTok', label:'تيكتوك', icon:'🎵', placeholder:'https://tiktok.com/@username'},
                ].map(s => (
                  <div key={s.key}>
                    <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:3}}>{s.icon} {s.label}</label>
                    <input value={profileForm[s.key] || subscriber?.[s.key] || ''} onChange={e => setProfileForm(p => ({...p, [s.key]: e.target.value}))}
                      placeholder={s.placeholder} style={{width:'100%',padding:'9px 12px',border:'1.5px solid #e5e7eb',borderRadius:9,fontSize:12,fontFamily:'Cairo,sans-serif',direction:'ltr',outline:'none',boxSizing:'border-box'}} />
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Tab: الوثائق */}
            {profileTab === 'docs' && (
            <div style={{background:'#fff',borderRadius:16,padding:20,boxShadow:'0 4px 16px rgba(44,62,107,0.08)',marginBottom:12}}>
              <h3 style={{color:'#2C3E6B',fontWeight:800,fontSize:15,margin:'0 0 16px',paddingBottom:10,borderBottom:'2px solid #FFC72C'}}>📄 الوثائق والمستندات</h3>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {[
                  {key:'profileImage', label:'الصورة الشخصية', icon:'🤳', accept:'image/*'},
                  {key:'nationalIdFront', label:'البطاقة الموحدة — أمام', icon:'🪪', accept:'image/*'},
                  {key:'nationalIdBack', label:'البطاقة الموحدة — خلف', icon:'🪪', accept:'image/*'},
                  {key:'passport', label:'جواز السفر', icon:'📗', accept:'image/*'},
                  {key:'tradeIdFront', label:'هوية التجارة — أمام', icon:'🏪', accept:'image/*'},
                  {key:'tradeIdBack', label:'هوية التجارة — خلف', icon:'🏪', accept:'image/*'},
                  {key:'cv', label:'السيفي (CV)', icon:'📋', accept:'image/*,application/pdf'},
                ].map(doc => {
                  const val = profileForm[doc.key] || subscriber?.[doc.key]
                  return (
                    <div key={doc.key} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:12,border:'1.5px solid #e5e7eb',background:'#fafafa'}}>
                      <span style={{fontSize:22,flexShrink:0}}>{doc.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:13,color:'#374151',marginBottom:4}}>{doc.label}</div>
                        {val
                          ? <a href={val} target="_blank" rel="noreferrer" style={{fontSize:11,color:'#2C3E6B',fontWeight:700}}>✅ مرفوع — اضغط للعرض</a>
                          : <span style={{fontSize:11,color:'#94a3b8'}}>لم يرفع بعد</span>
                        }
                      </div>
                      <label style={{padding:'6px 12px',background:'#e0e7ff',color:'#4338ca',borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:700,flexShrink:0}}>
                        {uploading[doc.key] ? '⏳' : '📁 رفع'}
                        <input type="file" accept={doc.accept} style={{display:'none'}} onChange={e => uploadDoc(doc.key, e.target.files[0])} />
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
            )}

            {/* زر الحفظ الثابت — يعمل من أي tab */}
            {profileMsg && <div style={{background: profileMsg.includes('✅') ? '#f0fdf4' : '#fef2f2', color: profileMsg.includes('✅') ? '#059669' : '#ef4444', padding:'10px 14px', borderRadius:10, fontSize:13, marginBottom:12, fontWeight:700, marginTop:8}}>{profileMsg}</div>}
            <button onClick={saveProfile}
              style={{width:'100%',padding:'15px',borderRadius:14,background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:800,fontSize:16,marginTop:8}}>
              💾 حفظ
            </button>

          </div>
        )}
      </div>
    </div>
  )
}
