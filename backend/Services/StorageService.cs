using Amazon.S3;
using Amazon.S3.Model;

namespace FICCPlatform.Services;

/// <summary>
/// خدمة مركزية لإدارة الملفات — تدعم التخزين المحلي + Cloudflare R2
/// إذا R2 مفعّل: يرفع على السحابة ويرجع URL
/// إذا لا: يحفظ محلياً ويرجع مسار نسبي
/// </summary>
public class StorageService {
    private readonly string _uploadsRoot;
    private readonly AmazonS3Client? _s3;
    private readonly string _bucket;
    private readonly string _r2Endpoint;
    private readonly bool _r2Enabled;

    public StorageService(IConfiguration cfg, IWebHostEnvironment env) {
        // مسار التخزين المحلي
        var configured = cfg["Storage:UploadsPath"];
        _uploadsRoot = !string.IsNullOrWhiteSpace(configured)
            ? configured
            : Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads");
        Directory.CreateDirectory(_uploadsRoot);

        // إعداد Cloudflare R2
        var accountId  = cfg["Cloudflare:AccountId"]  ?? "";
        var accessKey  = cfg["Cloudflare:AccessKeyId"] ?? "";
        var secretKey  = cfg["Cloudflare:SecretKey"]   ?? "";
        _bucket        = cfg["Cloudflare:Bucket"]      ?? "ficcmedia";
        _r2Endpoint    = $"https://{accountId}.r2.cloudflarestorage.com";
        _r2Enabled     = !string.IsNullOrEmpty(accessKey) && !string.IsNullOrEmpty(secretKey) && !string.IsNullOrEmpty(accountId);

        if (_r2Enabled) {
            _s3 = new AmazonS3Client(accessKey, secretKey, new AmazonS3Config {
                ServiceURL = _r2Endpoint,
                ForcePathStyle = true
            });
        }
    }

    public bool IsR2Enabled => _r2Enabled;
    public string UploadsRoot => _uploadsRoot;

    /// <summary>مسار مجلد فرعي محلي</summary>
    public string GetFolder(string subFolder) {
        var path = Path.Combine(_uploadsRoot, subFolder);
        Directory.CreateDirectory(path);
        return path;
    }

    public string GetFilePath(string subFolder, string fileName) =>
        Path.Combine(GetFolder(subFolder), fileName);

    public string GetRelativeUrl(string subFolder, string fileName) =>
        $"/uploads/{subFolder}/{fileName}";

    /// <summary>
    /// رفع ملف — إذا R2 مفعّل يرفع عليه، وإلا يحفظ محلياً
    /// يرجع URL كامل (R2) أو مسار نسبي (محلي)
    /// </summary>
    public async Task<string> SaveFileAsync(IFormFile file, string subFolder, string? customName = null) {
        var ext = Path.GetExtension(file.FileName).ToLower();
        var fileName = customName ?? $"{Guid.NewGuid()}{ext}";

        if (_r2Enabled && _s3 != null) {
            // رفع لـ R2
            var key = $"{subFolder}/{fileName}";
            using var stream = file.OpenReadStream();
            var request = new PutObjectRequest {
                BucketName  = _bucket,
                Key         = key,
                InputStream = stream,
                ContentType = file.ContentType,
                CannedACL   = S3CannedACL.PublicRead
            };
            await _s3.PutObjectAsync(request);
            return $"{_r2Endpoint}/{_bucket}/{key}";
        } else {
            // حفظ محلي
            var folder = GetFolder(subFolder);
            var fullPath = Path.Combine(folder, fileName);
            using var fs = File.Create(fullPath);
            await file.CopyToAsync(fs);
            return $"/uploads/{subFolder}/{fileName}";
        }
    }

    /// <summary>حذف ملف من R2 أو محلياً</summary>
    public async Task DeleteFileAsync(string urlOrPath) {
        if (string.IsNullOrEmpty(urlOrPath)) return;

        if (_r2Enabled && _s3 != null && urlOrPath.Contains("r2.cloudflarestorage.com")) {
            // استخرج الـ key من الـ URL
            var uri = new Uri(urlOrPath);
            var key = uri.AbsolutePath.TrimStart('/').Replace($"{_bucket}/", "");
            try { await _s3.DeleteObjectAsync(_bucket, key); } catch { }
        } else {
            // حذف محلي
            var localPath = urlOrPath.StartsWith("/uploads/")
                ? Path.Combine(_uploadsRoot, urlOrPath["/uploads/".Length..])
                : urlOrPath;
            if (File.Exists(localPath)) File.Delete(localPath);
        }
    }
}
