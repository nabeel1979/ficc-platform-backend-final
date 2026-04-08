import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'
import { useNavigate } from 'react-router-dom'
import OrganizationSelector from '../components/OrganizationSelector'
import Organizations from './Organizations'

const API = '/correspondence'
const getToken = () => localStorage.getItem('ficc_token')
const getUser = () => { try { return JSON.parse(localStorage.getItem('ficc_user')||'{}') } catch { return {} } }
const authHdrs = () => ({ Authorization: `Bearer ${getToken()}` })

// Rich text toolbar
const COLORS = ['#000000','#2C3E6B','#dc2626','#16a34a','#d97706','#7c3aed','#0891b2']
const RichToolbar = () => {
  const exec = (cmd, val=null) => { document.execCommand(cmd, false, val) }
  return (
    <div style={{display:'flex',gap:'4px',flexWrap:'wrap',padding:'8px',background:'#f8f9fa',borderRadius:'8px 8px 0 0',border:'1.5px solid #dde3ed',borderBottom:'none',alignItems:'center'}}>
      {/* Format */}
      {[['bold','B',{fontWeight:'900'}],['italic','I',{fontStyle:'italic'}],['underline','U',{textDecoration:'underline'}]].map(([cmd,icon,s])=>(
        <button key={cmd} type="button" onMouseDown={e=>{e.preventDefault();exec(cmd)}}
          style={{...s,padding:'4px 10px',borderRadius:'6px',border:'1px solid #dde3ed',background:'#fff',cursor:'pointer',fontSize:'13px',fontFamily:'Cairo,sans-serif'}}>
          {icon}
        </button>
      ))}
      <span style={{width:'1px',height:'24px',background:'#dde3ed',margin:'0 2px'}} />
      {/* Font size */}
      <select onMouseDown={e=>e.stopPropagation()} onChange={e=>exec('fontSize',e.target.value)} defaultValue="3"
        style={{padding:'3px 6px',borderRadius:'6px',border:'1px solid #dde3ed',fontSize:'12px',fontFamily:'Cairo,sans-serif',cursor:'pointer'}}>
        <option value="1">صغير</option>
        <option value="3">عادي</option>
        <option value="5">كبير</option>
        <option value="7">أكبر</option>
      </select>
      <span style={{width:'1px',height:'24px',background:'#dde3ed',margin:'0 2px'}} />
      {/* Text colors */}
      {COLORS.map(c=>(
        <button key={c} type="button" onMouseDown={e=>{e.preventDefault();exec('foreColor',c)}}
          style={{width:'20px',height:'20px',borderRadius:'50%',background:c,border:'2px solid #fff',cursor:'pointer',boxShadow:'0 0 0 1px #ccc',flexShrink:0}} title={c} />
      ))}
      <span style={{width:'1px',height:'24px',background:'#dde3ed',margin:'0 2px'}} />
      {/* Lists & align */}
      {[['insertUnorderedList','• قائمة'],['insertOrderedList','١. مرقمة'],['justifyRight','⇒'],['justifyCenter','⇔'],['justifyLeft','⇐']].map(([cmd,icon])=>(
        <button key={cmd} type="button" onMouseDown={e=>{e.preventDefault();exec(cmd)}}
          style={{padding:'4px 8px',borderRadius:'6px',border:'1px solid #dde3ed',background:'#fff',cursor:'pointer',fontSize:'12px',fontFamily:'Cairo,sans-serif'}}>
          {icon}
        </button>
      ))}
    </div>
  )
}

