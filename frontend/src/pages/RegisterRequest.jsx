import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../lib/api'

const API = ''

// Convert Arabic/Persian numerals to English
const toEnNum = v => (v||'').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))


const govOptions = ['بغداد','البصرة','نينوى','أربيل','النجف','كربلاء','الأنبار','بابل','ذي قار','واسط','ميسان','المثنى','صلاح الدين','كركوك','السليمانية','دهوك','القادسية','ديالى']

const ENTITY_CONFIGS = {
  chamber: { hidden: true,
    label: 'دليل الغرف التجارية',
    icon: '🏛️',
    color: '#2C3E6B',
    fields: [
      { key: 'name',            label: 'اسم الغرفة', required: true },
      { key: 'governorate',     label: 'المحافظة', type: 'select', options: govOptions, required: true },
      { key: 'city',            label: 'اسم المحلة ورقمها', placeholder: 'مثال: حي المعرفة 821' },
      { key: '_ziqaq',          label: 'رقم الزقاق', placeholder: 'مثال: 37' },
      { key: '_dar',            label: 'رقم الدار', placeholder: 'مثال: 21' },
      { key: 'phone',           label: 'رقم الهاتف', type: 'tel', required: true, verify: true },
      { key: 'email',           label: 'البريد الإلكتروني العام', type: 'email', verify: true },
      { key: 'internalEmail',   label: 'إيميل المخاطبات الداخلية', type: 'email', placeholder: 'للمراسلات الرسمية — لا يُنشر', verify: true },
      { key: 'website',         label: 'الموقع الإلكتروني', placeholder: 'https://' },
      { key: 'poBox',           label: 'رقم صندوق البريد' },
      { key: 'establishedYear', label: 'سنة التأسيس', type: 'number' },
      { key: 'boardMembersCount',      label: 'عدد أعضاء مجلس الإدارة', type: 'number' },
      { key: 'generalAssemblyCount',   label: 'عدد أعضاء الهيئة العامة', type: 'number' },
      { key: 'description',     label: 'نبذة عن الغرفة', type: 'textarea' },
      { key: '_logo',           label: 'شعار الغرفة (لوغو)', type: 'logo' },
      { key: '_social',         label: 'روابط التواصل الاجتماعي', type: 'social' },
    ]
  },
  member: { hidden: true,
    label: 'عضو مجلس الاتحاد',
    icon: '👤',
    color: '#4A6FA5',
    fields: [
      { key: 'fullName',    label: 'اسم العضو والقب', required: true },
      { key: 'title',       label: 'المنصب', type: 'select', options: ['رئيس مجلس الاتحاد', 'نائب أول', 'نائب ثاني', 'نائب ثالث', 'عضو'], required: true },
      { key: 'chamberId',   label: 'اسم الغرفة التجارية', type: 'chambers', required: true },
      { key: '_photo',      label: 'صورة شخصية', type: 'photo' },
      { key: 'phone',       label: 'رقم الهاتف', type: 'tel', verify: true },
      { key: 'email',       label: 'البريد الإلكتروني', type: 'email', verify: true },
      { key: '_social',     label: 'منصات التواصل الاجتماعي', type: 'social' },
      { key: 'bio',         label: 'نبذة شخصية', type: 'textarea' },
    ]
  },
  lawyer: {
    label: 'المحامون',
    icon: '⚖️',
    color: '#7c3aed',
    fields: [
      { key: '_photo',        label: 'الصورة الشخصية', type: 'photo' },
      { key: 'fullName',      label: 'الاسم الكامل', required: true },
      { key: 'title',         label: 'اللقب المهني', type: 'select', options: ['محامٍ', 'محامية', 'مستشار قانوني', 'مستشارة قانونية'] },
      { key: 'specialization',label: 'التخصص القانوني', required: true },
      { key: 'licenseNumber', label: 'رقم الإجازة / الترخيص' },
      { key: 'chamberId',     label: 'الغرفة التجارية', type: 'chamber' },
      { key: 'governorate',   label: 'المحافظة' },
      { key: 'area',          label: 'المنطقة / الحي' },
      { key: 'address',       label: 'العنوان التفصيلي' },
      { key: 'phone',         label: 'رقم الهاتف', type: 'tel', required: true, verify: true },
      { key: 'mobile',        label: 'رقم الموبايل', type: 'tel', verify: true },
      { key: 'email',         label: 'البريد الإلكتروني', type: 'email', verify: true },
      { key: 'website',       label: 'الموقع الإلكتروني' },
      { key: 'bio',           label: 'نبذة مهنية', type: 'textarea' },
      { key: '_social',       label: 'التواصل الاجتماعي', type: 'social' },
      { key: '_idFile',       label: 'صورة الوثيقة', type: 'idfile' },
    ]
  },

  agent: {
    label: 'وكلاء الإخراج',
    icon: '🏭',
    color: '#ea580c',
    fields: [
      { key: '_photo',        label: 'الصورة الشخصية', type: 'photo' },
      { key: 'fullName',      label: 'الاسم الكامل', required: true },
      { key: 'companyName',   label: 'اسم المكتب / الشركة' },
      { key: '_logo',         label: 'شعار المكتب', type: 'logo' },
      { key: 'licenseNumber', label: 'رقم الرخصة / التصريح' },
      { key: 'specialization',label: 'نوع البضائع المتخصص بها' },
      { key: 'chamberId',     label: 'الغرفة التجارية', type: 'chamber' },
      { key: 'governorate',   label: 'المحافظة' },
      { key: 'area',          label: 'المنطقة / الموقع' },
      { key: 'address',       label: 'العنوان التفصيلي' },
      { key: 'phone',         label: 'رقم الهاتف', type: 'tel', required: true, verify: true },
      { key: 'mobile',        label: 'رقم الموبايل', type: 'tel', verify: true },
      { key: 'email',         label: 'البريد الإلكتروني', type: 'email', verify: true },
      { key: 'website',       label: 'الموقع الإلكتروني' },
      { key: 'description',   label: 'نبذة عن الخدمات', type: 'textarea' },
      { key: '_social',       label: 'التواصل الاجتماعي', type: 'social' },
      { key: '_idFile',       label: 'صورة الوثيقة', type: 'idfile' },
    ]
  },

  shipping: {
    label: 'شركات الشحن',
    icon: '🚢',
    color: '#0369a1',
    fields: [
      { key: '_logo',         label: 'شعار الشركة', type: 'logo' },
      { key: 'companyName',   label: 'اسم شركة الشحن', required: true },
      { key: 'businessType',  label: 'نوع الشحن', type: 'select', options: ['شحن بحري','شحن جوي','شحن بري','متكامل'] },
      { key: 'routes',        label: 'خطوط السير الرئيسية' },
      { key: 'chamberId',     label: 'الغرفة التجارية', type: 'chamber' },
      { key: 'governorate',   label: 'المحافظة' },
      { key: 'address',       label: 'العنوان التفصيلي' },
      { key: 'ownerName',     label: 'اسم المدير المفوض', required: true },
      { key: '_photo',        label: 'صورة المدير', type: 'photo' },
      { key: 'phone',         label: 'رقم الهاتف', type: 'tel', required: true, verify: true },
      { key: 'mobile',        label: 'رقم الموبايل', type: 'tel', verify: true },
      { key: 'email',         label: 'البريد الإلكتروني', type: 'email', verify: true },
      { key: 'website',       label: 'الموقع الإلكتروني' },
      { key: 'description',   label: 'نبذة عن الشركة وخدماتها', type: 'textarea' },
      { key: '_social',       label: 'التواصل الاجتماعي', type: 'social' },
      { key: '_idFile',       label: 'صورة الوثيقة', type: 'idfile' },
    ]
  },

  trader: {
    label: 'دليل الشركات والتجار',
    icon: '🏢',
    color: '#059669',
    fields: [
      // ─── بيانات الشركة ───
      { key: '_logo',         label: 'شعار الشركة / المؤسسة', type: 'logo' },
      { key: 'tradeName',     label: 'الاسم التجاري', required: true },
      { key: 'businessType',  label: 'نوع النشاط التجاري', type: 'select', required: true,
        options: ['استيراد وتصدير','تجارة جملة','تجارة مفرد','مقاولات وإنشاءات','صناعة وتصنيع','خدمات مهنية','تكنولوجيا ومعلوماتية','نقل ولوجستيات','زراعة وأغذية','صحة وصيدلة','تعليم وتدريب','سياحة وفنادق','عقارات','مالية وتأمين','أخرى'] },
      { key: 'tradeCategory', label: 'التصنيف التجاري', type: 'select',
        options: ['شركة ذات مسؤولية محدودة','شركة مساهمة','مؤسسة فردية','شركة تضامن','وكالة تجارية','فرع شركة أجنبية','تعاونية','أخرى'] },
      { key: 'chamberId',     label: 'الغرفة التجارية', type: 'chamber', required: true },
      { key: 'governorate',   label: 'المحافظة', type: 'select', options: ['بغداد','البصرة','نينوى','أربيل','النجف','كربلاء','الأنبار','ديالى','صلاح الدين','واسط','ميسان','ذي قار','المثنى','القادسية','بابل','كركوك','السليمانية','دهوك'] },
      { key: 'area',          label: 'المنطقة / الحي' },
      { key: 'address',       label: 'العنوان التفصيلي' },
      { key: 'website',       label: 'الموقع الإلكتروني' },
      { key: 'description',   label: 'نبذة عن النشاط', type: 'textarea' },
      // ─── بيانات المدير / المفوض ───
      { key: 'ownerName',     label: 'اسم المدير / صاحب العمل', required: true },
      { key: '_photo',        label: 'صورة شخصية للمدير', type: 'photo' },
      // ─── وسائل التواصل ───
      { key: 'phone',         label: 'رقم الهاتف', type: 'tel', required: true, verify: true },
      { key: 'mobile',        label: 'رقم الموبايل', type: 'tel', verify: true },
      { key: 'email',         label: 'البريد الإلكتروني', type: 'email', verify: true },
      { key: '_social',       label: 'التواصل الاجتماعي', type: 'social' },
      // ─── وثيقة الهوية ───
      { key: '_idFile',       label: 'صورة وجه هوية التجارة مجددة', type: 'idfile' },
      { key: '_idFileBack',   label: 'صورة خلف هوية التجارة', type: 'idfileback' },
      { key: 'notes',         label: 'ملاحظات', type: 'textarea', placeholder: 'أي ملاحظات إضافية (اختياري)' },
    ]
  }
}

