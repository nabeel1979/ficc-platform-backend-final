import React, { useState, useEffect, useRef } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import api from '../lib/api'

const API = ''
const getToken  = () => localStorage.getItem('ficc_token')
const getUser   = () => { try { return JSON.parse(localStorage.getItem('ficc_user') || '{}') } catch { return {} } }
const authHdrs  = () => ({ Authorization: `Bearer ${getToken()}` })

const NAV = [
  { to: '/admin',            label: 'الرئيسية',       icon: '📊', exact: true },
  { to: '/admin/chambers',   label: 'الغرف التجارية', icon: '🏛️' },
  { to: '/admin/members',    label: 'الأعضاء',        icon: '👥' },
  { to: '/admin/traders',    label: 'دليل التجار',    icon: '🏢' },
  { to: '/admin/news',       label: 'الأخبار',        icon: '📰' },

  { to: '/admin/lawyers',    label: 'المحامون',       icon: '⚖️' },
  { to: '/admin/agents',     label: 'وكلاء الإخراج',  icon: '🏭' },
  { to: '/admin/shipping',   label: 'شركات الشحن',    icon: '🚢' },
  { to: '/admin/users',       label: 'المستخدمين',       icon: '🔑' },
  { to: '/admin/submissions', label: 'طلبات الإضافة',   icon: '📬' },
  { to: '/admin/subscribers', label: 'المتابعون',         icon: '🔔' },
  { to: '/admin/knowledge',   label: 'قاعدة المعرفة',    icon: '🧠' },
  { to: '/admin/chats',       label: 'المحادثات',         icon: '💬' },
  { to: '/admin/startups',   label: 'ريادة الأعمال',   icon: '🚀' },
  { to: '/admin/constants',  label: 'ثوابت النظام',    icon: '⚙️' },
  { to: '/admin/security',   label: 'إدارة الأمان',    icon: '🔒' },
  { to: '/admin/contacts',    label: 'إدارة جهات الاتصال', icon: '📋' },
  { to: '/correspondence',    label: '📨 المراسلات الرسمية', icon: '📨', external: true },
]

/* ─── Modal ─── */
function Modal({ title, onClose, children }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{background:'#fff',borderRadius:'20px',width:'100%',maxWidth:'560px',maxHeight:'90vh',overflow:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px',borderBottom:'1px solid #f0f2f8',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',borderRadius:'20px 20px 0 0'}}>
          <h3 style={{color:'#fff',fontWeight:'800',fontSize:'16px',margin:0}}>{title}</h3>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',width:'32px',height:'32px',borderRadius:'50%',cursor:'pointer',fontSize:'16px'}}>✕</button>
        </div>
        <div style={{padding:'24px'}}>{children}</div>
      </div>
    </div>
  )
}

