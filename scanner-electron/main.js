const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const https = require('https');
const http = require('http');

const LOCAL_PORT = 39271; // منفذ محلي للتواصل مع المتصفح

let mainWindow;
const configFile = path.join(os.homedir(), 'ficc-scanner-config.json');

// مسارات NAPS2 المحتملة
const NAPS2_PATHS = [
  'C:\\Program Files\\NAPS2\\NAPS2.exe',
  'C:\\Program Files (x86)\\NAPS2\\NAPS2.exe',
  'C:\\Program Files\\NAPS2\\NAPS2.exe',
  'D:\\Program Files\\NAPS2\\NAPS2.exe',
  'E:\\Program Files\\NAPS2\\NAPS2.exe',
];

function detectNAPS2() {
  for (const p of NAPS2_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  // البحث في الـ Registry (Windows)
  try {
    const { execSync } = require('child_process');
    const result = execSync(
      'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\NAPS2.exe" /ve 2>nul',
      { encoding: 'utf8', timeout: 3000 }
    );
    const match = result.match(/REG_SZ\s+(.+\.exe)/i);
    if (match && fs.existsSync(match[1].trim())) return match[1].trim();
  } catch {}
  return null;
}

const loadConfig = () => {
  try {
    if (fs.existsSync(configFile)) {
      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      // تحديث مسار NAPS2 تلقائياً لو ما موجود أو متغير
      if (!config.naps2Path || !fs.existsSync(config.naps2Path)) {
        config.naps2Path = detectNAPS2() || 'C:\\Program Files\\NAPS2\\NAPS2.exe';
      }
      return config;
    }
  } catch (e) {}
  const detectedNAPS2 = detectNAPS2();
  return { 
    token: '', 
    draftId: '', 
    naps2Path: detectedNAPS2 || 'C:\\Program Files\\NAPS2\\NAPS2.exe', 
    scanFolder: 'E:\\scaner',
    apiUrl: 'https://ficc.iq',
    naps2Detected: !!detectedNAPS2
  };
};

const saveConfig = (config) => {
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      enableRemoteModule: false
    },
    icon: path.join(__dirname, 'icon.ico')
  });

  const indexPath = path.join(__dirname, 'index.html');
  console.log('Loading:', indexPath);
  
  mainWindow.loadFile(indexPath).catch(err => {
    console.error('Failed to load file:', err);
    mainWindow.loadURL(`file://${indexPath}`);
  });

  // فقط في development - إذا بتبي تشوف console
  // mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('did-fail-load', () => {
    console.error('Page failed to load');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// Register custom protocol ficc-scanner://
app.setAsDefaultProtocolClient('ficc-scanner');

app.on('ready', () => {
  createWindow();
  startLocalServer();
});

// ─── Local HTTP Server ───
function startLocalServer() {
  const server = http.createServer((req, res) => {
    // السماح لأي origin (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      res.writeHead(200); res.end(); return;
    }

    const url = new URL(req.url, `http://localhost:${LOCAL_PORT}`);

    // GET /ping - تحقق أن الـ App شغّال
    if (url.pathname === '/ping') {
      const config = loadConfig();
      const naps2Path = config.naps2Path;
      res.writeHead(200);
      res.end(JSON.stringify({ 
        status: 'ok', 
        app: 'FICC Scanner',
        naps2Path: naps2Path,
        naps2Found: fs.existsSync(naps2Path),
        scanFolder: config.scanFolder || 'E:\\scaner'
      }));
      return;
    }

    // GET /detect-naps2 - اكتشاف مسار NAPS2
    if (url.pathname === '/detect-naps2') {
      const detected = detectNAPS2();
      res.writeHead(200);
      res.end(JSON.stringify({ 
        found: !!detected,
        path: detected || null
      }));
      return;
    }

    // GET /last-upload - آخر ملف رُفع (للصفحة لتتحدث)
    if (url.pathname === '/last-upload') {
      const config = loadConfig();
      res.writeHead(200);
      res.end(JSON.stringify({
        lastUpload: global.lastUpload || null,
        draftId: config.draftId || null
      }));
      return;
    }

    // POST /open-naps2 - فتح NAPS2
    if (url.pathname === '/open-naps2' && req.method === 'POST') {
      let body = '';
      req.on('data', d => body += d);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const config = loadConfig();

          // احفظ draftId و token
          if (data.draftId) config.draftId = data.draftId;
          if (data.token)   config.token   = data.token;
          saveConfig(config);

          // فتح NAPS2
          const naps2 = config.naps2Path || 'C:\\Program Files\\NAPS2\\NAPS2.exe';
          if (fs.existsSync(naps2)) {
            spawn(naps2, [], { detached: true });
            // أبلغ الـ renderer
            if (mainWindow) {
              mainWindow.webContents.send('start-monitor', {
                draftId: config.draftId,
                token:   config.token,
                scanFolder: config.scanFolder || 'E:\\scaner'
              });
            }
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, message: 'NAPS2 opened' }));
          } else {
            res.writeHead(404);
            res.end(JSON.stringify({ success: false, error: 'NAPS2 not found at: ' + naps2 }));
          }
        } catch (e) {
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  server.listen(LOCAL_PORT, '127.0.0.1', () => {
    console.log(`✅ Local server running on http://127.0.0.1:${LOCAL_PORT}`);
  });

  server.on('error', (err) => {
    console.error('Local server error:', err.message);
  });
}

