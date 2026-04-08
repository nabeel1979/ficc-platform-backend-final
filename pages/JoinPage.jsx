import { useNavigate } from 'react-router-dom'

export default function JoinPage() {
  const navigate = useNavigate()

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#1a1a2e,#2C3E6B)',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 16px',fontFamily:'Cairo,sans-serif',direction:'rtl'}}>
      <div style={{background:'white',borderRadius:'24px',padding:'40px',maxWidth:'480px',width:'100%',textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{fontSize:'52px',marginBottom:'16px'}}>🔒</div>
        <h2 style={{color:'#2C3E6B',fontWeight:'900',fontSize:'22px',margin:'0 0 12px'}}>العضوية محدودة</h2>
        <p style={{color:'#64748b',fontSize:'14px',lineHeight:'1.7',margin:'0 0 24px'}}>
          للانضمام كغرفة تجارية أو عضو مجلس الاتحاد،<br />
          يرجى التواصل مع الاتحاد مباشرة
        </p>
        <div style={{background:'#EEF2FF',borderRadius:'14px',padding:'20px',marginBottom:'24px',textAlign:'right'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
            <span style={{fontSize:'20px'}}>📞</span>
            <div>
              <p style={{color:'#888',fontSize:'11px',margin:0}}>الرقم المختصر</p>
              <p style={{color:'#2C3E6B',fontWeight:'800',fontSize:'16px',margin:0}}>5366</p>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
            <span style={{fontSize:'20px'}}>✉️</span>
            <div>
              <p style={{color:'#888',fontSize:'11px',margin:0}}>البريد الإلكتروني</p>
              <p style={{color:'#2C3E6B',fontWeight:'800',fontSize:'14px',margin:0}}>info@ficc.iq</p>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'20px'}}>🌐</span>
            <div>
              <p style={{color:'#888',fontSize:'11px',margin:0}}>الموقع الرسمي</p>
              <p style={{color:'#2C3E6B',fontWeight:'800',fontSize:'14px',margin:0}}>ficc.iq</p>
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:'10px',flexDirection:'column'}}>
          <a href="tel:5366"
            style={{padding:'12px',background:'#2C3E6B',color:'white',borderRadius:'12px',textDecoration:'none',fontWeight:'700',fontSize:'14px'}}>
            📞 اتصل بنا
          </a>
          <a href="/"
            style={{padding:'12px',background:'#f1f5f9',color:'#64748b',borderRadius:'12px',textDecoration:'none',fontWeight:'700',fontSize:'14px'}}>
            ← العودة للرئيسية
          </a>
        </div>
      </div>
    </div>
  )
}