export default function Correspondence() {
  const [tab, setTab] = useState('inbox')
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const [chambers, setChambers] = useState([])
  // Filters
  const [filterSearch, setFilterSearch] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterChamber, setFilterChamber] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  // Resend
  const [resending, setResending] = useState(null)
  const [previewModal, setPreviewModal] = useState(null) // {url, name, type}
  const user = getUser()
  // Get chamberId from multiple sources
  const getChamberId = () => {
    // 1. from user object (new login)
    if (user.chamberId && parseInt(user.chamberId) > 0) return parseInt(user.chamberId)
    if (user.ChamberId && parseInt(user.ChamberId) > 0) return parseInt(user.ChamberId)
    // 2. from JWT token claim
    try {
      const token = getToken()
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const cid = payload['chamberId']
        if (cid && parseInt(cid) > 0) return parseInt(cid)
      }
    } catch {}
    // 3. default admin = الاتحاد (27)
    return 27
  }
  const chamberId = getChamberId()
  const chamberName = user.chamberName || 'اتحاد الغرف التجارية'
  const navigate = useNavigate()

  // Compose state
  const [compose, setCompose] = useState(false)
  const [form, setForm] = useState({ subject:'', body:'', priority:'normal', recipients:[], sendNow:false })
  const [selectedOrgs, setSelectedOrgs] = useState([]) // الجهات المختارة كأيقونات
  const [sendToUnion, setSendToUnion] = useState(false) // إرسال للاتحاد
  const [scannerConnected, setScannerConnected] = useState(false) // حالة اتصال السكانر
  const [showScannerDownload, setShowScannerDownload] = useState(false) // عرض خيار التحميل
  const [attachments, setAttachments] = useState([])  // {file, name, size, status: 'uploading'|'done'|'error', filePath}
  const [draftId, setDraftId] = useState(null)  // auto-created draft ID for attachment uploads
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [scannerMonitoring, setScannerMonitoring] = useState(false)
  const monitorIntervalRef = useRef(null)
  const lastScannedFilesRef = useRef(new Set())
  
  // Organizations (Jehates)
  const [organizations, setOrganizations] = useState([])
  const [showOrgModal, setShowOrgModal] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [orgForm, setOrgForm] = useState({name: '', chambers: []})
  const [currentTab, setCurrentTab] = useState('draft')  // draft | organizations
  const [replyText, setReplyText] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const editorRef = useRef()

  useEffect(() => {
    // Refresh user info to get latest ChamberId
    api.get('/auth/me', { headers: authHdrs() }).then(r => {
      if (r.data.chamberId || r.data.ChamberId) {
        const storedUser = JSON.parse(localStorage.getItem('ficc_user')||'{}')
        localStorage.setItem('ficc_user', JSON.stringify({...storedUser, ...r.data}))
      }
    }).catch(()=>{})
    api.get('/chambers', { headers: authHdrs() })
      .then(r => {
        const list = Array.isArray(r.data)?r.data:r.data.items||[]
        // Exclude sender's own chamber
        const filtered = list.filter(c => c.id !== chamberId)
        setChambers(filtered)
        // Default: NO recipients selected (user must choose)
        setForm(f => ({...f, recipients: []}))
      }).catch(()=>{})
    loadItems()
    // Unread count
    api.get(`${API}/unread/${chamberId}`, { headers: authHdrs() })
      .then(r => setUnread(r.data.count)).catch(()=>{})
  }, [tab])

  const loadItems = async () => {
    setLoading(true)
    try {
      const endpoints = { inbox:`${API}/inbox/${chamberId}`, sent:`${API}/sent/${chamberId}`, drafts:`${API}/drafts/${chamberId}` }
      const r = await api.get(endpoints[tab] || endpoints.inbox, { headers: authHdrs() })
      setItems(r.data)
    } catch { setItems([]) }
    setLoading(false)
  }

  const openLetter = async (id) => {
    const r = await api.get(`${API}/${id}?viewerId=${chamberId}`, { headers: authHdrs() })
    setSelected(r.data)
    if (tab==='inbox') setUnread(u => Math.max(0,u-1))
  }

  const handleSend = async (draft=false) => {
    if (!form.subject) { setMsg('الموضوع مطلوب'); return }
    if (!draft && form.recipients.length===0) { setMsg('يجب اختيار مستلم واحد على الأقل للإرسال'); return }
    // Block send if any file still uploading
    if (!draft && attachments.some(a=>a.status==='uploading')) {
      setMsg('⏳ انتظر اكتمال رفع الملفات أولاً'); return
    }
    setSaving(true); setMsg('')
    const body = editorRef.current?.innerHTML || form.body
    let r
    if (draftId) {
      // Update existing draft then send
      await api.put(`${API}/${draftId}`, {
        subject: form.subject, body, priority: form.priority,
        recipients: form.recipients, status: draft?'draft':'sent', sentAt: draft?null:new Date().toISOString()
      }, { headers: authHdrs() }).catch(()=>{})
      if (!draft) await api.post(`${API}/${draftId}/send`, {}, { headers: authHdrs() }).catch(()=>{})
      // جيب رقم الكتاب من السيرفر
      const updated = await api.get(`${API}/${draftId}?viewerId=${chamberId}`, { headers: authHdrs() }).catch(()=>null)
      r = { data: { id: draftId, referenceNumber: updated?.data?.referenceNumber || '—' } }
    } else {
      r = await api.post(API, {
        subject: form.subject, body,
        senderId: chamberId, senderName: chamberName,
        priority: form.priority, sendNow: !draft,
        recipients: form.recipients
      }, { headers: authHdrs() }).catch(e=>{ setMsg('❌ ' + (e.response?.data?.message||'خطأ')); setSaving(false); return null })
      if (!r) return
    }
    setMsg(draft ? '✅ تم حفظ المسودة' : `✅ تم الإرسال — رقم الكتاب: ${r.data.referenceNumber}`)
    if (draft) {
      // Switch to drafts tab after saving
      setTimeout(()=>{
        setCompose(false)
        setTab('drafts')
      }, 1000)
    } else {
      // Close and go to sent tab
      setTimeout(()=>{
        setCompose(false)
        setForm({subject:'',body:'',priority:'normal',recipients:chambers.map(c=>({chamberId:c.id,chamberName:c.name})),sendNow:false})
        setAttachments([])
        setTab('sent')
      }, 1500)
    }
    setSaving(false)
  }

  const handleReply = async () => {
    if (!replyText.trim()) return
    await api.post(`${API}/${selected.id}/reply`, { senderId:chamberId, senderName:chamberName, body:replyText }, { headers: authHdrs() })
    setReplyText('')
    const r = await api.get(`${API}/${selected.id}?viewerId=${chamberId}`, { headers: authHdrs() })
    setSelected(r.data)
  }

  const toggleRecipient = (c) => {
    const exists = form.recipients.find(r => r.chamberId === c.id)
    if (exists) setForm({...form, recipients: form.recipients.filter(r => r.chamberId !== c.id)})
    else setForm({...form, recipients: [...form.recipients, {chamberId:c.id, chamberName:c.name}]})
  }

  const selectAll = () => setForm({...form, recipients: chambers.map(c=>({chamberId:c.id,chamberName:c.name}))})
  const clearAll  = () => setForm({...form, recipients: []})

  // فتح NAPS2 عبر FICC Scanner Local Server أو تحميل الـ App
  const openScannerApp = async () => {
    setShowUploadModal(false)
    setMsg('⏳ جاري فتح السكانر...')

    try {
      // أنشئ مسودة إذا ما موجودة
      let lid = draftId
      if (!lid) {
        const dr = await api.post(API, {
          subject: form.subject || '(مسودة)',
          body: editorRef.current?.innerHTML || '',
          senderId: chamberId, senderName: chamberName,
          priority: form.priority, sendNow: false, recipients: []
        }, { headers: authHdrs() })
        lid = dr.data.id
        setDraftId(lid)
      }

      // تحقق أن FICC Scanner App شغّال
      const pingRes = await fetch('http://127.0.0.1:39271/ping', { signal: AbortSignal.timeout(2000) })
        .catch(() => null)

      if (pingRes?.ok) {
        // الـ App شغّال - أرسل طلب فتح NAPS2
        const res = await fetch('http://127.0.0.1:39271/open-naps2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draftId: lid, token: getToken() })
        })
        const data = await res.json()

        if (data.success) {
          setMsg('✅ NAPS2 مفتوح — امسح الوثيقة وستُرفع تلقائياً!')
          startScannerMonitoring()
        } else {
          setMsg('⚠️ ' + data.error)
        }
      } else {
        // الـ App مو شغّال - عرض خيار التحميل مباشرة
        downloadScannerApp()
      }
    } catch (err) {
      setMsg('⚠️ تعذّر الاتصال — حاول تحميل FICC Scanner')
      setShowScannerDownload(true)
    }
  }

  // تحميل FICC Scanner
  const downloadScannerApp = () => {
    setMsg('📥 جاري تحميل FICC Scanner من السيرفر...')
    // حمّل مباشرة عبر فتح الرابط
    const downloadUrl = window.location.protocol + '//' + window.location.host + '/FICC-Scanner-Source.zip'
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = 'FICC-Scanner-Setup.zip'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      setMsg('✅ تم التحميل! الملف: FICC-Scanner-Setup.zip\n\n📋 الخطوات:\n1️⃣ استخرج الملف\n2️⃣ افتح PowerShell\n3️⃣ cd scanner-electron\n4️⃣ npm install\n5️⃣ npm start')
    }, 500)
  }

  const startScannerMonitoring = () => {
    // وقف أي مراقبة سابقة
    if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current)
    
    let elapsedTime = 0
    monitorIntervalRef.current = setInterval(async () => {
      elapsedTime += 1000  // كل ثانية بدل 2
      
      // توقف بعد 60 ثانية (بدل 30)
      if (elapsedTime > 60000) {
        clearInterval(monitorIntervalRef.current)
        setScannerMonitoring(false)
        return
      }
      
      try {
        // البحث عن صور جديدة في مجلد NAPS2 (عبر API backend)
        const r = await api.get(`/api/correspondence/scan-folder`, {
          headers: authHdrs(),
          params: { lastFiles: JSON.stringify(Array.from(lastScannedFilesRef.current)) }
        })
        
        if (r.data.files && r.data.files.length > 0) {
          // وجدنا صور جديدة!
          r.data.files.forEach(async (filePath) => {
            lastScannedFilesRef.current.add(filePath)
            
            // تحميل الصورة
            try {
              const response = await fetch(filePath)
              const blob = await response.blob()
              const file = new File([blob], filePath.split('\\').pop(), { type: 'image/jpeg' })
              uploadFile(file)
            } catch (err) {
              console.error('فشل تحميل الصورة:', err)
            }
          })
          
          // توقف المراقبة بعد العثور على صور
          clearInterval(monitorIntervalRef.current)
          setScannerMonitoring(false)
        }
      } catch (err) {
        // لا بأس - ربما لا توجد صور بعد
      }
    }, 2000)
  }

  useEffect(() => {
    return () => {
      if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current)
    }
  }, [])

  // Auto-refresh المرفقات كل 3 ثواني لما يكون في مسودة
  useEffect(() => {
    if (!draftId) return
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`${API}/${draftId}`, { headers: authHdrs() })
        if (res.data?.attachments) {
          setAttachments(prev => {
            // الملفات من السيرفر
            const serverFiles = res.data.attachments.map(a => ({
              tempId: `server_${a.id}`,
              id: a.id,
              name: a.fileName,
              size: a.fileSize,
              filePath: a.filePath,
              status: 'done'
            }))
            // دمج مع الملفات اللي لسا ترفع (uploading فقط — مو المكتملة)
            const serverFileNames = serverFiles.map(a => a.name)
            const uploading = prev.filter(a => a.status === 'uploading' && !serverFileNames.includes(a.name))
            return [...serverFiles, ...uploading]
          })
        }
      } catch {}
    }, 3000)
    return () => clearInterval(interval)
  }, [draftId])

  // فحص حالة اتصال السكانر كل 5 ثواني + polling آخر رفع
  const lastUploadRef = useRef(null)
  useEffect(() => {
    const checkScanner = async () => {
      try {
        const res = await fetch('http://127.0.0.1:39271/ping', {
          signal: AbortSignal.timeout(1000)
        }).catch(() => null)
        if (res?.ok) {
          const data = await res.json()
          setScannerConnected(true)
        } else {
          setScannerConnected(false)
        }
      } catch {
        setScannerConnected(false)
      }
    }

    // polling آخر رفع من الـ Scanner
    const checkLastUpload = async () => {
      try {
        const res = await fetch('http://127.0.0.1:39271/last-upload', {
          signal: AbortSignal.timeout(1000)
        }).catch(() => null)
        if (res?.ok) {
          const data = await res.json()
          if (data.lastUpload && data.lastUpload.time !== lastUploadRef.current) {
            lastUploadRef.current = data.lastUpload.time
            // ملف جديد رُفع! حدّث المرفقات
            if (data.draftId) {
              try {
                const attachRes = await api.get(`${API}/${data.draftId}`, { headers: authHdrs() })
                if (attachRes.data?.attachments) {
                  const serverFiles = attachRes.data.attachments.map(a => ({
                    tempId: `server_${a.id}`,
                    id: a.id,
                    name: a.fileName,
                    size: a.fileSize,
                    filePath: a.filePath,
                    status: 'done'
                  }))
                  setAttachments(serverFiles)
                  setMsg(`✅ تم رفع "${data.lastUpload.fileName}" من السكانر!`)
                }
              } catch {}
            }
          }
        }
      } catch {}
    }

    checkScanner()
    // فحص الـ Scanner كل 10 ثواني فقط — مو كل 5
    const scannerInterval = setInterval(checkScanner, 10000)
    // فحص آخر رفع فقط لما الـ Scanner متصل
    const uploadInterval = setInterval(() => {
      if (scannerConnected) checkLastUpload()
    }, 3000)
    return () => {
      clearInterval(scannerInterval)
      clearInterval(uploadInterval)
    }
  }, [scannerConnected])

  const uploadFile = async (file) => {
    console.log('Uploading file:', file.name, file.size);
    
    // ينشئ مسودة تلقائياً لو ما موجودة
    // Add with uploading status
    const tempId = Date.now()
    setAttachments(prev => [...prev, {tempId, file, name:file.name, size:file.size, status:'uploading', filePath:null}])
    try {
      // Create draft if not exists
      let lid = draftId
      if (!lid) {
        const dr = await api.post(API, {
          subject: form.subject || '(مسودة)',
          body: editorRef.current?.innerHTML || '',
          senderId: chamberId, senderName: chamberName,
          priority: form.priority, sendNow: false, recipients: []
        }, { headers: authHdrs() })
        lid = dr.data.id
        setDraftId(lid)
      }
      // Upload file
      const fd = new FormData(); fd.append('file', file)
      const res = await api.post(`${API}/${lid}/attach`, fd, { headers: { Authorization: authHdrs().Authorization } })
      console.log('Upload response:', res.data)
      setAttachments(prev => prev.map(a => a.tempId===tempId
        ? {...a, status:'done', filePath:res.data.filePath, name: res.data.fileName || a.name}
        : a
      ))
    } catch (err) {
      console.error('Upload error:', err?.response?.status, err?.message)
      // إذا 401 - Token منتهي
      if (err?.response?.status === 401) {
        setAttachments(prev => prev.map(a => a.tempId===tempId ? {...a, status:'error', errorMsg:'انتهت صلاحية الجلسة - سجّل دخول من جديد'} : a))
        setMsg('⚠️ انتهت صلاحية الجلسة — يرجى تسجيل الدخول من جديد')
      } else {
        setAttachments(prev => prev.map(a => a.tempId===tempId ? {...a, status:'error', errorMsg:'فشل الرفع'} : a))
      }
    }
  }

  const priorityColor = { normal:'#4A6FA5', urgent:'#dc2626', secret:'#7c3aed' }
  const priorityLabel = { normal:'📄 عادي', urgent:'🔴 عاجل', secret:'🔒 سري' }

  // Preview Modal
  if (previewModal) return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',zIndex:9999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'16px'}}>
      <div style={{display:'flex',justifyContent:'space-between',width:'100%',maxWidth:'800px',marginBottom:'12px',alignItems:'center'}}>
        <span style={{color:'#fff',fontSize:'14px',fontFamily:'Cairo,sans-serif'}}>{previewModal.name}</span>
        <button onClick={()=>setPreviewModal(null)}
          style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',borderRadius:'50%',width:'36px',height:'36px',cursor:'pointer',fontSize:'18px',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
      </div>
      <img src={previewModal.url} alt={previewModal.name}
        style={{maxWidth:'100%',maxHeight:'80vh',objectFit:'contain',borderRadius:'12px',boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}} />
    </div>
  )

  // Compose Screen
  if (compose) return (
    <div style={{minHeight:'100vh',background:'#F5F7FA',padding:'20px',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      <div style={{maxWidth:'900px',margin:'0 auto'}}>
        <div style={{background:'#fff',borderRadius:'16px',padding:'24px',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'20px',alignItems:'center'}}>
            <h2 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'20px',margin:0}}>✍️ كتاب جديد</h2>
            <button onClick={()=>setCompose(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'20px',color:'#888'}}>✕</button>
          </div>

          {/* Priority */}
          <div style={{marginBottom:'16px'}}>
            <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#2C3E6B',marginBottom:'6px'}}>الأولوية</label>
            <div style={{display:'flex',gap:'8px'}}>
              {Object.entries(priorityLabel).map(([k,v]) => (
                <button key={k} type="button" onClick={()=>setForm({...form,priority:k})}
                  style={{padding:'8px 16px',borderRadius:'10px',border:`2px solid ${form.priority===k?priorityColor[k]:'#dde3ed'}`,background:form.priority===k?priorityColor[k]+'22':'#fff',color:form.priority===k?priorityColor[k]:'#666',cursor:'pointer',fontSize:'13px',fontWeight:'700',fontFamily:'Cairo,sans-serif'}}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div style={{marginBottom:'16px'}}>
            <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#2C3E6B',marginBottom:'6px'}}>الموضوع *</label>
            <input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="موضوع الكتاب الرسمي..."
              style={{width:'100%',padding:'12px 16px',borderRadius:'12px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',direction:'rtl',outline:'none',boxSizing:'border-box'}} />
          </div>

          {/* Recipients */}
          <div style={{marginBottom:'16px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
              <label style={{fontSize:'13px',fontWeight:'700',color:'#2C3E6B'}}>المستلمون * (اختر الغرف)</label>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center'}}>
                <OrganizationSelector 
                  chambers={chambers}
                  onSelectOrganization={(selectedChambers, orgName) => {
                    setSelectedOrgs(prev => {
                      const exists = prev.find(o => o.name === orgName)
                      if (exists) return prev
                      return [...prev, { name: orgName, chambers: selectedChambers }]
                    })
                    setForm(f => {
                      const existing = f.recipients
                      const newOnes = selectedChambers
                        .filter(c => !existing.find(r => r.chamberId === c.id))
                        .map(c => ({ chamberId: c.id, chamberName: c.name }))
                      return { ...f, recipients: [...existing, ...newOnes] }
                    })
                  }}
                />
                {/* Checkbox الاتحاد - يظهر فقط للغرف (مو الاتحاد) */}
                {chamberId !== 27 && (
                  <label style={{display:'flex',alignItems:'center',gap:'6px',cursor:'pointer',padding:'6px 12px',borderRadius:'8px',border:`2px solid ${sendToUnion?'#2C3E6B':'#dde3ed'}`,background:sendToUnion?'#2C3E6B22':'#fff',fontSize:'13px',fontFamily:'Cairo,sans-serif',fontWeight:'700',color:sendToUnion?'#2C3E6B':'#555'}}>
                    <input
                      type="checkbox"
                      checked={sendToUnion}
                      onChange={e => {
                        setSendToUnion(e.target.checked)
                        if (e.target.checked) {
                          // أضيف الاتحاد (id=27) للمستلمين
                          setForm(f => {
                            const exists = f.recipients.find(r => r.chamberId === 27)
                            if (exists) return f
                            return { ...f, recipients: [...f.recipients, { chamberId: 27, chamberName: 'اتحاد الغرف التجارية' }] }
                          })
                        } else {
                          // أحذف الاتحاد من المستلمين
                          setForm(f => ({ ...f, recipients: f.recipients.filter(r => r.chamberId !== 27) }))
                        }
                      }}
                      style={{cursor:'pointer'}}
                    />
                    🏛️ الاتحاد
                  </label>
                )}

              </div>
            </div>
            {/* الجهات المختارة كأيقونات */}
            {selectedOrgs.length > 0 && (
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'8px'}}>
                {selectedOrgs.map((org, idx) => (
                  <div key={idx} style={{
                    display:'flex',alignItems:'center',gap:'6px',
                    padding:'6px 12px',borderRadius:'20px',
                    background:'#2C3E6B',color:'#fff',
                    fontSize:'13px',fontFamily:'Cairo,sans-serif',fontWeight:'700'
                  }}>
                    <span>🏛️ {org.name} ({org.chambers.length} غرف)</span>
                    <button
                      type="button"
                      onClick={() => {
                        // حذف الجهة وغرفها من المستلمين
                        const chamberIds = org.chambers.map(c => c.id)
                        setSelectedOrgs(prev => prev.filter((_, i) => i !== idx))
                        setForm(f => ({
                          ...f,
                          recipients: f.recipients.filter(r => !chamberIds.includes(r.chamberId))
                        }))
                      }}
                      style={{background:'none',border:'none',color:'#fff',cursor:'pointer',fontSize:'14px',padding:'0',lineHeight:1}}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
            {/* عرض الجهات المختارة كأيقونات فقط */}
            {form.recipients.length === 0 && selectedOrgs.length === 0 && !sendToUnion && (
              <div style={{padding:'16px',border:'1.5px dashed #dde3ed',borderRadius:'12px',textAlign:'center',color:'#aaa',fontSize:'13px',fontFamily:'Cairo,sans-serif'}}>
                اختر من الجهات أو حدد الاتحاد
              </div>
            )}
            {form.recipients.length>0 && <p style={{color:'#4A6FA5',fontSize:'12px',margin:'4px 0 0'}}>{form.recipients.length} غرفة محددة</p>}
          </div>

          {/* Rich Text Editor */}
          <div style={{marginBottom:'16px'}}>
            <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#2C3E6B',marginBottom:'6px'}}>نص الكتاب *</label>
            <RichToolbar />
            <div ref={editorRef} contentEditable suppressContentEditableWarning
              style={{minHeight:'200px',padding:'16px',border:'1.5px solid #dde3ed',borderRadius:'0 0 12px 12px',fontSize:'15px',lineHeight:'2',fontFamily:'Cairo,sans-serif',direction:'rtl',outline:'none',background:'#fff'}}
              data-placeholder="اكتب نص الكتاب هنا..." />
          </div>

          {/* Attachments + Scanner */}
          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#2C3E6B',marginBottom:'8px'}}>📎 المرفقات والوثائق</label>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'10px'}}>
              {/* Single Upload Button + Modal */}
              <button onClick={()=>setShowUploadModal(true)}
                style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 16px',borderRadius:'10px',background:'#2C3E6B',color:'#FFC72C',cursor:'pointer',fontSize:'13px',fontWeight:'700',border:'none',fontFamily:'Cairo,sans-serif'}}>
                📤 إضافة ملف أو صورة
              </button>
            </div>
            
            {/* Upload Modal */}
            {showUploadModal && (
              <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
                <div style={{background:'#fff',borderRadius:'16px',padding:'24px',maxWidth:'400px',width:'90%',boxShadow:'0 10px 40px rgba(0,0,0,0.3)'}}>
                  <h3 style={{textAlign:'center',fontSize:'16px',fontWeight:'700',color:'#2C3E6B',marginBottom:'20px',fontFamily:'Cairo,sans-serif'}}>📤 تحميل ملف أو صورة</h3>
                  
                  {/* Scanner Option */}
                  <button onClick={openScannerApp} disabled={scannerMonitoring}
                    style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderRadius:'12px',background:'#F0FDF4',color:'#16a34a',cursor:scannerMonitoring?'wait':'pointer',fontSize:'13px',fontWeight:'700',border:'2px solid #bbf7d0',marginBottom:'12px',fontFamily:'Cairo,sans-serif',transition:'all 0.2s',width:'100%',justifyContent:'center',opacity:scannerMonitoring?0.6:1}}>
                    <span style={{fontSize:'18px'}}>📸</span>
                    <span>{scannerMonitoring?'⏳ جاري المراقبة...':'من السكانر'}</span>
                  </button>
                  
                  {/* Files Option */}
                  <button type="button"
                    style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'12px',padding:'14px 16px',borderRadius:'12px',background:'#EEF2FF',color:'#2C3E6B',cursor:'pointer',fontSize:'13px',fontWeight:'700',border:'2px solid #c7d2fe',marginBottom:'12px',fontFamily:'Cairo,sans-serif',transition:'all 0.2s',width:'100%'}}
                    onClick={() => {
                      const inp = document.createElement('input')
                      inp.type = 'file'
                      inp.multiple = true
                      inp.accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.bmp'
                      inp.onchange = e => {
                        Array.from(e.target.files).forEach(uploadFile)
                        setShowUploadModal(false)
                      }
                      inp.click()
                    }}>
                    <span style={{fontSize:'18px'}}>📁</span>
                    <span>من الملفات</span>
                  </button>
                  
                  {/* Close Button */}
                  <button onClick={()=>setShowUploadModal(false)}
                    style={{width:'100%',padding:'10px',borderRadius:'8px',background:'#f3f4f6',color:'#6b7280',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:'700',fontFamily:'Cairo,sans-serif'}}>
                    إغلاق
                  </button>
                </div>
              </div>
            )}
            
            {/* Attachments list */}
            {attachments.length > 0 && (
              <div style={{background:'#f8f9fa',borderRadius:'10px',padding:'10px 12px'}}>
                {attachments.map((att,i)=>{
                  const isImg = att.file?.type?.startsWith('image/') || att.name?.match(/\.(jpg|jpeg|png|gif)$/i)
                  const previewUrl = isImg && att.file ? URL.createObjectURL(att.file) : null
                  const isDone = att.status === 'done'
                  const isUploading = att.status === 'uploading'
                  const isError = att.status === 'error'
                  return (
                    <div key={att.tempId||i} style={{display:'flex',gap:'10px',alignItems:'center',padding:'8px 0',borderBottom:i<attachments.length-1?'1px solid #e5e7eb':'none',opacity:isError?0.6:1}}>
                      {/* Preview thumbnail */}
                      <div style={{position:'relative',flexShrink:0}}>
                        {previewUrl ? (
                          <img src={previewUrl} alt="" style={{width:'48px',height:'48px',objectFit:'cover',borderRadius:'8px',border:`2px solid ${isDone?'#10b981':isError?'#dc2626':'#FFC72C'}`,cursor:isDone?'pointer':'default'}}
                            onClick={()=>isDone&&setPreviewModal({url:previewUrl,name:att.name,type:'image'})} />
                        ) : (
                          <div style={{width:'48px',height:'48px',borderRadius:'8px',background:isDone?'#F0FDF4':isError?'#FEF2F2':'#FFF8E7',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',border:`2px solid ${isDone?'#10b981':isError?'#dc2626':'#FFC72C'}`}}>
                            {att.name?.endsWith('.pdf')?'📕':att.name?.startsWith('scan_')?'🖨️':'📄'}
                          </div>
                        )}
                        {/* Status overlay */}
                        <div style={{position:'absolute',bottom:'-6px',right:'-6px',width:'18px',height:'18px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'800',
                          background:isDone?'#10b981':isError?'#dc2626':'#FFC72C',color:'#fff'}}>
                          {isDone?'✓':isError?'!':'⏳'}
                        </div>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:'13px',color:'#333',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{att.name}</p>
                        <p style={{fontSize:'11px',margin:'2px 0 0',color:isDone?'#10b981':isError?'#dc2626':'#d97706'}}>
                          {isDone?'✅ تم التحميل':isError?'❌ فشل التحميل':'⏳ جاري التحميل...'}
                          {att.size && <span style={{color:'#aaa',marginRight:'6px'}}> — {(att.size/1024).toFixed(0)} KB</span>}
                        </p>
                      </div>
                      <button type="button" onClick={()=>setAttachments(prev=>prev.filter((_,j)=>j!==i))}
                        style={{background:'#fee2e2',border:'none',color:'#dc2626',cursor:'pointer',fontSize:'14px',padding:'4px 8px',borderRadius:'8px',flexShrink:0}}>✕</button>
                    </div>
                  )
                })}
                <p style={{color:'#888',fontSize:'11px',margin:'6px 0 0'}}>{attachments.length} ملف {attachments.filter(a=>a.status==='uploading').length>0?'— ⏳ جاري التحميل...':''}</p>
              </div>
            )}
          </div>

          {msg && <div style={{background:msg.startsWith('✅')?'#F0FDF4':'#FEF2F2',color:msg.startsWith('✅')?'#16a34a':'#dc2626',padding:'10px',borderRadius:'10px',marginBottom:'12px',fontSize:'13px'}}>{msg}</div>}

          <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
            <button onClick={()=>handleSend(true)} disabled={saving}
              style={{padding:'12px 24px',borderRadius:'12px',border:'1.5px solid #2C3E6B',background:'#fff',color:'#2C3E6B',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px'}}>
              💾 حفظ مسودة
            </button>
            <button onClick={()=>handleSend(false)} disabled={saving}
              style={{padding:'12px 28px',borderRadius:'12px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px'}}>
              {saving?'⏳ جاري الإرسال...':'📨 إرسال الآن'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // View Letter
  if (selected) return (
    <div style={{minHeight:'100vh',background:'#F5F7FA',padding:'20px',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      <div style={{maxWidth:'800px',margin:'0 auto'}}>
        <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',color:'#2C3E6B',cursor:'pointer',fontWeight:'700',fontSize:'14px',marginBottom:'16px'}}>← العودة</button>
        <div style={{background:'#fff',borderRadius:'16px',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          {/* Header */}
          <div style={{background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',padding:'24px 28px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'8px'}}>
              <div>
                <p style={{color:'rgba(255,255,255,0.7)',fontSize:'12px',margin:'0 0 4px'}}>رقم الكتاب: {selected.referenceNumber}</p>
                <h2 style={{color:'#fff',fontWeight:'800',fontSize:'18px',margin:0}}>{selected.subject}</h2>
              </div>
              <span style={{background:priorityColor[selected.priority]+'44',color:'#fff',padding:'4px 14px',borderRadius:'20px',fontSize:'13px',fontWeight:'700'}}>
                {priorityLabel[selected.priority]}
              </span>
            </div>
            <div style={{display:'flex',gap:'16px',marginTop:'12px',flexWrap:'wrap'}}>
              <span style={{color:'rgba(255,255,255,0.8)',fontSize:'13px'}}>📤 من: {selected.senderName}</span>
              <span style={{color:'rgba(255,255,255,0.8)',fontSize:'13px'}}>📅 {new Date(selected.sentAt).toLocaleDateString('ar-IQ')}</span>
            </div>
          </div>

          {/* Body */}
          <div style={{padding:'28px',borderBottom:'1px solid #f0f0f0'}}>
            <div dangerouslySetInnerHTML={{__html: selected.body}} style={{fontSize:'15px',lineHeight:'2',color:'#333'}} />
          </div>

          {/* Attachments */}
          {selected.attachments?.length > 0 && (
            <div style={{padding:'16px 28px',borderBottom:'1px solid #f0f0f0'}}>
              <h4 style={{color:'#2C3E6B',margin:'0 0 10px',fontSize:'14px'}}>📎 المرفقات ({selected.attachments.length})</h4>
              <div style={{display:'flex',flexWrap:'wrap',gap:'10px'}}>
              {selected.attachments.map(a=>{
                const isPdf = a.fileName?.toLowerCase().endsWith('.pdf')
                const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(a.fileName||'')
                const fileUrl = a.filePath?.startsWith('http') ? a.filePath : `https://ficc.iq${a.filePath}`
                return (
                  <div key={a.id} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',width:'100px'}}>
                    {/* Preview */}
                    <a href={fileUrl} target="_blank" rel="noreferrer" style={{textDecoration:'none',width:'100%'}}>
                      <div style={{width:'100%',height:'80px',borderRadius:'10px',border:'2px solid #dde3ed',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',background:'#f8f9fa',cursor:'pointer',transition:'transform 0.1s'}}
                        onMouseEnter={e=>e.currentTarget.style.transform='scale(1.05)'}
                        onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
                        {isImg ? (
                          <img src={fileUrl} alt={a.fileName} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                        ) : isPdf ? (
                          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                            <span style={{fontSize:'36px'}}>📕</span>
                            <span style={{fontSize:'10px',color:'#dc2626',fontWeight:'700'}}>PDF</span>
                          </div>
                        ) : (
                          <span style={{fontSize:'36px'}}>📄</span>
                        )}
                      </div>
                    </a>
                    {/* Name + Download */}
                    <div style={{width:'100%',textAlign:'center'}}>
                      <p style={{fontSize:'11px',color:'#444',margin:'0 0 4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'100px'}}>{a.fileName}</p>
                      <a href={fileUrl} download target="_blank" rel="noreferrer"
                        style={{fontSize:'11px',color:'#2C3E6B',textDecoration:'none',background:'#EEF2FF',padding:'3px 8px',borderRadius:'6px',display:'inline-block'}}>
                        ⬇️ تحميل
                      </a>
                    </div>
                  </div>
                )
              })}
              </div>
            </div>
          )}

          {/* Recipients */}
          {selected.recipients?.length > 0 && (
            <div style={{padding:'16px 28px',borderBottom:'1px solid #f0f0f0'}}>
              <h4 style={{color:'#2C3E6B',margin:'0 0 10px',fontSize:'14px'}}>👥 المستلمون</h4>
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                {selected.recipients.map(r=>(
                  <span key={r.id} style={{padding:'4px 12px',borderRadius:'20px',background:r.readAt?'#F0FDF4':'#FEF3C7',color:r.readAt?'#16a34a':'#d97706',fontSize:'12px',fontWeight:'700'}}>
                    {r.chamberName} {r.readAt?'✓ قرأ':'⏳ لم يقرأ'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Replies */}
          {selected.replies?.length > 0 && (
            <div style={{padding:'16px 28px',borderBottom:'1px solid #f0f0f0'}}>
              <h4 style={{color:'#2C3E6B',margin:'0 0 14px',fontSize:'14px'}}>💬 الردود ({selected.replies.length})</h4>
              {selected.replies.map(r=>(
                <div key={r.id} style={{background:'#f8f9fa',borderRadius:'12px',padding:'14px 16px',marginBottom:'10px',borderRight:'4px solid #4A6FA5'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                    <span style={{color:'#2C3E6B',fontWeight:'700',fontSize:'13px'}}>{r.senderName}</span>
                    <span style={{color:'#aaa',fontSize:'12px'}}>{new Date(r.createdAt).toLocaleDateString('ar-IQ')}</span>
                  </div>
                  <div dangerouslySetInnerHTML={{__html:r.body}} style={{fontSize:'14px',color:'#444',lineHeight:'1.7'}} />
                </div>
              ))}
            </div>
          )}

          {/* Acknowledge button for inbox */}
          {tab==='inbox' && (() => {
            const myRec = selected.recipients?.find(r=>r.chamberId===chamberId)
            if (!myRec) return null
            return (
              <div style={{padding:'16px 28px',borderBottom:'1px solid #f0f0f0',background:'#FAFBFF'}}>
                {myRec.acknowledgedAt ? (
                  <div style={{display:'flex',alignItems:'center',gap:'8px',color:'#16a34a',fontSize:'14px',fontWeight:'700'}}>
                    ✅ تم تأكيد الاستلام — {new Date(myRec.acknowledgedAt).toLocaleDateString('ar-IQ')}
                  </div>
                ) : (
                  <button onClick={async ()=>{
                    await api.post(`${API}/${selected.id}/acknowledge`, { chamberId }, { headers: authHdrs() }).catch(()=>{})
                    const r = await api.get(`${API}/${selected.id}?viewerId=${chamberId}`, { headers: authHdrs() })
                    setSelected(r.data)
                  }} style={{padding:'10px 24px',borderRadius:'12px',background:'#10b981',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px',display:'flex',alignItems:'center',gap:'8px'}}>
                    ✅ تأكيد الاستلام
                  </button>
                )}
              </div>
            )
          })()}

          {/* Reply Box */}
          <div style={{padding:'20px 28px'}}>
            <h4 style={{color:'#2C3E6B',margin:'0 0 10px',fontSize:'14px'}}>↩️ الرد</h4>
            <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} rows={3} placeholder="اكتب ردك هنا..."
              style={{width:'100%',padding:'12px',borderRadius:'12px',border:'1.5px solid #dde3ed',fontSize:'14px',fontFamily:'Cairo,sans-serif',direction:'rtl',resize:'vertical',boxSizing:'border-box',marginBottom:'10px'}} />
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
              <button onClick={handleReply} disabled={!replyText.trim()}
                style={{padding:'10px 24px',borderRadius:'12px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px'}}>
                إرسال الرد ↩️
              </button>
              <button onClick={async()=>{
                  await api.post(`${API}/${selected.id}/reply`,
                    { senderId:chamberId, senderName:chamberName, body:'تم الاستلام وسيتم إجراء اللازم' },
                    { headers: authHdrs() })
                  setMsg('✅ تم إرسال إشعار الاستلام')
                }}
                style={{padding:'10px 24px',borderRadius:'12px',background:'linear-gradient(135deg,#059669,#10b981)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px'}}>
                ✅ تم الاستلام وسيتم إجراء اللازم
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Main Inbox
  return (
    <div style={{minHeight:'100vh',background:'#F5F7FA',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      <div style={{maxWidth:'1100px',margin:'0 auto',padding:'20px'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px',flexWrap:'wrap',gap:'12px'}}>
          <div>
            <h1 style={{color:'#2C3E6B',fontWeight:'800',fontSize:'24px',margin:'0 0 4px'}}>📨 المراسلات الرسمية</h1>
            <p style={{color:'#888',fontSize:'13px',margin:0}}>اتحاد الغرف التجارية العراقية</p>
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            {/* أيقونة حالة اتصال السكانر + زر التحميل */}
            <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
              <div
                title={scannerConnected ? 'FICC Scanner متصل ✅' : 'FICC Scanner غير متصل - شغّل التطبيق'}
                style={{
                  padding:'10px 14px', borderRadius:'14px',
                  background: scannerConnected ? '#F0FDF4' : '#FEF2F2',
                  color: scannerConnected ? '#16a34a' : '#dc2626',
                  border: `1.5px solid ${scannerConnected ? '#16a34a' : '#dc2626'}`,
                  fontFamily:'Cairo,sans-serif', fontWeight:'700', fontSize:'13px',
                  display:'flex', alignItems:'center', gap:'6px', cursor:'default'
                }}
              >
                <span style={{fontSize:'10px'}}>●</span>
                {scannerConnected ? 'السكانر متصل' : 'السكانر غير متصل'}
              </div>
              {!scannerConnected && (
                <button
                  onClick={downloadScannerApp}
                  style={{
                    padding:'10px 14px', borderRadius:'14px',
                    background:'#3b82f6', color:'white', border:'none',
                    cursor:'pointer', fontFamily:'Cairo,sans-serif',
                    fontWeight:'700', fontSize:'13px'
                  }}
                >
                  📥 تحميل
                </button>
              )}
            </div>

            {/* زر لوحة التحكم - للـ Admin فقط */}
            {(user.role === 'Admin' || user.Role === 'Admin' || user.role === 'SuperAdmin' || user.Role === 'SuperAdmin') && (
              <button onClick={() => navigate('/admin')}
                style={{padding:'12px 16px',borderRadius:'14px',background:'#F0FDF4',color:'#16a34a',border:'1.5px solid #16a34a',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px',display:'flex',alignItems:'center',gap:'6px'}}>
                🏠 لوحة التحكم
              </button>
            )}
            <button onClick={()=>{
                const t = getToken()
                navigator.clipboard.writeText(t).then(()=>alert('✅ تم نسخ Token\nالصقه في برنامج FICC Scanner')).catch(()=>alert('Token:\n'+t))
              }}
              title="نسخ Token لبرنامج السكنر"
              style={{padding:'12px 16px',borderRadius:'14px',background:'#FFF8E7',color:'#B8860B',border:'1.5px solid #FFC72C',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px'}}>
              📋 نسخ Token
            </button>
            <button onClick={()=>{
              // تحميل الغرف لو ما تحملت
              if (chambers.length === 0) {
                api.get('/chambers', { headers: authHdrs() })
                  .then(r => {
                    const list = Array.isArray(r.data)?r.data:r.data.items||[]
                    const filtered = list.filter(c => c.id !== chamberId)
                    setChambers(filtered)
                  }).catch(()=>{})
              }
              setCompose(true)
            }}
              style={{padding:'12px 24px',borderRadius:'14px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'15px',display:'flex',alignItems:'center',gap:'8px'}}>
              ✍️ كتاب جديد
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:'4px',background:'#fff',borderRadius:'14px',padding:'6px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)',marginBottom:'20px',width:'fit-content'}}>
          {[
            {key:'inbox',  label:'📥 الوارد',   badge: unread},
            {key:'sent',   label:'📤 الصادر',   badge:0},
            {key:'drafts', label:'📝 المسودات', badge:0},
          ].map(t => (
            <button key={t.key} onClick={()=>{setTab(t.key);setItems([])}}
              style={{padding:'10px 20px',borderRadius:'10px',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'14px',position:'relative',
                background:tab===t.key?'linear-gradient(135deg,#2C3E6B,#4A6FA5)':'transparent',
                color:tab===t.key?'#fff':'#666'}}>
              {t.label}
              {t.badge>0 && <span style={{position:'absolute',top:'-4px',left:'-4px',background:'#dc2626',color:'#fff',borderRadius:'50%',width:'20px',height:'20px',fontSize:'11px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800'}}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* Filters Bar */}
        <div style={{background:'#fff',borderRadius:'14px',padding:'12px 16px',boxShadow:'0 2px 8px rgba(0,0,0,0.05)',marginBottom:'12px'}}>
          <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
            <input value={filterSearch} onChange={e=>setFilterSearch(e.target.value)} placeholder="🔍 بحث بالعنوان..."
              style={{flex:1,minWidth:'140px',padding:'8px 12px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'13px',fontFamily:'Cairo,sans-serif',direction:'rtl',outline:'none'}} />
            <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)}
              style={{padding:'8px 10px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'13px',outline:'none'}} />
            <select value={filterChamber} onChange={e=>setFilterChamber(e.target.value)}
              style={{padding:'8px 10px',borderRadius:'10px',border:'1.5px solid #dde3ed',fontSize:'13px',fontFamily:'Cairo,sans-serif',background:'#fff',maxWidth:'160px'}}>
              <option value="">كل الغرف</option>
              {chambers.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            {(filterSearch||filterDate||filterChamber) && (
              <button onClick={()=>{setFilterSearch('');setFilterDate('');setFilterChamber('')}}
                style={{padding:'8px 12px',borderRadius:'10px',background:'#fee2e2',color:'#dc2626',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:'700',fontFamily:'Cairo,sans-serif'}}>
                ✕ مسح
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {loading ? <div style={{textAlign:'center',padding:'60px',color:'#aaa'}}>⏳ جاري التحميل...</div> : (
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {items.filter(item => {
              const subj = item.subject || item.correspondence?.subject || ''
              const date = item.sentAt || item.correspondence?.sentAt || ''
              const senderName = item.senderName || item.correspondence?.senderName || ''
              const recipients = item.recipients || item.correspondence?.recipients || []
              // Build full text for chamber search: sender + all recipients
              const chamberText = [
                senderName,
                ...recipients.map(r => r.chamberName || '')
              ].join(' ')
              if (filterSearch && !subj.includes(filterSearch)) return false
              if (filterDate && !date.startsWith(filterDate)) return false
              if (filterChamber && !chamberText.includes(filterChamber)) return false
              return true
            }).map(item => {
              const id = item.id || item.correspondence?.id
              const subj = item.subject || item.correspondence?.subject
              const ref = item.referenceNumber || item.correspondence?.referenceNumber
              const sender = item.senderName || item.correspondence?.senderName
              const date = item.sentAt || item.correspondence?.sentAt
              const prio = item.priority || item.correspondence?.priority || 'normal'
              const isUnread = item.readAt === null || item.readAt === undefined
              const itemRecipients = item.recipients || item.correspondence?.recipients || []
              const readCount = itemRecipients.filter(r=>r.readAt).length
              const totalCount = itemRecipients.length
              return (
                <div key={id}
                  style={{background:'#fff',borderRadius:'12px',padding:'14px 18px',boxShadow:'0 2px 8px rgba(0,0,0,0.05)',border:`1px solid ${isUnread?'#c7d2fe':'#eef0f5'}`,transition:'all 0.2s'}}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateX(-3px)';e.currentTarget.style.boxShadow='0 4px 16px rgba(44,62,107,0.12)'}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'}}>

                  {/* Sent: Recipients badges */}
                  {tab==='sent' && itemRecipients.length>0 && (
                    <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'8px'}}>
                      {itemRecipients.map(r=>(
                        <span key={r.chamberId} style={{
                          padding:'2px 8px',borderRadius:'12px',fontSize:'10px',fontWeight:'700',
                          background: r.readAt?'#F0FDF4':'#FEF3C7',
                          color: r.readAt?'#16a34a':'#d97706',
                          display:'inline-flex',alignItems:'center',gap:'3px'
                        }}>
                          {r.readAt ? '✉️' : '📬'} {r.chamberName?.replace('غرفة تجارة ','')?.replace('الغرفة التجارية العراقية العامة','عامة')}
                        </span>
                      ))}
                      <span style={{fontSize:'10px',color:'#888',marginRight:'4px'}}>({readCount}/{totalCount} استلم)</span>
                    </div>
                  )}

                  <div style={{display:'flex',alignItems:'center',gap:'14px',cursor:'pointer'}} onClick={()=>openLetter(id)}>
                    {/* Open/unread icon */}
                    <div style={{fontSize:'20px',flexShrink:0}}>
                      {tab==='inbox' ? (isUnread ? '📬' : '📭') : tab==='sent' ? '📤' : '📝'}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                        <span style={{fontWeight:isUnread?'800':'600',fontSize:'14px',color:'#1f2937'}}>{subj}</span>
                        <div style={{display:'flex',gap:'8px',alignItems:'center',flexShrink:0}}>
                          <span style={{background:priorityColor[prio]+'22',color:priorityColor[prio],padding:'2px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700'}}>{priorityLabel[prio]}</span>
                          <span style={{color:'#aaa',fontSize:'12px'}}>{date?new Date(date).toLocaleDateString('ar-IQ'):''}</span>
                        </div>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'4px',flexWrap:'wrap',gap:'6px'}}>
                        <div style={{display:'flex',gap:'12px'}}>
                          {ref && <span style={{color:'#888',fontSize:'12px'}}>#{ref}</span>}
                          {sender && tab==='inbox' && <span style={{color:'#4A6FA5',fontSize:'12px'}}>من: {sender}</span>}
                          {item.attachmentsCount>0 && <span style={{color:'#888',fontSize:'12px'}}>📎 {item.attachmentsCount}</span>}
                        </div>
                        {tab==='sent' && (
                          <button onClick={async e=>{
                            e.stopPropagation()
                            const r = await api.get(`${API}/${id}`, { headers: authHdrs() })
                            const letter = r.data
                            // All chambers except sender
                            setForm({subject:letter.subject, body:letter.body, priority:letter.priority||'normal',
                              recipients: chambers.map(c=>({chamberId:c.id,chamberName:c.name})), sendNow:false})
                            setResending(letter)
                            setCompose(true)
                          }} style={{padding:'4px 10px',borderRadius:'8px',background:'#EEF2FF',color:'#2C3E6B',border:'none',cursor:'pointer',fontSize:'11px',fontWeight:'700',fontFamily:'Cairo,sans-serif'}}>
                            🔁 إعادة إرسال
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            {items.length===0 && (
              <div style={{textAlign:'center',padding:'60px',background:'#fff',borderRadius:'16px',color:'#aaa'}}>
                <div style={{fontSize:'48px',marginBottom:'12px'}}>📭</div>
                <p style={{fontSize:'15px'}}>لا توجد مراسلات {tab==='inbox'?'في الوارد':tab==='sent'?'في الصادر':'في المسودات'}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
