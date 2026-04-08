import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../lib/api'

const API = ''

export default function Chat() {
  const navigate = useNavigate()
  const location = useLocation()
  const [subscriber, setSubscriber] = useState(null)
  const [loginPhone, setLoginPhone] = useState('')
  const [loginOtp, setLoginOtp] = useState('')
  const [loginStep, setLoginStep] = useState('phone') // phone | otp
  const [chats, setChats] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [view, setView] = useState('chats') // chats | chat | new
  const bottomRef = useRef(null)

  // تحقق من الجلسة المحفوظة
  useEffect(() => {
    const saved = localStorage.getItem('ficc_subscriber')
    if (saved) {
      try { setSubscriber(JSON.parse(saved)) } catch {}
    }
  }, [])

  useEffect(() => {
    if (subscriber) loadChats()
  }, [subscriber])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadChats = async () => {
    try {
      const r = await api.get(`${API}/chat/my/${subscriber.id}`)
      setChats(r.data || [])
    } catch {}
  }

  const loadMessages = async (chatId) => {
    try {
      const r = await api.get(`${API}/chat/${chatId}/messages?subscriberId=${subscriber.id}`)
      setMessages(r.data.messages || [])
      setActiveChat(r.data.chat)
    } catch {}
  }

  // تسجيل الدخول
  const sendOtp = async () => {
    if (!loginPhone) { setErr('أدخل رقم الهاتف'); return }
    setLoading(true); setErr('')
    try {
      await api.post(`${API}/subscribers/send-otp`, { phone: loginPhone })
      setLoginStep('otp'); setLoginOtp('')
      setMsg('تم إرسال رمز التأكيد 📱')
    } catch(e) { setErr(e?.response?.data?.message || 'الرقم غير مسجّل') }
    setLoading(false)
  }

  const verifyOtp = async () => {
    if (!loginOtp) { setErr('أدخل الرمز'); return }
    setLoading(true); setErr('')
    try {
      const r = await api.post(`${API}/subscribers/verify-otp`, { phone: loginPhone, code: loginOtp })
      setSubscriber(r.data)
      localStorage.setItem('ficc_subscriber', JSON.stringify(r.data))
      setMsg('')
    } catch(e) { setErr(e?.response?.data?.message || 'رمز خاطئ') }
    setLoading(false)
  }

  // محادثة جديدة
  const startChat = async () => {
    if (!subject) { setErr('أدخل موضوع المحادثة'); return }
    setLoading(true); setErr('')
    try {
      const r = await api.post(`${API}/chat/start`, { subscriberId: subscriber.id, subject })
      await loadMessages(r.data.id)
      setView('chat')
      loadChats()
    } catch(e) { setErr('حدث خطأ') }
    setLoading(false)
  }

  // إرسال رسالة
  const sendMsg = async () => {
    if (!input.trim() || !activeChat) return
    const text = input; setInput('')
    const tmpUser = { id: Date.now(), sender: 'user', body: text, createdAt: new Date() }
    setMessages(p => [...p, tmpUser])
    try {
      const r = await api.post(`${API}/chat/${activeChat.id}/send`, { subscriberId: subscriber.id, body: text })
      setMessages(p => [...p.filter(m => m.id !== tmpUser.id), r.data.userMessage, r.data.aiMessage])
    } catch {}
  }

  const logout = () => {
    localStorage.removeItem('ficc_subscriber')
    setSubscriber(null); setChats([]); setActiveChat(null); setMessages([])
  }

  const inp = { width:'100%', padding:'12px 14px', borderRadius:'10px', border:'1.5px solid #dde3ed', fontSize:'14px', fontFamily:'Cairo,sans-serif', outline:'none', boxSizing:'border-box', direction:'rtl' }
  const btnPrimary = { padding:'13px', borderRadius:'12px', background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)', color:'#fff', border:'none', cursor:'pointer', fontFamily:'Cairo,sans-serif', fontWeight:'800', fontSize:'15px', width:'100%' }

  // واجهة تسجيل الدخول
  if (!subscriber) return (
    <div style={{minHeight:'80vh',background:'#F5F7FA',padding:'32px 16px',fontFamily:'Cairo,sans-serif',direction:'rtl',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{maxWidth:'400px',width:'100%'}}>
        <div style={{background:'linear-gradient(135deg,#1a1a2e,#2C3E6B)',borderRadius:'20px',padding:'28px',textAlign:'center',marginBottom:'20px'}}>
          <div style={{fontSize:'48px',marginBottom:'10px'}}>💬</div>
          <h1 style={{color:'#fff',fontWeight:'800',fontSize:'20px',margin:'0 0 6px'}}>راسلنا</h1>
          <p style={{color:'rgba(255,255,255,0.6)',fontSize:'13px',margin:0}}>اتحاد الغرف التجارية العراقية</p>
        </div>
        <div style={{background:'#fff',borderRadius:'16px',padding:'24px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
          {loginStep === 'phone' ? (
            <>
              <h3 style={{color:'#2C3E6B',margin:'0 0 16px',fontWeight:'800'}}>🔑 تسجيل الدخول</h3>
              <p style={{color:'#888',fontSize:'13px',margin:'0 0 16px'}}>أدخل رقم هاتفك المسجّل كمتابع</p>
              <input value={loginPhone} onChange={e=>setLoginPhone(e.target.value)} placeholder="07xxxxxxxxx" style={{...inp,direction:'ltr',marginBottom:'12px'}}/>
              {err && <div style={{background:'#fee2e2',color:'#dc2626',padding:'10px',borderRadius:'8px',fontSize:'13px',marginBottom:'12px'}}>{err}</div>}
              <button onClick={sendOtp} disabled={loading} style={btnPrimary}>{loading?'⏳...':'📱 أرسل رمز التأكيد'}</button>
              <p style={{textAlign:'center',marginTop:'12px',fontSize:'13px',color:'#888'}}>
                ما عندك حساب؟ <a href="/subscribe" style={{color:'#2C3E6B',fontWeight:'700'}}>سجّل متابعاً</a>
              </p>
            </>
          ) : (
            <>
              <h3 style={{color:'#2C3E6B',margin:'0 0 8px',fontWeight:'800'}}>📲 رمز التأكيد</h3>
              {msg && <p style={{color:'#16a34a',fontSize:'13px',background:'#f0fdf4',padding:'8px',borderRadius:'8px',margin:'0 0 12px'}}>{msg}</p>}
              <input value={loginOtp} onChange={e=>setLoginOtp(e.target.value)} placeholder="000000" maxLength={6}
                style={{...inp,direction:'ltr',letterSpacing:'8px',textAlign:'center',fontSize:'20px',fontWeight:'800',marginBottom:'12px'}}/>
              {err && <div style={{background:'#fee2e2',color:'#dc2626',padding:'10px',borderRadius:'8px',fontSize:'13px',marginBottom:'12px'}}>{err}</div>}
              <button onClick={verifyOtp} disabled={loading} style={btnPrimary}>{loading?'⏳...':'✅ دخول'}</button>
              <button onClick={()=>{setLoginStep('phone');setErr('');setMsg('')}} style={{...btnPrimary,marginTop:'8px',background:'#f5f7fa',color:'#666'}}>← رجوع</button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  // واجهة المحادثة المفتوحة
  if (view === 'chat' && activeChat) return (
    <div style={{minHeight:'80vh',display:'flex',flexDirection:'column',background:'#F5F7FA',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',padding:'16px 20px',display:'flex',alignItems:'center',gap:'12px'}}>
        <button onClick={()=>{setView('chats');setActiveChat(null);loadChats()}} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',fontSize:'20px',padding:'4px'}}>←</button>
        <div style={{flex:1}}>
          <div style={{color:'#fff',fontWeight:'800',fontSize:'15px'}}>{activeChat.subject}</div>
          <div style={{color:'rgba(255,255,255,0.7)',fontSize:'12px'}}>اتحاد الغرف التجارية العراقية 🏛️</div>
        </div>
        <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',
          background:activeChat.status==='answered'?'#16a34a':activeChat.status==='closed'?'#6b7280':'#f59e0b',color:'#fff'}}>
          {activeChat.status==='answered'?'✅ مُجاب':activeChat.status==='closed'?'مغلق':'🟡 مفتوح'}
        </span>
      </div>

      {/* الرسائل */}
      <div style={{flex:1,overflow:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:'12px',maxHeight:'calc(80vh - 130px)'}}>
        {messages.length === 0 && (
          <div style={{textAlign:'center',padding:'40px',color:'#aaa'}}>
            <div style={{fontSize:'48px',marginBottom:'8px'}}>💬</div>
            <p>ابدأ محادثتك — سنرد عليك فوراً</p>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{display:'flex',justifyContent:m.sender==='user'?'flex-end':'flex-start'}}>
            <div style={{maxWidth:'75%',padding:'12px 16px',borderRadius:m.sender==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px',
              background:m.sender==='user'?'linear-gradient(135deg,#2C3E6B,#4A6FA5)':m.sender==='admin'?'linear-gradient(135deg,#059669,#047857)':'#fff',
              color:m.sender==='user'||m.sender==='admin'?'#fff':'#333',
              boxShadow:'0 2px 8px rgba(0,0,0,0.1)',fontSize:'14px',lineHeight:'1.6',whiteSpace:'pre-wrap'}}>
              {m.sender !== 'user' && <div style={{fontSize:'11px',color:m.sender==='admin'?'rgba(255,255,255,0.7)':'#888',marginBottom:'4px'}}>{m.sender==='admin'?'👤 الأدمن':'🤖 المساعد الذكي'}</div>}
              {m.body}
              <div style={{fontSize:'10px',color:m.sender==='user'||m.sender==='admin'?'rgba(255,255,255,0.6)':'#ccc',marginTop:'4px',textAlign:'left'}}>
                {new Date(m.createdAt).toLocaleTimeString('ar-IQ',{hour:'2-digit',minute:'2-digit'})}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* مربع الإرسال */}
      {activeChat.status !== 'closed' && (
        <div style={{padding:'12px 16px',background:'#fff',borderTop:'1px solid #eef0f7',display:'flex',gap:'8px'}}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMsg()}
            placeholder="اكتب رسالتك..."
            style={{flex:1,padding:'11px 14px',borderRadius:'24px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',outline:'none'}}/>
          <button onClick={sendMsg} disabled={!input.trim()}
            style={{padding:'11px 18px',borderRadius:'24px',background:input.trim()?'linear-gradient(135deg,#2C3E6B,#4A6FA5)':'#f0f2f7',color:input.trim()?'#fff':'#aaa',border:'none',cursor:input.trim()?'pointer':'default',fontFamily:'Cairo,sans-serif',fontWeight:'800',fontSize:'14px'}}>
            إرسال ←
          </button>
        </div>
      )}
    </div>
  )

  // واجهة محادثة جديدة
  if (view === 'new') return (
    <div style={{minHeight:'80vh',background:'#F5F7FA',padding:'24px 16px',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      <div style={{maxWidth:'500px',margin:'0 auto'}}>
        <button onClick={()=>setView('chats')} style={{background:'none',border:'none',color:'#2C3E6B',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'14px',marginBottom:'16px',fontWeight:'700'}}>← رجوع</button>
        <div style={{background:'#fff',borderRadius:'16px',padding:'24px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
          <h2 style={{color:'#2C3E6B',fontWeight:'800',margin:'0 0 20px',fontSize:'18px'}}>✉️ رسالة جديدة</h2>
          <div style={{marginBottom:'16px'}}>
            <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#555',marginBottom:'6px'}}>موضوع الرسالة</label>
            <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="مثال: استفسار عن التسجيل بالغرفة" style={inp}/>
          </div>
          {err && <div style={{background:'#fee2e2',color:'#dc2626',padding:'10px',borderRadius:'8px',fontSize:'13px',marginBottom:'12px'}}>{err}</div>}
          <button onClick={startChat} disabled={loading} style={btnPrimary}>{loading?'⏳...':'✉️ ابدأ المحادثة'}</button>
        </div>
      </div>
    </div>
  )

  // قائمة المحادثات
  return (
    <div style={{minHeight:'80vh',background:'#F5F7FA',padding:'0',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#1a1a2e,#2C3E6B)',padding:'20px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
          <div style={{width:'44px',height:'44px',borderRadius:'50%',background:'linear-gradient(135deg,#FFC72C,#f59e0b)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',fontWeight:'800',color:'#1a1a2e'}}>
            {subscriber.fullName?.charAt(0)}
          </div>
          <div style={{flex:1}}>
            <div style={{color:'#fff',fontWeight:'800',fontSize:'15px'}}>{subscriber.fullName}</div>
            <div style={{color:'rgba(255,255,255,0.6)',fontSize:'12px',direction:'ltr'}}>{subscriber.phone}</div>
          </div>
          <button onClick={logout} style={{background:'rgba(255,255,255,0.1)',border:'none',color:'rgba(255,255,255,0.7)',cursor:'pointer',padding:'6px 12px',borderRadius:'8px',fontFamily:'Cairo,sans-serif',fontSize:'12px'}}>خروج</button>
        </div>
        <button onClick={()=>{setView('new');setSubject('');setErr('')}}
          style={{width:'100%',padding:'13px',borderRadius:'12px',background:'#FFC72C',color:'#1a1a2e',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'800',fontSize:'15px'}}>
          ✉️ رسالة جديدة
        </button>
      </div>

      {/* المحادثات */}
      <div style={{padding:'16px'}}>
        <h3 style={{color:'#2C3E6B',fontWeight:'800',margin:'0 0 12px',fontSize:'16px'}}>محادثاتي ({chats.length})</h3>
        {chats.length === 0 ? (
          <div style={{background:'#fff',borderRadius:'14px',padding:'40px',textAlign:'center',boxShadow:'0 2px 10px rgba(44,62,107,0.06)'}}>
            <div style={{fontSize:'48px',marginBottom:'8px'}}>💬</div>
            <p style={{color:'#888'}}>لا يوجد محادثات بعد</p>
          </div>
        ) : chats.map(c => (
          <div key={c.id} onClick={()=>{loadMessages(c.id);setView('chat')}}
            style={{background:'#fff',borderRadius:'14px',padding:'16px',marginBottom:'10px',boxShadow:'0 2px 10px rgba(44,62,107,0.06)',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',border:'1px solid #eef0f7'}}>
            <div>
              <div style={{fontWeight:'800',color:'#2C3E6B',fontSize:'14px'}}>{c.subject}</div>
              <div style={{fontSize:'12px',color:'#aaa',marginTop:'3px'}}>{new Date(c.createdAt).toLocaleDateString('ar-IQ')}</div>
            </div>
            <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',
              background:c.status==='answered'?'#dcfce7':c.status==='closed'?'#f1f5f9':'#fff8e7',
              color:c.status==='answered'?'#16a34a':c.status==='closed'?'#6b7280':'#b45309'}}>
              {c.status==='answered'?'✅ مُجاب':c.status==='closed'?'مغلق':'🟡 مفتوح'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
