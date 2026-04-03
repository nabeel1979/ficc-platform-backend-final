import { useState } from 'react'
import api from '../lib/api'
import { useNavigate } from 'react-router-dom'

const API = ''

export default function Login({ onLogin }) {
  const [step, setStep]       = useState('login')   // login | otp | forgot | reset_otp
  const [form, setForm]       = useState({ username:'', otp:'', newPass:'', newPass2:'' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState('')
  const [channel, setChannel] = useState('sms')
  const [channelStatus, setChannelStatus] = useState({ smsDisabled: false, emailDisabled: false })
  const [contactInfo, setContactInfo] = useState(null)
  const [maskedInfo, setMaskedInfo] = useState({ phone: '', email: '' })
  const [timer, setTimer]     = useState(0)
  const [otpTimer, setOtpTimer] = useState(0)
  const [otpSent, setOtpSent] = useState(false)
  const navigate = useNavigate()

  const [isBlocked, setIsBlocked] = useState(false)
  const set = (k, v) => setForm(p => ({...p, [k]: v}))
  const [showPass, setShowPass] = useState({})
  const inp = (ph, k, type='text') => {
    const isPass = type === 'password'
    const visible = showPass[k]
    return (
      <div style={{position:'relative',marginBottom:'12px'}}>
        <input placeholder={ph} type={isPass && !visible ? 'password' : 'text'} value={form[k]} onChange={e=>set(k,e.target.value)}
          style={{width:'100%',padding:'12px 16px',paddingLeft: isPass ? '44px' : '16px',borderRadius:'12px',border:'1.5px solid #dde3ed',
            fontSize:'14px',fontFamily:'Cairo,sans-serif',direction:'rtl',outline:'none',
            background:'#FAFBFF',boxSizing:'border-box'}}/>
        {isPass && (
          <button type="button" onClick={()=>setShowPass(p=>({...p,[k]:!p[k]}))}
            style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#888',fontSize:'18px',padding:0,lineHeight:1}}>
            {visible ? '🙈' : '👁️'}
          </button>
        )}
      </div>
    )
  }

  const startOtpTimer = () => {
    setOtpTimer(600)
    const iv = setInterval(() => setOtpTimer(t => { if(t<=1){clearInterval(iv);return 0} return t-1 }), 1000)
  }

  const fmtTime = t => `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`

  // Step 1: user types username → check if exists → show channel picker
  const handleCheckUser = async () => {
    if (!form.username) { setMsg('أدخل اسم المستخدم'); return }
    setLoading(true); setMsg('')
    try {
      const r = await api.post(`${API}/auth/login-otp`, { username: form.username })
      if (r.data.exists) {
        // تحقق من SMS و إيميل
        try {
          const [smsRes, emailRes] = await Promise.allSettled([
            api.get(`${API}/otp/contact-info?username=${encodeURIComponent(form.username)}&channel=sms`),
            api.get(`${API}/otp/contact-info?username=${encodeURIComponent(form.username)}&channel=email`)
          ])
          const hasPhone = smsRes.status === 'fulfilled' && smsRes.value.data?.found === true
          const hasEmail = emailRes.status === 'fulfilled' && emailRes.value.data?.found === true
          setContactInfo({ hasPhone, hasEmail })
          setMaskedInfo({
            phone: smsRes.status === 'fulfilled' ? smsRes.value.data?.masked || '' : '',
            email: emailRes.status === 'fulfilled' ? emailRes.value.data?.masked || '' : ''
          })
          // جلب حالة الـ Channels
          try {
            const chRes = await api.get(`${API}/security/channels`)
            setChannelStatus(chRes.data)
            // اختر تلقائياً الطريقة المتوفرة وغير المعطّلة
            if (hasPhone && !chRes.data.smsDisabled) setChannel('sms')
            else if (hasEmail && !chRes.data.emailDisabled) setChannel('email')
            else if (hasPhone) setChannel('sms')
            else if (hasEmail) setChannel('email')
          } catch {
            if (hasPhone) setChannel('sms')
            else if (hasEmail) setChannel('email')
          }
        } catch { setContactInfo({ hasPhone: true, hasEmail: true }) }
        setStep('channel')
      }
    } catch(e) {
      setMsg(e.response?.data?.message || 'اسم المستخدم غير صحيح')
    } finally { setLoading(false) }
  }

  // Step 2: send OTP
  const handleSendOtp = async () => {
    setLoading(true); setMsg('')
    try {
      await api.post(`${API}/otp/send`, { username: form.username, type: 'login', channel })
      setOtpSent(true)
      setStep('otp')
      startOtpTimer()
      setTimer(60)
      const iv = setInterval(() => setTimer(t => { if(t<=1){clearInterval(iv);return 0} return t-1 }), 1000)
    } catch(e) {
      const data = e.response?.data
      if (data?.blocked) {
        setIsBlocked(true)
        setMsg(data.message)
      } else {
        setMsg(data?.message || 'فشل الإرسال')
      }
    } finally { setLoading(false) }
  }

  // Step 3: verify OTP → login
  const handleVerifyOtp = async () => {
    if (!form.otp) { setMsg('أدخل الرمز'); return }
    setLoading(true); setMsg('')
    try {
      const r = await api.post(`${API}/auth/login-otp-verify`, { username: form.username, code: form.otp, channel })
      localStorage.setItem('ficc_token', r.data.token)
      localStorage.setItem('ficc_user', JSON.stringify(r.data.user))
      if (onLogin) onLogin(r.data)
      navigate('/admin')
    } catch(e) {
      setMsg(e.response?.data?.message || 'الرمز غير صحيح')
    } finally { setLoading(false) }
  }

  // Forgot password flow
  const handleForgotSend = async () => {
    if (!form.username) { setMsg('أدخل اسم المستخدم'); return }
    setLoading(true); setMsg('')
    try {
      await api.post(`${API}/otp/send`, { username: form.username, type: 'reset_password', channel })
      setStep('reset_otp')
      setOtpSent(true)
      startOtpTimer()
    } catch(e) {
      setMsg(e.response?.data?.message || 'فشل الإرسال')
    } finally { setLoading(false) }
  }

  const handleResetPass = async () => {
    if (!form.otp) { setMsg('أدخل الرمز'); return }
    if (!form.newPass || form.newPass.length < 6) { setMsg('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return }
    if (form.newPass !== form.newPass2) { setMsg('كلمتا المرور غير متطابقتين'); return }
    setLoading(true); setMsg('')
    try {
      await api.post(`${API}/otp/verify`, { username: form.username, code: form.otp, type: 'reset_password', channel, newPassword: form.newPass })
      setMsg('✅ تم تغيير كلمة المرور بنجاح')
      setTimeout(() => { setStep('login'); setForm({username:'',otp:'',newPass:'',newPass2:''}); setMsg('') }, 2000)
    } catch(e) {
      setMsg(e.response?.data?.message || 'الرمز غير صحيح')
    } finally { setLoading(false) }
  }

  const btn = (label, onClick, color='#2C3E6B') => (
    <button onClick={onClick} disabled={loading}
      style={{width:'100%',padding:'14px',borderRadius:'12px',background:loading?'#ccc':`linear-gradient(135deg,${color},#4A6FA5)`,
        color:'#fff',border:'none',fontSize:'15px',fontWeight:'700',fontFamily:'Cairo,sans-serif',cursor:loading?'not-allowed':'pointer',marginBottom:'10px'}}>
      {loading ? '⏳ جاري...' : label}
    </button>
  )

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#1a1a2e,#2C3E6B)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      <div style={{background:'#fff',borderRadius:'24px',padding:'40px',width:'100%',maxWidth:'420px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <a href="/" title="العودة للصفحة الرئيسية">
            <img src="/ficc-logo.jpg" alt="FICC" style={{width:'72px',height:'72px',borderRadius:'50%',border:'3px solid #FFC72C',cursor:'pointer',display:'block',margin:'0 auto 12px'}}/>
          </a>
          <h2 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'20px',margin:'0 0 4px'}}>اتحاد الغرف التجارية العراقية</h2>
          <p style={{color:'#888',fontSize:'13px',margin:0}}>
            {step==='login' && 'تسجيل الدخول'}
            {step==='channel' && 'اختر طريقة التحقق'}
            {step==='otp' && '🔑 أدخل رمز التحقق'}
            {step==='forgot' && '🔐 نسيت كلمة المرور'}
            {step==='reset_otp' && '🔑 إعادة تعيين كلمة المرور'}
          </p>
        </div>

        {msg && !isBlocked && (
          <div style={{background:msg.startsWith('✅')?'#F0FDF4':'#FEF2F2',color:msg.startsWith('✅')?'#16a34a':'#dc2626',padding:'12px',borderRadius:'10px',fontSize:'13px',marginBottom:'16px',textAlign:'center'}}>
            {msg}
          </div>
        )}
        {isBlocked && (
          <div style={{background:'#FEF2F2',border:'1.5px solid #fecaca',borderRadius:'14px',padding:'20px',marginBottom:'16px',textAlign:'center'}}>
            <div style={{fontSize:'36px',marginBottom:'8px'}}>⛔</div>
            <div style={{fontWeight:'800',color:'#dc2626',fontSize:'15px',marginBottom:'10px'}}>تم الحجب بسبب الاستخدام الخاطئ</div>
            <div style={{color:'#7f1d1d',fontSize:'13px',lineHeight:'1.8',whiteSpace:'pre-line',marginBottom:'12px'}}>{msg}</div>
            <div style={{display:'flex',gap:'8px',justifyContent:'center',flexWrap:'wrap'}}>
              <a href="tel:5366" style={{padding:'8px 16px',background:'#dc2626',color:'white',borderRadius:'10px',textDecoration:'none',fontSize:'13px',fontWeight:'700'}}>📞 5366</a>
              <a href="mailto:info@ficc.iq" style={{padding:'8px 16px',background:'#991b1b',color:'white',borderRadius:'10px',textDecoration:'none',fontSize:'13px',fontWeight:'700'}}>✉️ info@ficc.iq</a>
            </div>
          </div>
        )}

        {/* STEP 1: Enter username */}
        {step==='login' && <>
          <div style={{marginBottom:'12px'}}>
            <input placeholder="اسم المستخدم *" value={form.username} onChange={e=>set('username',e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleCheckUser()}
              name="username" autoComplete="username"
              style={{width:'100%',padding:'12px 16px',borderRadius:'12px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',direction:'rtl',outline:'none',background:'#FAFBFF',boxSizing:'border-box'}}/>
          </div>
          {btn('متابعة →', handleCheckUser)}
        </>}

        {/* STEP 2: Choose channel */}
        {step==='channel' && <>
          {/* ✅ تأكيد الحساب */}
          <div style={{background:'#F0FDF4',border:'1px solid #bbf7d0',borderRadius:'12px',padding:'14px 16px',marginBottom:'16px',textAlign:'center'}}>
            <div style={{fontSize:'22px',marginBottom:'6px'}}>✅</div>
            <p style={{color:'#16a34a',fontWeight:'700',fontSize:'13px',margin:'0 0 10px'}}>تم التحقق من حسابك</p>
            <p style={{color:'#555',fontSize:'12px',margin:'0 0 8px'}}>إرسال رمز التحقق إلى:</p>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {maskedInfo.phone && (
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',background:'white',borderRadius:'8px',padding:'8px 12px',border:'1px solid #e2e8f0'}}>
                  <span style={{fontSize:'16px'}}>📱</span>
                  <span style={{fontSize:'13px',fontWeight:'600',color:'#374151',direction:'ltr'}}>{maskedInfo.phone}</span>
                </div>
              )}
              {maskedInfo.email && (
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',background:'white',borderRadius:'8px',padding:'8px 12px',border:'1px solid #e2e8f0'}}>
                  <span style={{fontSize:'16px'}}>📧</span>
                  <span style={{fontSize:'13px',fontWeight:'600',color:'#374151',direction:'ltr'}}>{maskedInfo.email}</span>
                </div>
              )}
            </div>
          </div>

          <p style={{color:'#555',fontSize:'13px',marginBottom:'12px',textAlign:'center'}}>اختر طريقة الاستلام:</p>
          <div style={{display:'flex',gap:'10px',marginBottom:'20px'}}>
            {contactInfo?.hasPhone !== false && (
              <button
                onClick={() => !channelStatus.smsDisabled && setChannel('sms')}
                disabled={channelStatus.smsDisabled}
                title={channelStatus.smsDisabled ? 'خدمة الواتساب معطّلة مؤقتاً' : ''}
                style={{flex:1,padding:'14px',borderRadius:'12px',
                  border:`2px solid ${channelStatus.smsDisabled ? '#e2e8f0' : channel==='sms'?'#2C3E6B':'#dde3ed'}`,
                  background: channelStatus.smsDisabled ? '#f5f5f5' : channel==='sms'?'#EEF2FF':'#fff',
                  color: channelStatus.smsDisabled ? '#bbb' : channel==='sms'?'#2C3E6B':'#888',
                  fontFamily:'Cairo,sans-serif',fontWeight:channel==='sms'?'700':'500',fontSize:'14px',
                  cursor: channelStatus.smsDisabled ? 'not-allowed' : 'pointer',
                  position:'relative'}}>
                {channelStatus.smsDisabled ? '🚫' : '💬'} واتساب
                {channelStatus.smsDisabled && <div style={{fontSize:'10px',color:'#bbb',marginTop:'2px'}}>معطّل مؤقتاً</div>}
              </button>
            )}
            {contactInfo?.hasEmail !== false && (
              <button
                onClick={() => !channelStatus.emailDisabled && setChannel('email')}
                disabled={channelStatus.emailDisabled}
                title={channelStatus.emailDisabled ? 'خدمة الإيميل معطّلة مؤقتاً' : ''}
                style={{flex:1,padding:'14px',borderRadius:'12px',
                  border:`2px solid ${channelStatus.emailDisabled ? '#e2e8f0' : channel==='email'?'#2C3E6B':'#dde3ed'}`,
                  background: channelStatus.emailDisabled ? '#f5f5f5' : channel==='email'?'#EEF2FF':'#fff',
                  color: channelStatus.emailDisabled ? '#bbb' : channel==='email'?'#2C3E6B':'#888',
                  fontFamily:'Cairo,sans-serif',fontWeight:channel==='email'?'700':'500',fontSize:'14px',
                  cursor: channelStatus.emailDisabled ? 'not-allowed' : 'pointer'}}>
                {channelStatus.emailDisabled ? '🚫' : '📧'} إيميل
                {channelStatus.emailDisabled && <div style={{fontSize:'10px',color:'#bbb',marginTop:'2px'}}>معطّل مؤقتاً</div>}
              </button>
            )}
          </div>
          {btn('إرسال الرمز', handleSendOtp)}
          <button onClick={()=>setStep('login')} style={{width:'100%',background:'none',border:'none',color:'#888',cursor:'pointer',fontSize:'13px',fontFamily:'Cairo,sans-serif',padding:'6px'}}>← رجوع</button>
        </>}

        {/* STEP 3: Enter OTP */}
        {step==='otp' && <>
          <p style={{color:'#555',fontSize:'13px',textAlign:'center',marginBottom:'16px'}}>
            تم إرسال رمز التحقق عبر {channel==='sms'?'الواتساب':'البريد الإلكتروني'}
          </p>
          {otpSent && otpTimer > 0 && (
            <div style={{textAlign:'center',marginBottom:'12px'}}>
              <span style={{background:'#EEF2FF',color:'#2C3E6B',borderRadius:'8px',padding:'6px 16px',fontSize:'13px',fontWeight:'700',direction:'ltr',display:'inline-block',unicodeBidi:'bidi-override'}}>
                ⏱️ {fmtTime(otpTimer)}
              </span>
            </div>
          )}
          {otpSent && otpTimer === 0 && (
            <div style={{background:'#FEF2F2',color:'#dc2626',padding:'10px',borderRadius:'10px',fontSize:'13px',textAlign:'center',marginBottom:'12px'}}>
              ⚠️ انتهت صلاحية الرمز — أعد الإرسال
            </div>
          )}
          <div style={{marginBottom:'12px'}}>
            <input placeholder="أدخل الرمز" value={form.otp} onChange={e=>set('otp',e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleVerifyOtp()}
              maxLength={6}
              style={{width:'100%',padding:'14px',borderRadius:'12px',border:'1.5px solid #dde3ed',fontSize:'22px',fontFamily:'monospace',textAlign:'center',outline:'none',background:'#FAFBFF',boxSizing:'border-box',letterSpacing:'8px',direction:'ltr'}}/>
          </div>
          {btn('تسجيل الدخول', handleVerifyOtp, '#10b981')}
          <button disabled={timer>0} onClick={handleSendOtp}
            style={{width:'100%',background:'none',border:'none',color:timer>0?'#ccc':'#4A6FA5',cursor:timer>0?'not-allowed':'pointer',fontSize:'13px',fontFamily:'Cairo,sans-serif',padding:'6px'}}>
            {timer>0 ? `إعادة الإرسال (${timer}s)` : '🔄 إعادة إرسال الرمز'}
          </button>
          <button onClick={()=>{setStep('channel');setForm(p=>({...p,otp:''}));setMsg('')}}
            style={{width:'100%',background:'none',border:'none',color:'#888',cursor:'pointer',fontSize:'13px',fontFamily:'Cairo,sans-serif',padding:'6px'}}>← تغيير طريقة الاستلام</button>
        </>}

        {/* Forgot password */}
        {step==='forgot' && <>
          <div style={{marginBottom:'12px'}}>
            <input placeholder="اسم المستخدم أو البريد الإلكتروني" value={form.username} onChange={e=>set('username',e.target.value)}
              style={{width:'100%',padding:'12px 16px',borderRadius:'12px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',direction:'rtl',outline:'none',background:'#FAFBFF',boxSizing:'border-box'}}/>
          </div>
          <div style={{display:'flex',gap:'10px',marginBottom:'16px'}}>
            {['sms','email'].map(c=>(
              <button key={c} onClick={()=>setChannel(c)} style={{flex:1,padding:'12px',borderRadius:'12px',border:`2px solid ${channel===c?'#2C3E6B':'#dde3ed'}`,background:channel===c?'#EEF2FF':'#fff',color:channel===c?'#2C3E6B':'#888',fontFamily:'Cairo,sans-serif',fontWeight:channel===c?'700':'500',fontSize:'13px',cursor:'pointer'}}>
                {c==='sms' ? '💬 واتساب' : '📧 إيميل'}
              </button>
            ))}
          </div>
          {btn('إرسال رمز التحقق', handleForgotSend)}
          <button onClick={()=>setStep('login')} style={{width:'100%',background:'none',border:'none',color:'#888',cursor:'pointer',fontSize:'13px',fontFamily:'Cairo,sans-serif',padding:'6px'}}>← رجوع</button>
        </>}

        {/* Reset password */}
        {step==='reset_otp' && <>
          {otpSent && otpTimer > 0 && (
            <div style={{textAlign:'center',marginBottom:'12px'}}>
              <span style={{background:'#EEF2FF',color:'#2C3E6B',borderRadius:'8px',padding:'6px 16px',fontSize:'13px',fontWeight:'700',direction:'ltr',display:'inline-block',unicodeBidi:'bidi-override'}}>
                ⏱️ {fmtTime(otpTimer)}
              </span>
            </div>
          )}
          <div style={{marginBottom:'12px'}}>
            <input placeholder="رمز التحقق" value={form.otp} onChange={e=>set('otp',e.target.value)} maxLength={6}
              style={{width:'100%',padding:'14px',borderRadius:'12px',border:'1.5px solid #dde3ed',fontSize:'22px',fontFamily:'monospace',textAlign:'center',outline:'none',background:'#FAFBFF',boxSizing:'border-box',letterSpacing:'8px',direction:'ltr'}}/>
          </div>
          {inp('كلمة المرور الجديدة (6+ أحرف)','newPass','password')}
          {inp('تأكيد كلمة المرور','newPass2','password')}
          {btn('تغيير كلمة المرور', handleResetPass)}
          <button onClick={()=>{setStep('forgot');setForm(p=>({...p,otp:''}));setMsg('')}}
            style={{width:'100%',background:'none',border:'none',color:'#888',cursor:'pointer',fontSize:'13px',fontFamily:'Cairo,sans-serif',padding:'6px',marginTop:'4px'}}>← رجوع</button>
        </>}

      </div>
      <div style={{textAlign:'center',marginTop:'20px',width:'100%',maxWidth:'420px'}}>
        <a href="/" style={{color:'rgba(255,255,255,0.7)',fontSize:'13px',fontFamily:'Cairo,sans-serif',textDecoration:'none',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'6px',width:'100%'}}>
          🏠 العودة إلى الصفحة الرئيسية
        </a>
      </div>
    </div>
  )
}
