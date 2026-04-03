using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;

namespace FICCPlatform.Services;

public class R2StorageService {
    private readonly AmazonS3Client _s3;
    private readonly string _bucket;
    private readonly string _endpoint;
    private readonly bool _enabled;

    public R2StorageService(IConfiguration cfg) {
        var accountId  = cfg["Cloudflare:AccountId"]  ?? "";
        var accessKey  = cfg["Cloudflare:AccessKeyId"] ?? "";
        var secretKey  = cfg["Cloudflare:SecretKey"]   ?? "";
        _bucket        = cfg["Cloudflare:Bucket"]      ?? "ficcmedia";
        _endpoint      = $"https://{accountId}.r2.cloudflarestorage.com";
        _enabled       = !string.IsNullOrEmpty(accessKey) && !string.IsNullOrEmpty(secretKey);

        if (_enabled) {
            var config = new AmazonS3Config {
                ServiceURL = _endpoint,
                ForcePathStyle = true
            };
            _s3 = new AmazonS3Client(accessKey, secretKey, config);
        }
    }

    public bool IsEnabled => _enabled;

    // رفع ملف لـ R2
    public async Task<string?> UploadAsync(Stream stream, string key, string contentType) {
        if (!_enabled) return null;
        try {
            var request = new PutObjectRequest {
                BucketName  = _bucket,
                Key         = key,
                InputStream = stream,
                ContentType = contentType,
                CannedACL   = S3CannedACL.PublicRead
            };
            await _s3.PutObjectAsync(request);
            return $"{_endpoint}/{_bucket}/{key}";
        } catch (Exception ex) {
            Console.WriteLine($"R2 upload failed: {ex.Message}");
            return null;
        }
    }

    // رفع ملف من مسار محلي
    public async Task<string?> UploadFileAsync(string localPath, string key, string contentType) {
        if (!_enabled || !File.Exists(localPath)) return null;
        using var stream = File.OpenRead(localPath);
        return await UploadAsync(stream, key, contentType);
    }

    // حذف ملف من R2
    public async Task DeleteAsync(string key) {
        if (!_enabled) return;
        try {
            await _s3.DeleteObjectAsync(_bucket, key);
        } catch { }
    }

    // توليد URL للوصول العام
    public string GetPublicUrl(string key) =>
        $"{_endpoint}/{_bucket}/{key}";
}
