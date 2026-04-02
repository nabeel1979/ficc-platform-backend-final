import { useState, useEffect } from 'react'
import api from '../lib/api'

const API = ''

export default function Conferences() {
  const [conferences, setConferences] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    api.get(`${API}/conferences`).then(r => setConferences(r.data)).finally(() => setLoading(false))
  }, [])

  const openConference = async (conf) => {
    setSelected(conf)
    const r = await api.get(`${API}/conferences/${conf.id}/sessions`)
    setSessions(r.data)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🎤 المؤتمرات والفعاليات</h1>
      {loading ? (
        <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {conferences.map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow hover:shadow-md overflow-hidden border border-gray-100 cursor-pointer" onClick={() => openConference(c)}>
              {c.imageUrl && <img src={c.imageUrl} alt={c.title} className="w-full h-40 object-cover" />}
              <div className="p-5">
                <h3 className="font-bold text-gray-800 text-lg mb-2">{c.title}</h3>
                {c.description && <p className="text-gray-500 text-sm mb-3 line-clamp-2">{c.description}</p>}
                <div className="text-sm text-gray-600 space-y-1">
                  <p>📍 {c.location}</p>
                  <p>📅 {new Date(c.date).toLocaleDateString('ar-IQ')}</p>
                  {c.maxAttendees && <p>👥 الطاقة: {c.maxAttendees} حاضر</p>}
                </div>
                <button className="mt-4 w-full bg-ficc-gold text-white py-2 rounded-lg text-sm font-medium hover:bg-yellow-600">
                  سجّل حضورك
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sessions Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 mb-4">{selected.title} — جدول الجلسات</h2>
            {sessions.length === 0 ? (
              <p className="text-gray-400 text-center py-4">لا توجد جلسات مضافة بعد</p>
            ) : (
              <div className="space-y-3">
                {sessions.map(s => (
                  <div key={s.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-bold text-gray-700">{s.title}</h4>
                    {s.speaker && <p className="text-sm text-blue-700">المتحدث: {s.speaker}</p>}
                    <div className="flex gap-4 text-xs text-gray-500 mt-1">
                      {s.startTime && <span>🕐 {new Date(s.startTime).toLocaleTimeString('ar-IQ', {hour:'2-digit',minute:'2-digit'})}</span>}
                      {s.room && <span>🏛️ {s.room}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setSelected(null)} className="mt-4 w-full border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