// Handle protocol on Windows
app.on('second-instance', (event, commandLine) => {
  const url = commandLine.find(arg => arg.startsWith('ficc-scanner://'));
  if (url && mainWindow) {
    mainWindow.focus();
    mainWindow.webContents.send('protocol-url', url);
  }
});

// Handle protocol on Mac
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('protocol-url', url);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// ─── IPC Handlers ───

ipcMain.handle('get-config', () => loadConfig());

ipcMain.handle('save-config', (event, config) => {
  saveConfig(config);
  return { success: true };
});

ipcMain.handle('open-naps2', async (event, { naps2Path, draftId }) => {
  try {
    if (!naps2Path || !fs.existsSync(naps2Path)) {
      return { success: false, error: 'NAPS2 not found' };
    }
    
    const proc = spawn(naps2Path, [], { detached: true });
    return { success: true, pid: proc.pid };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('monitor-folder', async (event, { scanFolder, draftId, token }) => {
  if (!fs.existsSync(scanFolder)) {
    return { success: false, error: 'Folder not found' };
  }

  const files = fs.readdirSync(scanFolder)
    .filter(f => f.match(/\.(jpg|jpeg|png|pdf)$/i))
    .map(f => ({
      name: f,
      path: path.join(scanFolder, f),
      mtime: fs.statSync(path.join(scanFolder, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 10)
    .map(f => f.path);

  return { success: true, files };
});

ipcMain.handle('upload-file', async (event, { filePath, draftId, token, apiUrl, deleteAfterUpload = true }) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const boundary = '----FICCBoundary' + Date.now();
    
    // بناء multipart/form-data
    const header = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileBuffer, footer]);
    
    const baseUrl = apiUrl || 'https://ficc.iq';
    const uploadUrl = `${baseUrl}/api/correspondence/${draftId}/attach`;
    const isHttps = uploadUrl.startsWith('https');
    const lib = isHttps ? https : http;
    const urlObj = new URL(uploadUrl);
    
    return new Promise((resolve) => {
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length
        },
        rejectUnauthorized: false
      };
      
      const req = lib.request(options, (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            // ✅ حذف الملف بعد الرفع الناجح
            if (deleteAfterUpload) {
              try {
                fs.unlinkSync(filePath);
                console.log(`✅ Deleted after upload: ${fileName}`);
              } catch (e) {
                console.error(`⚠️ Could not delete: ${e.message}`);
              }
            }
            // حفظ آخر رفع للـ polling
            global.lastUpload = { fileName, time: Date.now(), draftId };
            resolve({ success: true, fileName, size: fileBuffer.length, deleted: deleteAfterUpload });
          } else {
            resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` });
          }
        });
      });
      
      req.on('error', (err) => resolve({ success: false, error: err.message }));
      req.write(body);
      req.end();
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});
