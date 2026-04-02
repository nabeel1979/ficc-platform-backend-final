"""
FICC Scanner Client - Windows v18
System Tray Integration + NAPS2 GUI
"""
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

import tkinter as tk
from tkinter import messagebox, filedialog
import threading
import requests
import os
import json
import subprocess
from datetime import datetime
try:
    from pystray import Icon, Menu, MenuItem
    import PIL.Image
    HAS_TRAY = True
except ImportError:
    HAS_TRAY = False

API_URL = "https://ficc.iq/api/correspondence"
CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scanner_config.json")
NAPS2_PATHS = [
    r"C:\Program Files\NAPS2\NAPS2.exe",
    r"C:\Program Files (x86)\NAPS2\NAPS2.exe",
    r"C:\Program Files\NAPS2\NAPS2.Console.exe",
    r"C:\Program Files (x86)\NAPS2\NAPS2.Console.exe",
]

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"token": "", "naps2_path": ""}

def save_config(cfg):
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)

def find_naps2():
    for p in NAPS2_PATHS:
        if os.path.exists(p):
            return p
    return None

def upload_file(filepath, draft_id, token):
    fname = os.path.basename(filepath)
    ext = fname.lower().split('.')[-1]
    mimes = {'jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png','bmp':'image/bmp','pdf':'application/pdf'}
    mime = mimes.get(ext, 'application/octet-stream')
    for attempt in range(1, 4):
        try:
            with open(filepath, 'rb') as f:
                r = requests.post(
                    f"{API_URL}/{draft_id}/attach",
                    files={'file': (fname, f, mime)},
                    headers={'Authorization': f'Bearer {token}'},
                    timeout=180, verify=False
                )
            return r.ok, r.json() if r.ok else r.text
        except Exception as e:
            if attempt == 3:
                return False, str(e)
            import time; time.sleep(3 * attempt)

class ScannerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("FICC Scanner - نظام المراسلات الرسمية")
        self.root.geometry("550x520")
        self.root.configure(bg='#F0F2F8')
        self.root.resizable(False, False)
        self.cfg = load_config()
        self.tray_icon = None
        self.build_ui()
        
        if HAS_TRAY:
            self.setup_tray()
        
        # Window close button behavior
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)

    def build_ui(self):
        header = tk.Frame(self.root, bg='#2C3E6B', height=60)
        header.pack(fill='x')
        tk.Label(header, text="🏛️ FICC Scanner v18", font=('Arial', 16, 'bold'),
                 bg='#2C3E6B', fg='#FFC72C').pack(side='left', padx=20, pady=10)
        tk.Label(header, text="نظام المراسلات الرسمية", font=('Arial', 10),
                 bg='#2C3E6B', fg='white').pack(side='right', padx=20, pady=10)

        body = tk.Frame(self.root, bg='#F0F2F8', padx=20, pady=20)
        body.pack(fill='both', expand=True)

        tk.Label(body, text="رقم المسودة (مثال: 18):", font=('Arial', 11),
                 bg='#F0F2F8', anchor='e').pack(fill='x', pady=(0,2))
        self.draft_entry = tk.Entry(body, font=('Arial', 14), justify='center')
        self.draft_entry.pack(fill='x', pady=(0,10))

        tk.Label(body, text="رمز الدخول (Token):", font=('Arial', 11),
                 bg='#F0F2F8', anchor='e').pack(fill='x', pady=(0,2))
        self.token_entry = tk.Entry(body, font=('Arial', 10), show='*')
        self.token_entry.pack(fill='x', pady=(0,16))
        if self.cfg.get('token'):
            self.token_entry.insert(0, self.cfg['token'])

        # NAPS2 status
        naps2 = find_naps2()
        naps_status = "✅ NAPS2 مثبت" if naps2 else "⚠️ NAPS2 غير مثبت"
        naps_color = "#10b981" if naps2 else "#d97706"
        
        naps_frame = tk.Frame(body, bg='#F0F2F8')
        naps_frame.pack(fill='x', pady=8)
        tk.Label(naps_frame, text=naps_status, font=('Arial', 9), bg='#F0F2F8', fg=naps_color).pack(side='left')
        
        if not naps2:
            tk.Button(naps_frame, text="📁 اختر NAPS2", font=('Arial', 9),
                     bg='#FFC72C', fg='#1a1a2e', cursor='hand2',
                     command=self.browse_naps2, relief='flat').pack(side='right')

        tk.Button(body, text="📸 فتح NAPS2 للمسح",
                  font=('Arial', 12, 'bold'), bg='#2C3E6B', fg='white',
                  cursor='hand2', command=self.scan_naps2_ui, height=2).pack(fill='x', pady=4)

        tk.Button(body, text="📂 اختر صور من الكمبيوتر",
                  font=('Arial', 12, 'bold'), bg='#6366f1', fg='white',
                  cursor='hand2', command=self.browse_images, height=2).pack(fill='x', pady=4)

        self.status = tk.Label(body, text="جاهز للمسح ✅", font=('Arial', 11),
                               bg='#F0F2F8', fg='#10b981')
        self.status.pack(pady=10)

    def setup_tray(self):
        """Setup System Tray icon"""
        try:
            # Create a simple colored icon (yellow square)
            img = PIL.Image.new('RGB', (64, 64), color='#FFC72C')
            
            menu = Menu(
                MenuItem('📂 أفتح البرنامج', self.show_window),
                MenuItem('---', None),
                MenuItem('❌ خروج', self.quit_app)
            )
            
            self.tray_icon = Icon("FICC Scanner", img, menu=menu)
        except Exception as e:
            print(f"Tray setup failed: {e}")

    def show_window(self):
        """Show window from tray"""
        self.root.deiconify()
        self.root.lift()

    def on_closing(self):
        """Minimize to tray instead of closing"""
        if HAS_TRAY and self.tray_icon:
            self.root.withdraw()
            self.tray_icon.run_nonblocking()
        else:
            self.root.destroy()

    def quit_app(self):
        """Quit application"""
        if self.tray_icon:
            self.tray_icon.stop()
        self.root.destroy()

    def browse_naps2(self):
        path = filedialog.askopenfilename(
            title="اختر NAPS2.exe",
            filetypes=[("NAPS2 Executable", "NAPS2.exe"), ("All Files", "*.*")]
        )
        if path:
            self.cfg['naps2_path'] = path
            save_config(self.cfg)
            messagebox.showinfo("تم", f"تم حفظ NAPS2 من:\n{path}")

    def browse_images(self):
        draft_id, token = self.get_params()
        if not draft_id: return
        
        files = filedialog.askopenfilenames(
            title="اختر الصور",
            filetypes=[("Image Files", "*.jpg *.jpeg *.png *.bmp"), ("All Files", "*.*")]
        )
        
        if files:
            self.upload_files(list(files), draft_id, token)

    def get_params(self):
        draft_id = self.draft_entry.get().strip()
        token = self.token_entry.get().strip()
        if not draft_id or not token:
            messagebox.showwarning("تنبيه", "أدخل رقم المسودة ورمز الدخول")
            return None, None
        self.cfg['token'] = token
        save_config(self.cfg)
        return draft_id, token

    def scan_naps2_ui(self):
        draft_id, token = self.get_params()
        if not draft_id: return
        
        naps2 = self.cfg.get('naps2_path') or find_naps2()
        if not naps2:
            messagebox.showerror("خطأ", "لم نجد NAPS2\nاختر موقعه يدويّاً")
            self.browse_naps2()
            return
        
        self.status.config(text="⏳ جاري فتح NAPS2...", fg='#d97706')
        self.root.update()
        
        def task():
            try:
                subprocess.Popen(naps2, shell=True)
                self.status.config(text="✅ تم فتح NAPS2\nاعمل الصور وأغلق NAPS2 عشان يحمّلها", fg='#10b981')
                self.root.update()
                
                import time
                time.sleep(2)
                
                naps2_dir = os.path.expanduser(r"~\Pictures\NAPS2")
                if os.path.exists(naps2_dir):
                    files = [os.path.join(naps2_dir, f) for f in os.listdir(naps2_dir) 
                            if f.endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
                    if files:
                        self.upload_files(files, draft_id, token)
                        return
                
                self.status.config(text="⚠️ ما اتحمّلت صور جديدة", fg='#d97706')
            except Exception as e:
                messagebox.showerror("خطأ", str(e))
                self.status.config(text="❌ فشل المسح", fg='#dc2626')
        
        threading.Thread(target=task, daemon=True).start()

    def upload_files(self, files, draft_id, token):
        self.status.config(text=f"⏳ رفع 0/{len(files)}...", fg='#d97706')
        self.root.update()
        
        success_count = 0
        for i, fp in enumerate(files):
            self.status.config(text=f"⏳ رفع {i+1}/{len(files)}...", fg='#d97706')
            self.root.update()
            ok, result = upload_file(fp, draft_id, token)
            if ok:
                success_count += 1
            else:
                messagebox.showerror("خطأ في الرفع", f"فشل رفع {os.path.basename(fp)}\n{result}")
                self.status.config(text="❌ فشل الرفع", fg='#dc2626')
                return
        
        self.status.config(text=f"✅ تم رفع {success_count} صورة بنجاح!", fg='#10b981')

if __name__ == "__main__":
    root = tk.Tk()
    app = ScannerApp(root)
    
    if HAS_TRAY and app.tray_icon:
        root.withdraw()
        app.tray_icon.run()
    else:
        root.mainloop()
