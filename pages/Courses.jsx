import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'

const API = ''

const STATUS = {
  upcoming:  { label: '📅 قادمة', color: '#10b981', bg: '#d1fae5', icon: '🟢' },
  ongoing:   { label: '🔴 جارية', color: '#ef4444', bg: '#fee2e2', icon: '🔴' },
  completed: { label: '✅ منتهية', color: '#6b7280', bg: '#f3f4f6', icon: '⚫' },
}

function ApplyModal({ course, onClose }) {
  const [form, setForm] = useState({ fullName:'', phone:'', email:'', company:'', motivation:'' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [success, setSuccess] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setMsg('')
    try {
      await api.post(`${API}/api/courses/${course.id}/apply`, form)
      setSuccess(true)
    } catch(err) {
      setMsg(err.response?.data?.message || 'حدث خطأ، حاول مرة أخرى')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:20, padding:'32px 28px', width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', direction:'rtl', fontFamily:'Cairo,sans-serif' }}>
        {success ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#10b981', marginBottom:8 }}>تم التسجيل بنجاح!</h2>
            <p style={{ color:'#64748b', fontSize:14, marginBottom:24 }}>تم تسجيل طلبك في دورة "{course.title}". سيتم التواصل معك قريباً.</p>
            <button onClick={onClose} style={{ padding:'12px 32px', background:'#2C3E6B', color:'#fff', border:'none', borderRadius:12, cursor:'pointer', fontFamily:'Cairo,sans-serif', fontWeight:700, fontSize:14 }}>إغلاق</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:18, fontWeight:800, color:'#2C3E6B', marginBottom:4 }}>📝 التقديم على الدورة</h2>
              <p style={{ fontSize:13, color:'#64748b' }}>{course.title}</p>
            </div>
            <form onSubmit={submit}>
              {[
                { label:'الاسم الكامل *', key:'fullName', required:true },
                { label:'رقم الهاتف *', key:'phone', required:true, type:'tel' },
                { label:'البريد الإلكتروني', key:'email', type:'email' },
                { label:'اسم الشركة / الجهة', key:'company' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>{f.label}</label>
                  <input type={f.type||'text'} required={f.required} value={form[f.key]} onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))}
                    style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:13, fontFamily:'Cairo,sans-serif', outline:'none', boxSizing:'border-box' }} />
                </div>
              ))}
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>لماذا تريد الانضمام لهذه الدورة؟</label>
                <textarea value={form.motivation} onChange={e => setForm(p=>({...p,motivation:e.target.value}))}
                  style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:13, fontFamily:'Cairo,sans-serif', outline:'none', boxSizing:'border-box', height:80, resize:'vertical' }} />
              </div>
              {msg && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', color:'#ef4444', fontSize:13, marginBottom:14 }}>{msg}</div>}
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" disabled={loading} style={{ flex:1, padding:'12px', background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)', color:'#fff', border:'none', borderRadius:12, cursor:'pointer', fontFamily:'Cairo,sans-serif', fontWeight:800, fontSize:14 }}>
                  {loading ? '⏳ جارٍ التسجيل...' : '✅ تسجيل الآن'}
                </button>
                <button type="button" onClick={onClose} style={{ padding:'12px 20px', background:'#f1f5f9', border:'none', borderRadius:12, cursor:'pointer', fontFamily:'Cairo,sans-serif', fontWeight:700 }}>إلغاء</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function CourseCard({ course, onApply }) {
  const st = STATUS[course.status] || STATUS.upcoming
  const start = new Date(course.startDate)
  const end = new Date(course.endDate)
  const fmt = d => d.toLocaleDateString('ar-IQ', { year:'numeric', month:'long', day:'numeric' })
  const pct = course.maxParticipants > 0 ? Math.round((course.currentParticipants / course.maxParticipants) * 100) : 0

  return (
    <div style={{ background:'#fff', borderRadius:18, overflow:'hidden', boxShadow:'0 2px 12px rgba(44,62,107,0.08)', border:'1px solid #e5e7eb', display:'flex', flexDirection:'column', transition:'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 8px 32px rgba(44,62,107,0.15)'; e.currentTarget.style.transform='translateY(-3px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='0 2px 12px rgba(44,62,107,0.08)'; e.currentTarget.style.transform='' }}>
      
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)', padding:'20px 20px 16px', position:'relative' }}>
        <span style={{ position:'absolute', top:14, left:14, padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:800, background:st.bg, color:st.color }}>
          {st.icon} {st.label}
        </span>
        {course.category && <span style={{ position:'absolute', top:14, right:14, padding:'3px 10px', borderRadius:20, fontSize:11, background:'rgba(255,199,44,0.2)', color:'#FFC72C', fontWeight:700 }}>{course.category}</span>}
        <h3 style={{ color:'#fff', fontSize:16, fontWeight:800, marginTop:24, marginBottom:8, lineHeight:1.4 }}>{course.title}</h3>
        {course.speaker && (
          <div style={{ color:'rgba(255,255,255,0.8)', fontSize:12 }}>
            👤 {course.speaker} — <span style={{ color:'rgba(255,255,255,0.6)' }}>{course.speakerTitle}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding:'16px 20px', flex:1 }}>
        {course.description && <p style={{ color:'#64748b', fontSize:13, lineHeight:1.7, marginBottom:14 }}>{course.description.slice(0,120)}{course.description.length>120?'...':''}</p>}
        
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', gap:8, fontSize:12, color:'#374151' }}>
            <span>📅</span>
            <span>{fmt(start)}{start.getTime()!==end.getTime() ? ` ← ${fmt(end)}` : ''}</span>
          </div>
          {course.location && <div style={{ display:'flex', gap:8, fontSize:12, color:'#374151' }}><span>📍</span><span>{course.location}</span></div>}
          <div style={{ display:'flex', gap:8, fontSize:12, color:'#374151' }}>
            <span>💰</span>
            <span style={{ fontWeight:700, color: course.isFree ? '#10b981' : '#2C3E6B' }}>{course.isFree ? 'مجانية' : `${course.price?.toLocaleString('ar')} د.ع`}</span>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginTop:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#64748b', marginBottom:4 }}>
            <span>المشاركون</span>
            <span style={{ fontWeight:700 }}>{course.currentParticipants} / {course.maxParticipants}</span>
          </div>
          <div style={{ background:'#e2e8f0', borderRadius:4, height:6 }}>
            <div style={{ background: pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981', width:`${pct}%`, height:6, borderRadius:4, transition:'width 0.3s' }} />
          </div>
          {pct >= 90 && <div style={{ fontSize:11, color:'#ef4444', marginTop:3, fontWeight:700 }}>⚠️ الأماكن تنفد!</div>}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:'14px 20px', borderTop:'1px solid #f1f5f9' }}>
        {course.status === 'upcoming' && course.currentParticipants < course.maxParticipants ? (
          <button onClick={() => onApply(course)}
            style={{ width:'100%', padding:'12px', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', border:'none', borderRadius:12, cursor:'pointer', fontFamily:'Cairo,sans-serif', fontWeight:800, fontSize:14 }}>
            📝 سجّل الآن
          </button>
        ) : course.status === 'upcoming' ? (
          <div style={{ textAlign:'center', padding:'10px', background:'#fef2f2', borderRadius:10, color:'#ef4444', fontSize:13, fontWeight:700 }}>❌ اكتمل عدد المشاركين</div>
        ) : course.status === 'ongoing' ? (
          <div style={{ textAlign:'center', padding:'10px', background:'#fff7ed', borderRadius:10, color:'#ea580c', fontSize:13, fontWeight:700 }}>🔴 الدورة جارية الآن</div>
        ) : (
          <div style={{ textAlign:'center', padding:'10px', background:'#f8fafc', borderRadius:10, color:'#64748b', fontSize:13 }}>✅ انتهت الدورة</div>
        )}
      </div>
    </div>
  )
}

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [filter, setFilter] = useState('all')
  const [applying, setApplying] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`${API}/api/courses`).then(r => setCourses(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? courses : courses.filter(c => c.status === filter)

  const counts = {
    all: courses.length,
    upcoming: courses.filter(c => c.status === 'upcoming').length,
    ongoing: courses.filter(c => c.status === 'ongoing').length,
    completed: courses.filter(c => c.status === 'completed').length,
  }

  return (
    <div className="page" style={{ direction:'rtl', fontFamily:'Cairo,sans-serif' }}>
      {applying && <ApplyModal course={applying} onClose={() => setApplying(null)} />}

      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)', borderRadius:20, padding:'40px 28px', marginBottom:28, textAlign:'center', color:'#fff' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🎓</div>
        <h1 style={{ fontSize:26, fontWeight:800, marginBottom:8 }}>الدورات الريادية</h1>
        <p style={{ color:'rgba(255,255,255,0.8)', fontSize:15, maxWidth:600, margin:'0 auto' }}>
          دورات تدريبية متخصصة لدعم رواد الأعمال وتنمية المشاريع الصغيرة والمتوسطة في العراق
        </p>
        <div style={{ display:'flex', gap:20, justifyContent:'center', marginTop:20, flexWrap:'wrap' }}>
          <div style={{ textAlign:'center' }}><div style={{ fontSize:22, fontWeight:800, color:'#FFC72C' }}>{counts.upcoming}</div><div style={{ fontSize:12, color:'rgba(255,255,255,0.7)' }}>دورة قادمة</div></div>
          <div style={{ width:1, background:'rgba(255,255,255,0.2)' }} />
          <div style={{ textAlign:'center' }}><div style={{ fontSize:22, fontWeight:800, color:'#FFC72C' }}>{counts.ongoing}</div><div style={{ fontSize:12, color:'rgba(255,255,255,0.7)' }}>جارية</div></div>
          <div style={{ width:1, background:'rgba(255,255,255,0.2)' }} />
          <div style={{ textAlign:'center' }}><div style={{ fontSize:22, fontWeight:800, color:'#FFC72C' }}>{counts.completed}</div><div style={{ fontSize:12, color:'rgba(255,255,255,0.7)' }}>منتهية</div></div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap' }}>
        {[
          { key:'all', label:'الكل', icon:'📚' },
          { key:'upcoming', label:'القادمة', icon:'🟢' },
          { key:'ongoing', label:'الجارية', icon:'🔴' },
          { key:'completed', label:'المنتهية', icon:'✅' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding:'9px 18px', borderRadius:12, border:'2px solid', cursor:'pointer', fontFamily:'Cairo,sans-serif', fontWeight:700, fontSize:13, transition:'all 0.2s',
              borderColor: filter===f.key ? '#2C3E6B' : '#e5e7eb',
              background: filter===f.key ? '#2C3E6B' : '#fff',
              color: filter===f.key ? '#fff' : '#374151' }}>
            {f.icon} {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#94a3b8' }}>⏳ جارٍ التحميل...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'#94a3b8', background:'#fff', borderRadius:16 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
          <div style={{ fontSize:15 }}>لا توجد دورات في هذا التصنيف حالياً</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20 }}>
          {filtered.map(c => <CourseCard key={c.id} course={c} onApply={setApplying} />)}
        </div>
      )}
    </div>
  )
}
