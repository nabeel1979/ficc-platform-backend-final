import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e?.message || 'خطأ غير معروف' } }
  render() {
    if (this.state.error) return (
      <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'Cairo,sans-serif',direction:'rtl',background:'#f5f7fa',padding:'20px'}}>
        <img src="/ficc-logo.jpg" alt="FICC" style={{width:'70px',height:'70px',borderRadius:'50%',border:'3px solid #FFC72C',marginBottom:'20px'}} />
        <h2 style={{color:'#2C3E6B',fontSize:'20px',fontWeight:'800',marginBottom:'12px'}}>حدث خطأ في تحميل الصفحة</h2>
        <p style={{color:'#888',fontSize:'14px',marginBottom:'24px'}}>يرجى تحديث الصفحة للمحاولة مجدداً</p>
        <button onClick={()=>window.location.reload()} style={{padding:'12px 32px',borderRadius:'12px',background:'linear-gradient(135deg,#2C3E6B,#4A6FA5)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontWeight:'700',fontSize:'15px'}}>
          🔄 تحديث الصفحة
        </button>
      </div>
    )
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
)
