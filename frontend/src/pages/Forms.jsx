import { useState, useEffect } from 'react'
import api from '../lib/api'

const API = ''

const fieldTypes = {
  text: 'نص قصير', textarea: 'نص طويل', number: 'رقم',
  email: 'بريد إلكتروني', phone: 'هاتف', date: 'تاريخ',
  dropdown: 'قائمة منسدلة', radio: 'اختيار واحد',
  checkbox: 'اختيار متعدد', rating: 'تقييم', file: 'ملف'
}

// Form Filler (for public forms)
export function FormFiller({ token }) {
  const [form, setForm] = useState(null)
  const [answers, setAnswers] = useState({})
  const [info, setInfo] = useState({ name: '', phone: '', email: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`${API}/forms/share/${token}`)
      .then(r => setForm(r.data))
      .catch(e => setError(e.response?.data?.message || 'الاستمارة غير متاحة'))
      .finally(() => setLoading(false))
  }, [token])

  const handleAnswer = (fieldId, value) => setAnswers(prev => ({ ...prev, [fieldId]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const answerList = Object.entries(answers).map(([fieldId, answer]) => ({
      fieldId: parseInt(fieldId),
      answer: Array.isArray(answer) ? answer.join(',') : String(answer)
    }))
    try {
      await api.post(`${API}/forms/${form.id}/submit`, {
        respondentName: info.name,
        respondentPhone: info.phone,
        respondentEmail: info.email,
        answers: answerList
      })
      setSubmitted(true)
    } catch (e) {
      setError(e.response?.data?.message || 'خطأ في الإرسال')
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">جاري التحميل...</div>
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>
  if (submitted) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">تم الإرسال بنجاح!</h2>
      <p className="text-gray-500">شكراً لك، تم استلام ردك.</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-ficc-green text-white p-6">
          <h1 className="text-xl font-bold">{form.title}</h1>
          {form.description && <p className="text-blue-200 text-sm mt-1">{form.description}</p>}
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Respondent info */}
          {!form.allowAnonymous && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="font-medium text-gray-700 text-sm">بيانات مقدّم الاستمارة</h3>
              <input value={info.name} onChange={e => setInfo(p=>({...p,name:e.target.value}))}
                placeholder="الاسم الكامل *" required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              <input value={info.phone} onChange={e => setInfo(p=>({...p,phone:e.target.value}))}
                placeholder="رقم الهاتف"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              <input value={info.email} onChange={e => setInfo(p=>({...p,email:e.target.value}))}
                placeholder="البريد الإلكتروني" type="email"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          )}

          {/* Form fields */}
          {form.fields?.map(field => (
            <div key={field.id} className="space-y-1">
              {field.fieldType === 'section_header' ? (
                <h3 className="font-bold text-gray-700 border-b pb-1 mt-4">{field.label}</h3>
              ) : (
                <>
                  <label className="text-sm font-medium text-gray-700">
                    {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                  </label>
                  {field.helpText && <p className="text-xs text-gray-400">{field.helpText}</p>}
                  <FieldInput field={field} value={answers[field.id]} onChange={v => handleAnswer(field.id, v)} />
                </>
              )}
            </div>
          ))}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button type="submit" className="w-full bg-ficc-green text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors">
            إرسال الاستمارة
          </button>
        </form>
      </div>
    </div>
  )
}

function FieldInput({ field, value, onChange }) {
  const opts = field.options ? JSON.parse(field.options) : []
  const cls = "w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"

  switch (field.fieldType) {
    case 'text': case 'email': case 'phone':
      return <input type={field.fieldType === 'email' ? 'email' : 'text'} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={field.placeholder} required={field.isRequired} className={cls} />
    case 'number':
      return <input type="number" value={value||''} onChange={e=>onChange(e.target.value)} placeholder={field.placeholder} required={field.isRequired} className={cls} />
    case 'date':
      return <input type="date" value={value||''} onChange={e=>onChange(e.target.value)} required={field.isRequired} className={cls} />
    case 'textarea':
      return <textarea value={value||''} onChange={e=>onChange(e.target.value)} placeholder={field.placeholder} required={field.isRequired} rows={3} className={cls} />
    case 'dropdown':
      return <select value={value||''} onChange={e=>onChange(e.target.value)} required={field.isRequired} className={cls}>
        <option value="">-- اختر --</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    case 'radio':
      return <div className="space-y-2">{opts.map(o => (
        <label key={o} className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name={`field_${field.id}`} value={o} checked={value===o} onChange={()=>onChange(o)} required={field.isRequired} />
          <span className="text-sm text-gray-700">{o}</span>
        </label>
      ))}</div>
    case 'checkbox':
      return <div className="space-y-2">{opts.map(o => (
        <label key={o} className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={Array.isArray(value)&&value.includes(o)}
            onChange={e => onChange(e.target.checked ? [...(value||[]),o] : (value||[]).filter(v=>v!==o))} />
          <span className="text-sm text-gray-700">{o}</span>
        </label>
      ))}</div>
    case 'rating':
      return <div className="flex gap-2">{[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={()=>onChange(n)}
          className={`w-10 h-10 rounded-full font-bold text-sm transition-colors ${value>=n ? 'bg-ficc-gold text-white' : 'bg-gray-100 text-gray-500 hover:bg-yellow-100'}`}>
          {n}
        </button>
      ))}</div>
    default:
      return <input value={value||''} onChange={e=>onChange(e.target.value)} className={cls} />
  }
}

// Forms List Page
export default function FormsPage() {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`${API}/forms`, { params: { status: 'Active' } })
      .then(r => setForms(r.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📋 الاستمارات الإلكترونية</h1>
      {loading ? (
        <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
      ) : (
        <div className="space-y-4">
          {forms.map(f => (
            <div key={f.id} className="bg-white rounded-xl shadow hover:shadow-md p-5 border border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">{f.title}</h3>
                {f.description && <p className="text-sm text-gray-500 mt-1">{f.description}</p>}
                <p className="text-xs text-gray-400 mt-1">الردود: {f.responseCount}</p>
              </div>
              <a href={`/forms/${f.shareToken}`}
                className="bg-ficc-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex-shrink-0">
                فتح الاستمارة
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
