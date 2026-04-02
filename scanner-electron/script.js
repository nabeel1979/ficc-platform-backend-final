// ─── Elements ───
const draftIdInput     = document.getElementById('draftId');
const tokenInput       = document.getElementById('token');
const scanFolderInput  = document.getElementById('scanFolder');
const naps2PathInput   = document.getElementById('naps2Path');
const naps2StatusDiv   = document.getElementById('naps2Status');
const toggleTokenBtn   = document.getElementById('toggleToken');
const saveConfigBtn    = document.getElementById('saveConfig');
const openNAPS2Btn     = document.getElementById('openNAPS2');
const startMonitorBtn  = document.getElementById('startMonitoring');
const stopMonitorBtn   = document.getElementById('stopMonitoring');
const statusCard       = document.getElementById('statusCard');
const filesListDiv     = document.getElementById('filesList');
const uploadLogDiv     = document.getElementById('uploadLog');
const connectionBadge  = document.getElementById('connectionBadge');
const connectionText   = document.getElementById('connectionText');

let monitoringActive  = false;
let monitoringInterval = null;
let uploadedFiles     = new Set();
let currentStep       = 1;

// ─── Steps ───
function setStep(n) {
  currentStep = n;
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step${i}`);
    if (i < n) el.className = 'step done';
    else if (i === n) el.className = 'step active';
    else el.className = 'step';
  }
}

// ─── Status ───
function setStatus(msg, type = 'ready') {
  statusCard.textContent = msg;
  statusCard.className = `status-card ${type}`;
}

// ─── Connection Badge ───
function setConnection(connected) {
  connectionBadge.className = `status-badge ${connected ? 'connected' : 'disconnected'}`;
  connectionText.textContent = connected ? 'متصل بالسيرفر' : 'غير متصل';
}

// ─── Init ───
async function init() {
  if (!window.electronAPI) {
    setStatus('❌ electronAPI غير متوفر — أعد تشغيل التطبيق', 'error');
    return;
  }

  setStep(1);

  try {
    const config = await window.electronAPI.getConfig();
    draftIdInput.value    = config.draftId   || '';
    tokenInput.value      = config.token     || '';
    scanFolderInput.value = config.scanFolder || 'E:\\scaner';
    naps2PathInput.value  = config.naps2Path  || 'C:\\Program Files\\NAPS2\\NAPS2.exe';

    // عرض حالة NAPS2
    updateNAPS2Status(config.naps2Path);

    // تحقق من الاتصال
    checkConnection();

    if (config.draftId && config.token) {
      setStep(2);
      setStatus('✅ الإعدادات محفوظة — اضغط "فتح NAPS2 + بدء المراقبة"', 'ready');
    } else {
      setStatus('⚙️ أدخل Token و Draft ID ثم اضغط حفظ', 'warning');
    }
  } catch (err) {
    setStatus('❌ خطأ: ' + err.message, 'error');
  }

  // Handle protocol URL
  if (window.electronAPI?.onStartMonitor) {
    window.electronAPI.onStartMonitor((data) => {
      if (data.draftId) draftIdInput.value = data.draftId;
      if (data.token)   tokenInput.value   = data.token;
      setStep(2);
      openNAPS2Btn.click();
    });
  }
}

// ─── NAPS2 Status ───
function updateNAPS2Status(path) {
  if (path && path.includes('NAPS2')) {
    naps2StatusDiv.className = 'naps2-status found';
    naps2StatusDiv.textContent = '✅ ' + path;
  } else {
    naps2StatusDiv.className = 'naps2-status notfound';
    naps2StatusDiv.textContent = '⚠️ لم يتم الكشف — تحقق من التثبيت';
  }
}

// ─── Check Connection ───
async function checkConnection() {
  try {
    const res = await fetch('http://127.0.0.1:39271/ping', {
      signal: AbortSignal.timeout(1000)
    }).catch(() => null);
    setConnection(res?.ok === true);
  } catch { setConnection(false); }
}
setInterval(checkConnection, 5000);

// ─── Toggle Token ───
toggleTokenBtn.addEventListener('click', () => {
  tokenInput.type = tokenInput.type === 'password' ? 'text' : 'password';
  toggleTokenBtn.textContent = tokenInput.type === 'password' ? '👁️' : '🙈';
});

// ─── Save Config ───
saveConfigBtn.addEventListener('click', async () => {
  if (!draftIdInput.value || !tokenInput.value) {
    setStatus('⚠️ أدخل Token و Draft ID أولاً!', 'warning');
    return;
  }
  await window.electronAPI.saveConfig({
    draftId:    draftIdInput.value,
    token:      tokenInput.value,
    scanFolder: scanFolderInput.value,
    naps2Path:  naps2PathInput.value,
    apiUrl:     'https://ficc.iq'
  });
  setStep(2);
  setStatus('✅ تم حفظ الإعدادات — جاهز للمسح', 'ready');
});

// ─── Open NAPS2 ───
openNAPS2Btn.addEventListener('click', async () => {
  if (!draftIdInput.value || !tokenInput.value) {
    setStatus('⚠️ أدخل Token و Draft ID أولاً!', 'warning');
    return;
  }

  setStatus('⏳ جاري فتح NAPS2...', 'scanning');
  setStep(2);

  const result = await window.electronAPI.openNAPS2({
    naps2Path: naps2PathInput.value || 'C:\\Program Files\\NAPS2\\NAPS2.exe',
    draftId:   draftIdInput.value
  });

  if (result.success) {
    setStatus('✅ NAPS2 مفتوح — امسح الوثيقة الآن 📄', 'scanning');
    startMonitor();
  } else {
    setStatus('❌ تعذّر فتح NAPS2: ' + result.error, 'error');
  }
});

// ─── Monitor ───
startMonitorBtn.addEventListener('click', startMonitor);
stopMonitorBtn.addEventListener('click', stopMonitor);

function startMonitor() {
  if (monitoringActive) return;
  if (!draftIdInput.value || !tokenInput.value) {
    setStatus('⚠️ أدخل Token و Draft ID أولاً!', 'warning');
    return;
  }
  monitoringActive = true;
  startMonitorBtn.disabled = true;
  stopMonitorBtn.disabled  = false;
  setStatus('🔄 جاري المراقبة — انتظر ملف جديد في ' + scanFolderInput.value, 'scanning');
  monitoringInterval = setInterval(checkNewFiles, 2000);
}

function stopMonitor() {
  monitoringActive = false;
  clearInterval(monitoringInterval);
  startMonitorBtn.disabled = false;
  stopMonitorBtn.disabled  = true;
}

// ─── Check New Files ───
async function checkNewFiles() {
  const result = await window.electronAPI.monitorFolder({
    scanFolder: scanFolderInput.value,
    draftId:    draftIdInput.value,
    token:      tokenInput.value
  });

  if (!result.success || !result.files.length) return;

  const newFiles = result.files.filter(f => !uploadedFiles.has(f));
  if (!newFiles.length) return;

  // عرض الملفات
  filesListDiv.innerHTML = result.files.map(f => {
    const name = f.split('\\').pop();
    const isNew = !uploadedFiles.has(f);
    return `<div class="file-item ${isNew ? 'new' : 'uploaded'}">
      <span class="file-name">${isNew ? '🆕' : '✅'} ${name}</span>
      <span class="file-badge" style="background:${isNew?'#bfdbfe':'#bbf7d0'};color:${isNew?'#2563eb':'#16a34a'}">
        ${isNew ? 'جديد' : 'مُرفوع'}
      </span>
    </div>`;
  }).join('');

  stopMonitor();

  // رفع الملفات الجديدة
  for (const filePath of newFiles) {
    const fileName = filePath.split('\\').pop();
    setStep(3);
    setStatus(`📤 جاري رفع: ${fileName}`, 'uploading');

    // إنشاء مسودة تلقائية إذا ما عندنا draftId
    let currentDraftId = draftIdInput.value;
    if (!currentDraftId) {
      try {
        const draftRes = await fetch('https://ficc.iq/api/correspondence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenInput.value}` },
          body: JSON.stringify({ subject: `مستند مسحوح - ${fileName}`, body: '', sendNow: false, recipients: [] })
        });
        const draftData = await draftRes.json();
        currentDraftId = draftData.id;
        draftIdInput.value = currentDraftId;
        setStatus(`📝 تم إنشاء مسودة #${currentDraftId} — جاري الرفع...`, 'uploading');
      } catch(e) {
        setStatus(`❌ فشل إنشاء المسودة: ${e.message}`, 'error');
        continue;
      }
    }

    // عرض في سجل الرفع
    uploadLogDiv.innerHTML = `<div class="file-item uploading">
      <span class="file-name">⏳ ${fileName}</span>
      <span class="file-badge" style="background:#fed7aa;color:#ea580c">جاري...</span>
    </div>` + uploadLogDiv.innerHTML;

    const deleteAfterUpload = document.getElementById('deleteAfterUpload')?.checked ?? true;
    const res = await window.electronAPI.uploadFile({
      filePath,
      draftId:  currentDraftId,
      token:    tokenInput.value,
      apiUrl:   'https://ficc.iq',
      deleteAfterUpload
    });

    if (res.success) {
      uploadedFiles.add(filePath);
      setStep(4);
      const deletedMsg = res.deleted ? ' — 🗑️ حُذف من المجلد' : '';
      setStatus(`✅ تم رفع "${fileName}" بنجاح!${deletedMsg} 🎉`, 'ready');
      uploadLogDiv.innerHTML = `<div class="file-item uploaded">
        <span class="file-name">✅ ${fileName}</span>
        <span class="file-badge" style="background:#bbf7d0;color:#16a34a">مُرفوع</span>
      </div>` + uploadLogDiv.innerHTML;
    } else {
      setStatus(`❌ فشل رفع "${fileName}": ${res.error}`, 'error');
      uploadLogDiv.innerHTML = `<div class="file-item" style="border-color:#fecaca;background:#FEF2F2">
        <span class="file-name">❌ ${fileName}</span>
        <span class="file-badge" style="background:#fecaca;color:#dc2626">فشل</span>
      </div>` + uploadLogDiv.innerHTML;
    }
  }
}

// ─── Handle Protocol ───
if (window.electronAPI?.onProtocolUrl) {
  window.electronAPI.onProtocolUrl((url) => {
    try {
      const params = new URL(url).searchParams;
      if (params.get('draftId')) draftIdInput.value = params.get('draftId');
      if (params.get('token'))   tokenInput.value   = params.get('token');
      window.electronAPI.saveConfig({
        draftId:    draftIdInput.value,
        token:      tokenInput.value,
        scanFolder: scanFolderInput.value,
        naps2Path:  naps2PathInput.value,
        apiUrl:     'https://ficc.iq'
      });
      openNAPS2Btn.click();
    } catch (e) { console.error('Protocol error:', e); }
  });
}

// ─── Start ───
init();
