namespace FICCPlatform.Services;

/// <summary>
/// خدمة مركزية لإدارة مسارات الملفات المرفوعة.
/// المسار يُقرأ من appsettings: Storage:UploadsPath
/// إذا كان فارغاً → يستخدم wwwroot/uploads تلقائياً
/// 
/// Linux:   Storage:UploadsPath = /root/.openclaw/workspace/ficc-platform/uploads
/// Windows: Storage:UploadsPath = D:\FICC-Platform\uploads
/// Docker:  Storage:UploadsPath = (فارغ → wwwroot/uploads)
/// </summary>
public class StorageService {
    private readonly string _uploadsRoot;

    public StorageService(IConfiguration cfg, IWebHostEnvironment env) {
        var configured = cfg["Storage:UploadsPath"];
        if (!string.IsNullOrWhiteSpace(configured)) {
            _uploadsRoot = configured;
        } else {
            // default: wwwroot/uploads داخل التطبيق
            _uploadsRoot = Path.Combine(
                env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"),
                "uploads"
            );
        }
        // تأكد المجلد الجذري موجود
        Directory.CreateDirectory(_uploadsRoot);
    }

    /// <summary>المسار الجذري لمجلد uploads</summary>
    public string UploadsRoot => _uploadsRoot;

    /// <summary>مسار مجلد فرعي (مثلاً "members", "news")</summary>
    public string GetFolder(string subFolder) {
        var path = Path.Combine(_uploadsRoot, subFolder);
        Directory.CreateDirectory(path);
        return path;
    }

    /// <summary>مسار ملف كامل داخل مجلد فرعي</summary>
    public string GetFilePath(string subFolder, string fileName) =>
        Path.Combine(GetFolder(subFolder), fileName);

    /// <summary>URL نسبي للملف (للـ frontend): /uploads/members/file.jpg</summary>
    public string GetRelativeUrl(string subFolder, string fileName) =>
        $"/uploads/{subFolder}/{fileName}";
}