/* ─── Social Field Component ─── */
function SocialField({ formData, onChange, value }) {
  const init = value || {}
  const [vals, setVals] = React.useState({
    facebook:  init.facebook  || formData?.facebook  || '',
    twitter:   init.twitter   || formData?.twitter   || '',
    instagram: init.instagram || formData?.instagram || '',
    linkedin:  init.linkedin  || formData?.linkedIn  || formData?.linkedin  || '',
    whatsapp:  init.whatsapp  || formData?.whatsApp  || '',
    telegram:  init.telegram  || formData?.telegram  || '',
    youtube:   init.youtube   || formData?.youTube   || '',
  })

  const update = (key, val) => {
    const updated = { ...vals, [key]: val }
    setVals(updated)
    onChange(updated)
  }

  const socials = [
    { key:'facebook',  label:'فيسبوك',   icon:'📘', placeholder:'https://facebook.com/...' },
    { key:'twitter',   label:'تويتر X',  icon:'𝕏',  placeholder:'https://twitter.com/...' },
    { key:'instagram', label:'انستغرام', icon:'📸', placeholder:'https://instagram.com/...' },
    { key:'linkedin',  label:'لينكدإن',  icon:'💼', placeholder:'https://linkedin.com/...' },
    { key:'whatsapp',  label:'واتساب',   icon:'💬', placeholder:'07xxxxxxxxxx' },
    { key:'telegram',  label:'تيليغرام', icon:'✈️', placeholder:'https://t.me/...' },
    { key:'youtube',   label:'يوتيوب',   icon:'📺', placeholder:'https://youtube.com/...' },
  ]

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
      {socials.map(s => (
        <div key={s.key} style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <span style={{fontSize:'20px',width:'28px',textAlign:'center',flexShrink:0}}>{s.icon}</span>
          <div style={{flex:1}}>
            <label style={{fontSize:'11px',color:'#888',display:'block',marginBottom:'3px'}}>{s.label}</label>
            <input
              value={vals[s.key]}
              onChange={e => update(s.key, e.target.value)}
              placeholder={s.placeholder}
              style={{
                width:'100%', padding:'8px 12px', borderRadius:'8px',
                border:'1.5px solid #dde3ed', fontSize:'13px',
                fontFamily:'Cairo,sans-serif', direction:'ltr', outline:'none',
                background:'#FAFBFF', boxSizing:'border-box'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Logo Field Component ─── */
function LogoField({ value, onChange, existingLogo, isPhoto }) {
  const inputRef = React.useRef()
  const [preview, setPreview] = React.useState(null)
  const [imgError, setImgError] = React.useState(false)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setImgError(false)
    onChange(file)
  }

  const displaySrc = preview || existingLogo
  const showImg = displaySrc && !imgError

  return (
    <div style={{display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap'}}>
      {/* Current logo */}
      <div style={{position:'relative'}}>
        {showImg ? (
          <img
            src={displaySrc}
            alt="لوغو"
            style={{width:'80px',height:'80px',objectFit:'contain',borderRadius:'12px',
              border:'2px solid #2C3E6B',background:'#f5f7fa',padding:'4px'}}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{width:'80px',height:'80px',borderRadius:'12px',border:'2px dashed #ccc',
            background:'#f5f7fa',display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:'28px',color:'#ccc'}}>🖼️</div>
        )}
        {preview && <span style={{position:'absolute',top:'-8px',right:'-8px',background:'#10b981',color:'#fff',borderRadius:'10px',fontSize:'10px',fontWeight:'700',padding:'2px 6px'}}>جديد</span>}
      </div>
      {/* Upload button */}
      <div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{display:'none'}} />
        <button type="button" onClick={()=>inputRef.current?.click()} style={{
          display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 20px',
          borderRadius:'10px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',
          color:'#fff',cursor:'pointer',fontSize:'13px',fontWeight:'700',
          border:'none',fontFamily:'Cairo,sans-serif'
        }}>
          🖼️ {isPhoto ? (existingLogo ? 'تغيير الصورة' : 'رفع الصورة الشخصية') : (existingLogo ? 'تغيير اللوغو' : 'رفع اللوغو')}
        </button>
        <p style={{color:'#aaa',fontSize:'11px',marginTop:'6px'}}>PNG, JPG, SVG — يُفضّل خلفية شفافة</p>
      </div>
    </div>
  )
}

/* ─── Images Field Component ─── */
function ImagesField({ value, onChange, existingImages: initExisting, existingMain, onSetMain, onDeleteExisting }) {
  const [existing, setExisting]       = React.useState(initExisting || [])
  const [selectedMain, setSelectedMain] = React.useState(existingMain || (initExisting||[])[0] || null)
  const [newFiles, setNewFiles]       = React.useState([])
  const inputRef = React.useRef()

  // Sync when modal opens with different news item
  React.useEffect(() => {
    setExisting(initExisting || [])
    setSelectedMain(existingMain || (initExisting||[])[0] || null)
    setNewFiles([])
  }, [JSON.stringify(initExisting), existingMain])

  const handleSetMain = (url) => {
    setSelectedMain(url)
    if (onSetMain) onSetMain(url)
  }

  const handleDeleteExisting = (url, e) => {
    e.stopPropagation()
    const updated = existing.filter(u => u !== url)
    setExisting(updated)
    if (selectedMain === url) {
      const next = updated[0] || null
      setSelectedMain(next)
      if (onSetMain) onSetMain(next)
    }
    if (onDeleteExisting) onDeleteExisting(url)
  }

  const handleNewFiles = (files) => {
    const arr = Array.from(files)
    setNewFiles(arr)
    onChange(arr)
  }

  const removeNewFile = (idx, e) => {
    e.stopPropagation()
    const updated = newFiles.filter((_,i) => i !== idx)
    setNewFiles(updated)
    onChange(updated)
  }

  return (
    <div>
      {/* Existing images */}
      {existing.length > 0 && (
        <div style={{marginBottom:'14px'}}>
          <p style={{fontSize:'12px',color:'#2C3E6B',fontWeight:'700',margin:'0 0 10px'}}>
            👆 اضغط للتعيين رئيسية — ✕ للحذف:
          </p>
          <div style={{display:'flex',flexWrap:'wrap',gap:'14px'}}>
            {existing.map((url,i) => {
              const isMain = selectedMain === url || (!selectedMain && i===0)
              return (
                <div key={url} onClick={()=>handleSetMain(url)}
                  style={{position:'relative',cursor:'pointer',transition:'transform 0.15s',transform:isMain?'scale(1.05)':'scale(1)'}}>
                  <img src={url} alt="" style={{
                    width:'90px',height:'90px',objectFit:'cover',borderRadius:'12px',display:'block',
                    border: isMain ? '3px solid #FFC72C' : '3px solid #e5e7eb',
                    boxShadow: isMain ? '0 0 0 3px rgba(255,199,44,0.3)' : 'none',
                    transition:'all 0.2s'
                  }} />
                  {/* Delete button */}
                  <button onClick={(e)=>handleDeleteExisting(url,e)} type="button" style={{
                    position:'absolute',top:'-8px',left:'-8px',
                    background:'#dc2626',color:'#fff',border:'none',borderRadius:'50%',
                    width:'22px',height:'22px',cursor:'pointer',fontSize:'13px',fontWeight:'800',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    boxShadow:'0 2px 4px rgba(0,0,0,0.3)',lineHeight:'1'
                  }}>✕</button>
                  {/* Number badge */}
                  <span style={{
                    position:'absolute',top:'-8px',right:'-8px',
                    background: isMain ? '#FFC72C' : '#2C3E6B',
                    color: isMain ? '#1a1a2e' : '#fff',
                    borderRadius:'50%',width:'22px',height:'22px',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:'11px',fontWeight:'800'
                  }}>{i+1}</span>
                  {/* Main badge */}
                  {isMain && (
                    <div style={{
                      position:'absolute',bottom:'-10px',left:'50%',transform:'translateX(-50%)',
                      background:'#FFC72C',color:'#1a1a2e',fontSize:'10px',fontWeight:'800',
                      padding:'2px 8px',borderRadius:'10px',whiteSpace:'nowrap'
                    }}>⭐ رئيسية</div>
                  )}
                </div>
              )
            })}
          </div>
          <p style={{fontSize:'11px',color:'#aaa',marginTop:'16px'}}>
            {existing.length} صورة — الرئيسية: {selectedMain?.split('/').pop() || '—'}
          </p>
        </div>
      )}

      {/* Upload button */}
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={e=>handleNewFiles(e.target.files)} style={{display:'none'}} />
      <button type="button" onClick={()=>inputRef.current?.click()} style={{
        display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 20px',borderRadius:'10px',
        background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',cursor:'pointer',
        fontSize:'13px',fontWeight:'700',border:'none',fontFamily:'Cairo,sans-serif'
      }}>
        📸 {existing.length > 0 ? 'إضافة صور جديدة' : 'اختر صور (حتى 5)'}
      </button>

      {/* New files preview */}
      {newFiles.length > 0 && (
        <div style={{marginTop:'12px'}}>
          <p style={{fontSize:'12px',color:'#10b981',fontWeight:'700',margin:'0 0 8px'}}>✅ صور جديدة ({newFiles.length})</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:'10px'}}>
            {newFiles.map((f,i) => (
              <div key={i} style={{position:'relative'}}>
                <img src={URL.createObjectURL(f)} alt="" style={{width:'80px',height:'80px',objectFit:'cover',borderRadius:'8px',border:'2px solid #10b981'}} />
                <button onClick={(e)=>removeNewFile(i,e)} type="button" style={{
                  position:'absolute',top:'-8px',left:'-8px',
                  background:'#dc2626',color:'#fff',border:'none',borderRadius:'50%',
                  width:'20px',height:'20px',cursor:'pointer',fontSize:'12px',fontWeight:'800',
                  display:'flex',alignItems:'center',justifyContent:'center'
                }}>✕</button>
                <span style={{position:'absolute',top:'-6px',right:'-6px',background:'#10b981',color:'#fff',borderRadius:'50%',width:'18px',height:'18px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:'700'}}>{i+1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Field Renderer ─── */
// ─── Image Lightbox ───
function ImageLightbox({ src, onClose }) {
  if (!src) return null
  return (
    <div onClick={onClose} style={{
      position:'fixed',inset:0,zIndex:99999,background:'rgba(0,0,0,0.92)',
      display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out',padding:16
    }}>
      <img src={src} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:'95vw',maxHeight:'92vh',objectFit:'contain',borderRadius:12,boxShadow:'0 8px 40px rgba(0,0,0,0.6)'}} />
      <button onClick={onClose} style={{position:'absolute',top:16,left:16,background:'rgba(255,255,255,0.15)',border:'none',borderRadius:'50%',width:44,height:44,cursor:'pointer',color:'#fff',fontSize:22,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
      <a href={src} download target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
        style={{position:'absolute',top:16,right:16,background:'rgba(255,255,255,0.15)',border:'none',borderRadius:10,padding:'8px 16px',cursor:'pointer',color:'#fff',fontSize:13,fontFamily:'Cairo,sans-serif',fontWeight:700,textDecoration:'none'}}>
        ⬇️ تحميل
      </a>
    </div>
  )
}

function AdminSearchableSelect({ options, value, onChange, base }) {
  const [q, setQ] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const filtered = q.trim() ? options.filter(o => o.toLowerCase().includes(q.toLowerCase())) : options
  return (
    <div style={{position:'relative',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      <div style={{...base,display:'flex',alignItems:'center',padding:0,overflow:'hidden',cursor:'pointer'}} onClick={()=>setOpen(o=>!o)}>
        {value
          ? <span style={{flex:1,padding:'10px 14px',fontSize:14,whiteSpace:'normal',wordBreak:'break-word',lineHeight:'1.6',color:'#222'}}>{value}</span>
          : <span style={{flex:1,padding:'10px 14px',fontSize:14,color:'#aaa'}}>-- اختر أو اكتب --</span>
        }
        {value && <button type="button" onClick={e=>{e.stopPropagation();onChange('');setQ('')}} style={{padding:'8px',background:'none',border:'none',cursor:'pointer',color:'#888',fontSize:16}}>✕</button>}
        <span style={{padding:'10px 10px',color:'#888',fontSize:11}}>▼</span>
      </div>
      {open && (
        <div style={{position:'absolute',top:'100%',right:0,left:0,zIndex:9999,background:'#fff',border:'1px solid #dde3ed',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,0.12)',maxHeight:260,display:'flex',flexDirection:'column'}}>
          <div style={{padding:'8px',borderBottom:'1px solid #eee',flexShrink:0}}>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 بحث..." autoFocus
              style={{width:'100%',padding:'7px 10px',border:'1px solid #dde3ed',borderRadius:7,fontFamily:'Cairo,sans-serif',fontSize:13,boxSizing:'border-box',outline:'none'}} />
          </div>
          <div style={{overflowY:'auto'}}>
            {q.trim() && !options.includes(q.trim()) && (
              <div onMouseDown={()=>{onChange(q.trim());setQ('');setOpen(false)}}
                style={{padding:'9px 14px',cursor:'pointer',fontSize:13,color:'#2C3E6B',fontWeight:700,borderBottom:'1px solid #f0f0f0',background:'#EEF2FF'}}>
                ✏️ إضافة: "{q.trim()}"
              </div>
            )}
            {filtered.length===0
              ? <div style={{padding:12,color:'#999',textAlign:'center',fontSize:13}}>لا نتائج</div>
              : filtered.map(o=>(
                <div key={o} onMouseDown={()=>{onChange(o);setQ('');setOpen(false)}}
                  style={{padding:'9px 14px',cursor:'pointer',fontSize:13,borderBottom:'1px solid #f5f5f5',whiteSpace:'normal',wordBreak:'break-word',lineHeight:'1.5'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#f0f4ff'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  {o}
                </div>
              ))
            }
          </div>
        </div>
      )}
      {open && <div style={{position:'fixed',inset:0,zIndex:9998}} onClick={()=>setOpen(false)}/>}
    </div>
  )
}

function OtpVerifyField({ field, value, onChange, onVerified }) {
  const [otp, setOtp] = React.useState('')
  const [sent, setSent] = React.useState(false)
  const [verified, setVerified] = React.useState(false)
  const [msg, setMsg] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [timer, setTimer] = React.useState(0)
  const isPhone = field.key === 'phone'

  const startTimer = () => {
    setTimer(60)
    const iv = setInterval(() => setTimer(t => { if(t<=1){clearInterval(iv);return 0} return t-1 }), 1000)
  }

  const sendOtp = async () => {
    if (!value) { setMsg('أدخل ' + field.label + ' أولاً'); return }
    setLoading(true); setMsg('')
    try {
      // Use a temp username based on value for verification
      const ch = isPhone ? 'sms' : 'email'
      // We need to use the admin's credentials to send OTP to this contact
      // Send via dedicated verify-contact endpoint
      await api.post(`${API}/otp/verify-contact`, {
        value: value,
        channel: ch
      }, { headers: authHdrs() })
      setSent(true)
      startTimer()
      setMsg('✅ تم الإرسال')
    } catch(e) {
      setMsg('❌ ' + (e.response?.data?.message || 'فشل الإرسال'))
    } finally { setLoading(false) }
  }

  const checkOtp = async () => {
    if (!otp) { setMsg('أدخل الرمز'); return }
    setLoading(true); setMsg('')
    try {
      await api.post(`${API}/otp/verify-contact-check`, {
        value: value,
        channel: isPhone ? 'sms' : 'email',
        code: otp
      }, { headers: authHdrs() })
      // Set verified immediately BEFORE any parent callbacks
      setVerified(true)
      setSent(false)
      setOtp('')
      setMsg('✅ تم التحقق بنجاح')
      // Notify parent after local state settled
      setTimeout(() => {
        if (onVerified) onVerified(field.key, true)
      }, 0)
    } catch(e) {
      setMsg('❌ ' + (e.response?.data?.message || 'الرمز غير صحيح'))
      setLoading(false)
      return
    }
    setLoading(false)
  }

  const base = { width:'100%', padding:'10px 14px', borderRadius:'10px', border:'1.5px solid #dde3ed', fontSize:'14px', fontFamily:'Cairo,sans-serif', direction: isPhone ? 'ltr' : 'rtl', outline:'none', background:'#FAFBFF', boxSizing:'border-box' }

  return (
    <div>
      <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
        <input type={isPhone?'tel':field.type||'text'} value={value||''} onChange={e=>{
          const newVal = e.target.value
          onChange(newVal, false)
          setSent(false)
          if(newVal !== value) { setVerified(false); setMsg('') }
        }}
          placeholder={field.placeholder||field.label} style={{...base,flex:1}} />
        {verified ? (
          <span style={{color:'#10b981',fontSize:'20px',flexShrink:0}}>✅</span>
        ) : (
          <button type="button" onClick={sendOtp} disabled={loading||timer>0||!value?.trim()}
            style={{flexShrink:0,padding:'8px 14px',borderRadius:'10px',background:(!value?.trim()||timer>0)?'#aaa':'#2C3E6B',color:'#fff',border:'none',cursor:(!value?.trim()||timer>0||loading)?'not-allowed':'pointer',fontSize:'12px',fontFamily:'Cairo,sans-serif',fontWeight:'700',whiteSpace:'nowrap',opacity:!value?.trim()?0.4:1,pointerEvents:!value?.trim()?'none':'auto'}}>
            {timer>0 ? `${timer}s` : loading ? '...' : '📨 تحقق'}
          </button>
        )}
      </div>
      {sent && !verified && (
        <div style={{display:'flex',gap:'8px',marginTop:'8px',alignItems:'center'}}>
          <input type="text" value={otp} onChange={e=>setOtp(e.target.value)} maxLength={6} placeholder="أدخل الرمز"
            style={{flex:1,padding:'8px 14px',borderRadius:'10px',border:'1.5px solid #FFC72C',fontSize:'18px',fontFamily:'monospace',textAlign:'center',outline:'none',background:'#FFFBEB',boxSizing:'border-box',letterSpacing:'6px',direction:'ltr'}}/>
          <button type="button" onClick={checkOtp} disabled={loading}
            style={{flexShrink:0,padding:'8px 14px',borderRadius:'10px',background:'#10b981',color:'#fff',border:'none',cursor:'pointer',fontSize:'12px',fontFamily:'Cairo,sans-serif',fontWeight:'700'}}>
            ✓ تأكيد
          </button>
        </div>
      )}
      {msg && <div style={{fontSize:'12px',marginTop:'4px',color:msg.startsWith('✅')?'#10b981':'#dc2626'}}>{msg}</div>}
    </div>
  )
}

let _sysConstants = {}
function FormField({ field, value, onChange, onVerified }) {
  const base = {
    width:'100%', padding:'10px 14px', borderRadius:'10px',
    border:'1.5px solid #dde3ed', fontSize:'14px',
    fontFamily:'Cairo,sans-serif', direction:'rtl', outline:'none',
    background:'#FAFBFF', boxSizing:'border-box'
  }
  if (field.verifyOtp) return <OtpVerifyField field={field} value={value} onChange={onChange} onVerified={onVerified} />
  if (field.type === 'addressPart') return (
    <input value={value||''} onChange={e=>onChange(e.target.value)} placeholder={field.placeholder||''}
      style={{width:'100%',padding:'10px 14px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',direction:'rtl',outline:'none',background:'#FAFBFF',boxSizing:'border-box'}} />
  )
  if (field.type === 'select' || field.type === 'searchable-select') {
    const opts = (field.constantsKey && _sysConstants[field.constantsKey]?.length)
      ? _sysConstants[field.constantsKey].map(o => o.v||o)
      : (field.options || []).map(o => o.v||o)
    if (field.type === 'searchable-select' || opts.length > 10) {
      return <AdminSearchableSelect options={opts} value={value||''} onChange={onChange} base={base} />
    }
    return (
      <select value={value||''} onChange={e=>onChange(e.target.value)} style={base}>
        <option value="">-- اختر --</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }
  if (field.type === 'textarea') return (
    <textarea value={value||''} onChange={e=>onChange(e.target.value)} rows={4} style={{...base,resize:'vertical'}} />
  )
  if (field.type === 'social') return (
    <SocialField formData={field._formData} onChange={onChange} value={value} />
  )
  if (field.type === 'logo') {
    const isPhoto = field.label?.includes('صورة') || field.key === '_photo'
    const existingLogo = isPhoto
      ? (field._formData?.photoUrl || null)
      : (field._formData?.logoUrl || null)
    return <LogoField value={value} onChange={onChange} existingLogo={existingLogo} isPhoto={isPhoto} />
  }
  if (field.type === 'images') return (
    <ImagesField value={value} onChange={onChange}
      existingImages={field._formData ? (() => { try { return JSON.parse(field._formData.images||'[]') } catch { return field._formData.imageUrl?[field._formData.imageUrl]:[] } })() : []}
      existingMain={field._formData?.imageUrl}
      onSetMain={url => { if (field._onSetMain) field._onSetMain(url) }}
      onDeleteExisting={url => { if (field._onDeleteImg) field._onDeleteImg(url) }}
    />
  )
  if (field.type === 'checkbox') return (
    <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}>
      <input type="checkbox" checked={!!value} onChange={e=>onChange(e.target.checked)}
        style={{width:'18px',height:'18px',cursor:'pointer'}} />
      <span style={{fontSize:'14px',color:'#444'}}>{field.checkLabel||field.label}</span>
    </label>
  )
  if (field.type === 'multicheck') return (
    <MultiCheckField options={field.options} value={value||''} onChange={onChange} />
  )
  if (field.type === 'chamberSelect') return (
    <ChamberSelectField value={value||''} onChange={onChange} base={base} />
  )
  return <input type={field.type||'text'} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={field.placeholder||field.label} style={base} />
}

/* ─── Chamber Select from API ─── */
function ChamberSelectField({ value, onChange, base }) {
  const [chambers, setChambers] = useState([])
  useEffect(() => {
    api.get('/chambers').then(r => {
      const list = Array.isArray(r.data) ? r.data : r.data.items || []
      setChambers(list)
    }).catch(() => {})
  }, [])
  return (
    <select value={value||''} onChange={e=>onChange(e.target.value)} style={base}>
      <option value="">-- اختر الغرفة --</option>
      {chambers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
    </select>
  )
}

/* ─── Multi-Check Field ─── */
function MultiCheckField({ options, value, onChange }) {
  const selected = value ? value.split(',').map(s=>s.trim()).filter(Boolean) : []
  const toggle = (opt) => {
    const next = selected.includes(opt) ? selected.filter(s=>s!==opt) : [...selected, opt]
    onChange(next.join(','))
  }
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
      {options.map(opt => (
        <label key={opt} style={{display:'flex',alignItems:'center',gap:'6px',cursor:'pointer',
          padding:'6px 12px',borderRadius:'20px',fontSize:'13px',fontWeight:'600',
          background:selected.includes(opt)?'linear-gradient(135deg,#2C3E6B,#4A6FA5)':'#F0F2F8',
          color:selected.includes(opt)?'#fff':'#2C3E6B',
          border:`1.5px solid ${selected.includes(opt)?'#2C3E6B':'#dde3ed'}`,
          transition:'all 0.15s',userSelect:'none'}}>
          <input type="checkbox" checked={selected.includes(opt)} onChange={()=>toggle(opt)} style={{display:'none'}}/>
          {selected.includes(opt)?'✓ ':''}{opt}
        </label>
      ))}
    </div>
  )
}

/* ─── Generic CRUD Table ─── */
function CrudTable({ title, icon, endpoint, columns, fields: rawFields, addLabel, constants: ctxConstants = {} }) {
  const fields = rawFields.map(f =>
    f.constantsKey && ctxConstants[f.constantsKey]?.length
      ? { ...f, options: ctxConstants[f.constantsKey] }
      : f
  )
  const [items, setItems]     = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [modal, setModal]     = useState(null) // null | {mode:'add'|'edit'|'delete', item?}
  const [form, setForm]       = useState({})
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')
  const [verifiedFields, setVerifiedFields] = useState({})
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage]         = useState(1)

  const load = async (p = page, ps = pageSize, q = search) => {
    setLoading(true)
    try {
      const params = { page: p, pageSize: ps }
      if (q?.trim()) params.search = q.trim()
      const r = await api.get(`${API}/${endpoint}`, { headers: authHdrs(), params })
      const data = Array.isArray(r.data) ? r.data : r.data.items || []
      setItems(data)
      setTotal(r.data?.total || data.length)
    } catch { setItems([]); setTotal(0) }
    setLoading(false)
  }
  useEffect(() => { setPage(1); load(1, pageSize, '') }, [endpoint])
  useEffect(() => { setPage(1); load(1, pageSize, search) }, [search])
  useEffect(() => { load(page, pageSize, search) }, [page, pageSize])

  const openAdd  = () => { setForm({}); setVerifiedFields({}); setModal({mode:'add'}) }
  const openEdit = (item) => {
    const f = {...item}
    // Parse address into ziqaq + dar for chambers
    if (endpoint === 'chambers' && item.address) {
      const zMatch = item.address.match(/زقاق\s*(\S+)/)
      const dMatch = item.address.match(/دار\s*(\S+)/)
      if (zMatch) f._ziqaq = zMatch[1]
      if (dMatch) f._dar = dMatch[1]
    }
    setForm(f)
    // Pre-verify existing values (already in DB = already verified)
    const pre = {}
    if (item.email) pre.email = true
    if (item.phone) pre.phone = true
    setVerifiedFields(pre)
    setModal({mode:'edit', item})
  }
  const openDel  = (item) => { setModal({mode:'delete', item}) }
  const closeModal = () => { setModal(null); setForm({}) }

  const handleSave = async () => {
    // التحقق من إيميل أو هاتف للمستخدمين
    if (endpoint === 'users') {
      if (!form.email && !form.phone) {
        setMsg('⚠️ يجب إدخال البريد الإلكتروني أو رقم الهاتف — مطلوب لاستلام رمز الدخول OTP')
        return
      }
    }
    setSaving(true); setMsg('')
    try {
      // Merge ziqaq + dar into address for chambers
      if (endpoint === 'chambers' && (form._ziqaq || form._dar)) {
        const parts = []
        if (form._ziqaq) parts.push(`زقاق ${form._ziqaq}`)
        if (form._dar)   parts.push(`دار ${form._dar}`)
        form.address = parts.join('، ')
      }

      // Merge social fields BEFORE saving
      if (['chambers','traderdirectory'].includes(endpoint) && form._social) {
        const s = form._social
        if (s.facebook)  form.facebook  = s.facebook
        if (s.twitter)   form.twitter   = s.twitter
        if (s.instagram) form.instagram = s.instagram
        if (s.linkedin)  form.linkedIn  = s.linkedin
        if (s.whatsapp)  form.whatsApp  = s.whatsapp
        if (s.telegram)  form.telegram  = s.telegram
        if (s.youtube)   form.youTube   = s.youtube
      }
      let savedItem
      // Strip non-JSON fields before sending
      // Strip: _fields, File objects, nested objects, and upload-managed fields
      const uploadManagedFields = ['photoUrl','logoUrl']
      const cleanForm = Object.fromEntries(Object.entries(form).filter(([k,v]) => !k.startsWith('_') && !(v instanceof File) && !(v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) && !uploadManagedFields.includes(k)))
      console.log('Saving:', endpoint, modal.mode, cleanForm)
      console.log('Has _logo:', !!form._logo, form._logo)
      if (modal.mode === 'add') {
        const r = await api.post(`${API}/${endpoint}`, cleanForm, { headers: authHdrs() })
        savedItem = r.data; setMsg('✅ تمت الإضافة')
      } else {
        const r = await api.put(`${API}/${endpoint}/${modal.item.id}`, cleanForm, { headers: authHdrs() })
        savedItem = r.data; setMsg('✅ تم التعديل')
      }
      // Upload logo/photo for chambers, traders, members, shipping
      const logoEndpoints = ['chambers','traderdirectory','members','shipping']
      if (form._logo && logoEndpoints.includes(endpoint)) {
        const itemId = savedItem?.id || modal?.item?.id
        if (itemId) {
          const fd = new FormData()
          const isMember = endpoint === 'members'
          fd.append(isMember ? 'photo' : 'logo', form._logo)
          const uploadEp = isMember ? 'upload-photo' : 'upload-logo'
          try {
            await api.post(`${API}/${endpoint}/${itemId}/${uploadEp}`, fd, { headers: { Authorization: authHdrs().Authorization } })
            setMsg('✅ تم الحفظ والشعار')
          } catch(uploadErr) {
            setMsg('⚠️ تم الحفظ لكن فشل رفع الشعار: ' + (uploadErr?.response?.data?.message || uploadErr.message))
          }
        }
      }
      // رفع الصورة الشخصية للتاجر (_photo) منفصلاً عن الشعار
      if (form._photo && endpoint === 'traderdirectory') {
        const itemId = savedItem?.id || modal?.item?.id
        if (itemId) {
          const fd = new FormData()
          fd.append('photo', form._photo)
          try {
            await api.post(`${API}/${endpoint}/${itemId}/upload-photo`, fd, { headers: { Authorization: authHdrs().Authorization } })
            setMsg('✅ تم الحفظ والصور')
          } catch(uploadErr) {
            setMsg('⚠️ تم الحفظ لكن فشل رفع الصورة الشخصية: ' + (uploadErr?.response?.data?.message || uploadErr.message))
          }
        }
      }
      // Delete removed images
      if (form._deleteImages?.length > 0 && savedItem?.id) {
        await api.post(`${API}/${endpoint}/${savedItem.id}/delete-images`,
          { urls: form._deleteImages },
          { headers: { ...authHdrs(), 'Content-Type':'application/json' } }
        ).catch(()=>{})
      }
      // Upload new images if any (form._images is now always a plain Array)
      const imgArr = form._images ? (Array.isArray(form._images) ? form._images : Array.from(form._images)) : []
      console.log('Images to upload:', imgArr.length, imgArr.map(f=>f?.name))
      if (imgArr.length > 0 && savedItem?.id) {
        const fd = new FormData()
        imgArr.forEach(f => { if (f instanceof File) fd.append('images', f) })
        const uploadRes = await api.post(`${API}/${endpoint}/${savedItem.id}/upload-images`, fd, {
          headers: { Authorization: authHdrs().Authorization }
        })
        console.log('Upload result:', uploadRes.data)
        setMsg('✅ تم الحفظ والصور: ' + (uploadRes.data?.urls?.length || 0))
      }
      // Update main image if selected
      if (form._mainImage && savedItem?.id) {
        await api.patch(`${API}/${endpoint}/${savedItem.id}/set-main-image`,
          { imageUrl: form._mainImage },
          { headers: { ...authHdrs(), 'Content-Type':'application/json' } }
        ).catch(()=>{})
      }
      closeModal(); await load()
    } catch(e) {
      console.error('Save error:', e, e.response?.data)
      setMsg('❌ ' + (e.response?.data?.message || e.response?.data?.title || e.message || 'حدث خطأ في الحفظ'))
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await api.delete(`${API}/${endpoint}/${modal.item.id}`, { headers: authHdrs() })
      closeModal(); await load()
    } catch { setMsg('❌ فشل الحذف') }
    setSaving(false)
  }

  const filtered = items.filter(it =>
    !search || columns.some(c => String(it[c.key]||'').toLowerCase().includes(search.toLowerCase()))
  )
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = pageSize >= 1000 ? filtered : filtered.slice((page-1)*pageSize, page*pageSize)

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
        <h2 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'22px',margin:0}}>{icon} {title}</h2>
        <div style={{display:'flex',gap:'10px'}}>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="🔍 بحث..." style={{
            padding:'9px 14px',borderRadius:'10px',border:'1.5px solid #dde3ed',
            fontSize:'13px',fontFamily:'Cairo,sans-serif',outline:'none',width:'180px'
          }} />
          <select value={pageSize} onChange={e=>{setPageSize(+e.target.value);setPage(1)}}
            style={{padding:'9px 12px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'13px',fontFamily:'Cairo,sans-serif',background:'#fff',cursor:'pointer'}}>
            {[10,50,100,1000].map(n=><option key={n} value={n}>{n}</option>)}
          </select>
          <button onClick={openAdd} style={{
            padding:'9px 20px',borderRadius:'10px',
            background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',
            color:'#fff',border:'none',cursor:'pointer',
            fontSize:'13px',fontFamily:'Cairo,sans-serif',fontWeight:'700'
          }}>+ {addLabel}</button>
        </div>
      </div>

      {msg && <div style={{background: msg.startsWith('✅')?'#f0fdf4':'#fee2e2', color: msg.startsWith('✅')?'#16a34a':'#dc2626', padding:'10px 16px', borderRadius:'10px', marginBottom:'16px', fontSize:'14px'}}>{msg}</div>}

      {/* Table */}
      <div style={{background:'#fff',borderRadius:'16px',boxShadow:'0 4px 16px rgba(44,62,107,0.07)',overflow:'hidden'}}>
        {loading ? (
          <div style={{textAlign:'center',padding:'60px',color:'#aaa'}}>⏳ جاري التحميل...</div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:'600px'}}>
              <thead>
                <tr style={{background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)'}}>
                  <th style={th}>#</th>
                  {columns.map(c => <th key={c.key} style={th}>{c.label}</th>)}
                  <th style={{...th,textAlign:'center'}}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={columns.length+2} style={{textAlign:'center',padding:'40px',color:'#aaa'}}>لا توجد بيانات</td></tr>
                ) : paged.map((item, idx) => (
                  <tr key={item.id} style={{borderBottom:'1px solid #f0f2f8',background:idx%2===0?'#fff':'#fafbff',transition:'background 0.1s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#EEF2FF'}
                    onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?'#fff':'#fafbff'}>
                    <td style={td}>{(page-1)*pageSize+idx+1}</td>
                    {columns.map(c => (
                      <td key={c.key} style={{...td,maxWidth:'180px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {c.render ? c.render(item[c.key], item) : (item[c.key]??'—')}
                      </td>
                    ))}
                    <td style={{...td,textAlign:'center',whiteSpace:'nowrap'}}>
                      <button onClick={()=>openEdit(item)} style={{background:'#EEF2FF',color:'#2C3E6B',border:'none',borderRadius:'7px',padding:'6px 12px',cursor:'pointer',fontSize:'12px',marginLeft:'6px',fontFamily:'Cairo,sans-serif'}}>✏️ تعديل</button>
                      <button onClick={()=>openDel(item)}  style={{background:'#fee2e2',color:'#dc2626',border:'none',borderRadius:'7px',padding:'6px 12px',cursor:'pointer',fontSize:'12px',fontFamily:'Cairo,sans-serif'}}>🗑️ حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {(() => {
        const totalPages = Math.ceil(total / pageSize)
        return (
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'10px',flexWrap:'wrap',gap:8}}>
            <p style={{color:'#aaa',fontSize:'12px',margin:0}}>{total} سجل</p>
            {totalPages > 1 && (
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <button onClick={()=>setPage(1)} disabled={page===1} style={{padding:'5px 10px',borderRadius:7,border:'1px solid #dde3ed',background:page===1?'#f5f5f5':'#fff',cursor:page===1?'default':'pointer',fontSize:12,fontFamily:'Cairo,sans-serif'}}>««</button>
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{padding:'5px 10px',borderRadius:7,border:'1px solid #dde3ed',background:page===1?'#f5f5f5':'#fff',cursor:page===1?'default':'pointer',fontSize:12,fontFamily:'Cairo,sans-serif'}}>← السابق</button>
                <span style={{fontSize:12,color:'#555',fontFamily:'Cairo,sans-serif',padding:'0 6px'}}>{page} / {totalPages}</span>
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{padding:'5px 10px',borderRadius:7,border:'1px solid #dde3ed',background:page===totalPages?'#f5f5f5':'#fff',cursor:page===totalPages?'default':'pointer',fontSize:12,fontFamily:'Cairo,sans-serif'}}>التالي →</button>
                <button onClick={()=>setPage(totalPages)} disabled={page===totalPages} style={{padding:'5px 10px',borderRadius:7,border:'1px solid #dde3ed',background:page===totalPages?'#f5f5f5':'#fff',cursor:page===totalPages?'default':'pointer',fontSize:12,fontFamily:'Cairo,sans-serif'}}>»»</button>
              </div>
            )}
          </div>
        )
      })()}

      {/* Add/Edit Modal */}
      {modal && modal.mode !== 'delete' && (
        <Modal title={modal.mode==='add' ? `إضافة ${addLabel}` : `تعديل — ${modal.item[columns[0].key]||''}`} onClose={closeModal}>
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            {fields.map(f => (
              <div key={f.key}>
                {f.type !== 'checkbox' && <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#2C3E6B',marginBottom:'6px'}}>{f.label} {f.required&&<span style={{color:'red'}}>*</span>}</label>}
                <FormField field={{...f, _formData: modal?.item, _onSetMain: url=>setForm(p=>({...p,_mainImage:url})), _onDeleteImg: url=>setForm(p=>({...p,_deleteImages:[...(p._deleteImages||[]),url]}))}} value={form[f.key]} onChange={v=>{setForm(p=>({...p,[f.key]:v})); if(f.verifyOtp) setVerifiedFields(p=>({...p,[f.key]:false}))}} onVerified={(k,v)=>setVerifiedFields(p=>({...p,[k]:v}))} />
              </div>
            ))}
            <div style={{display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'8px'}}>
              <button onClick={closeModal} style={{padding:'10px 24px',borderRadius:'10px',border:'1.5px solid #dde3ed',background:'#fff',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'14px'}}>إلغاء</button>
              {(() => {
                // Check if any verifyOtp field has value but not verified
                const unverified = fields.filter(f => f.verifyOtp && form[f.key] && !verifiedFields[f.key])
                const canSave = unverified.length === 0
                return (
                  <button onClick={canSave ? handleSave : ()=>setMsg('⚠️ يرجى التحقق من: ' + unverified.map(f=>f.label).join('، '))}
                    disabled={saving}
                    title={!canSave ? 'يجب التحقق من البيانات أولاً' : ''}
                    style={{padding:'10px 28px',borderRadius:'10px',background:canSave?'linear-gradient(135deg,#2C3E6B,#4A6FA5)':'#9ca3af',color:'#fff',border:'none',cursor:saving?'not-allowed':canSave?'pointer':'not-allowed',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px',opacity:saving?0.7:1,transition:'background 0.2s'}}>
                    {saving ? '⏳ جاري الحفظ...' : canSave ? '💾 حفظ' : '🔒 يجب التحقق أولاً'}
                  </button>
                )
              })()}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {modal && modal.mode === 'delete' && (
        <Modal title="تأكيد الحذف" onClose={closeModal}>
          <div style={{textAlign:'center',padding:'8px 0'}}>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>⚠️</div>
            <p style={{color:'#444',fontSize:'15px',marginBottom:'24px'}}>هل تريد حذف <strong>{modal.item[columns[0].key]}</strong>؟<br/><span style={{color:'#dc2626',fontSize:'13px'}}>لا يمكن التراجع عن هذا الإجراء</span></p>
            <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
              <button onClick={closeModal} style={{padding:'10px 28px',borderRadius:'10px',border:'1.5px solid #dde3ed',background:'#fff',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'14px'}}>إلغاء</button>
              <button onClick={handleDelete} disabled={saving} style={{padding:'10px 28px',borderRadius:'10px',background:'#dc2626',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px'}}>
                {saving?'⏳ جاري الحذف...':'🗑️ حذف'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

const th = { padding:'12px 16px', color:'rgba(255,255,255,0.9)', fontFamily:'Cairo,sans-serif', fontSize:'13px', textAlign:'right', fontWeight:'600' }
const td = { padding:'12px 16px', fontSize:'13px', color:'#333', fontFamily:'Cairo,sans-serif' }

/* ─── Sidebar ─── */
function Sidebar({ collapsed, setCollapsed, onLogout }) {
  const loc = useLocation(); const user = getUser()
  const isSuperAdminSidebar = user?.role === 'SuperAdmin'
  return (
    <aside style={{width:collapsed?'64px':'240px',minHeight:'100vh',background:'linear-gradient(180deg,#1a1a2e 0%,#2C3E6B 100%)',display:'flex',flexDirection:'column',transition:'width 0.25s',flexShrink:0,position:'sticky',top:0}}>
      <div style={{padding:'20px 16px',borderBottom:'1px solid rgba(255,255,255,0.1)',display:'flex',alignItems:'center',gap:'10px'}}>
        <span style={{fontSize:'24px',flexShrink:0}}>🏛️</span>
        {!collapsed && <span style={{color:'#FFC72C',fontWeight:'800',fontSize:'14px',whiteSpace:'nowrap'}}>لوحة الإدارة</span>}
        <button onClick={()=>setCollapsed(!collapsed)} style={{marginRight:'auto',background:'none',border:'none',color:'rgba(255,255,255,0.5)',cursor:'pointer',fontSize:'16px'}}>☰</button>
      </div>
      <nav style={{flex:1,padding:'12px 8px',overflowY:'auto'}}>
        {NAV.filter(n => {
          // إدارة الأمان — SuperAdmin فقط
          if (n.to === '/admin/security' && !isSuperAdminSidebar) return false
          return true
        }).map(n => {
          const active = n.exact ? loc.pathname===n.to : loc.pathname.startsWith(n.to)
          return n.external ? (
              <a key={n.to} href={n.to} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',marginBottom:'4px',background:'transparent',borderRight:'3px solid transparent',color:'rgba(255,255,255,0.7)',textDecoration:'none',fontSize:'13px',fontWeight:'500',whiteSpace:'nowrap',overflow:'hidden'}}>
                <span style={{fontSize:'18px',flexShrink:0}}>{n.icon}</span>
                {!collapsed && n.label}
              </a>
            ) : (
              <Link key={n.to} to={n.to} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',marginBottom:'4px',background:active?'rgba(255,199,44,0.15)':'transparent',borderRight:active?'3px solid #FFC72C':'3px solid transparent',color:active?'#FFC72C':'rgba(255,255,255,0.7)',textDecoration:'none',fontSize:'13px',fontWeight:active?'700':'500',whiteSpace:'nowrap',overflow:'hidden'}}>
                <span style={{fontSize:'18px',flexShrink:0}}>{n.icon}</span>
                {!collapsed && n.label}
              </Link>
            )
        })}
      </nav>
      <div style={{padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,0.1)'}}>
        {!collapsed && <p style={{color:'rgba(255,255,255,0.6)',fontSize:'12px',margin:'0 0 8px'}}>👤 {user.fullName||user.username}</p>}
        <button onClick={onLogout} style={{width:'100%',padding:'8px',borderRadius:'8px',background:'rgba(255,0,0,0.15)',border:'1px solid rgba(255,0,0,0.3)',color:'#ff8080',cursor:'pointer',fontSize:'12px',fontFamily:'Cairo,sans-serif'}}>
          {collapsed?'🚪':'🚪 خروج'}
        </button>
      </div>
    </aside>
  )
}

/* ─── Stats ─── */
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{background:'#fff',borderRadius:'16px',padding:'24px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)',display:'flex',alignItems:'center',gap:'16px',borderRight:`4px solid ${color}`}}>
      <div style={{width:'56px',height:'56px',borderRadius:'14px',background:color+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',flexShrink:0}}>{icon}</div>
      <div>
        <p style={{color:'#888',fontSize:'13px',margin:'0 0 4px'}}>{label}</p>
        <p style={{color:'#1a1a2e',fontSize:'28px',fontWeight:'800',margin:0}}>{value}</p>
      </div>
    </div>
  )
}

/* ─── Overview ─── */
function Overview() {
  const [stats,setStats]=useState({})
  useEffect(()=>{
    Promise.all([
      api.get(`${API}/chambers`),
      api.get(`${API}/members`),
      api.get(`${API}/traderdirectory`),
      api.get(`${API}/news`),
    ]).then(([ch,mb,tr,nw])=>setStats({
      chambers:ch.data?.length??0,
      members:mb.data?.length??0,
      traders:Array.isArray(tr.data)?tr.data.length:(tr.data?.items?.length??0),
      news:nw.data?.length??0,
    })).catch(()=>{})
  },[])
  return (
    <div>
      <h2 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'22px',margin:'0 0 24px'}}>📊 نظرة عامة</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'20px',marginBottom:'32px'}}>
        <StatCard icon="🏛️" label="الغرف التجارية" value={stats.chambers??'…'} color="#2C3E6B" />
        <StatCard icon="👥" label="الأعضاء"         value={stats.members??'…'}  color="#4A6FA5" />
        <StatCard icon="🏢" label="دليل التجار"     value={stats.traders??'…'}  color="#FFC72C" />
        <StatCard icon="📰" label="الأخبار"          value={stats.news??'…'}     color="#10b981" />
      </div>
      <div style={{background:'#fff',borderRadius:'16px',padding:'24px',boxShadow:'0 4px 16px rgba(44,62,107,0.07)'}}>
        <h3 style={{color:'#2C3E6B',fontWeight:'700',margin:'0 0 16px'}}>🔗 روابط سريعة</h3>
        <div style={{display:'flex',flexWrap:'wrap',gap:'12px'}}>
          {NAV.slice(1).map(n=>(
            <Link key={n.to} to={n.to} style={{padding:'10px 20px',borderRadius:'10px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',textDecoration:'none',fontSize:'13px',fontWeight:'600'}}>{n.icon} {n.label}</Link>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Field Definitions ─── */
const govOptions = ['بغداد','البصرة','نينوى','أربيل','النجف','كربلاء','الأنبار','بابل','ذي قار','واسط','ميسان','المثنى','صلاح الدين','كركوك','السليمانية','دهوك','القادسية','ديالى']

const FIELDS = {
  chambers: [
    {key:'name',label:'اسم الغرفة',required:true},
    {key:'governorate',label:'المحافظة',type:'select',options:govOptions},
    {key:'city',label:'اسم المحلة ورقمها',placeholder:'مثال: حي المعرفة 821'},
    {key:'_ziqaq',label:'رقم الزقاق',placeholder:'مثال: 37',type:'addressPart'},
    {key:'_dar',label:'رقم الدار',placeholder:'مثال: 21',type:'addressPart'},
    {key:'phone',label:'الهاتف',type:'tel'},
    {key:'email',label:'البريد الإلكتروني العام',type:'email'},
    {key:'internalEmail',label:'📧 إيميل المخاطبات الداخلية (سري)',type:'email',placeholder:'للمراسلات الرسمية — لا يُنشر للعموم'},
    {key:'website',label:'الموقع الإلكتروني',placeholder:'https://'},
    {key:'poBox',label:'رقم صندوق البريد',placeholder:'مثال: 12345'},
    {key:'description',label:'نبذة عن الغرفة',type:'textarea'},
    {key:'establishedYear',label:'سنة التأسيس',type:'number'},
    {key:'boardMembersCount',label:'عدد أعضاء مجلس الإدارة',type:'number'},
    {key:'generalAssemblyCount',label:'عدد أعضاء الهيئة العامة (= عدد الأعضاء)',type:'number'},
    {key:'_logo',label:'شعار الغرفة (لوغو)',type:'logo'},
    {key:'_social',label:'روابط التواصل الاجتماعي',type:'social'},
  ],
  members: [
    {key:'fullName',label:'الاسم الكامل',required:true},
    {key:'title',label:'اللقب / المنصب'},
    {key:'chamberName',label:'الغرفة التجارية',type:'chamberSelect'},
    {key:'bio',label:'نبذة تعريفية',type:'textarea'},
    {key:'phone',label:'رقم الهاتف'},
    {key:'email',label:'البريد الإلكتروني',type:'email'},
    {key:'facebook',label:'فيسبوك'},
    {key:'twitter',label:'تويتر / X'},
    {key:'sortOrder',label:'ترتيب العرض',type:'number'},
    {key:'_logo',label:'الصورة الشخصية',type:'logo'},
  ],
  traderdirectory: [
    {key:'tradeName',label:'الاسم التجاري',required:true},
    {key:'businessType',label:'نوع النشاط التجاري',type:'searchable-select',options:['تجارة عامة','استيراد وتصدير','تجارة جملة','تجارة مفرد','مقاولات وإنشاءات','صناعة وتصنيع','خدمات مهنية','تكنولوجيا ومعلوماتية','نقل ولوجستيات','زراعة وأغذية','صحة وصيدلة','تعليم وتدريب','سياحة وفنادق','عقارات','مالية وتأمين','أخرى']},
    {key:'tradeCategory',label:'التصنيف التجاري',type:'searchable-select',constantsKey:'trader_classification',options:['شركة ذات مسؤولية محدودة','شركة مساهمة','مؤسسة فردية','شركة تضامن','وكالة تجارية','فرع شركة أجنبية','تعاونية','أخرى']},
    {key:'chamberName',label:'الغرفة التجارية',type:'chamberSelect'},
    {key:'ownerName',label:'صاحب العمل'},
    {key:'governorate',label:'المحافظة',type:'select',options:govOptions},
    {key:'area',label:'المنطقة / الحي'},
    {key:'address',label:'العنوان التفصيلي',type:'textarea'},
    {key:'website',label:'الموقع الإلكتروني',placeholder:'https://'},
    {key:'description',label:'الوصف / الوظيفة التجارية',type:'textarea'},
    {key:'phone',label:'رقم الهاتف',type:'tel'},
    {key:'mobile',label:'رقم الموبايل',type:'tel'},
    {key:'email',label:'البريد الإلكتروني',type:'email'},
    {key:'notes',label:'ملاحظات',type:'textarea'},
    {key:'_logo',label:'🏢 شعار الشركة / المنشأة',type:'logo'},
    {key:'_photo',label:'📷 صورة شخصية للمدير / صاحب العمل',type:'logo'},
    {key:'_social',label:'روابط التواصل الاجتماعي',type:'social'},
    {key:'isVerified',label:'موثّق',type:'checkbox',checkLabel:'هذا التاجر موثّق'},
  ],
  news: [
    {key:'title',label:'العنوان',required:true},
    {key:'body',label:'المحتوى',type:'textarea',required:true},
    {key:'category',label:'التصنيف',type:'select',constantsKey:'news_category',options:['أخبار الاتحاد','تقنية','شراكات','تدريب','اقتصاد','قانون','متنوع']},
    {key:'newsType',label:'نوع الخبر',type:'select',constantsKey:'news_type',options:['خبر','إعلان','تقرير','بيان رسمي','مقابلة']},
    {key:'author',label:'الكاتب'},
    {key:'isFeatured',label:'مميز',type:'checkbox',checkLabel:'تمييز هذا الخبر'},
    {key:'videoUrl',label:'🎬 رابط فيديو يوتيوب (اختياري)',placeholder:'https://www.youtube.com/watch?v=... أو https://youtu.be/...'},
    {key:'_images',label:'صور الخبر (1-5 صور)',type:'images'},
  ],
  exhibitions: [
    {key:'name',label:'اسم المعرض',required:true},
    {key:'description',label:'الوصف',type:'textarea'},
    {key:'location',label:'الموقع'},
    {key:'startDate',label:'تاريخ البدء',type:'date'},
    {key:'endDate',label:'تاريخ الانتهاء',type:'date'},
    {key:'maxParticipants',label:'أقصى عدد مشاركين',type:'number'},
    {key:'status',label:'الحالة',type:'select',options:[{v:'Upcoming',l:'قادم'},{v:'Active',l:'جارٍ'},{v:'Completed',l:'منتهي'},{v:'Cancelled',l:'ملغي'}]},
  ],
  conferences: [
    {key:'title',label:'عنوان المؤتمر',required:true},
    {key:'description',label:'الوصف',type:'textarea'},
    {key:'location',label:'الموقع'},
    {key:'startDate',label:'تاريخ البدء',type:'date'},
    {key:'endDate',label:'تاريخ الانتهاء',type:'date'},
    {key:'status',label:'الحالة',type:'select',options:[{v:'Upcoming',l:'قادم'},{v:'Active',l:'جارٍ'},{v:'Completed',l:'منتهي'}]},
  ],
  lawyers: [
    {key:'fullName',label:'الاسم الكامل',required:true},
    {key:'specialization',label:'التخصص'},
    {key:'governorate',label:'المحافظة',type:'select',options:govOptions},
    {key:'city',label:'المدينة'},
    {key:'phone',label:'الهاتف',type:'tel'},
    {key:'email',label:'البريد',type:'email'},
    {key:'experienceYears',label:'سنوات الخبرة',type:'number'},
    {key:'barAssociation',label:'نقابة المحامين'},
    {key:'isVerified',label:'موثّق',type:'checkbox',checkLabel:'محامٍ موثّق'},
    {key:'onlineConsultation',label:'إلكتروني',type:'checkbox',checkLabel:'يقدم استشارة إلكترونية'},
  ],
  users: [
    {key:'username',label:'اسم المستخدم',required:true},
    {key:'fullName',label:'الاسم الكامل'},
    {key:'email',label:'البريد الإلكتروني',type:'email',verifyOtp:true},
    {key:'phone',label:'رقم الهاتف',placeholder:'07xxxxxxxxx',verifyOtp:true},
    {key:'role',label:'الصلاحية',type:'select',options:[{v:'SuperAdmin',l:'⭐ سوبر مدير'},{v:'Admin',l:'مدير'},{v:'Editor',l:'محرر'},{v:'Member',l:'عضو'},{v:'Viewer',l:'مشاهد'}]},
    {key:'isActive',label:'نشط',type:'checkbox',checkLabel:'المستخدم نشط'},
  ],
  customsagents: [
    {key:'fullName',label:'الاسم الكامل',required:true},
    {key:'companyName',label:'اسم الشركة'},
    {key:'licenseNo',label:'رقم الترخيص'},
    {key:'governorate',label:'المحافظة',type:'select',options:govOptions},
    {key:'phone',label:'الهاتف',type:'tel'},
    {key:'email',label:'البريد',type:'email'},
    {key:'experienceYears',label:'سنوات الخبرة',type:'number'},
    {key:'ports',label:'المنافذ الجمركية'},
    {key:'specializations',label:'التخصصات'},
    {key:'isActive',label:'نشط',type:'checkbox',checkLabel:'وكيل نشط'},
  ],
  shipping: [
    {key:'companyName',label:'اسم الشركة',required:true},
    {key:'shippingType',label:'طرق الشحن',type:'multicheck',options:['شحن بري','شحن بحري','شحن جوي','شحن دولي','توصيل محلي','خدمات لوجستية','تخليص جمركي','تخزين ومستودعات']},
    {key:'country',label:'الدولة / دول العمل'},
    {key:'governorate',label:'المحافظة',type:'select',options:govOptions},
    {key:'address',label:'العنوان التفصيلي'},
    {key:'phone',label:'الهاتف',type:'tel'},
    {key:'mobile',label:'الموبايل',type:'tel'},
    {key:'email',label:'البريد الإلكتروني',type:'email'},
    {key:'website',label:'الموقع الإلكتروني',placeholder:'https://'},
    {key:'description',label:'نبذة عن الشركة',type:'textarea'},
    {key:'facebook',label:'فيسبوك'},
    {key:'instagram',label:'انستغرام'},
    {key:'whatsApp',label:'واتساب'},
    {key:'telegram',label:'تيليغرام'},
    {key:'isVerified',label:'موثّق',type:'checkbox',checkLabel:'شركة موثّقة'},
    {key:'_logo',label:'شعار الشركة',type:'logo'},
  ],
}

/* ─── Main Layout ─── */
export default function AdminDashboard() {
  const [collapsed, setCollapsed] = useState(false)
  const [constants, setConstants] = useState({})
  const navigate = useNavigate()
  const logout = () => { localStorage.removeItem('ficc_token'); localStorage.removeItem('ficc_user'); navigate('/login') }

  useEffect(() => {
    // جيب الثوابت لكل تصنيف منفصلاً (بدون pagination)
    const cats = ['trader_business_type','trader_classification','news_category','news_type','trader_sector']
    Promise.all(cats.map(cat =>
      api.get(`${API}/constants/${cat}`).then(r => ({ cat, items: r.data || [] })).catch(() => ({ cat, items: [] }))
    )).then(results => {
      const grouped = {}
      results.forEach(({ cat, items }) => {
        grouped[cat] = items.map(i => i.label || i.value)
      })
      _sysConstants = grouped
      setConstants(grouped)
    })
  }, [])

  // ── Auth Guard ──
  const token = getToken()
  const currentUser = getUser()
  const isSuperAdmin = currentUser?.role === 'SuperAdmin'

  useEffect(() => {
    if (!token) { navigate('/login', { replace: true }); return }
    // Verify token still valid
    api.get(`${API}/auth/me`, { headers: authHdrs() }).catch(() => {
      localStorage.removeItem('ficc_token')
      localStorage.removeItem('ficc_user')
      navigate('/login', { replace: true })
    })
  }, [])
  if (!token) return null

  const loc = useLocation()
  // حقن constants في الـ fields
  const resolvedFields = (ep) => (FIELDS[ep]||[]).map(f => {
    if (f.constantsKey && constants[f.constantsKey]?.length) {
      return { ...f, options: constants[f.constantsKey] }
    }
    return f
  })

  const T = (ep, title, icon, addLabel, cols) => (
    <CrudTable title={title} icon={icon} endpoint={ep} addLabel={addLabel}
      columns={cols} fields={FIELDS[ep]||[]} constants={constants} />
  )

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#F0F2F8',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} onLogout={logout} />
      <main style={{flex:1,padding:'28px',overflowY:'auto',minWidth:0}}>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="chambers" element={T('chambers','الغرف التجارية','🏛️','غرفة',[
            {key:'name',label:'الاسم'},
            {key:'governorate',label:'المحافظة'},
            {key:'phone',label:'الهاتف'},
            {key:'memberCount',label:'الأعضاء'},
          ])} />
          <Route path="members" element={T('members','أعضاء مجلس الاتحاد','👥','عضو مجلس',[
            {key:'fullName',label:'الاسم الكامل'},
            {key:'title',label:'المنصب'},
            {key:'chamberName',label:'الغرفة'},
            {key:'phone',label:'الهاتف'},
            {key:'status',label:'الحالة',render:v=>v==='Active'?'✅ نشط':'⏸️ غير نشط'},
          ])} />
          <Route path="shipping" element={T('shipping','شركات الشحن','🚢','شركة شحن',[
            {key:'companyName',label:'اسم الشركة'},
            {key:'shippingType',label:'نوع الشحن'},
            {key:'governorate',label:'المحافظة'},
            {key:'phone',label:'الهاتف'},
            {key:'isVerified',label:'الحالة',render:v=>v?'✅ موثّق':'⏳ بانتظار'},
          ])} />
          <Route path="traders" element={T('traderdirectory','دليل التجار','🏢','تاجر',[
            {key:'tradeName',label:'الاسم التجاري'},
            {key:'businessType',label:'نوع النشاط'},
            {key:'tradeCategory',label:'التصنيف'},
            {key:'chamberName',label:'الغرفة التجارية'},
            {key:'ownerName',label:'صاحب العمل'},
            {key:'isVerified',label:'الحالة',render:v=>v?'✅ موثّق':'⏳ بانتظار'},
          ])} />
          <Route path="news" element={T('news','الأخبار','📰','خبر',[
            {key:'title',label:'العنوان'},
            {key:'category',label:'التصنيف'},
            {key:'author',label:'الكاتب'},
            {key:'publishedAt',label:'التاريخ',render:v=>v?new Date(v).toLocaleDateString('ar-IQ'):'—'},
            {key:'isFeatured',label:'مميز',render:v=>v?'⭐ مميز':'📝 مسودة'},
          ])} />
          <Route path="exhibitions" element={T('exhibitions','المعارض','🎪','معرض',[
            {key:'name',label:'المعرض'},
            {key:'location',label:'الموقع'},
            {key:'startDate',label:'البدء',render:v=>v?new Date(v).toLocaleDateString('ar-IQ'):'—'},
            {key:'status',label:'الحالة'},
          ])} />
          <Route path="conferences" element={T('conferences','المؤتمرات','🎤','مؤتمر',[
            {key:'title',label:'المؤتمر'},
            {key:'location',label:'الموقع'},
            {key:'startDate',label:'التاريخ',render:v=>v?new Date(v).toLocaleDateString('ar-IQ'):'—'},
            {key:'status',label:'الحالة'},
          ])} />
          <Route path="lawyers" element={T('lawyers','المحامون','⚖️','محامٍ',[
            {key:'fullName',label:'الاسم'},
            {key:'specialization',label:'التخصص'},
            {key:'governorate',label:'المحافظة'},
            {key:'phone',label:'الهاتف'},
            {key:'isVerified',label:'الحالة',render:v=>v?'✅ موثّق':'⏳'},
          ])} />
          <Route path="agents" element={T('customsagents','وكلاء الإخراج','🏭','وكيل',[
            {key:'fullName',label:'الاسم'},
            {key:'companyName',label:'الشركة'},
            {key:'licenseNo',label:'الترخيص'},
            {key:'governorate',label:'المحافظة'},
            {key:'isActive',label:'الحالة',render:v=>v?'✅ نشط':'⏸️'},
          ])} />
          <Route path="users" element={T('users','المستخدمين','🔑','مستخدم',[
            {key:'username',label:'اسم المستخدم'},
            {key:'fullName',label:'الاسم الكامل'},
            {key:'email',label:'البريد'},
            {key:'role',label:'الصلاحية',render:v=>v==='SuperAdmin'?'⭐ سوبر مدير':v==='Admin'?'🔴 مدير':v==='Editor'?'🟡 محرر':v==='Viewer'?'🔵 مشاهد':'🟢 عضو'},
            {key:'isActive',label:'الحالة',render:v=>v?'✅ نشط':'🚫 موقوف'},
          ])} />
          <Route path="forms" element={T('forms','الاستمارات','📝','استمارة',[
            {key:'title',label:'العنوان'},
            {key:'category',label:'التصنيف'},
          ])} />
          <Route path="submissions" element={<SubmissionsPanel />} />
          <Route path="contacts" element={<ContactsPanel />} />
          <Route path="subscribers" element={<SubscribersPanel />} />
          <Route path="knowledge" element={<KnowledgePanel />} />
          <Route path="chats" element={<AdminChatsPanel />} />
          <Route path="startups" element={<StartupsAdminPanel />} />
          <Route path="constants" element={<SystemConstantsPanel />} />
          <Route path="security" element={isSuperAdmin ? <SecurityPanel /> : <div style={{padding:'40px',textAlign:'center',color:'#dc2626',fontSize:'18px',fontWeight:'700'}}>⛔ غير مصرّح لك بالوصول</div>} />
        </Routes>
      </main>
    </div>
  )
}


/* ─── Submissions Panel ─── */
function SubmissionsPanel() {
  const [items, setItems] = React.useState([])
  const [filter, setFilter] = React.useState('pending')
  const [entityFilter, setEntityFilter] = React.useState('all')
  const [selected, setSelected] = React.useState(null)
  const [note, setNote] = React.useState('')
  const [msg, setMsg] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [chambers, setChambers] = React.useState([])
  const [pageSize, setPageSize] = React.useState(10)
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState('')
  const [lightbox, setLightbox] = React.useState(null)

  React.useEffect(() => {
    api.get(`${API}/chambers`, { headers: authHdrs() }).then(r => setChambers(r.data||[])).catch(()=>{})
  }, [])

  const [counts, setCounts] = React.useState({ pending: 0, approved: 0, rejected: 0 })

  const load = React.useCallback(async (statusFilter = filter, typeFilter = entityFilter) => {
    setLoading(true)
    try {
      const [r, stats] = await Promise.all([
        api.get(`${API}/submissions?status=${statusFilter}&pageSize=50${typeFilter!=='all'?'&entityType='+typeFilter:''}`, { headers: authHdrs() }),
        api.get(`${API}/submissions/stats`, { headers: authHdrs() })
      ])
      setItems(Array.isArray(r.data) ? r.data : (r.data.items || r.data || []))
      setCounts({ pending: stats.data.pending, approved: stats.data.approved, rejected: stats.data.rejected })
    } catch { setItems([]) }
    finally { setLoading(false) }
  }, [])

  React.useEffect(() => {
    load(filter, entityFilter)
  }, [filter, entityFilter])

  const entityLabels = { chamber:'غرفة تجارية', member:'عضو مجلس الاتحاد', trader:'دليل التجار', shipping:'شركة شحن', lawyer:'محامٍ', agent:'وكيل إخراج' }
  const statusColors = { pending:'#F59E0B', approved:'#10b981', rejected:'#ef4444' }
  const statusLabels = { pending:'⏳ بانتظار المراجعة', approved:'✅ تمت الموافقة', rejected:'❌ مرفوض' }

  const handleAction = async (action) => {
    if (!selected) return
    if (action === 'delete') {
      const confirm1 = window.confirm(`⚠️ تحذير!\n\nهل أنت متأكد من حذف طلب "${selected.contactName}" نهائياً؟\nلا يمكن التراجع عن هذا الإجراء.`)
      if (!confirm1) return
      const confirm2 = window.prompt(`للتأكيد، اكتب كلمة "حذف" في الحقل أدناه:`)
      if (confirm2?.trim() !== 'حذف') {
        setMsg('❌ تم إلغاء الحذف — الكلمة غير مطابقة')
        return
      }
      setLoading(true); setMsg('')
      try {
        await api.delete(`${API}/submissions/${selected.id}`, { headers: authHdrs() })
        setMsg('✅ تم حذف الطلب')
        setSelected(null); setNote('')
        setItems(prev => prev.filter(i => i.id !== selected.id))
      } catch(e) { setMsg('❌ ' + (e.response?.data?.message || 'حدث خطأ')) }
      finally { setLoading(false) }
      return
    }
    setLoading(true); setMsg('')
    try {
      await api.post(`${API}/submissions/${selected.id}/${action}`, { note }, { headers: authHdrs() })
      const label = action === 'approve' ? 'الموافقة' : 'الرفض'
      setMsg(`✅ تم ${label} بنجاح`)
      setSelected(null); setNote('')
      setItems(prev => prev.filter(i => i.id !== selected.id))
      setFilter(action === 'approve' ? 'approved' : 'rejected')
    } catch(e) { setMsg('❌ ' + (e.response?.data?.message || 'حدث خطأ')) }
    finally { setLoading(false) }
  }

  const entityIcons = { chamber:'🏛️', member:'👤', trader:'🏢', shipping:'🚢' }

  return (
    <div style={{padding:'24px',fontFamily:'Cairo,sans-serif',direction:'rtl',background:'#F0F4F8',minHeight:'100%'}}>

      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#2C3E6B,#1a2a4a)',borderRadius:'16px',padding:'20px 24px',marginBottom:'20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h2 style={{color:'white',fontWeight:'800',margin:'0 0 4px',fontSize:'20px'}}>📬 طلبات التسجيل</h2>
          <p style={{color:'rgba(255,255,255,0.6)',margin:0,fontSize:'13px'}}>مراجعة وإدارة طلبات الانضمام</p>
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <button onClick={load} style={{padding:'10px 16px',borderRadius:'10px',background:'rgba(255,255,255,0.15)',color:'white',border:'1px solid rgba(255,255,255,0.2)',cursor:'pointer',fontSize:'13px',fontWeight:'700',fontFamily:'Cairo,sans-serif'}}>🔄 تحديث</button>
          <a href="/register" target="_blank" style={{padding:'10px 16px',borderRadius:'10px',background:'#10b981',color:'#fff',textDecoration:'none',fontSize:'13px',fontWeight:'700',fontFamily:'Cairo,sans-serif'}}>🔗 رابط التسجيل</a>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap'}}>
        {[['pending','⏳','قيد المراجعة','#f59e0b'],['approved','✅','موافق عليها','#10b981'],['rejected','❌','مرفوضة','#ef4444']].map(([k,icon,label,color])=>(
          <button key={k} onClick={()=>setFilter(k)}
            style={{padding:'8px 16px',borderRadius:'20px',border:`2px solid ${filter===k?color:'transparent'}`,
              background: filter===k ? `${color}15` : 'white',
              cursor:'pointer',fontFamily:'Cairo,sans-serif',display:'flex',alignItems:'center',gap:'6px',
              boxShadow:'0 2px 6px rgba(0,0,0,0.06)',transition:'all 0.2s',flexShrink:0}}>
            <span style={{fontSize:'14px'}}>{icon}</span>
            <span style={{fontSize:'18px',fontWeight:'800',color: filter===k ? color : '#1e293b'}}>{counts[k]}</span>
            <span style={{fontSize:'12px',fontWeight:'700',color: filter===k ? color : '#64748b'}}>{label}</span>
          </button>
        ))}
      </div>

      {/* فلتر النوع + pageSize */}
      <div style={{display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap',alignItems:'center'}}>
        {[['all','الكل 📋'],['chamber','🏛️ الغرف التجارية'],['member','👤 أعضاء مجلس الاتحاد'],['trader','🏢 دليل التجار'],['shipping','🚢 شركات الشحن'],['lawyer','⚖️ المحامون'],['agent','🏭 وكلاء الإخراج']].map(([k,label])=>(
          <button key={k} onClick={()=>{setEntityFilter(k);setPage(1)}}
            style={{padding:'7px 14px',borderRadius:'20px',border:'none',cursor:'pointer',
              fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:'700',
              background: entityFilter===k ? '#2C3E6B' : '#f0f2f8',
              color: entityFilter===k ? '#fff' : '#555',
              transition:'all 0.15s'}}>
            {label}
          </button>
        ))}
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="🔍 بحث بالاسم أو الهاتف..."
          style={{padding:'7px 14px',borderRadius:'20px',border:'none',fontSize:'12px',fontFamily:'Cairo,sans-serif',background:'#f0f2f8',color:'#333',outline:'none',minWidth:'180px',marginRight:'auto'}} />
        <select value={pageSize} onChange={e=>{setPageSize(+e.target.value);setPage(1)}}
          style={{padding:'7px 12px',borderRadius:'20px',border:'none',fontSize:'12px',fontFamily:'Cairo,sans-serif',background:'#f0f2f8',color:'#555',fontWeight:'700',cursor:'pointer'}}>
          {[10,50,100,1000].map(n=><option key={n} value={n}>{n} طلب</option>)}
        </select>
      </div>

      {msg && (
        <div style={{background:msg.startsWith('✅')?'#F0FDF4':'#FEF2F2',color:msg.startsWith('✅')?'#16a34a':'#dc2626',padding:'14px 16px',borderRadius:'12px',marginBottom:'16px',fontSize:'13px',fontWeight:'600',border:`1px solid ${msg.startsWith('✅')?'#bbf7d0':'#fecaca'}`}}>
          {msg}
        </div>
      )}

      {loading ? (
        <div style={{textAlign:'center',padding:'60px',background:'white',borderRadius:'16px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <div style={{display:'inline-block',width:'40px',height:'40px',border:'4px solid #e2e8f0',borderTopColor:'#2C3E6B',borderRadius:'50%',animation:'spin 0.8s linear infinite',marginBottom:'16px'}}></div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{color:'#94a3b8',fontSize:'14px',fontWeight:'600'}}>جاري التحميل...</p>
        </div>
      ) : items.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px',background:'white',borderRadius:'16px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:'48px',marginBottom:'12px'}}>📭</div>
          <p style={{color:'#94a3b8',fontSize:'15px',fontWeight:'600'}}>لا توجد طلبات في هذا القسم</p>
        </div>
      ) : (() => {
        const filtered = search.trim()
          ? items.filter(i => (i.contactName||'').includes(search) || (i.contactPhone||'').includes(search) || (i.contactEmail||'').toLowerCase().includes(search.toLowerCase()))
          : items
        const totalPages = Math.ceil(filtered.length / pageSize)
        const paged = pageSize >= 1000 ? filtered : filtered.slice((page-1)*pageSize, page*pageSize)
        return (<>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
          <span style={{color:'#888',fontSize:'12px',fontFamily:'Cairo,sans-serif'}}>{filtered.length} طلب{search && ` (نتائج البحث)`}</span>
          {totalPages > 1 && (
            <div style={{display:'flex',gap:5,alignItems:'center'}}>
              <button onClick={()=>setPage(1)} disabled={page===1} style={{padding:'4px 9px',borderRadius:7,border:'1px solid #dde3ed',background:page===1?'#f5f5f5':'#fff',cursor:page===1?'default':'pointer',fontSize:12,fontFamily:'Cairo,sans-serif'}}>««</button>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{padding:'4px 9px',borderRadius:7,border:'1px solid #dde3ed',background:page===1?'#f5f5f5':'#fff',cursor:page===1?'default':'pointer',fontSize:12,fontFamily:'Cairo,sans-serif'}}>← السابق</button>
              <span style={{fontSize:12,color:'#555',fontFamily:'Cairo,sans-serif',padding:'0 6px'}}>{page} / {totalPages}</span>
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{padding:'4px 9px',borderRadius:7,border:'1px solid #dde3ed',background:page===totalPages?'#f5f5f5':'#fff',cursor:page===totalPages?'default':'pointer',fontSize:12,fontFamily:'Cairo,sans-serif'}}>التالي →</button>
              <button onClick={()=>setPage(totalPages)} disabled={page===totalPages} style={{padding:'4px 9px',borderRadius:7,border:'1px solid #dde3ed',background:page===totalPages?'#f5f5f5':'#fff',cursor:page===totalPages?'default':'pointer',fontSize:12,fontFamily:'Cairo,sans-serif'}}>»»</button>
            </div>
          )}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          {paged.map((item, idx) => (
            <div key={item.id}
              style={{background:'white',borderRadius:'14px',padding:'16px 20px',
                boxShadow:'0 2px 8px rgba(0,0,0,0.05)',border:'1px solid #e2e8f0',
                cursor:'pointer',transition:'all 0.2s',display:'flex',alignItems:'center',gap:'14px'}}
              onClick={async ()=>{
                setNote('')
                // جيب التفاصيل الكاملة
                try {
                  const r = await api.get(`${API}/submissions/${item.id}`, { headers: authHdrs() })
                  setSelected({...item, ...r.data, formData: r.data.formData || r.data.FormData || item.formData})
                } catch { setSelected(item) }
              }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(44,62,107,0.12)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'}>

              {/* Seq + Icon */}
              <span style={{color:'#aaa',fontSize:'11px',fontWeight:'400',minWidth:'24px',textAlign:'center'}}>#{(page-1)*pageSize+idx+1}</span>
              <div style={{width:'48px',height:'48px',borderRadius:'12px',background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0}}>
                {entityIcons[item.entityType]||'📋'}
              </div>

              {/* Info */}
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                  <span style={{background:'#EEF2FF',color:'#2C3E6B',padding:'2px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700'}}>
                    {entityLabels[item.entityType]||item.entityType}
                  </span>
                  <span style={{fontSize:'11px',color:'#94a3b8'}}>
                    #{item.id} · {new Date(item.createdAt).toLocaleDateString('ar-IQ')}
                  </span>
                </div>
                <h3 style={{color:'#1e293b',fontWeight:'800',margin:'0 0 2px',fontSize:'15px'}}>{item.contactName}</h3>
                {item.contactPhone && <p style={{color:'#64748b',fontSize:'12px',margin:0}}>📱 {item.contactPhone}</p>}
              </div>

              {/* Status */}
              <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
                <span style={{background:statusColors[item.status]+'20',color:statusColors[item.status],
                  padding:'6px 14px',borderRadius:'20px',fontSize:'12px',fontWeight:'700'}}>
                  {statusLabels[item.status]}
                </span>
                <span style={{color:'#94a3b8',fontSize:'18px'}}>←</span>
              </div>
            </div>
          ))}
        </div>
        </>)
      })()}
      <ImageLightbox src={lightbox} onClose={()=>setLightbox(null)} />
      {selected && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={()=>setSelected(null)}>
          <div style={{background:'#fff',borderRadius:'20px',padding:'32px',width:'100%',maxWidth:'600px',maxHeight:'85vh',overflowY:'auto',direction:'rtl',fontFamily:'Cairo,sans-serif'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h3 style={{color:'#2C3E6B',fontWeight:'800',margin:0}}>تفاصيل الطلب #{selected.id}</h3>
              <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'20px',color:'#888'}}>✕</button>
            </div>
            <div style={{background:'#F5F7FA',borderRadius:'12px',padding:'16px',marginBottom:'16px'}}>
              <p style={{margin:'4px 0',fontSize:'13px'}}><strong>مقدم الطلب:</strong> {selected.contactName}</p>
              {selected.contactPhone && <p style={{margin:'4px 0',fontSize:'13px'}}><strong>الهاتف:</strong> {selected.contactPhone}</p>}
              <p style={{margin:'4px 0',fontSize:'13px'}}><strong>النوع:</strong> {entityLabels[selected.entityType]||selected.entityType}</p>
              <p style={{margin:'4px 0',fontSize:'13px'}}><strong>التاريخ:</strong> {new Date(selected.createdAt).toLocaleString('ar-IQ')}</p>
            </div>
            {/* Show logo if provided */}
            {/* صورة شخصية أو لوغو في الأعلى */}
            {(selected.formData?._photo || selected.logoData || selected.formData?._logo) && (
              <div style={{marginBottom:'16px',textAlign:'center',display:'flex',gap:'24px',justifyContent:'center',alignItems:'flex-end'}}>
                {selected.formData?._photo && (
                  <div style={{textAlign:'center'}}>
                    <img src={selected.formData._photo} alt="صورة شخصية" onClick={()=>setLightbox(selected.formData._photo)} style={{width:'80px',height:'80px',borderRadius:'50%',objectFit:'cover',border:'3px solid #2C3E6B',boxShadow:'0 2px 8px rgba(0,0,0,0.1)',cursor:'zoom-in'}} />
                    <p style={{fontSize:'11px',color:'#888',margin:'4px 0 0',fontWeight:'700'}}>📷 الصورة الشخصية</p>
                  </div>
                )}
                {(selected.logoData || selected.formData?._logo) && selected.formData?._logo !== selected.formData?._photo && (
                  <div style={{textAlign:'center'}}>
                    <img src={selected.logoData || selected.formData._logo} alt="شعار الشركة" onClick={()=>setLightbox(selected.logoData || selected.formData._logo)} style={{width:'80px',height:'80px',objectFit:'contain',borderRadius:'12px',border:'2px solid #059669',background:'#f5f7fa',padding:'4px',cursor:'zoom-in'}} />
                    <p style={{fontSize:'11px',color:'#888',margin:'4px 0 0',fontWeight:'700'}}>🏢 شعار الشركة</p>
                  </div>
                )}
                {(selected.logoData || selected.formData?._logo) && selected.formData?._logo === selected.formData?._photo && !selected.formData?._photo && (
                  <div style={{textAlign:'center'}}>
                    <img src={selected.logoData || selected.formData._logo} alt="شعار الشركة" onClick={()=>setLightbox(selected.logoData || selected.formData._logo)} style={{width:'80px',height:'80px',objectFit:'contain',borderRadius:'12px',border:'2px solid #059669',background:'#f5f7fa',padding:'4px',cursor:'zoom-in'}} />
                    <p style={{fontSize:'11px',color:'#888',margin:'4px 0 0',fontWeight:'700'}}>🏢 شعار الشركة</p>
                  </div>
                )}
              </div>
            )}
            <h4 style={{color:'#2C3E6B',fontWeight:'700',marginBottom:'10px'}}>📋 البيانات المدخلة:</h4>
            <div style={{background:'#F5F7FA',borderRadius:'12px',padding:'16px',marginBottom:'16px'}}>
              {/* الصورة الشخصية دائماً */}
              {(selected.entityType === 'member' || selected.entityType === 'lawyer' || selected.entityType === 'trader') && (
                <div style={{display:'flex',gap:'12px',padding:'12px 0',borderBottom:'1px solid #e5e7eb',alignItems:'center'}}>
                  <span style={{color:'#666',fontSize:'12px',minWidth:'130px',flexShrink:0}}>الصورة الشخصية:</span>
                  {selected.formData?._photo ? (
                    <img src={selected.formData._photo.startsWith('data:') ? selected.formData._photo : `https://ficc.iq${selected.formData._photo}`}
                      alt="صورة" onClick={()=>setLightbox(selected.formData._photo.startsWith('data:') ? selected.formData._photo : `https://ficc.iq${selected.formData._photo}`)} style={{width:'80px',height:'80px',borderRadius:'50%',objectFit:'cover',border:'3px solid #2C3E6B',cursor:'zoom-in'}} />
                  ) : (
                    <span style={{fontSize:'12px',color:'#ccc',background:'#f5f5f5',padding:'8px 16px',borderRadius:'6px'}}>— لم يرفع صورة</span>
                  )}
                </div>
              )}
              {/* منصات التواصل دائماً */}
              {(selected.entityType === 'member' || selected.entityType === 'lawyer') && (
                <div style={{padding:'10px 0',borderBottom:'1px solid #e5e7eb'}}>
                  <span style={{color:'#666',fontSize:'12px',display:'block',marginBottom:'6px',fontWeight:'700'}}>منصات التواصل الاجتماعي:</span>
                  {(() => {
                    const s = selected.formData?._social
                    if (!s) return <span style={{fontSize:'12px',color:'#ccc'}}>— لم يدخل</span>
                    const obj = typeof s === 'string' ? JSON.parse(s) : s
                    const socialLabels = {facebook:'فيسبوك',twitter:'تويتر',instagram:'انستغرام',linkedin:'لينكدإن',youtube:'يوتيوب',whatsapp:'واتساب',telegram:'تيليغرام'}
                    const entries = Object.entries(obj||{}).filter(([,v])=>v)
                    if (!entries.length) return <span style={{fontSize:'12px',color:'#ccc'}}>— لم يدخل</span>
                    return (
                      <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                        {entries.map(([k2,v2])=>(
                          <a key={k2} href={v2} target="_blank" rel="noreferrer"
                            style={{fontSize:'11px',padding:'3px 10px',borderRadius:'20px',background:'#EEF2FF',color:'#2C3E6B',textDecoration:'none',fontWeight:'700'}}>
                            {socialLabels[k2]||k2}
                          </a>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              )}
              {/* الصورة الشخصية — للأنواع الأخرى */}
              {selected.formData?._photo && !['member','lawyer','trader'].includes(selected.entityType) && (
                <div style={{display:'flex',gap:'12px',padding:'12px 0',borderBottom:'1px solid #e5e7eb',alignItems:'center'}}>
                  <span style={{color:'#666',fontSize:'12px',minWidth:'130px',flexShrink:0}}>الصورة الشخصية:</span>
                  <img src={selected.formData._photo.startsWith('data:') ? selected.formData._photo : `https://ficc.iq${selected.formData._photo}`}
                    alt="صورة" onClick={()=>setLightbox(selected.formData._photo.startsWith('data:') ? selected.formData._photo : `https://ficc.iq${selected.formData._photo}`)} style={{width:'80px',height:'80px',borderRadius:'50%',objectFit:'cover',border:'3px solid #2C3E6B',cursor:'zoom-in'}} />
                </div>
              )}
              {/* منصات التواصل */}
              {selected.formData?._social && (() => {
                const s = typeof selected.formData._social === 'string' ? JSON.parse(selected.formData._social) : selected.formData._social
                const socialLabels = {facebook:'فيسبوك',twitter:'تويتر',instagram:'انستغرام',linkedin:'لينكدإن',youtube:'يوتيوب',whatsapp:'واتساب',telegram:'تيليغرام'}
                const entries = Object.entries(s||{}).filter(([,v])=>v)
                if (!entries.length) return null
                return (
                  <div style={{padding:'10px 0',borderBottom:'1px solid #e5e7eb'}}>
                    <span style={{color:'#666',fontSize:'12px',display:'block',marginBottom:'6px'}}>منصات التواصل الاجتماعي:</span>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                      {entries.map(([k2,v2])=>(
                        <a key={k2} href={v2} target="_blank" rel="noreferrer"
                          style={{fontSize:'11px',padding:'3px 10px',borderRadius:'20px',background:'#EEF2FF',color:'#2C3E6B',textDecoration:'none',fontWeight:'700'}}>
                          {socialLabels[k2]||k2}
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })()}
              {/* صور الهوية */}
              {(selected.formData?._idFile || selected.formData?._idFileBack) && (
                <div style={{padding:'10px 0',borderBottom:'1px solid #e5e7eb'}}>
                  <span style={{color:'#666',fontSize:'12px',display:'block',marginBottom:'8px',fontWeight:'700'}}>صور هوية التجارة:</span>
                  <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
                    {selected.formData?._idFile && (
                      <div style={{textAlign:'center'}}>
                        <img src={selected.formData._idFile.startsWith('data:') ? selected.formData._idFile : `https://ficc.iq${selected.formData._idFile}`}
                          alt="وجه الهوية" onClick={()=>setLightbox(selected.formData._idFile.startsWith('data:') ? selected.formData._idFile : `https://ficc.iq${selected.formData._idFile}`)}
                          style={{width:'150px',height:'100px',objectFit:'cover',borderRadius:'8px',border:'2px solid #2C3E6B',cursor:'zoom-in'}} />
                        <p style={{fontSize:'11px',color:'#888',margin:'4px 0 0'}}>الوجه</p>
                      </div>
                    )}
                    {selected.formData?._idFileBack && (
                      <div style={{textAlign:'center'}}>
                        <img src={selected.formData._idFileBack.startsWith('data:') ? selected.formData._idFileBack : `https://ficc.iq${selected.formData._idFileBack}`}
                          alt="خلف الهوية" onClick={()=>setLightbox(selected.formData._idFileBack.startsWith('data:') ? selected.formData._idFileBack : `https://ficc.iq${selected.formData._idFileBack}`)}
                          style={{width:'150px',height:'100px',objectFit:'cover',borderRadius:'8px',border:'2px solid #059669',cursor:'zoom-in'}} />
                        <p style={{fontSize:'11px',color:'#888',margin:'4px 0 0'}}>الخلف</p>
                      </div>
                    )}
                    {/* إذا ملف وليس base64 */}
                    {selected.formData?._idFileName_ && (
                      <div style={{textAlign:'center',padding:'8px',background:'#f5f5f5',borderRadius:'8px',border:'2px solid #ddd'}}>
                        <span style={{fontSize:'28px'}}>🪪</span>
                        <p style={{fontSize:'11px',color:'#444',margin:'4px 0 0'}}>{selected.formData._idFileName_}</p>
                        <p style={{fontSize:'10px',color:'#888'}}>{selected.formData._idFileBackName_ && 'وجه + خلف'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {Object.entries(selected.formData||{}).map(([k,v])=>{
                // Skip internal fields
                if (['_social','_idFile','_idFileBack','_photo','_logo'].includes(k)) return null
                // Skip metadata fields
                if (k.endsWith('Name_') || k.endsWith('Size_') || k.endsWith('FileName_') || k.endsWith('FileSize_')) return null
                if (k.startsWith('_')) return null
                // عرض الصورة الشخصية
                if (k === '_photo' && typeof v === 'string' && v.startsWith('data:image')) return (
                  <div key={k} style={{display:'flex',gap:'8px',padding:'10px 0',borderBottom:'1px solid #e5e7eb',alignItems:'center'}}>
                    <span style={{color:'#888',fontSize:'13px',minWidth:'120px',textAlign:'right',fontWeight:'700'}}>الصورة الشخصية:</span>
                    <img src={v} alt="photo" onClick={()=>setLightbox(v)} style={{width:'80px',height:'80px',borderRadius:'50%',objectFit:'cover',border:'3px solid #2C3E6B',boxShadow:'0 2px 8px rgba(0,0,0,0.1)',cursor:'zoom-in'}} />
                  </div>
                )
                // عرض اللوغو
                if (k === '_logo' && typeof v === 'string' && v.startsWith('data:image')) return (
                  <div key={k} style={{display:'flex',gap:'8px',padding:'10px 0',borderBottom:'1px solid #e5e7eb',alignItems:'center'}}>
                    <span style={{color:'#888',fontSize:'13px',minWidth:'120px',textAlign:'right',fontWeight:'700'}}>شعار الشركة:</span>
                    <img src={v} alt="logo" onClick={()=>setLightbox(v)} style={{width:'80px',height:'80px',borderRadius:'10px',objectFit:'contain',border:'2px solid #2C3E6B',background:'#f5f7fa',padding:'4px',cursor:'zoom-in'}} />
                  </div>
                )
                if (typeof v === 'string' && v.startsWith('data:image')) return (
                  <div key={k} style={{display:'flex',gap:'8px',padding:'10px 0',borderBottom:'1px solid #e5e7eb',alignItems:'center'}}>
                    <span style={{color:'#888',fontSize:'13px',minWidth:'120px',textAlign:'right',fontWeight:'700'}}>صورة:</span>
                    <img src={v} alt={k} onClick={()=>setLightbox(v)} style={{width:'120px',height:'80px',borderRadius:'8px',objectFit:'cover',border:'2px solid #dde3ed',cursor:'zoom-in'}} />
                  </div>
                )
                // Arabic labels
                const labels = {
                  // عضو مجلس الاتحاد
                  fullName:'اسم العضو واللقب', title:'المنصب', chamberId:'رقم الغرفة',
                  chamberName:'اسم الغرفة التجارية', bio:'نبذة شخصية',
                  // تواصل
                  phone:'رقم الهاتف', mobile:'رقم الموبايل', email:'البريد الإلكتروني',
                  facebook:'فيسبوك', twitter:'تويتر / X', instagram:'انستغرام',
                  linkedin:'لينكدإن', youtube:'يوتيوب', whatsApp:'واتساب', telegram:'تيليغرام',
                  // دليل التجار
                  tradeName:'الاسم التجاري', companyName:'اسم الشركة / المنشأة',
                  ownerName:'صاحب العمل', businessType:'نوع النشاط التجاري',
                  tradeCategory:'التصنيف التجاري', chamberName:'رقم العرفة / الغرفة',
                  area:'المنطقة / الحي', logoUrl:'الشعار', notes:'ملاحظات',
                  // عام
                  name:'الاسم', governorate:'المحافظة', city:'المدينة',
                  address:'العنوان التفصيلي', website:'الموقع الإلكتروني',
                  description:'الوصف', poBox:'صندوق البريد',
                  photoUrl:'رابط الصورة', establishedYear:'سنة التأسيس',
                  boardMembersCount:'عدد أعضاء المجلس', generalAssemblyCount:'عدد الهيئة العامة',
                  memberCount:'عدد الأعضاء', licenseNo:'رقم السجل التجاري',
                  registeredYear:'سنة التسجيل', licenseNumber:'رقم الإجازة',
                  specialization:'التخصص', internalEmail:'البريد الداخلي',
                  subCategory:'التصنيف الفرعي',
                }
                const label = labels[k] || k
                // رقم الغرفة → اسمها
                let display = !v ? '—' : (typeof v === 'string' && v.length > 150 ? v.slice(0,150)+'...' : String(v))
                if (k === 'chamberId' && v) {
                  const ch = chambers?.find(c => c.id === parseInt(v))
                  if (ch) display = ch.name
                }
                return (
                  <div key={k} style={{display:'flex',gap:'8px',padding:'7px 0',borderBottom:'1px solid #e5e7eb',alignItems:'flex-start'}}>
                    <span style={{color:'#666',fontSize:'12px',minWidth:'130px',textAlign:'left',flexShrink:0,paddingTop:'2px'}}>{label}:</span>
                    <span style={{color: !v ? '#ccc' : '#333',fontSize:'13px',fontWeight: v ? '600' : '400',wordBreak:'break-word'}}>{display}</span>
                  </div>
                )
              })}
            </div>
            {selected.status === 'pending' && <>
              <div style={{marginBottom:'16px'}}>
                <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#2C3E6B',marginBottom:'6px'}}>ملاحظة (اختياري)</label>
                <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2}
                  style={{width:'100%',padding:'10px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'13px',fontFamily:'Cairo,sans-serif',direction:'rtl',resize:'vertical',boxSizing:'border-box'}} />
              </div>
              <div style={{display:'flex',gap:'10px'}}>
                <button onClick={()=>handleAction('approve')} disabled={loading}
                  style={{flex:1,padding:'12px',borderRadius:'10px',background:'#10b981',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px'}}>✅ موافقة وإنشاء السجل</button>
                <button onClick={()=>handleAction('reject')} disabled={loading}
                  style={{flex:1,padding:'12px',borderRadius:'10px',background:'#ef4444',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px'}}>❌ رفض</button>
              </div>
            </>}
            {selected.status !== 'pending' && (
              <div style={{background:selected.status==='approved'?'#F0FDF4':'#FEF2F2',padding:'12px',borderRadius:'10px',fontSize:'13px',color:selected.status==='approved'?'#16a34a':'#dc2626'}}>
                {statusLabels[selected.status]} {selected.reviewNote && `— ${selected.reviewNote}`}
              </div>
            )}
            {/* زر حذف دائماً */}
            <div style={{marginTop:'12px',borderTop:'1px solid #f0f0f0',paddingTop:'12px'}}>
              <button onClick={()=>handleAction('delete')} disabled={loading}
                style={{width:'100%',padding:'10px',borderRadius:'10px',background:'#fff',color:'#dc2626',border:'1.5px solid #fecaca',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'13px'}}>
                🗑️ حذف الطلب نهائياً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Settings Panel ─── */
function SettingsPanel() {
  const [s, setS] = useState({})
  const [msg, setMsg] = useState('')
  const base = {width:'100%',padding:'10px 14px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',direction:'rtl',outline:'none',background:'#FAFBFF',boxSizing:'border-box'}
  const ta = {...base,resize:'vertical'}

  useEffect(() => {
    api.get(`${API}/settings`,{headers:authHdrs()}).then(r=>setS(r.data||{})).catch(()=>{})
  },[])

  const g = k => s[k]||''
  const u = (k,v) => setS(p=>({...p,[k]:v}))

  const save = async () => {
    try {
      await api.put(`${API}/settings`, s, {headers:{...authHdrs(),'Content-Type':'application/json'}})
      setMsg('✅ تم الحفظ')
      setTimeout(()=>setMsg(''),3000)
    } catch { setMsg('❌ خطأ في الحفظ') }
  }

  const fields = [
    {section:'نبذة عن الاتحاد', items:[
      {k:'about_title',label:'العنوان',type:'text'},
      {k:'about_text1',label:'الفقرة الأولى',type:'textarea'},
      {k:'about_text2',label:'الفقرة الثانية',type:'textarea'},
      {k:'about_badge1',label:'الشارة 1',type:'text'},
      {k:'about_badge2',label:'الشارة 2',type:'text'},
      {k:'about_badge3',label:'الشارة 3',type:'text'},
      {k:'about_badge4',label:'الشارة 4',type:'text'},
    ]},
    {section:'منصات التواصل الاجتماعي', items:[
      {k:'facebook_url',   label:'🔵 فيسبوك (رابط الصفحة)', type:'text'},
      {k:'instagram_url',  label:'📸 انستغرام (رابط الحساب)', type:'text'},
      {k:'twitter_url',    label:'🐦 تويتر / X (رابط الحساب)', type:'text'},
      {k:'tiktok_url',     label:'🎵 تيكتوك (رابط الحساب)', type:'text'},
      {k:'whatsapp_url',   label:'💬 واتساب (رابط الكروب)', type:'text'},
      {k:'youtube_channel_id', label:'▶️ يوتيوب (Channel ID فقط)', placeholder:'مثال: UC9CtGm0zD50U7J4PJPOvMog', type:'text'},
    ]},
    {section:'الرؤية والرسالة', items:[
      {k:'vision_title',label:'عنوان الرؤية',type:'text'},
      {k:'vision_text',label:'نص الرؤية',type:'textarea'},
      {k:'mission_title',label:'عنوان الرسالة',type:'text'},
      {k:'mission_text',label:'نص الرسالة',type:'textarea'},
      {k:'independence_title',label:'عنوان الاستقلالية',type:'text'},
      {k:'independence_text',label:'نص الاستقلالية',type:'textarea'},
      {k:'partnership_title',label:'عنوان الشراكة',type:'text'},
      {k:'partnership_text',label:'نص الشراكة',type:'textarea'},
    ]},
  ]

  return (
    <div style={{maxWidth:'800px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
        <h2 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'20px',margin:0}}>⚙️ إعدادات الموقع</h2>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          {msg && <span style={{color:msg.includes('✅')?'#16a34a':'#dc2626',fontWeight:'700',fontSize:'14px'}}>{msg}</span>}
          <button onClick={save} style={{padding:'10px 24px',borderRadius:'10px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px',border:'none',cursor:'pointer'}}>💾 حفظ التغييرات</button>
        </div>
      </div>
      {fields.map(sec => (
        <div key={sec.section} style={{background:'#fff',borderRadius:'16px',padding:'24px',marginBottom:'20px',boxShadow:'0 4px 16px rgba(44,62,107,0.08)',border:'1px solid #eef0f5'}}>
          <h3 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'16px',margin:'0 0 18px',paddingBottom:'10px',borderBottom:'2px solid #FFC72C'}}>{sec.section}</h3>
          <div style={{display:'grid',gap:'14px'}}>
            {sec.items.map(f => (
              <div key={f.k}>
                <label style={{display:'block',color:'#555',fontSize:'13px',fontWeight:'600',marginBottom:'6px'}}>{f.label}</label>
                {f.type==='textarea'
                  ? <textarea value={g(f.k)} onChange={e=>u(f.k,e.target.value)} rows={3} style={ta}/>
                  : <input type="text" value={g(f.k)} onChange={e=>u(f.k,e.target.value)} style={base}/>
                }
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Contacts Panel ─── */
function ConfirmDialog({ msg, onConfirm, onCancel }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{background:'#fff',borderRadius:'16px',padding:'28px',maxWidth:'360px',width:'100%',textAlign:'center',fontFamily:'Cairo,sans-serif',direction:'rtl',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{fontSize:'48px',marginBottom:'12px'}}>⚠️</div>
        <p style={{color:'#333',fontSize:'15px',fontWeight:'700',marginBottom:'8px'}}>{msg}</p>
        <p style={{color:'#dc2626',fontSize:'13px',marginBottom:'24px'}}>لا يمكن التراجع عن هذا الإجراء</p>
        <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
          <button onClick={onCancel} style={{padding:'10px 24px',borderRadius:'10px',border:'1.5px solid #dde3ed',background:'#fff',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'14px',fontWeight:'700'}}>إلغاء</button>
          <button onClick={onConfirm} style={{padding:'10px 24px',borderRadius:'10px',background:'#dc2626',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'14px',fontWeight:'700'}}>تأكيد الحذف</button>
        </div>
      </div>
    </div>
  )
}

function ContactsPanel() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [source, setSource] = useState('all')
  const [showDupes, setShowDupes] = useState(false)
  const [msg, setMsg] = useState('')
  const [confirmDlg, setConfirmDlg] = useState(null) // {msg, onConfirm}
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const sources = [
    { key: 'all', label: 'الكل' },
    { key: 'members',     label: 'أعضاء المجلس',     api: '/members',         phone: 'phone',  email: 'email', name: 'fullName' },
    { key: 'chambers',    label: 'الغرف التجارية',   api: '/chambers',        phone: 'phone',  email: 'email', name: 'name' },
    { key: 'traders',     label: 'دليل التجار',      api: '/traderdirectory', phone: 'phone',  email: 'email', name: 'tradeName' },
    { key: 'shipping',    label: 'شركات الشحن',      api: '/shipping',        phone: 'phone',  email: 'email', name: 'companyName' },
    { key: 'users',       label: 'المستخدمين',        api: '/users',           phone: 'phone',  email: 'email', name: 'username' },
    { key: 'submissions', label: 'طلبات الانتظار',   api: '/submissions?status=pending&pageSize=50', phone: 'contactPhone', email: 'contactEmail', name: 'contactName', isPending: true },
  ]

  const normalize = p => {
    if (!p) return ''
    p = p.replace(/\s+/g,'').replace(/^00964/,'+964').replace(/^\+964/,'0964').replace(/^0964/,'07')
    return p.startsWith('07') ? p : p
  }

  const fetchAll = async () => {
    setLoading(true)
    const all = []
    const toFetch = source === 'all' ? sources.slice(1) : sources.filter(s => s.key === source)
    for (const s of toFetch) {
      try {
        const sep = s.api.includes('?') ? '&' : '?'
        const r = await api.get(`${s.api}${sep}_t=${Date.now()}`, { headers: authHdrs() })
        const items = Array.isArray(r.data) ? r.data : (r.data.items || r.data.submissions || r.data || [])
        items.forEach(item => {
          // For pending submissions, extract phone/email from formData
          let phone = item[s.phone] || ''
          let email = item[s.email] || ''
          if (s.isPending && item.formData) {
            const fd = typeof item.formData === 'string' ? JSON.parse(item.formData) : item.formData
            phone = phone || fd.phone || fd.mobile || ''
            email = email || fd.email || ''
          }
          if (phone || email) {
            all.push({
              id: item.id, source: s.key, sourceLabel: s.label,
              name: item[s.name] || (s.isPending ? `طلب #${item.id}` : '—'),
              phone, email,
              raw: item,
              isPending: !!s.isPending
            })
          }
        })
      } catch {}
    }
    setContacts(all)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [source])

  // Detect duplicates
  const phoneCounts = {}
  const emailCounts = {}
  contacts.forEach(c => {
    const p = normalize(c.phone)
    if (p) phoneCounts[p] = (phoneCounts[p]||0) + 1
    const e = (c.email||'').toLowerCase().trim()
    if (e) emailCounts[e] = (emailCounts[e]||0) + 1
  })

  let filtered = contacts.filter(c =>
    !search || c.name.includes(search) || (c.phone||'').includes(search) || (c.email||'').toLowerCase().includes(search.toLowerCase())
  )
  if (showDupes) {
    filtered = filtered.filter(c =>
      (c.phone && phoneCounts[normalize(c.phone)] > 1) ||
      (c.email && emailCounts[(c.email||'').toLowerCase().trim()] > 1)
    )
  }

  const dupeCount = contacts.filter(c =>
    (c.phone && phoneCounts[normalize(c.phone)] > 1) ||
    (c.email && emailCounts[(c.email||'').toLowerCase().trim()] > 1)
  ).length

  const handleClear = (c, field) => {
    setConfirmDlg({
      msg: `حذف ${field==='phone'?'الهاتف':'الإيميل'} من "${c.name}"؟`,
      onConfirm: async () => {
        setConfirmDlg(null)
        try {
          const apiMap = { members:'/members', chambers:'/chambers', traders:'/traderdirectory', shipping:'/shipping', users:'/users' }
          await api.patch(`${apiMap[c.source]}/${c.id}/clear-contact`, { field }, { headers: authHdrs() })
          setMsg('✅ تم المسح')
          setContacts(prev => prev.map(x => x.source===c.source && x.id===c.id ? {...x, [field]:''} : x))
        } catch { setMsg('❌ فشل') }
      }
    })
  }

  const srcColor = { members:'#4A6FA5', chambers:'#2C3E6B', traders:'#059669', shipping:'#7c3aed', users:'#dc2626', submissions:'#d97706' }

  const handleRejectSubmission = (c) => {
    setConfirmDlg({
      msg: `رفض طلب "${c.name}"؟`,
      onConfirm: async () => {
        setConfirmDlg(null)
        try {
          await api.post(`/api/submissions/${c.id}/reject`, { note: 'تكرار جهة اتصال' }, { headers: authHdrs() })
          setMsg('✅ تم رفض الطلب')
          setContacts(prev => prev.filter(x => !(x.source==='submissions' && x.id===c.id)))
        } catch { setMsg('❌ فشل') }
      }
    })
  }

  return (
    <div style={{padding:'16px',maxWidth:'1100px',margin:'0 auto'}}>
      {confirmDlg && <ConfirmDialog msg={confirmDlg.msg} onConfirm={confirmDlg.onConfirm} onCancel={()=>setConfirmDlg(null)} />}
      <h2 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'20px',margin:'0 0 16px'}}>📋 إدارة جهات الاتصال</h2>

      {/* Filters */}
      <div style={{background:'#fff',borderRadius:'14px',padding:'12px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px',display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="🔍 بحث..."
          style={{flex:1,minWidth:'140px',padding:'9px 12px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'13px',fontFamily:'Cairo,sans-serif',direction:'rtl',outline:'none'}} />
        <select value={source} onChange={e=>{setSource(e.target.value);setPage(1)}}
          style={{padding:'9px 10px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'13px',fontFamily:'Cairo,sans-serif',background:'#fff'}}>
          {sources.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select value={pageSize} onChange={e=>{setPageSize(+e.target.value);setPage(1)}}
          style={{padding:'9px 10px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'13px',fontFamily:'Cairo,sans-serif',background:'#fff',cursor:'pointer'}}>
          {[10,50,100,1000].map(n=><option key={n} value={n}>{n}</option>)}
        </select>
        <button onClick={()=>{setShowDupes(!showDupes);setPage(1)}}
          style={{padding:'9px 12px',borderRadius:'10px',border:'1.5px solid '+(showDupes?'#dc2626':'#dde3ed'),background:showDupes?'#fee2e2':'#fff',color:showDupes?'#dc2626':'#666',fontSize:'13px',fontFamily:'Cairo,sans-serif',fontWeight:'700',cursor:'pointer',whiteSpace:'nowrap'}}>
          ⚠️ مكرر ({dupeCount})
        </button>
        <span style={{color:'#888',fontSize:'12px'}}>{filtered.length} نتيجة</span>
      </div>

      {msg && <div style={{background:'#F0FDF4',color:'#16a34a',padding:'10px 16px',borderRadius:'10px',marginBottom:'12px',fontSize:'13px'}}>{msg}</div>}

      {loading ? <div style={{textAlign:'center',padding:'60px',color:'#aaa'}}>⏳ جاري التحميل...</div> : (() => {
        const totalPages = Math.ceil(filtered.length / pageSize)
        const paged = pageSize >= 1000 ? filtered : filtered.slice((page-1)*pageSize, page*pageSize)
        return (<>
        {/* Cards layout - responsive */}
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {paged.map((c, i) => {
            const isDupePhone = c.phone && phoneCounts[normalize(c.phone)] > 1
            const isDupeEmail = c.email && emailCounts[(c.email||'').toLowerCase().trim()] > 1
            const seq = (page-1)*pageSize + i + 1
            return (
              <div key={`${c.source}-${c.id}`}
                style={{background:'#fff',borderRadius:'12px',padding:'12px 14px',boxShadow:'0 2px 8px rgba(0,0,0,0.05)',border:`1px solid ${isDupePhone||isDupeEmail?'#fca5a5':'#eef0f5'}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px',flexWrap:'wrap',gap:'4px'}}>
                  <span style={{fontWeight:'700',fontSize:'14px',color:'#2C3E6B'}}>
                    <span style={{color:'#aaa',fontWeight:'400',fontSize:'12px',marginLeft:'6px'}}>#{seq}</span>
                    {c.name}
                  </span>
                  <span style={{background:srcColor[c.source]||'#888',color:'#fff',borderRadius:'8px',padding:'2px 8px',fontSize:'11px',fontWeight:'700'}}>{c.sourceLabel}</span>
                </div>
                {c.phone && (
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px',flexWrap:'wrap'}}>
                    <span style={{fontSize:'12px',color:'#888',minWidth:'40px'}}>📞</span>
                    <span style={{fontSize:'13px',color:isDupePhone?'#dc2626':'#059669',fontWeight:'600',direction:'ltr'}}>{c.phone}</span>
                    {isDupePhone && <span style={{background:'#fee2e2',color:'#dc2626',fontSize:'10px',borderRadius:'6px',padding:'1px 6px',fontWeight:'700'}}>مكرر</span>}
                    {c.isPending
                      ? <button onClick={()=>handleRejectSubmission(c)} style={{marginRight:'auto',background:'#fef3c7',color:'#d97706',border:'none',borderRadius:'6px',padding:'3px 8px',cursor:'pointer',fontSize:'11px',fontWeight:'700'}}>رفض الطلب</button>
                      : <button onClick={()=>handleClear(c,'phone')} style={{marginRight:'auto',background:'#fee2e2',color:'#dc2626',border:'none',borderRadius:'6px',padding:'3px 8px',cursor:'pointer',fontSize:'11px',fontWeight:'700'}}>حذف</button>
                    }
                  </div>
                )}
                {c.email && (
                  <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                    <span style={{fontSize:'12px',color:'#888',minWidth:'40px'}}>✉️</span>
                    <span style={{fontSize:'12px',color:isDupeEmail?'#dc2626':'#4A6FA5',fontWeight:'600',direction:'ltr',wordBreak:'break-all'}}>{c.email}</span>
                    {isDupeEmail && <span style={{background:'#fee2e2',color:'#dc2626',fontSize:'10px',borderRadius:'6px',padding:'1px 6px',fontWeight:'700'}}>مكرر</span>}
                    {c.isPending
                      ? <button onClick={()=>handleRejectSubmission(c)} style={{marginRight:'auto',background:'#fef3c7',color:'#d97706',border:'none',borderRadius:'6px',padding:'3px 8px',cursor:'pointer',fontSize:'11px',fontWeight:'700'}}>رفض الطلب</button>
                      : <button onClick={()=>handleClear(c,'email')} style={{marginRight:'auto',background:'#fee2e2',color:'#dc2626',border:'none',borderRadius:'6px',padding:'3px 8px',cursor:'pointer',fontSize:'11px',fontWeight:'700'}}>حذف</button>
                    }
                  </div>
                )}
              </div>
            )
          })}
          {paged.length === 0 && (
            <div style={{textAlign:'center',padding:'40px',background:'#fff',borderRadius:'12px',color:'#aaa'}}>لا توجد نتائج</div>
          )}
        </div>
        {totalPages > 1 && (
          <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:6,padding:'14px 0',flexWrap:'wrap'}}>
            <button onClick={()=>setPage(1)} disabled={page===1}
              style={{padding:'5px 10px',borderRadius:7,border:'1px solid #dde3ed',background:page===1?'#f5f5f5':'#fff',cursor:page===1?'default':'pointer',fontSize:12,fontFamily:'Cairo,sans-serif'}}>««</button>
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
              style={{padding:'5px 10px',borderRadius:7,border:'1px solid #dde3ed',background:page===1?'#f5f5f5':'#fff',cursor:page===1?'default':'pointer',fontSize:12,fontFamily:'Cairo,sans-serif'}}>← السابق</button>
            <span style={{fontSize:12,color:'#555',fontFamily:'Cairo,sans-serif',padding:'0 8px'}}>{page} / {totalPages}</span>
            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
              style={{padding:'5px 10px',borderRadius:7,border:'1px solid #dde3ed',background:page===totalPages?'#f5f5f5':'#fff',cursor:page===totalPages?'default':'pointer',fontSize:12,fontFamily:'Cairo,sans-serif'}}>التالي →</button>
            <button onClick={()=>setPage(totalPages)} disabled={page===totalPages}
              style={{padding:'5px 10px',borderRadius:7,border:'1px solid #dde3ed',background:page===totalPages?'#f5f5f5':'#fff',cursor:page===totalPages?'default':'pointer',fontSize:12,fontFamily:'Cairo,sans-serif'}}>»»</button>
          </div>
        )}
        </>)
      })()}
    </div>
  )
}

// ─── Security Panel ───
function SystemConstantsPanel() {
  const [selected, setSelected] = useState('trader_classification')
  const [items, setItems] = useState([])
  const [all, setAll] = useState([])
  const [form, setForm] = useState({ value: '', label: '', sortOrder: 0, isActive: true })
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [msg, setMsg] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const CATS = [
    { key: 'trader_classification', label: '🏢 تصنيف التاجر',  section: 'دليل التجار' },
    { key: 'trader_sector',         label: '🏭 القطاع',          section: 'دليل التجار' },
    { key: 'trader_business_type',  label: '📦 نوع النشاط',     section: 'دليل التجار' },
    { key: 'news_type',             label: '📰 تصنيف الخبر',     section: 'الأخبار' },
    { key: 'news_category',         label: '🗂️ فئة الخبر',       section: 'الأخبار' },
  ]

  const [totalItems, setTotalItems] = useState(0)

  const doLoad = React.useCallback((p, ps, cat, q) => {
    const params = { category: cat, page: p, pageSize: ps }
    if (q && q.trim()) params.search = q.trim()
    api.get(`${API}/constants`, { headers: authHdrs(), params }).then(r => {
      const data = r.data?.items || r.data || []
      setTotalItems(r.data?.total || data.length)
      setItems(Array.isArray(data) ? data : [])
    }).catch(()=>{})
  }, [])

  // عند تغيير القسم أو البحث → رجع للصفحة 1
  useEffect(() => { setPage(1); doLoad(1, pageSize, selected, search) }, [selected])
  useEffect(() => { setPage(1); doLoad(1, pageSize, selected, search) }, [search])
  // عند تغيير الصفحة أو عدد العناصر
  useEffect(() => { doLoad(page, pageSize, selected, search) }, [page, pageSize])

  const save = async e => {
    e.preventDefault(); setMsg('')
    try {
      if (editing) await api.put(`${API}/constants/${editing}`, { ...form, category: selected }, { headers: authHdrs() })
      else await api.post(`${API}/constants`, { ...form, category: selected }, { headers: authHdrs() })
      setShowForm(false); setEditing(null); setForm({ value: '', label: '', sortOrder: 0, isActive: true }); doLoad(page, pageSize, selected, search)
    } catch(e) { setMsg(e.response?.data?.message || 'خطأ') }
  }

  const del = async id => {
    if (!confirm('حذف هذه القيمة؟')) return
    try {
      await api.delete(`${API}/constants/${id}`, { headers: authHdrs() })
      doLoad(page, pageSize, selected, search)
    } catch(e) {
      const msg = e?.response?.data?.message || 'حدث خطأ'
      alert(msg)
    }
  }
  const startEdit = item => { setForm({ value: item.value, label: item.label||'', sortOrder: item.sortOrder, isActive: item.isActive }); setEditing(item.id); setShowForm(true) }
  const sections = [...new Set(CATS.map(c => c.section))]

  return (
    <div style={{ padding: 28, direction: 'rtl' }}>
      <h2 style={{ margin: '0 0 24px', color: '#2C3E6B', fontWeight: 900 }}>⚙️ ثوابت النظام</h2>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ width: 210, flexShrink: 0 }}>
          {sections.map(sec => (
            <div key={sec} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#888', padding: '4px 8px' }}>{sec}</div>
              {CATS.filter(c => c.section === sec).map(c => (
                <div key={c.key} onClick={() => setSelected(c.key)}
                  style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, fontSize: 13,
                    background: selected === c.key ? '#2C3E6B' : '#fff',
                    color: selected === c.key ? '#fff' : '#333',
                    fontWeight: selected === c.key ? 700 : 400,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>{c.label}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ margin: 0, color: '#2C3E6B', fontSize: 16 }}>{CATS.find(c=>c.key===selected)?.label} <span style={{color:'#888',fontSize:12,fontWeight:400}}>({totalItems} عنصر{search && ` — ${items.length} نتيجة`})</span></h3>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <input value={search} onChange={e=>{setSearch(e.target.value)}}
                placeholder="🔍 بحث..."
                style={{padding:'6px 12px',borderRadius:8,border:'1px solid #dde3ed',fontSize:13,fontFamily:'Cairo,sans-serif',minWidth:'160px',outline:'none'}} />
              <select value={pageSize} onChange={e=>{setPageSize(+e.target.value);setPage(1)}}
                style={{padding:'6px 12px',borderRadius:8,border:'1px solid #dde3ed',fontSize:13,fontFamily:'Cairo,sans-serif',background:'#fff',cursor:'pointer'}}>
                {[10,50,100,1000].map(n => <option key={n} value={n}>{n} عنصر</option>)}
              </select>
              <button onClick={() => { setShowForm(true); setEditing(null); setForm({ value: '', label: '', sortOrder: 0, isActive: true }) }}
                style={{ background: '#2C3E6B', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontWeight: 700 }}>+ إضافة</button>
            </div>
          </div>
          {showForm && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 18, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <form onSubmit={save}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10 }}>
                  {[['القيمة','value','text'],['الترتيب','sortOrder','number']].map(([lbl,key,type])=>(
                    <div key={key}>
                      <label style={{ display:'block',fontSize:12,fontWeight:700,color:'#444',marginBottom:4 }}>{lbl}</label>
                      <input type={type} style={{ width:'100%',padding:'8px 10px',border:'1px solid #ddd',borderRadius:8,fontFamily:'Cairo,sans-serif',boxSizing:'border-box',fontSize:13 }}
                        value={form[key]} required={key==='value'} onChange={e=>setForm({...form,[key]:type==='number'?+e.target.value:e.target.value})} />
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginTop:10 }}>
                  <input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})} id="ca" />
                  <label htmlFor="ca" style={{fontSize:13}}>نشط</label>
                </div>
                {msg && <p style={{color:'red',fontSize:12,margin:'6px 0'}}>{msg}</p>}
                <div style={{ display:'flex',gap:8,marginTop:12 }}>
                  <button type="submit" style={{ background:'#2C3E6B',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:700 }}>{editing?'تحديث':'حفظ'}</button>
                  <button type="button" onClick={()=>{setShowForm(false);setEditing(null)}} style={{ background:'#f0f0f0',color:'#333',border:'none',borderRadius:8,padding:'8px 18px',cursor:'pointer',fontFamily:'Cairo,sans-serif' }}>إلغاء</button>
                </div>
              </form>
            </div>
          )}
          <div style={{ background:'#fff',borderRadius:12,boxShadow:'0 2px 8px rgba(0,0,0,0.06)',overflow:'hidden' }}>
            <div style={{ display:'grid',gridTemplateColumns:'36px 1fr 56px 70px 90px',padding:'9px 16px',background:'#f8f8f8',fontSize:12,fontWeight:700,color:'#666',borderBottom:'2px solid #eee' }}>
              <span>#</span><span>القيمة</span><span>الترتيب</span><span>الحالة</span><span>إجراءات</span>
            </div>
            {items.length===0 ? <p style={{textAlign:'center',padding:36,color:'#999'}}>لا توجد عناصر</p> : (() => {
              const totalPages = Math.ceil(totalItems / pageSize)
              return (<>
                {items.map((item,i)=>(
                  <div key={item.id} style={{ display:'grid',gridTemplateColumns:'36px 1fr 56px 70px 90px',padding:'10px 16px',borderBottom:'1px solid #f5f5f5',alignItems:'center',fontSize:13 }}>
                    <span style={{color:'#aaa'}}>{(page-1)*pageSize+i+1}</span>
                    <span style={{fontWeight:600,color:'#333'}}>{item.value}</span>
                    <span style={{textAlign:'center',color:'#888'}}>{item.sortOrder}</span>
                    <span style={{textAlign:'center'}}>
                      <span style={{fontSize:11,padding:'3px 8px',borderRadius:20,background:item.isActive?'#d1fae5':'#fee2e2',color:item.isActive?'#065f46':'#991b1b'}}>{item.isActive?'نشط':'موقوف'}</span>
                    </span>
                    <div style={{display:'flex',gap:5}}>
                      <button onClick={()=>startEdit(item)} style={{background:'#7c3aed22',color:'#7c3aed',border:'1px solid #7c3aed44',borderRadius:5,padding:'5px 9px',cursor:'pointer',fontSize:13}}>✏️</button>
                      <button onClick={()=>del(item.id)} style={{background:'#dc262622',color:'#dc2626',border:'1px solid #dc262644',borderRadius:5,padding:'5px 9px',cursor:'pointer',fontSize:13}}>🗑️</button>
                    </div>
                  </div>
                ))}
                {totalPages > 1 && (
                  <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:6,padding:'12px',borderTop:'1px solid #f0f0f0',flexWrap:'wrap'}}>
                    <button onClick={()=>setPage(1)} disabled={page===1} style={{padding:'5px 10px',borderRadius:7,border:'1px solid #dde3ed',background:page===1?'#f5f5f5':'#fff',cursor:page===1?'default':'pointer',fontSize:12,fontFamily:'Cairo,sans-serif'}}>««</button>
                    <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{padding:'5px 10px',borderRadius:7,border:'1px solid #dde3ed',background:page===1?'#f5f5f5':'#fff',cursor:page===1?'default':'pointer',fontSize:12,fontFamily:'Cairo,sans-serif'}}>← السابق</button>
                    <span style={{fontSize:12,color:'#555',fontFamily:'Cairo,sans-serif',padding:'0 6px'}}>{page} / {totalPages} ({totalItems} عنصر)</span>
                    <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{padding:'5px 10px',borderRadius:7,border:'1px solid #dde3ed',background:page===totalPages?'#f5f5f5':'#fff',cursor:page===totalPages?'default':'pointer',fontSize:12,fontFamily:'Cairo,sans-serif'}}>التالي →</button>
                    <button onClick={()=>setPage(totalPages)} disabled={page===totalPages} style={{padding:'5px 10px',borderRadius:7,border:'1px solid #dde3ed',background:page===totalPages?'#f5f5f5':'#fff',cursor:page===totalPages?'default':'pointer',fontSize:12,fontFamily:'Cairo,sans-serif'}}>»»</button>
                  </div>
                )}
              </>)
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}

function SecurityPanel() {
  const [blocked, setBlocked] = React.useState([])
  const [stats, setStats] = React.useState(null)
  const [channels, setChannels] = React.useState({ smsDisabled: false, emailDisabled: false })
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState('active')
  const [blockForm, setBlockForm] = React.useState({ contact: '', channel: 'email' })
  const [msg, setMsg] = React.useState('')
  const [search, setSearch] = React.useState('')
  const [pageSize, setPageSize] = React.useState(10)
  const [page, setPage] = React.useState(1)
  const [rateLimits, setRateLimits] = React.useState([])
  const [showAllRate, setShowAllRate] = React.useState(false)

  const loadRateLimits = async (all=false) => {
    try {
      const r = await api.get(`${API}/security/ratelimits?blockedOnly=${!all}`, { headers: authHdrs() })
      setRateLimits(r.data || [])
    } catch {}
  }

  const unblockRate = async (id) => {
    await api.post(`${API}/security/ratelimits/unblock/${id}`, {}, { headers: authHdrs() })
    setMsg('✅ تم فك الحظر')
    loadRateLimits(showAllRate)
  }

  const deleteRate = async (id) => {
    await api.delete(`${API}/security/ratelimits/${id}`, { headers: authHdrs() })
    loadRateLimits(showAllRate)
  }

  const load = async () => {
    setLoading(true)
    try {
      const [bl, st, ch] = await Promise.all([
        api.get(`${API}/security/blocked?activeOnly=${filter === 'active'}`, { headers: authHdrs() }),
        api.get(`${API}/security/stats`, { headers: authHdrs() }),
        api.get(`${API}/security/channels`, { headers: authHdrs() })
      ])
      setBlocked(bl.data)
      setStats(st.data)
      setChannels(ch.data)
    } catch {}
    setLoading(false)
  }

  const toggleChannel = async (channel, disable) => {
    const action = disable ? 'disable' : 'enable'
    const ch = channel === 'sms' ? 'SMS' : 'الإيميل'
    if (!window.confirm(`${disable ? 'إيقاف' : 'تفعيل'} ${ch}؟`)) return
    
    // تحديث فوري للـ UI
    setChannels(prev => ({
      ...prev,
      [channel === 'sms' ? 'smsDisabled' : 'emailDisabled']: disable
    }))
    setMsg(`${disable ? '🔴 جاري إيقاف' : '✅ جاري تفعيل'} ${ch}...`)
    
    try {
      await api.post(`${API}/security/channels/${channel}/${action}`, {}, { headers: authHdrs() })
      setMsg(`${disable ? '🔴 تم إيقاف' : '✅ تم تفعيل'} ${ch}`)
    } catch (e) {
      setMsg('❌ حدث خطأ')
      load()
    }
  }

  React.useEffect(() => { load() }, [filter])
  React.useEffect(() => { loadRateLimits(showAllRate) }, [showAllRate])

  const unblock = async (id) => {
    if (!window.confirm('فك الحجب؟')) return
    await api.post(`${API}/security/unblock/${id}`, {}, { headers: authHdrs() })
    setMsg('✅ تم فك الحجب')
    load()
  }

  const blockManual = async () => {
    if (!blockForm.contact) return
    // تحديد النوع تلقائياً حسب المدخل
    const isEmail = blockForm.contact.includes('@')
    const detectedChannel = isEmail ? 'email' : 'sms'
    try {
      await api.post(`${API}/security/block`, { contact: blockForm.contact, channel: detectedChannel }, { headers: authHdrs() })
      setMsg(`✅ تم حجب ${isEmail ? 'الإيميل' : 'رقم الهاتف'} بنجاح`)
      setBlockForm({ contact: '', channel: 'email' })
      load()
    } catch (e) {
      setMsg('❌ ' + (e?.response?.data?.message || 'حدث خطأ'))
    }
  }

  const channelBg = { email: '#EEF2FF', sms: '#F0FDF4' }
  const channelColor = { email: '#4f46e5', sms: '#16a34a' }

  return (
    <div style={{padding:'24px',fontFamily:'Cairo,sans-serif',direction:'rtl',background:'#F0F4F8',minHeight:'100%'}}>

      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#dc2626,#991b1b)',borderRadius:'16px',padding:'20px 24px',marginBottom:'20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h2 style={{color:'white',fontWeight:'800',margin:'0 0 4px',fontSize:'20px'}}>🔒 إدارة الأمان</h2>
          <p style={{color:'rgba(255,255,255,0.7)',margin:0,fontSize:'13px'}}>مراقبة محاولات OTP والجهات المحجوبة</p>
        </div>
        <button onClick={load} style={{padding:'10px 16px',borderRadius:'10px',background:'rgba(255,255,255,0.15)',color:'white',border:'1px solid rgba(255,255,255,0.2)',cursor:'pointer',fontSize:'13px',fontWeight:'700',fontFamily:'Cairo,sans-serif'}}>
          🔄 تحديث
        </button>
      </div>

      {/* Stats — compact row */}
      {stats && (
        <div style={{display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap'}}>
          {[
            ['🚫', 'محجوب حالياً', stats.totalBlocked, '#dc2626'],
            ['⚠️', 'محجوب اليوم', stats.blockedToday, '#f59e0b'],
            ['❌', 'فشل 24 ساعة', stats.failedLast24h, '#ef4444'],
            ['⏱️', 'فشل آخر ساعة', stats.failedLastHour, '#f97316'],
            ['✅', 'نجاح 24 ساعة', stats.successLast24h, '#10b981'],
          ].map(([icon, label, val, color]) => (
            <div key={label} style={{background:'white',borderRadius:'10px',padding:'8px 14px',display:'flex',alignItems:'center',gap:'6px',boxShadow:'0 1px 6px rgba(0,0,0,0.06)',border:'1px solid #e2e8f0',flexShrink:0}}>
              <span style={{fontSize:'14px'}}>{icon}</span>
              <span style={{fontSize:'18px',fontWeight:'800',color}}>{val}</span>
              <span style={{fontSize:'11px',color:'#94a3b8'}}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {msg && <div style={{background:'#F0FDF4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'12px',marginBottom:'16px',color:'#16a34a',fontWeight:'700'}}>{msg}</div>}

      {/* مفاتيح الإيقاف الطارئ */}
      <div style={{background:'white',borderRadius:'14px',padding:'16px',marginBottom:'16px',boxShadow:'0 2px 8px rgba(0,0,0,0.05)',border:'1px solid #e2e8f0'}}>
        <div style={{fontWeight:'700',color:'#2C3E6B',fontSize:'14px',marginBottom:'12px'}}>⚡ إيقاف طارئ</div>
        <div className="security-channels-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>

          {/* SMS */}
          <div style={{padding:'16px',borderRadius:'12px',background: channels.smsDisabled ? '#FEF2F2' : '#F0FDF4',border:`1.5px solid ${channels.smsDisabled ? '#fecaca' : '#bbf7d0'}`,transition:'all 0.3s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
              <span style={{fontWeight:'700',fontSize:'15px'}}>
                {channels.smsDisabled ? '🔴' : '📱'} SMS
              </span>
              <span style={{padding:'6px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:'700',
                background: channels.smsDisabled ? '#dc2626' : '#16a34a', color:'white',transition:'all 0.3s ease'}}>
                {channels.smsDisabled ? '🔴 متوقف' : '✅ يعمل'}
              </span>
            </div>
            <button onClick={() => toggleChannel('sms', !channels.smsDisabled)}
              style={{width:'100%',padding:'12px',borderRadius:'10px',border:'none',cursor:'pointer',
                fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'13px',
                background: channels.smsDisabled ? '#16a34a' : '#dc2626',
                color:'white',transition:'all 0.3s ease',transform:'scale(1)',
                '&:hover':{transform:'scale(1.02)'}}}>
              {channels.smsDisabled ? '✅ تفعيل SMS' : '🔴 إيقاف SMS'}
            </button>
          </div>

          {/* Email */}
          <div style={{padding:'16px',borderRadius:'12px',background: channels.emailDisabled ? '#FEF2F2' : '#F0FDF4',border:`1.5px solid ${channels.emailDisabled ? '#fecaca' : '#bbf7d0'}`,transition:'all 0.3s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
              <span style={{fontWeight:'700',fontSize:'15px'}}>
                {channels.emailDisabled ? '🔴' : '📧'} الإيميل
              </span>
              <span style={{padding:'6px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:'700',
                background: channels.emailDisabled ? '#dc2626' : '#16a34a', color:'white',transition:'all 0.3s ease'}}>
                {channels.emailDisabled ? '🔴 متوقف' : '✅ يعمل'}
              </span>
            </div>
            <button onClick={() => toggleChannel('email', !channels.emailDisabled)}
              style={{width:'100%',padding:'12px',borderRadius:'10px',border:'none',cursor:'pointer',
                fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'13px',
                background: channels.emailDisabled ? '#16a34a' : '#dc2626',
                color:'white',transition:'all 0.3s ease',transform:'scale(1)',
                '&:hover':{transform:'scale(1.02)'}}}>
              {channels.emailDisabled ? '✅ تفعيل الإيميل' : '🔴 إيقاف الإيميل'}
            </button>
          </div>

        </div>
      </div>

      {/* حجب يدوي */}
      <div style={{background:'white',borderRadius:'14px',padding:'16px',marginBottom:'16px',boxShadow:'0 2px 8px rgba(0,0,0,0.05)',border:'1px solid #e2e8f0'}}>
        <div style={{fontWeight:'700',color:'#2C3E6B',fontSize:'14px',marginBottom:'12px'}}>➕ حجب يدوي</div>
        {(() => {
          const v = blockForm.contact.trim()
          const isEmail = v.includes('@') && v.includes('.')
          const isPhone = /^[\d\+\-\s\(\)]{7,}$/.test(v)
          const isValid = isEmail || isPhone
          const hint = !v ? '' : isEmail ? '📧 إيميل' : isPhone ? '📱 هاتف' : '❌ غير صحيح'
          const hintColor = !v ? '' : isValid ? (isEmail ? '#4f46e5' : '#16a34a') : '#dc2626'
          const borderColor = !v ? '#e2e8f0' : isValid ? hintColor : '#dc2626'
          return (
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <div style={{flex:1,minWidth:'200px',position:'relative'}}>
                <input value={blockForm.contact} onChange={e=>setBlockForm(p=>({...p,contact:e.target.value}))}
                  placeholder="إيميل أو رقم هاتف"
                  style={{width:'100%',padding:'10px 12px',border:`1.5px solid ${borderColor}`,borderRadius:'10px',fontSize:'13px',fontFamily:'Cairo,sans-serif',outline:'none'}} />
                {v && (
                  <span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'11px',fontWeight:'700',color:hintColor,background:'#fff',padding:'0 4px'}}>
                    {hint}
                  </span>
                )}
              </div>
              <button onClick={blockManual} disabled={!isValid}
                style={{padding:'10px 20px',background:isValid?'#dc2626':'#ccc',color:'white',border:'none',borderRadius:'10px',cursor:isValid?'pointer':'not-allowed',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'13px',transition:'background 0.2s'}}>
                🚫 حجب
              </button>
            </div>
          )
        })()}
      </div>

      {/* قائمة المحجوبين */}
      <div style={{background:'white',borderRadius:'14px',padding:'16px',boxShadow:'0 2px 8px rgba(0,0,0,0.05)',border:'1px solid #e2e8f0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px',flexWrap:'wrap',gap:8}}>
          <div style={{fontWeight:'700',color:'#2C3E6B',fontSize:'14px'}}>📋 الجهات المحجوبة</div>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}}>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="🔍 بحث..."
              style={{padding:'6px 12px',borderRadius:'8px',border:'1px solid #dde3ed',fontSize:'12px',fontFamily:'Cairo,sans-serif',outline:'none',minWidth:'150px'}} />
            <select value={pageSize} onChange={e=>{setPageSize(+e.target.value);setPage(1)}}
              style={{padding:'6px 10px',borderRadius:'8px',border:'1px solid #dde3ed',fontSize:'12px',fontFamily:'Cairo,sans-serif',background:'#fff',cursor:'pointer'}}>
              {[10,50,100,1000].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
            {['active','all'].map(f => (
              <button key={f} onClick={()=>{setFilter(f);setPage(1)}}
                style={{padding:'6px 14px',borderRadius:'8px',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'12px',
                  background:filter===f?'#2C3E6B':'#f1f5f9',color:filter===f?'white':'#475569'}}>
                {f==='active'?'النشطة':'الكل'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:'40px'}}><div className="ficc-spinner"></div></div>
        ) : blocked.length === 0 ? (
          <div style={{textAlign:'center',padding:'40px',color:'#94a3b8',fontSize:'14px'}}>✅ لا توجد جهات محجوبة</div>
        ) : (() => {
          const filteredBlocked = search.trim() ? blocked.filter(b => b.contact?.includes(search)) : blocked
          const totalPagesB = Math.ceil(filteredBlocked.length / pageSize)
          const pagedBlocked = pageSize >= 1000 ? filteredBlocked : filteredBlocked.slice((page-1)*pageSize, page*pageSize)
          return (<>
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {pagedBlocked.length === 0 && <div style={{textAlign:'center',padding:'24px',color:'#94a3b8'}}>لا توجد نتائج</div>}
            {pagedBlocked.map((b, idx) => (
              <div key={b.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px',borderRadius:'10px',background:b.isActive?'#FEF2F2':'#F8FAFC',border:`1px solid ${b.isActive?'#fecaca':'#e2e8f0'}`}}>
                <span style={{color:'#aaa',fontSize:'11px',minWidth:'20px'}}>#{(page-1)*pageSize+idx+1}</span>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                    <span style={{background:channelBg[b.channel],color:channelColor[b.channel],padding:'2px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700'}}>
                      {b.channel === 'email' ? '✉️ إيميل' : '📱 هاتف'}
                    </span>
                    {b.isActive && <span style={{background:'#FEF2F2',color:'#dc2626',padding:'2px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700'}}>🚫 محجوب</span>}
                  </div>
                  <div style={{fontWeight:'700',color:'#1e293b',fontSize:'14px'}}>{b.contact}</div>
                  <div style={{fontSize:'11px',color:'#94a3b8'}}>
                    {new Date(b.blockedAt).toLocaleString('ar-IQ')} {b.ipAddress && `— IP: ${b.ipAddress}`}
                  </div>
                </div>
                {b.isActive && (
                  <button onClick={() => unblock(b.id)}
                    style={{padding:'8px 16px',background:'#10b981',color:'white',border:'none',borderRadius:'10px',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'13px',flexShrink:0}}>
                    ✅ فك الحجب
                  </button>
                )}
              </div>
            ))}
          </div>
          {totalPagesB > 1 && (
            <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:10}}>
              <button onClick={()=>setPage(1)} disabled={page===1} style={{padding:'4px 9px',borderRadius:7,border:'1px solid #dde3ed',background:page===1?'#f5f5f5':'#fff',cursor:page===1?'default':'pointer',fontSize:12}}>««</button>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{padding:'4px 9px',borderRadius:7,border:'1px solid #dde3ed',background:page===1?'#f5f5f5':'#fff',cursor:page===1?'default':'pointer',fontSize:12,fontFamily:'Cairo,sans-serif'}}>← السابق</button>
              <span style={{fontSize:12,color:'#555',padding:'0 6px',alignSelf:'center'}}>{page} / {totalPagesB}</span>
              <button onClick={()=>setPage(p=>Math.min(totalPagesB,p+1))} disabled={page===totalPagesB} style={{padding:'4px 9px',borderRadius:7,border:'1px solid #dde3ed',background:page===totalPagesB?'#f5f5f5':'#fff',cursor:page===totalPagesB?'default':'pointer',fontSize:12,fontFamily:'Cairo,sans-serif'}}>التالي →</button>
              <button onClick={()=>setPage(totalPagesB)} disabled={page===totalPagesB} style={{padding:'4px 9px',borderRadius:7,border:'1px solid #dde3ed',background:page===totalPagesB?'#f5f5f5':'#fff',cursor:page===totalPagesB?'default':'pointer',fontSize:12}}>»»</button>
            </div>
          )}
          </>)
        })()}
      </div>

      {/* ─── حظر المتابعين (RateLimit) ─── */}
      <div style={{background:'white',borderRadius:'14px',padding:'16px',marginTop:'16px',boxShadow:'0 2px 8px rgba(0,0,0,0.05)',border:'1px solid #e2e8f0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div style={{fontWeight:'700',color:'#2C3E6B',fontSize:'14px'}}>🛡️ حظر المتابعين (OTP Rate Limit)</div>
          <div style={{display:'flex',gap:'6px'}}>
            <button onClick={()=>setShowAllRate(!showAllRate)}
              style={{padding:'5px 12px',borderRadius:'8px',background:showAllRate?'#EEF2FF':'#FFF8E7',color:showAllRate?'#4338ca':'#B8860B',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:'700'}}>
              {showAllRate?'المحجوبين فقط':'عرض الكل'}
            </button>
            <button onClick={()=>loadRateLimits(showAllRate)} style={{padding:'5px 10px',borderRadius:'8px',background:'#f0f2f7',color:'#666',border:'none',cursor:'pointer',fontSize:'12px'}}>🔄</button>
          </div>
        </div>
        {rateLimits.length === 0 ? (
          <p style={{color:'#aaa',textAlign:'center',padding:'20px',fontSize:'13px'}}>لا يوجد حظر حالي ✅</p>
        ) : (
          <div style={{overflow:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px',minWidth:'400px'}}>
              <thead>
                <tr style={{background:'#f5f7fa'}}>
                  <th style={{padding:'8px 12px',textAlign:'right',color:'#555'}}>الرقم / الإيميل</th>
                  <th style={{padding:'8px 12px',textAlign:'right',color:'#555'}}>النوع</th>
                  <th style={{padding:'8px 12px',textAlign:'right',color:'#555'}}>المحاولات</th>
                  <th style={{padding:'8px 12px',textAlign:'right',color:'#555'}}>محجوب حتى</th>
                  <th style={{padding:'8px 12px',textAlign:'center',color:'#555'}}>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {rateLimits.map((r,i)=>(
                  <tr key={r.id} style={{borderBottom:'1px solid #f0f2f7',background:r.blockedUntil&&new Date(r.blockedUntil)>new Date()?'#fff5f5':'#fff'}}>
                    <td style={{padding:'8px 12px',fontWeight:'700',direction:'ltr'}}>{r.key}</td>
                    <td style={{padding:'8px 12px'}}>{r.keyType==='phone-login'?'🔑 دخول':r.keyType==='whatsapp'?'💬 واتساب':r.keyType==='email'?'📧 إيميل':'📱 هاتف'}</td>
                    <td style={{padding:'8px 12px',textAlign:'center'}}>
                      <span style={{padding:'2px 8px',borderRadius:'12px',background:r.attempts>=5?'#fee2e2':'#fff8e7',color:r.attempts>=5?'#dc2626':'#b45309',fontWeight:'700'}}>{r.attempts}</span>
                    </td>
                    <td style={{padding:'8px 12px',fontSize:'11px',color:r.blockedUntil&&new Date(r.blockedUntil)>new Date()?'#dc2626':'#888'}}>
                      {r.blockedUntil ? new Date(r.blockedUntil).toLocaleTimeString('ar-IQ') : '—'}
                    </td>
                    <td style={{padding:'8px 12px',textAlign:'center',whiteSpace:'nowrap'}}>
                      {r.blockedUntil && new Date(r.blockedUntil) > new Date() && (
                        <button onClick={()=>unblockRate(r.id)} style={{background:'#dcfce7',color:'#16a34a',border:'none',borderRadius:'7px',padding:'4px 10px',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'11px',fontWeight:'700',margin:'1px'}}>✅ فك الحظر</button>
                      )}
                      <button onClick={()=>deleteRate(r.id)} style={{background:'#fee2e2',color:'#dc2626',border:'none',borderRadius:'7px',padding:'4px 8px',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'11px',fontWeight:'700',margin:'1px'}}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}

// ─── Startups Admin Panel ───
function StartupsAdminPanel() {
  const [startups, setStartups] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const token = getToken()

  const load = () => {
    setLoading(true)
    api.get('/startups/admin/all' + (filter !== 'all' ? `?status=${filter}` : ''),
      { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setStartups(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const updateStatus = async (id, status, notes) => {
    await api.put(`/api/startups/${id}/status`,
      { status, notes },
      { headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  const statusColors = { pending:'#f59e0b', approved:'#10b981', rejected:'#ef4444' }
  const statusLabels = { pending:'⏳ قيد المراجعة', approved:'✅ مقبول', rejected:'❌ مرفوض' }

  return (
    <div style={{padding:'24px',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h2 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'22px',margin:0}}>🚀 ريادة الأعمال</h2>
        <div style={{display:'flex',gap:'8px'}}>
          {['all','pending','approved','rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{padding:'8px 16px',borderRadius:'10px',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'13px',
                background: filter===s ? '#2C3E6B' : '#f1f5f9',
                color: filter===s ? 'white' : '#475569'}}>
              {s==='all'?'الكل':statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{textAlign:'center',padding:'60px',background:'white',borderRadius:'16px'}}>
          <div className="ficc-spinner" style={{marginBottom:'12px'}}></div>
          <p style={{color:'#94a3b8',fontSize:'14px',fontWeight:'600'}}>جاري التحميل...</p>
        </div>
      ) : startups.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px',background:'white',borderRadius:'16px',color:'#94a3b8'}}>
          لا توجد مشاريع
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          {startups.map(s => (
            <div key={s.id} style={{background:'white',borderRadius:'14px',padding:'20px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)',border:'1px solid #e2e8f0'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',flexWrap:'wrap',gap:'8px'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                    <span style={{background:statusColors[s.status]+'20',color:statusColors[s.status],padding:'3px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:'700'}}>
                      {statusLabels[s.status]}
                    </span>
                    <span style={{background:'#e0e7ff',color:'#6366f1',padding:'3px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:'700'}}>{s.sector}</span>
                    <span style={{fontSize:'11px',color:'#94a3b8'}}>{s.stage}</span>
                  </div>
                  <h3 style={{fontSize:'17px',fontWeight:'800',color:'#1a2a4a',margin:'0 0 6px'}}>{s.name}</h3>
                  {s.description && <p style={{fontSize:'13px',color:'#64748b',margin:'0 0 8px',lineHeight:'1.5'}}>{s.description}</p>}
                  <div style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>
                    <span style={{fontSize:'13px',color:'#475569'}}>👤 {s.ownerName}</span>
                    {s.ownerPhone && <span style={{fontSize:'13px',color:'#475569'}}>📱 {s.ownerPhone}</span>}
                    {s.ownerEmail && <span style={{fontSize:'13px',color:'#475569'}}>✉️ {s.ownerEmail}</span>}
                    {s.ownerGender && <span style={{fontSize:'13px',color:'#475569'}}>{s.ownerGender === 'ذكر' ? '👨' : '👩'} {s.ownerGender}</span>}
                    {s.ownerBirthdate && <span style={{fontSize:'13px',color:'#475569'}}>🎂 {s.ownerBirthdate}</span>}
                    {s.fundingNeeded && <span style={{fontSize:'13px',color:'#475569'}}>💰 {s.fundingNeeded}</span>}
                  </div>
                </div>
                {/* أزرار التحكم */}
                <div style={{display:'flex',gap:'8px',flexShrink:0}}>
                  {s.status !== 'approved' && (
                    <button onClick={() => updateStatus(s.id, 'approved', '')}
                      style={{padding:'8px 16px',background:'#10b981',color:'white',border:'none',borderRadius:'10px',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'13px'}}>
                      ✅ قبول
                    </button>
                  )}
                  {s.status !== 'rejected' && (
                    <button onClick={() => {
                      const notes = prompt('سبب الرفض (اختياري):')
                      if (notes !== null) updateStatus(s.id, 'rejected', notes)
                    }}
                      style={{padding:'8px 16px',background:'#ef4444',color:'white',border:'none',borderRadius:'10px',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'13px'}}>
                      ❌ رفض
                    </button>
                  )}
                  {s.status !== 'pending' && (
                    <button onClick={() => updateStatus(s.id, 'pending', '')}
                      style={{padding:'8px 16px',background:'#f59e0b',color:'white',border:'none',borderRadius:'10px',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'13px'}}>
                      ⏳ إعادة مراجعة
                    </button>
                  )}
                </div>
              </div>
              {s.adminNotes && (
                <div style={{marginTop:'10px',padding:'8px 12px',background:'#fffbeb',borderRadius:'8px',fontSize:'13px',color:'#92400e',borderRight:'3px solid #f59e0b'}}>
                  📝 ملاحظة: {s.adminNotes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Subscribers Panel ─── */
function SubscribersPanel() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [editSub, setEditSub] = useState(null)
  const [otpMsg, setOtpMsg] = useState('')
  const [pageSize, setPageSize] = useState(20)
  const [notifyFilter, setNotifyFilter] = useState('')
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const load = async (p=1, q='') => {
    setLoading(true)
    try {
      const r = await api.get(`${API}/subscribers`, { params: { page: p, pageSize, search: q } })
      setItems(r.data.items || [])
      setTotal(r.data.total || 0)
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load(1, search) }, [])

  const del = async (id) => {
    if (!window.confirm('هل تريد حذف هذا المتابع؟')) return
    await api.delete(`${API}/subscribers/${id}`)
    load(page, search)
  }

  const toggleActive = async (s) => {
    await api.put(`${API}/subscribers/${s.id}`, { ...s, isActive: !s.isActive, sectors: s.sectors, notifyBy: s.notifyBy })
    load(page, search)
  }

  const resendOtp = async (s) => {
    setOtpMsg('')
    try {
      await api.post(`${API}/subscribers/send-field-otp`, { field: 'whatsapp', value: s.whatsApp || s.phone })
      setOtpMsg(`✅ تم إرسال OTP لـ ${s.fullName}`)
      setTimeout(()=>setOtpMsg(''), 4000)
    } catch(e) { setOtpMsg('❌ فشل الإرسال') }
  }

  const notifyLabel = (nb) => {
    try { return JSON.parse(nb||'[]').map(n=>n==='whatsapp'?'💬':n==='sms'?'📱':n==='email'?'📧':n).join(' ') }
    catch { return nb||'' }
  }
  const sectorsLabel = (s) => { try { return JSON.parse(s||'[]').join('، ') } catch { return s||'' } }

  const btn = (label, onClick, bg, color) => (
    <button onClick={onClick} style={{background:bg,color:color,border:'none',borderRadius:'7px',padding:'4px 8px',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'11px',fontWeight:'700',margin:'1px'}}>{label}</button>
  )

  return (
    <div style={{padding:'24px',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
        <h2 style={{color:'#2C3E6B',fontWeight:'900',fontSize:'20px',margin:0}}>🔔 المتابعون ({total})</h2>
        <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
          <input value={search} onChange={e=>{setSearch(e.target.value); load(1, e.target.value)}}
            placeholder="بحث بالاسم أو الهاتف..."
            style={{padding:'9px 14px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',width:'180px',outline:'none'}}/>
          <select value={notifyFilter} onChange={e=>setNotifyFilter(e.target.value)}
            style={{padding:'9px 12px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'13px',fontFamily:'Cairo,sans-serif',background:'#fff',cursor:'pointer'}}>
            <option value=''>📢 كل الطرق</option>
            <option value='whatsapp'>💬 واتساب</option>
            <option value='sms'>📱 SMS</option>
            <option value='email'>📧 إيميل</option>
          </select>
          <select value={pageSize} onChange={e=>{setPageSize(+e.target.value);setPage(1);load(1,search)}}
            style={{padding:'9px 12px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'13px',fontFamily:'Cairo,sans-serif',background:'#fff',cursor:'pointer'}}>
            {[10,20,50,100].map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {otpMsg && <div style={{background:'#f0fdf4',color:'#16a34a',padding:'10px 16px',borderRadius:'10px',marginBottom:'12px',fontWeight:'700'}}>{otpMsg}</div>}

      {/* نافذة التعديل */}
      {editSub && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:'16px',padding:'28px',width:'400px',direction:'rtl',fontFamily:'Cairo,sans-serif'}}>
            <h3 style={{color:'#2C3E6B',margin:'0 0 16px'}}>✏️ تعديل المتابع</h3>
            {/* حقل الاسم */}
            <div style={{marginBottom:'12px'}}>
              <label style={{fontSize:'12px',fontWeight:'700',color:'#555',display:'block',marginBottom:'4px'}}>الاسم</label>
              <input value={editSub.fullName||''} onChange={e=>setEditSub(p=>({...p,fullName:e.target.value}))}
                style={{width:'100%',padding:'9px 12px',borderRadius:'9px',border:'1.5px solid #dde3ed',fontSize:'13px',fontFamily:'Cairo,sans-serif',boxSizing:'border-box'}}/>
            </div>
            {/* حقول مع زر تحقق */}
            {[
              {lbl:'رقم الهاتف', k:'phone', field:'phone'},
              {lbl:'واتساب',     k:'whatsApp', field:'whatsapp'},
              {lbl:'الإيميل',   k:'email', field:'email'},
            ].map(({lbl,k,field})=>(
              <div key={k} style={{marginBottom:'12px'}}>
                <label style={{fontSize:'12px',fontWeight:'700',color:'#555',display:'block',marginBottom:'4px'}}>{lbl}</label>
                <div style={{display:'flex',gap:'6px'}}>
                  <input value={editSub[k]||''} onChange={e=>setEditSub(p=>({...p,[k]:e.target.value}))}
                    style={{flex:1,padding:'9px 12px',borderRadius:'9px',border:'1.5px solid #dde3ed',fontSize:'13px',fontFamily:'Cairo,sans-serif',direction:field==='email'?'ltr':'ltr',boxSizing:'border-box'}}/>
                  <button type="button" onClick={async()=>{
                    const val = editSub[k]
                    if(!val){alert('أدخل القيمة أولاً');return}
                    try{
                      await api.post(`${API}/subscribers/send-field-otp`,{field,value:val})
                      alert(`✅ تم إرسال رمز التحقق إلى ${val}`)
                    }catch(e){alert(e?.response?.data?.message||'فشل الإرسال')}
                  }} style={{padding:'9px 12px',borderRadius:'9px',background:'#EEF2FF',color:'#4338ca',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:'700',whiteSpace:'nowrap'}}>
                    📲 تحقق
                  </button>
                </div>
              </div>
            ))}
            {/* القطاعات */}
            <div style={{marginBottom:'12px'}}>
              <label style={{fontSize:'12px',fontWeight:'700',color:'#555',display:'block',marginBottom:'8px'}}>القطاعات</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'8px'}}>
                {['تجارة عامة','استيراد وتصدير','صناعة وتصنيع','مقاولات وإنشاءات','خدمات مهنية','تكنولوجيا ومعلوماتية','نقل ولوجستيات','زراعة وأغذية','صحة وصيدلة','تعليم وتدريب','سياحة وفنادق','عقارات','مالية وتأمين','طاقة وكهرباء','أخرى'].map(sec=>{
                  const cur = (() => { try { return JSON.parse(editSub.sectors||'[]') } catch { return [] } })()
                  const active = cur.includes(sec)
                  return (
                    <button key={sec} type="button" onClick={()=>{
                      const arr = active ? cur.filter(x=>x!==sec) : [...cur, sec]
                      setEditSub(p=>({...p, sectors: JSON.stringify(arr)}))
                    }} style={{padding:'4px 10px',borderRadius:'16px',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'11px',fontWeight:'600',
                      background:active?'#2C3E6B':'#EEF2FF',color:active?'#fff':'#2C3E6B'}}>
                      {active?'✓ ':''}{sec}
                    </button>
                  )
                })}
              </div>
              <button type="button" onClick={()=>{
                  const ALL_SEC = ['تجارة عامة','استيراد وتصدير','صناعة وتصنيع','مقاولات وإنشاءات','خدمات مهنية','تكنولوجيا ومعلوماتية','نقل ولوجستيات','زراعة وأغذية','صحة وصيدلة','تعليم وتدريب','سياحة وفنادق','عقارات','مالية وتأمين','طاقة وكهرباء','أخرى']
                  const cur2 = (() => { try { return JSON.parse(editSub.sectors||'[]') } catch { return [] } })()
                  setEditSub(p=>({...p, sectors: JSON.stringify(cur2.length===ALL_SEC.length ? [] : ALL_SEC)}))
                }}
                style={{padding:'5px 12px',borderRadius:'8px',background:'#FFF8E7',color:'#B8860B',border:'1px solid #fde68a',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'11px',fontWeight:'700',marginTop:'6px'}}>
                {(()=>{ try { return JSON.parse(editSub.sectors||'[]').length } catch { return 0 } })() === 15 ? '❌ إلغاء الكل' : '✅ اختر الكل'}
              </button>
            </div>

            {/* طريقة التواصل */}
            <div style={{marginBottom:'16px'}}>
              <label style={{fontSize:'12px',fontWeight:'700',color:'#555',display:'block',marginBottom:'8px'}}>طريقة التواصل</label>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                {[{k:'whatsapp',l:'واتساب 💬'},{k:'sms',l:'رسالة نصية 📱'},{k:'email',l:'بريد إلكتروني 📧'}].map(({k,l})=>{
                  const cur = (() => { try { return JSON.parse(editSub.notifyBy||'[]') } catch { return [] } })()
                  const active = cur.includes(k)
                  return (
                    <button key={k} type="button" onClick={()=>{
                      const arr = active ? cur.filter(x=>x!==k) : [...cur, k]
                      setEditSub(p=>({...p, notifyBy: JSON.stringify(arr)}))
                    }} style={{padding:'8px 16px',borderRadius:'10px',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:'700',
                      background:active?'#059669':'#F0FDF4',color:active?'#fff':'#059669'}}>
                      {active?'✓ ':''}{l}
                    </button>
                  )
                })}
                <button type="button" onClick={()=>setEditSub(p=>({...p,notifyBy:JSON.stringify(['whatsapp','sms','email'])}))}
                  style={{padding:'8px 14px',borderRadius:'10px',background:'#FFF8E7',color:'#B8860B',border:'1px solid #fde68a',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:'700'}}>
                  ✅ كل الطرق
                </button>
              </div>
            </div>

            <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
              <button onClick={async()=>{
                const sec = (() => { try { return JSON.parse(editSub.sectors||'[]') } catch { return [] } })()
                if (sec.length === 0) { alert('⚠️ اختر قطاعاً واحداً على الأقل'); return }
                const ntf = (() => { try { return JSON.parse(editSub.notifyBy||'[]') } catch { return [] } })()
                if (ntf.length === 0) { alert('⚠️ اختر طريقة تواصل واحدة على الأقل'); return }
                await api.put(`${API}/subscribers/${editSub.id}`,editSub); setEditSub(null); load(page,search)
              }} style={{flex:1,padding:'11px',borderRadius:'10px',background:'#2C3E6B',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'800'}}>💾 حفظ</button>
              <button onClick={()=>setEditSub(null)}
                style={{flex:1,padding:'11px',borderRadius:'10px',background:'#f5f7fa',color:'#666',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif'}}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div style={{textAlign:'center',padding:'40px',color:'#888'}}>⏳ جاري التحميل...</div> : (()=>{
        const di = notifyFilter ? items.filter(s=>{try{return JSON.parse(s.notifyBy||'[]').includes(notifyFilter)}catch{return false}}) : items
        return (
        <div>
          {/* Desktop: جدول */}
          <div className="sub-table-wrap" style={{background:'#fff',borderRadius:'16px',overflow:'auto',boxShadow:'0 4px 16px rgba(44,62,107,0.08)',display:isMobile?'none':'block'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px',minWidth:'700px'}}>
              <thead>
                <tr style={{background:'#2C3E6B',color:'#fff'}}>
                  <th style={{padding:'12px 16px',textAlign:'right'}}>#</th>
                  <th style={{padding:'12px 16px',textAlign:'right'}}>الاسم</th>
                  <th style={{padding:'12px 16px',textAlign:'right'}}>الهاتف</th>
                  <th style={{padding:'12px 16px',textAlign:'right'}}>البريد</th>
                  <th style={{padding:'12px 16px',textAlign:'right'}}>الإشعار</th>
                  <th style={{padding:'12px 16px',textAlign:'right'}}>الحالة</th>
                  <th style={{padding:'12px 16px',textAlign:'center'}}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {di.map((s,i) => (
                  <tr key={s.id} style={{borderBottom:'1px solid #f0f2f7',background:s.isActive===false?'#fff5f5':i%2===0?'#fff':'#fafbff'}}>
                    <td style={{padding:'10px 16px',color:'#888'}}>{(page-1)*pageSize+i+1}</td>
                    <td style={{padding:'10px 16px'}}>
                      <div style={{fontWeight:'700',color:'#2C3E6B'}}>{s.fullName}</div>
                      <div style={{fontSize:'11px',color:'#aaa'}}>{sectorsLabel(s.sectors)}</div>
                    </td>
                    <td style={{padding:'10px 16px',direction:'ltr',fontSize:'12px'}}>{s.phone}</td>
                    <td style={{padding:'10px 16px',fontSize:'12px',color:'#666'}}>{s.email||'—'}</td>
                    <td style={{padding:'10px 16px',textAlign:'center'}}>{notifyLabel(s.notifyBy)}</td>
                    <td style={{padding:'10px 16px',textAlign:'center'}}>
                      <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',
                        background:s.isActive!==false?'#dcfce7':'#fee2e2',color:s.isActive!==false?'#16a34a':'#dc2626'}}>
                        {s.isActive!==false?'✅ نشط':'⏸️ موقوف'}
                      </span>
                    </td>
                    <td style={{padding:'10px 16px',textAlign:'center',whiteSpace:'nowrap'}}>
                      {btn(s.isActive!==false?'⏸️ إيقاف':'▶️ تفعيل',()=>toggleActive(s),s.isActive!==false?'#fff8e7':'#f0fdf4',s.isActive!==false?'#b45309':'#16a34a')}
                      {btn('✏️ تعديل',()=>setEditSub({...s}),'#EEF2FF','#4338ca')}
                      {btn('🗑️',()=>del(s.id),'#fee2e2','#dc2626')}
                    </td>
                  </tr>
                ))}
                {di.length===0 && <tr><td colSpan={7} style={{padding:'40px',textAlign:'center',color:'#aaa'}}>لا يوجد متابعون</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Mobile: بطاقات */}
          <div className="sub-cards-wrap" style={{display:isMobile?'block':'none'}}>
            {di.map((s,i) => (
              <div key={s.id} style={{background:s.isActive===false?'#fff5f5':'#fff',borderRadius:'14px',padding:'16px',marginBottom:'10px',boxShadow:'0 2px 10px rgba(44,62,107,0.07)',border:'1px solid #eef0f7'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                  <div>
                    <span style={{fontWeight:'800',color:'#2C3E6B',fontSize:'14px'}}>{s.fullName}</span>
                    <div style={{fontSize:'12px',color:'#888',direction:'ltr',marginTop:'2px'}}>{s.phone}</div>
                    {s.email && <div style={{fontSize:'11px',color:'#aaa'}}>{s.email}</div>}
                  </div>
                  <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',
                    background:s.isActive!==false?'#dcfce7':'#fee2e2',color:s.isActive!==false?'#16a34a':'#dc2626'}}>
                    {s.isActive!==false?'✅':'⏸️'}
                  </span>
                </div>
                <div style={{fontSize:'11px',color:'#666',marginBottom:'10px'}}>
                  {notifyLabel(s.notifyBy)}
                </div>
                <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                  {btn(s.isActive!==false?'⏸️ إيقاف':'▶️ تفعيل',()=>toggleActive(s),s.isActive!==false?'#fff8e7':'#f0fdf4',s.isActive!==false?'#b45309':'#16a34a')}
                  {btn('✏️ تعديل',()=>setEditSub({...s}),'#EEF2FF','#4338ca')}
                  {btn('🗑️ حذف',()=>del(s.id),'#fee2e2','#dc2626')}
                </div>
              </div>
            ))}
            {di.length===0 && <div style={{textAlign:'center',padding:'40px',color:'#aaa'}}>لا يوجد متابعون</div>}
          </div>

          {/* Pagination */}
          {total > pageSize && (
            <div style={{padding:'16px',display:'flex',gap:'8px',justifyContent:'center',alignItems:'center',flexWrap:'wrap'}}>
              <button onClick={()=>{setPage(1);load(1,search)}} disabled={page===1} style={{padding:'7px 13px',borderRadius:'8px',border:'1px solid #dde3ed',cursor:page===1?'default':'pointer',fontFamily:'Cairo,sans-serif'}}>««</button>
              <button onClick={()=>{const p=page-1;setPage(p);load(p,search)}} disabled={page===1} style={{padding:'7px 13px',borderRadius:'8px',border:'1px solid #dde3ed',cursor:page===1?'default':'pointer',fontFamily:'Cairo,sans-serif'}}>‹</button>
              <span style={{fontSize:'13px',color:'#666',padding:'0 8px'}}>صفحة {page} من {Math.ceil(total/pageSize)}</span>
              <button onClick={()=>{const p=page+1;setPage(p);load(p,search)}} disabled={page>=Math.ceil(total/pageSize)} style={{padding:'7px 13px',borderRadius:'8px',border:'1px solid #dde3ed',cursor:'pointer',fontFamily:'Cairo,sans-serif'}}>›</button>
              <button onClick={()=>{const last=Math.ceil(total/pageSize);setPage(last);load(last,search)}} disabled={page>=Math.ceil(total/pageSize)} style={{padding:'7px 13px',borderRadius:'8px',border:'1px solid #dde3ed',cursor:'pointer',fontFamily:'Cairo,sans-serif'}}>»»</button>
            </div>
          )}
        </div>
        )
      })()}
    </div>
  )
}

/* ─── Knowledge Base Panel ─── */
function KnowledgePanel() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title:'', keywords:'', type:'text', answer:'', linkUrl:'', category:'' })
  const [msg, setMsg] = useState('')
  const [importFile, setImportFile] = useState(null)
  const pageSize = 20

  const load = async (p=1, q='') => {
    setLoading(true)
    try {
      const r = await api.get(`${API}/knowledge`, { params: { page: p, pageSize, search: q }, headers: authHdrs() })
      setItems(r.data.items || [])
      setTotal(r.data.total || 0)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.title) { setMsg('⚠️ العنوان مطلوب'); return }
    try {
      if (editItem) {
        await api.put(`${API}/knowledge/${editItem.id}`, form, { headers: authHdrs() })
      } else {
        await api.post(`${API}/knowledge`, form, { headers: authHdrs() })
      }
      setMsg('✅ تم الحفظ'); setEditItem(null); setShowAdd(false)
      setForm({ title:'', keywords:'', type:'text', answer:'', linkUrl:'', category:'' })
      load(page, search)
    } catch { setMsg('❌ حدث خطأ') }
  }

  const del = async (id) => {
    if (!window.confirm('حذف؟')) return
    await api.delete(`${API}/knowledge/${id}`, { headers: authHdrs() })
    load(page, search)
  }

  const importExcel = async () => {
    if (!importFile) return
    const fd = new FormData(); fd.append('file', importFile)
    try {
      const r = await api.post(`${API}/knowledge/import-excel`, fd, { headers: { ...authHdrs(), 'Content-Type': 'multipart/form-data' } })
      setMsg('✅ ' + r.data.message); setImportFile(null); load()
    } catch { setMsg('❌ فشل الاستيراد') }
  }

  const openEdit = (item) => { setEditItem(item); setForm({...item}); setShowAdd(true) }

  const typeLabel = (t) => t === 'link' ? '🔗 رابط' : t === 'file' ? '📎 ملف' : '📝 نص'

  const FormModal = () => (
    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
      <div style={{background:'#fff',borderRadius:'16px',padding:'24px',width:'100%',maxWidth:'520px',direction:'rtl',fontFamily:'Cairo,sans-serif',maxHeight:'90vh',overflow:'auto'}}>
        <h3 style={{color:'#2C3E6B',margin:'0 0 16px',fontWeight:'800'}}>{editItem?'✏️ تعديل':'➕ إضافة'} معرفة</h3>
        {[['العنوان *','title'],['المفاتيح (كلمات مفتاحية مفصولة بفاصلة)','keywords'],['التصنيف','category']].map(([lbl,k])=>(
          <div key={k} style={{marginBottom:'12px'}}>
            <label style={{fontSize:'12px',fontWeight:'700',color:'#555',display:'block',marginBottom:'4px'}}>{lbl}</label>
            <input value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
              style={{width:'100%',padding:'9px 12px',borderRadius:'9px',border:'1.5px solid #dde3ed',fontSize:'13px',fontFamily:'Cairo,sans-serif',boxSizing:'border-box'}}/>
          </div>
        ))}
        <div style={{marginBottom:'12px'}}>
          <label style={{fontSize:'12px',fontWeight:'700',color:'#555',display:'block',marginBottom:'4px'}}>النوع</label>
          <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}
            style={{width:'100%',padding:'9px 12px',borderRadius:'9px',border:'1.5px solid #dde3ed',fontSize:'13px',fontFamily:'Cairo,sans-serif'}}>
            <option value="text">📝 نص</option>
            <option value="link">🔗 رابط</option>
            <option value="file">📎 ملف</option>
          </select>
        </div>
        {form.type === 'link' && (
          <div style={{marginBottom:'12px'}}>
            <label style={{fontSize:'12px',fontWeight:'700',color:'#555',display:'block',marginBottom:'4px'}}>الرابط</label>
            <input value={form.linkUrl||''} onChange={e=>setForm(p=>({...p,linkUrl:e.target.value}))} placeholder="https://"
              style={{width:'100%',padding:'9px 12px',borderRadius:'9px',border:'1.5px solid #dde3ed',fontSize:'13px',fontFamily:'Cairo,sans-serif',direction:'ltr',boxSizing:'border-box'}}/>
          </div>
        )}
        <div style={{marginBottom:'16px'}}>
          <label style={{fontSize:'12px',fontWeight:'700',color:'#555',display:'block',marginBottom:'4px'}}>الإجابة / المحتوى</label>
          <textarea value={form.answer||''} onChange={e=>setForm(p=>({...p,answer:e.target.value}))} rows={5}
            style={{width:'100%',padding:'9px 12px',borderRadius:'9px',border:'1.5px solid #dde3ed',fontSize:'13px',fontFamily:'Cairo,sans-serif',resize:'vertical',boxSizing:'border-box'}}/>
        </div>
        {msg && <div style={{color:msg.startsWith('✅')?'#16a34a':'#dc2626',fontSize:'13px',marginBottom:'8px'}}>{msg}</div>}
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={save} style={{flex:1,padding:'11px',borderRadius:'10px',background:'#2C3E6B',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'800'}}>💾 حفظ</button>
          <button onClick={()=>{setShowAdd(false);setEditItem(null);setMsg('')}} style={{flex:1,padding:'11px',borderRadius:'10px',background:'#f5f7fa',color:'#666',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif'}}>إلغاء</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{padding:'24px',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      {showAdd && <FormModal/>}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
        <h2 style={{color:'#2C3E6B',fontWeight:'900',fontSize:'20px',margin:0}}>🧠 قاعدة المعرفة ({total})</h2>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
          <input value={search} onChange={e=>{setSearch(e.target.value);load(1,e.target.value)}} placeholder="بحث..."
            style={{padding:'9px 12px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'13px',fontFamily:'Cairo,sans-serif',width:'160px',outline:'none'}}/>
          <label style={{padding:'9px 14px',borderRadius:'10px',background:'#f0fdf4',color:'#16a34a',border:'1px solid #86efac',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'13px',fontWeight:'700'}}>
            📥 استيراد CSV
            <input type="file" accept=".csv,.xlsx" onChange={e=>setImportFile(e.target.files[0])} style={{display:'none'}}/>
          </label>
          {importFile && <button onClick={importExcel} style={{padding:'9px 14px',borderRadius:'10px',background:'#059669',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'13px',fontWeight:'700'}}>✅ رفع</button>}
          <button onClick={()=>{setShowAdd(true);setEditItem(null);setForm({title:'',keywords:'',type:'text',answer:'',linkUrl:'',category:''})}}
            style={{padding:'9px 16px',borderRadius:'10px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'13px',fontWeight:'700'}}>
            + إضافة
          </button>
        </div>
      </div>
      {msg && !showAdd && <div style={{background:'#f0fdf4',color:'#16a34a',padding:'10px 14px',borderRadius:'10px',marginBottom:'12px',fontWeight:'700'}}>{msg}</div>}
      <div style={{background:'#fff',borderRadius:'16px',overflow:'auto',boxShadow:'0 4px 16px rgba(44,62,107,0.08)'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px',minWidth:'600px'}}>
          <thead>
            <tr style={{background:'#2C3E6B',color:'#fff'}}>
              <th style={{padding:'12px 16px',textAlign:'right'}}>#</th>
              <th style={{padding:'12px 16px',textAlign:'right'}}>العنوان</th>
              <th style={{padding:'12px 16px',textAlign:'right'}}>المفاتيح</th>
              <th style={{padding:'12px 16px',textAlign:'right'}}>النوع</th>
              <th style={{padding:'12px 16px',textAlign:'right'}}>التصنيف</th>
              <th style={{padding:'12px 16px',textAlign:'center'}}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((k,i) => (
              <tr key={k.id} style={{borderBottom:'1px solid #f0f2f7',background:i%2===0?'#fff':'#fafbff'}}>
                <td style={{padding:'10px 16px',color:'#888'}}>{(page-1)*pageSize+i+1}</td>
                <td style={{padding:'10px 16px',fontWeight:'700',color:'#2C3E6B',maxWidth:'200px'}}>
                  <div>{k.title}</div>
                  {k.answer && <div style={{fontSize:'11px',color:'#888',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{k.answer.slice(0,60)}...</div>}
                </td>
                <td style={{padding:'10px 16px',fontSize:'12px',color:'#666',maxWidth:'150px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{k.keywords}</td>
                <td style={{padding:'10px 16px'}}><span style={{padding:'3px 8px',borderRadius:'12px',fontSize:'11px',fontWeight:'700',background:'#EEF2FF',color:'#4338ca'}}>{typeLabel(k.type)}</span></td>
                <td style={{padding:'10px 16px',fontSize:'12px',color:'#666'}}>{k.category||'—'}</td>
                <td style={{padding:'10px 16px',textAlign:'center',whiteSpace:'nowrap'}}>
                  <button onClick={()=>openEdit(k)} style={{background:'#EEF2FF',color:'#4338ca',border:'none',borderRadius:'7px',padding:'4px 10px',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'11px',fontWeight:'700',margin:'1px'}}>✏️ تعديل</button>
                  <button onClick={()=>del(k.id)} style={{background:'#fee2e2',color:'#dc2626',border:'none',borderRadius:'7px',padding:'4px 10px',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'11px',fontWeight:'700',margin:'1px'}}>🗑️</button>
                </td>
              </tr>
            ))}
            {items.length===0 && <tr><td colSpan={6} style={{padding:'40px',textAlign:'center',color:'#aaa'}}>لا توجد بيانات</td></tr>}
          </tbody>
        </table>
        {total > pageSize && (
          <div style={{padding:'12px',display:'flex',gap:'8px',justifyContent:'center',alignItems:'center'}}>
            <button onClick={()=>{setPage(1);load(1,search)}} disabled={page===1} style={{padding:'6px 12px',borderRadius:'8px',border:'1px solid #dde3ed',cursor:page===1?'default':'pointer',fontFamily:'Cairo,sans-serif'}}>««</button>
            <button onClick={()=>{const p=page-1;setPage(p);load(p,search)}} disabled={page===1} style={{padding:'6px 12px',borderRadius:'8px',border:'1px solid #dde3ed',cursor:page===1?'default':'pointer',fontFamily:'Cairo,sans-serif'}}>‹</button>
            <span style={{fontSize:'13px',color:'#666'}}>صفحة {page} من {Math.ceil(total/pageSize)}</span>
            <button onClick={()=>{const p=page+1;setPage(p);load(p,search)}} disabled={page>=Math.ceil(total/pageSize)} style={{padding:'6px 12px',borderRadius:'8px',border:'1px solid #dde3ed',cursor:'pointer',fontFamily:'Cairo,sans-serif'}}>›</button>
            <button onClick={()=>{const last=Math.ceil(total/pageSize);setPage(last);load(last,search)}} disabled={page>=Math.ceil(total/pageSize)} style={{padding:'6px 12px',borderRadius:'8px',border:'1px solid #dde3ed',cursor:'pointer',fontFamily:'Cairo,sans-serif'}}>»»</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Admin Chats Panel ─── */
function AdminChatsPanel() {
  const [chats, setChats] = useState([])
  const [total, setTotal] = useState(0)
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [msg, setMsg] = useState('')
  const bottomRef = useRef(null)

  const load = async () => {
    try {
      const r = await api.get(`${API}/chat/all`, { params: { status: statusFilter }, headers: authHdrs() })
      setChats(r.data.items || [])
      setTotal(r.data.total || 0)
    } catch {}
  }

  const loadMessages = async (chatId, subscriberId) => {
    try {
      const r = await api.get(`${API}/chat/${chatId}/messages?subscriberId=${subscriberId}`)
      setMessages(r.data.messages || [])
      setActiveChat(r.data.chat)
    } catch {}
  }

  useEffect(() => { load() }, [statusFilter])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendReply = async () => {
    if (!reply.trim() || !activeChat) return
    try {
      await api.post(`${API}/chat/${activeChat.id}/admin-reply`, { body: reply }, { headers: authHdrs() })
      setReply('')
      loadMessages(activeChat.id, activeChat.subscriberId)
      setMsg('✅ تم الإرسال'); setTimeout(()=>setMsg(''), 2000)
    } catch { setMsg('❌ حدث خطأ') }
  }

  if (activeChat) return (
    <div style={{height:'calc(100vh - 60px)',display:'flex',flexDirection:'column',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      <div style={{background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',padding:'14px 20px',display:'flex',alignItems:'center',gap:'10px'}}>
        <button onClick={()=>{setActiveChat(null);setMessages([]);load()}} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',fontSize:'18px'}}>←</button>
        <div style={{flex:1}}>
          <div style={{color:'#fff',fontWeight:'800',fontSize:'14px'}}>{activeChat.subject}</div>
          <div style={{color:'rgba(255,255,255,0.6)',fontSize:'11px'}}>المتابع #{activeChat.subscriberId}</div>
        </div>
        {msg && <span style={{color:'#FFC72C',fontSize:'12px',fontWeight:'700'}}>{msg}</span>}
      </div>
      <div style={{flex:1,overflow:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:'10px'}}>
        {messages.map(m=>(
          <div key={m.id} style={{display:'flex',justifyContent:m.sender==='user'?'flex-start':'flex-end'}}>
            <div style={{maxWidth:'75%',padding:'10px 14px',borderRadius:m.sender==='user'?'18px 18px 18px 4px':'18px 18px 4px 18px',
              background:m.sender==='user'?'#f0f2f7':m.sender==='admin'?'linear-gradient(135deg,#059669,#047857)':'linear-gradient(135deg,#2C3E6B,#4A6FA5)',
              color:m.sender==='user'?'#333':'#fff',fontSize:'13px',lineHeight:'1.6',whiteSpace:'pre-wrap'}}>
              <div style={{fontSize:'10px',color:m.sender==='user'?'#888':'rgba(255,255,255,0.6)',marginBottom:'3px'}}>
                {m.sender==='user'?'👤 المتابع':m.sender==='admin'?'👨‍💼 الأدمن':'🤖 المساعد'}
              </div>
              {m.body}
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:'12px 16px',background:'#fff',borderTop:'1px solid #eef0f7',display:'flex',gap:'8px'}}>
        <input value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendReply()}
          placeholder="اكتب ردك..."
          style={{flex:1,padding:'10px 14px',borderRadius:'24px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',outline:'none'}}/>
        <button onClick={sendReply} disabled={!reply.trim()}
          style={{padding:'10px 18px',borderRadius:'24px',background:reply.trim()?'#2C3E6B':'#f0f2f7',color:reply.trim()?'#fff':'#aaa',border:'none',cursor:reply.trim()?'pointer':'default',fontFamily:'Cairo,sans-serif',fontWeight:'800'}}>
          إرسال ←
        </button>
      </div>
    </div>
  )

  return (
    <div style={{padding:'24px',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
        <h2 style={{color:'#2C3E6B',fontWeight:'900',fontSize:'20px',margin:0}}>💬 المحادثات ({total})</h2>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
          style={{padding:'9px 12px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'13px',fontFamily:'Cairo,sans-serif',background:'#fff'}}>
          <option value=''>كل الحالات</option>
          <option value='open'>🟡 مفتوح</option>
          <option value='answered'>✅ مُجاب</option>
          <option value='closed'>⬛ مغلق</option>
        </select>
      </div>
      {chats.length===0 ? (
        <div style={{background:'#fff',borderRadius:'14px',padding:'40px',textAlign:'center',color:'#aaa'}}>💬 لا توجد محادثات</div>
      ) : chats.map(c=>(
        <div key={c.id} onClick={()=>loadMessages(c.id, c.subscriberId)}
          style={{background:'#fff',borderRadius:'14px',padding:'16px',marginBottom:'10px',cursor:'pointer',boxShadow:'0 2px 8px rgba(44,62,107,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center',border:'1px solid #eef0f7'}}>
          <div>
            <div style={{fontWeight:'800',color:'#2C3E6B',fontSize:'14px'}}>{c.subject}</div>
            <div style={{fontSize:'12px',color:'#888',marginTop:'2px'}}>
              {c.subscriber?.fullName} — {new Date(c.updatedAt||c.createdAt).toLocaleString('ar-IQ')}
            </div>
          </div>
          <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',
            background:c.status==='answered'?'#dcfce7':c.status==='closed'?'#f1f5f9':'#fff8e7',
            color:c.status==='answered'?'#16a34a':c.status==='closed'?'#6b7280':'#b45309'}}>
            {c.status==='answered'?'✅ مُجاب':c.status==='closed'?'مغلق':'🟡 مفتوح'}
          </span>
        </div>
      ))}
    </div>
  )
}
