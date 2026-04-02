import axios from 'axios'

// قرأ الـ baseURL من .env — مثال: VITE_API_URL=https://ficcapi.gcdev.co/api
// إذا ما محدد، يستخدم /api (nginx proxy)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

// أضف الـ JWT token تلقائياً لكل الطلبات
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ficc_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