/* ─── OTP Verify Field ─── */
function OtpVerifyInput({ field, value, onChange, onVerified, verified, channelStatus }) {
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(0)
  const [msg, setMsg] = useState('')
  const isPhone = field.type === 'tel'
  const ch = isPhone ? 'sms' : 'email'
  const isDisabled = isPhone ? channelStatus?.smsDisabled : channelStatus?.emailDisabled

  const startTimer = () => {
    setTimer(60)
    const iv = setInterval(() => setTimer(t => { if(t<=1){clearInterval(iv);return 0} return t-1 }), 1000)
  }

  // إذا الـ Channel معطّل — أظهر رسالة فوراً
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
    // كندا / أمريكا
    if ((p.startsWith('+1') && p.length === 12) || (p.startsWith('001') && p.length === 13)) return true
    // العراق
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
      const contact = isPhone ? (value.startsWith('07') ? '+964'+value.slice(1) : value) : value
      await api.post(`${API}/otp/verify-contact`, { value: contact, channel: ch })
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
      await api.post(`${API}/otp/verify-contact-check`, { value: contact, channel: ch, code: otp })
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
    direction: (isPhone || field.type==='email') ? 'ltr' : 'rtl', outline:'none',
    background: verified ? '#F0FDF4' : '#FAFBFF', boxSizing:'border-box'
  }

  return (
    <div>
      <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
        <input type={field.type||'text'} value={value||''} placeholder={field.placeholder||field.label} inputMode={isPhone?'numeric':undefined} pattern={isPhone?'[0-9]*':undefined}
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
          <input type="text" value={otp} onChange={e=>setOtp(e.target.value)} maxLength={6} placeholder="أدخل الرمز"
            style={{flex:1,padding:'10px',borderRadius:'10px',border:'1.5px solid #FFC72C',fontSize:'20px',fontFamily:'monospace',textAlign:'center',outline:'none',background:'#FFFBEB',letterSpacing:'6px',direction:'ltr',boxSizing:'border-box'}}
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

/* ─── Registration Form ─── */
function SearchableSelect({ options, value, onChange, inputStyle }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const isLarge = options.length > 50
  const filtered = q.trim() ? options.filter(o => o.includes(q.trim())) : options

  if (!isLarge) return (
    <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
      <option value="">-- اختر --</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', ...inputStyle, padding: 0, overflow: 'hidden', minHeight: 44 }}>
        {value ? (
          <div style={{ flex: 1, padding: '10px 12px', fontFamily: 'Cairo,sans-serif', fontSize: 14, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.6', color: '#222', cursor: 'default' }}
            onClick={() => setOpen(true)}>
            {value}
          </div>
        ) : (
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="اكتب للبحث عن نشاط..."
            style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontFamily: 'Cairo,sans-serif', fontSize: 14, background: 'transparent' }}
          />
        )}
        {value && (
          <button type="button" onClick={() => { onChange(''); setQ(''); setOpen(true) }}
            style={{ padding: '10px 10px', background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 16, flexShrink: 0 }}>✕</button>
        )}
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 999, background: '#fff', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxHeight: 240, overflowY: 'auto' }}>
          <div style={{ padding: '6px 10px', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: '#fff' }}>
            <input value={q} onChange={e => { setQ(e.target.value); onChange('') }}
              placeholder="ابحث..." autoFocus
              style={{ width: '100%', padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontFamily: 'Cairo,sans-serif', boxSizing: 'border-box' }} />
          </div>
          {filtered.length === 0
            ? <div style={{ padding: 12, color: '#999', textAlign: 'center' }}>لا نتائج</div>
            : filtered.slice(0, 100).map(o => (
              <div key={o} onMouseDown={() => { onChange(o); setQ(''); setOpen(false) }}
                style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f5f5f5' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {o}
              </div>
            ))
          }
          {filtered.length > 100 && (
            <div style={{ padding: '6px 12px', color: '#888', fontSize: 12, textAlign: 'center' }}>
              {filtered.length} نتيجة — اكتب أكثر لتضييق البحث
            </div>
          )}
        </div>
      )}
      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onMouseDown={() => setOpen(false)} />}
    </div>
  )
}

function RegistrationForm({ entityType, onBack, showBack = true, constants = {} }) {
  const config = ENTITY_CONFIGS[entityType]
  const [form, setForm] = useState({})
  const [verified, setVerified] = useState({})
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [msg, setMsg] = useState('')
  const [channelStatus, setChannelStatus] = useState({ smsDisabled: false, emailDisabled: false })

  // جلب حالة الـ Channels عند تحميل الصفحة
  useEffect(() => {
    api.get(`${API}/security/channels`).then(r => setChannelStatus(r.data)).catch(() => {})
  }, [])

  const set = (k, v) => setForm(p => ({...p, [k]: v}))
  const setV = (k, v) => setVerified(p => ({...p, [k]: v}))

  // Check if any verify field has value but not verified
  const unverified = config.fields.filter(f => f.verify && form[f.key]?.trim() && !verified[f.key])
  const canSubmit = unverified.length === 0

  // Logo file state
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [chambers, setChambers] = useState([])
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [idFile, setIdFile] = useState(null)
  const [idPreview, setIdPreview] = useState(null)
  const [idFileBack, setIdFileBack] = useState(null)
  const [idPreviewBack, setIdPreviewBack] = useState(null)

  // Load chambers if needed
  useEffect(() => {
    if (['member','trader','lawyer','agent','shipping'].includes(entityType)) {
      api.get('/chambers').then(r => {
        setChambers(Array.isArray(r.data) ? r.data : r.data.items || [])
      }).catch(()=>{})
    }
  }, [entityType])

  const handleSubmit = async () => {
    if (!contactName) { setMsg('الرجاء إدخال اسم مقدم الطلب'); return }
    const required = config.fields.filter(f => f.required && !form[f.key])
    if (required.length > 0) { setMsg('الرجاء إدخال: ' + required.map(f=>f.label).join('، ')); return }
    if (!canSubmit) { setMsg('يرجى التحقق من: ' + unverified.map(f=>f.label).join('، ')); return }

    // Build merged form: combine _ziqaq + _dar into address
    const finalForm = {...form}
    if (form._ziqaq || form._dar) {
      const parts = []
      if (form._ziqaq) parts.push(`زقاق ${form._ziqaq}`)
      if (form._dar)   parts.push(`دار ${form._dar}`)
      finalForm.address = parts.join('، ')
    }
    // Clean temp fields
    delete finalForm._ziqaq; delete finalForm._dar; delete finalForm._social; delete finalForm._logo

    // Merge social
    if (form._social) {
      const s = form._social
      if (s.facebook)  finalForm.facebook  = s.facebook
      if (s.instagram) finalForm.instagram = s.instagram
      if (s.twitter)   finalForm.twitter   = s.twitter
      if (s.whatsapp)  finalForm.whatsApp  = s.whatsapp
      if (s.telegram)  finalForm.telegram  = s.telegram
      if (s.youtube)   finalForm.youTube   = s.youtube
    }

    setLoading(true); setMsg('')
    try {
      // Convert logo/photo to base64 before sending
      let logoData = null
      let photoData = null
      if (logoFile) {
        logoData = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = e => resolve(e.target.result)
          reader.readAsDataURL(logoFile)
        })
      }
      // Upload ID file if present
      // Convert photo to base64 for ALL entity types
      if (photoFile) {
        const photoB64 = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = e => resolve(e.target.result)
          reader.readAsDataURL(photoFile)
        })
        finalForm._photo = photoB64
        if (entityType === 'member') finalForm.photoUrl = photoB64
      }

      // Convert ID files to base64
      if (idFile) {
        finalForm._idFile = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = e => resolve(e.target.result)
          reader.readAsDataURL(idFile)
        })
      }
      if (idFileBack) {
        finalForm._idFileBack = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = e => resolve(e.target.result)
          reader.readAsDataURL(idFileBack)
        })
      }

      await api.post(`${API}/submissions`, {
        entityType, contactName, contactPhone,
        contactEmail: finalForm.email || '',
        formData: finalForm,
        logoData
      })
      // Redirect to main site after 2 seconds
      setTimeout(() => { window.location.href = 'https://ficc.iq' }, 2000)
      setDone(true)
    } catch(e) {
      setMsg('❌ ' + (e.response?.data?.message || 'حدث خطأ، حاول مجدداً'))
    } finally { setLoading(false) }
  }

  const inputStyle = {
    width:'100%', padding:'12px 16px', borderRadius:'12px', border:'1.5px solid #dde3ed',
    fontSize:'14px', fontFamily:'Cairo,sans-serif', direction:'rtl', outline:'none',
    background:'#FAFBFF', boxSizing:'border-box'
  }

  if (done) return (
    <div style={{textAlign:'center',padding:'60px 20px'}}>
      <div style={{fontSize:'64px',marginBottom:'16px'}}>✅</div>
      <h2 style={{color:'#2C3E6B',fontWeight:'800',marginBottom:'12px'}}>تم استلام طلبك بنجاح!</h2>
      <p style={{color:'#666',fontSize:'15px',marginBottom:'24px'}}>سيتم مراجعة طلبك من قبل الإدارة والتواصل معك قريباً</p>
      <button onClick={onBack} style={{padding:'12px 32px',borderRadius:'12px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'15px'}}>
        العودة للرئيسية
      </button>
    </div>
  )

  return (
    <div style={{maxWidth:'600px',margin:'0 auto',padding:'20px'}}>
      {showBack && (
        <button onClick={onBack} style={{background:'none',border:'none',color:'#2C3E6B',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'14px',fontWeight:'700',marginBottom:'20px',padding:'8px 0',display:'flex',alignItems:'center',gap:'6px'}}>
          ← العودة
        </button>
      )}
      <div style={{background:'#fff',borderRadius:'20px',padding:'32px',boxShadow:'0 4px 20px rgba(0,0,0,0.08)',border:'1px solid #e5e7eb'}}>
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <img src="/ficc-logo.jpg" alt="FICC" style={{width:'70px',height:'70px',borderRadius:'50%',border:'3px solid #FFC72C',marginBottom:'10px',display:'block',margin:'0 auto 10px'}} />
          <p style={{color:'#888',fontSize:'12px',margin:'0 0 12px',fontWeight:'600'}}>اتحاد الغرف التجارية العراقية</p>
          <span style={{fontSize:'36px'}}>{config.icon}</span>
          <h2 style={{color:config.color,fontWeight:'800',fontSize:'22px',margin:'6px 0 4px'}}>{config.label}</h2>
          <p style={{color:'#888',fontSize:'13px',margin:0}}>يرجى تعبئة النموذج — سيتم مراجعة طلبك وإضافتك بعد الموافقة</p>
        </div>

        {/* Contact info */}
        <div style={{background:'#EEF2FF',borderRadius:'12px',padding:'16px',marginBottom:'24px',border:'1.5px solid #c7d2fe'}}>
          <p style={{color:'#2C3E6B',fontWeight:'700',fontSize:'13px',margin:'0 0 12px'}}>📋 معلومات مقدم الطلب</p>
          <div style={{marginBottom:'10px'}}>
            <label style={{display:'block',fontSize:'12px',fontWeight:'700',color:'#444',marginBottom:'4px'}}>الاسم الكامل *</label>
            <input value={contactName} onChange={e=>setContactName(e.target.value)} style={inputStyle} placeholder="اسم مقدم الطلب" />
          </div>
          <div>
            <label style={{display:'block',fontSize:'12px',fontWeight:'700',color:'#444',marginBottom:'4px'}}>رقم الهاتف للتواصل</label>
            <input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} style={{...inputStyle,direction:'ltr'}} placeholder="07xxxxxxxxx" type="tel" />
          </div>
        </div>

        {/* Form fields */}
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          {config.fields.map(f => (
            <div key={f.key}>
              <label style={{display:'block',fontSize:'13px',fontWeight:'700',color:'#2C3E6B',marginBottom:'6px'}}>
                {f.label} {f.required && <span style={{color:'red'}}>*</span>}
                {f.verify && <span style={{color:'#888',fontSize:'11px',fontWeight:'400'}}> (يتطلب تحقق)</span>}
              </label>
              {f.verify ? (
                <OtpVerifyInput field={f} value={form[f.key]||''} onChange={v=>set(f.key,v)} onVerified={setV} verified={!!verified[f.key]} channelStatus={channelStatus} />
              ) : f.type === 'select' ? (
                <SearchableSelect
                  options={f.constantsKey && constants[f.constantsKey]?.length ? constants[f.constantsKey] : (f.options||[])}
                  value={form[f.key]||''}
                  onChange={v=>set(f.key,v)}
                  inputStyle={inputStyle}
                />
              ) : f.type === 'textarea' ? (
                <textarea value={form[f.key]||''} onChange={e=>set(f.key,e.target.value)} rows={3}
                  style={{...inputStyle,resize:'vertical'}} placeholder={f.placeholder||f.label} />
              ) : f.type === 'chambers' || f.type === 'chamber' ? (
                <select value={form[f.key]||''} onChange={e=>set(f.key,e.target.value?parseInt(e.target.value):'')} style={inputStyle}>
                  <option value="">-- اختر الغرفة التجارية --</option>
                  {chambers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              ) : f.type === 'photo' ? (
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  {photoPreview ? <img src={photoPreview} alt="photo" style={{width:'60px',height:'60px',borderRadius:'50%',objectFit:'cover',border:'2px solid #2C3E6B',background:'#f5f7fa'}} /> :
                    <div style={{width:'60px',height:'60px',borderRadius:'50%',border:'2px dashed #ccc',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',color:'#ccc'}}>📸</div>}
                  <label style={{padding:'8px 16px',borderRadius:'10px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',cursor:'pointer',fontSize:'13px',fontWeight:'700'}}>
                    📸 {photoPreview ? 'تغيير الصورة' : 'رفع الصورة'}
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const file=e.target.files[0];if(file){setPhotoFile(file);set('_photo',file.name);setPhotoPreview(URL.createObjectURL(file))}}} />
                  </label>
                </div>
              ) : f.type === 'idfile' ? (
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                    {idPreview ? (
                      <img src={idPreview} alt="id" style={{width:'80px',height:'50px',objectFit:'cover',borderRadius:'8px',border:'2px solid #2C3E6B'}} />
                    ) : (
                      <div style={{width:'80px',height:'50px',borderRadius:'8px',border:'2px dashed #ccc',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',color:'#ccc'}}>🪪</div>
                    )}
                    <label style={{padding:'8px 16px',borderRadius:'10px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',cursor:'pointer',fontSize:'13px',fontWeight:'700'}}>
                      🪪 {idPreview ? 'تغيير الوثيقة' : (config.fields.find(f=>f.type==='idfile')?.label?.includes('التجارة') ? 'رفع هوية التجارة' : 'رفع الوثيقة')}
                      <input type="file" accept="image/*,.pdf" style={{display:'none'}}
                        onChange={e=>{
                          const file=e.target.files[0]
                          if(file){
                            setIdFile(file)
                            set('_idFile',file.name)
                            if(file.type.startsWith('image/')) setIdPreview(URL.createObjectURL(file))
                            else setIdPreview(null)
                          }
                        }} />
                    </label>
                    {idFile && <span style={{fontSize:'12px',color:'#16a34a',fontWeight:'700'}}>✅ {idFile.name}</span>}
                  </div>
                  <p style={{fontSize:'11px',color:'#94a3b8',margin:0}}>يُقبل: صورة JPG/PNG أو ملف PDF</p>
                </div>
              ) : f.type === 'idfileback' ? (
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                    {idPreviewBack ? (
                      <img src={idPreviewBack} alt="id-back" style={{width:'80px',height:'50px',objectFit:'cover',borderRadius:'8px',border:'2px solid #2C3E6B'}} />
                    ) : (
                      <div style={{width:'80px',height:'50px',borderRadius:'8px',border:'2px dashed #ccc',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',color:'#ccc'}}>🪪</div>
                    )}
                    <label style={{padding:'8px 16px',borderRadius:'10px',background:'linear-gradient(135deg,#059669,#10b981)',color:'#fff',cursor:'pointer',fontSize:'13px',fontWeight:'700'}}>
                      🪪 {idPreviewBack ? 'تغيير الخلف' : 'رفع خلف الهوية'}
                      <input type="file" accept="image/*,.pdf" style={{display:'none'}}
                        onChange={e=>{
                          const file=e.target.files[0]
                          if(file){
                            setIdFileBack(file)
                            set('_idFileBack',file.name)
                            if(file.type.startsWith('image/')) setIdPreviewBack(URL.createObjectURL(file))
                            else setIdPreviewBack(null)
                          }
                        }} />
                    </label>
                    {idFileBack && <span style={{fontSize:'12px',color:'#16a34a',fontWeight:'700'}}>✅ {idFileBack.name}</span>}
                  </div>
                  <p style={{fontSize:'11px',color:'#94a3b8',margin:0}}>يُقبل: صورة JPG/PNG أو ملف PDF</p>
                </div>
              ) : f.type === 'logo' ? (
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  {logoPreview ? <img src={logoPreview} alt="logo" style={{width:'60px',height:'60px',borderRadius:'10px',objectFit:'contain',border:'2px solid #2C3E6B',background:'#f5f7fa',padding:'4px'}} /> :
                    <div style={{width:'60px',height:'60px',borderRadius:'10px',border:'2px dashed #ccc',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',color:'#ccc'}}>🖼️</div>}
                  <label style={{padding:'8px 16px',borderRadius:'10px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',cursor:'pointer',fontSize:'13px',fontWeight:'700'}}>
                    🖼️ {logoPreview ? 'تغيير اللوغو' : 'رفع اللوغو'}
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const file=e.target.files[0];if(file){setLogoFile(file);setLogoPreview(URL.createObjectURL(file))}}} />
                  </label>
                </div>
              ) : f.type === 'social' ? (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                  {[['facebook','فيسبوك','#1877F2'],['instagram','انستغرام','#E1306C'],['twitter','تويتر','#1DA1F2'],['whatsapp','واتساب','#25D366'],['telegram','تيليغرام','#0088cc'],['youtube','يوتيوب','#FF0000']].map(([k,l,c])=>(
                    <div key={k}>
                      <label style={{display:'block',fontSize:'11px',fontWeight:'700',color:'#888',marginBottom:'3px'}}>{l}</label>
                      <input value={(form._social||{})[k]||''} onChange={e=>setForm(p=>({...p,_social:{...(p._social||{}),[k]:e.target.value}}))}
                        style={{...inputStyle,padding:'8px 12px',fontSize:'12px',direction:'ltr'}} placeholder={`رابط ${l}`} />
                    </div>
                  ))}
                </div>
              ) : (
                <input type={f.type||'text'} value={form[f.key]||''} onChange={e=>set(f.key,e.target.value)}
                  style={{...inputStyle,direction:f.type==='tel'||f.type==='number'||f.type==='email'?'ltr':'rtl'}} placeholder={f.placeholder||f.label} />
              )}
            </div>
          ))}
        </div>

        {msg && <div style={{background:'#FEF2F2',color:'#dc2626',padding:'12px',borderRadius:'10px',fontSize:'13px',marginTop:'16px',textAlign:'center'}}>{msg}</div>}

        <button onClick={handleSubmit} disabled={loading}
          style={{width:'100%',marginTop:'24px',padding:'14px',borderRadius:'12px',
            background: loading ? '#ccc' : canSubmit ? `linear-gradient(135deg,${config.color},#4A6FA5)` : '#9ca3af',
            color:'#fff',border:'none',cursor:loading?'not-allowed':canSubmit?'pointer':'not-allowed',
            fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'16px'}}>
          {loading ? '⏳ جاري الإرسال...' : canSubmit ? '📨 إرسال الطلب' : '🔒 يجب التحقق أولاً'}
        </button>
        {!canSubmit && unverified.length > 0 && (
          <p style={{textAlign:'center',color:'#888',fontSize:'12px',marginTop:'8px'}}>
            يرجى التحقق من: {unverified.map(f=>f.label).join('، ')}
          </p>
        )}
      </div>
    </div>
  )
}

export default function RegisterRequest() {
  const { entityType: paramType } = useParams()
  const [selected, setSelected] = useState(paramType || null)
  const [constants, setConstants] = useState({})

  useEffect(() => {
    api.get(`${API}/constants`).then(r => {
      const grouped = {}
      r.data.forEach(item => {
        if (!grouped[item.category]) grouped[item.category] = []
        grouped[item.category].push(item.label || item.value)
      })
      setConstants(grouped)
    }).catch(() => {})
  }, [])

  // If URL has entityType directly, show form immediately
  if (selected && ENTITY_CONFIGS[selected]) {
    const cfg = ENTITY_CONFIGS[selected]
    document.title = `استمارة ${cfg.label} | اتحاد الغرف التجارية العراقية`
    return (
      <div style={{background:'#F5F7FA',padding:'24px 16px',fontFamily:'Cairo,sans-serif',direction:'rtl',minHeight:'60vh'}}>
        <div style={{maxWidth:'700px',margin:'0 auto'}}>
          <button onClick={()=>{ setSelected(null); window.history.pushState({}, '', '/register') }}
            style={{display:'flex',alignItems:'center',gap:'6px',background:'none',border:'none',color:'#2C3E6B',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'14px',fontWeight:'700',marginBottom:'20px',padding:'8px 0'}}>
            ← العودة للقائمة
          </button>
          <RegistrationForm entityType={selected} showBack={false} onBack={()=>{ setSelected(null); window.history.pushState({}, '', '/register') }} constants={constants} />
        </div>
      </div>
    )
  }

  return (
    <div style={{background:'#F5F7FA',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      {/* Page Header */}
      <div style={{background:'linear-gradient(135deg,#2C3E6B,#1a2a4a)',padding:'32px 20px',textAlign:'center'}}>
        <div style={{fontSize:'44px',marginBottom:'10px'}}>📋</div>
        <h1 style={{color:'white',fontWeight:'900',fontSize:'24px',margin:'0 0 6px'}}>سجّل نشاطك التجاري</h1>
        <p style={{color:'rgba(255,255,255,0.65)',fontSize:'14px',margin:0}}>أضف نشاطك إلى قواعد بيانات اتحاد الغرف التجارية العراقية</p>
      </div>

      <div style={{maxWidth:'1000px',margin:'0 auto',padding:'28px 16px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'16px'}}>
          {Object.entries(ENTITY_CONFIGS).filter(([,cfg]) => !cfg.hidden).sort(([a],[b]) => a==='trader'?-1:b==='trader'?1:0).map(([key, cfg]) => (
            <div key={key}
              style={{background:'white',borderRadius:'16px',padding:'24px',textAlign:'center',
                boxShadow:'0 2px 12px rgba(0,0,0,0.06)',border:'1px solid #e2e8f0',
                cursor:'pointer',transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(44,62,107,0.15)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)'}}>
              <div style={{fontSize:'44px',marginBottom:'12px'}}>{cfg.icon}</div>
              <h3 style={{color:'#1e293b',fontWeight:'800',fontSize:'15px',margin:'0 0 12px'}}>{cfg.label}</h3>
              <button onClick={()=>{setSelected(key);window.history.pushState({},'',' /register/'+key)}}
                style={{background:`linear-gradient(135deg,${cfg.color},${cfg.color}cc)`,color:'#fff',border:'none',
                  borderRadius:'10px',padding:'10px 16px',cursor:'pointer',fontFamily:'Cairo,sans-serif',
                  fontWeight:'700',fontSize:'13px',width:'100%',marginBottom:'8px'}}>
                تقديم الطلب
              </button>
              <span style={{color:'#94a3b8',fontSize:'11px',cursor:'pointer'}}
                onClick={()=>{navigator.clipboard.writeText(window.location.origin+'/register/'+key);alert('تم نسخ الرابط ✅')}}>
                🔗 نسخ الرابط
              </span>
            </div>
          ))}
        </div>

        <div style={{marginTop:'24px',textAlign:'center'}}>
          <a href="/track-request"
            style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'12px 28px',borderRadius:'12px',
              background:'#FFC72C',color:'#1a1a2e',textDecoration:'none',fontFamily:'Cairo,sans-serif',fontWeight:'800',fontSize:'14px'}}>
            🔍 متابعة حالة طلبي
          </a>
        </div>
      </div>
    </div>
  )
}
