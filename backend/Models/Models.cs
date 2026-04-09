namespace FICCPlatform.Models;

public class Chamber {
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string City { get; set; } = "";
    public string Governorate { get; set; } = "";
    public string? Phone { get; set; }
    public string? Email { get; set; }           // إيميل عام (ينشر)
    public string? InternalEmail { get; set; }   // إيميل المخاطبات الداخلية (سري)
    public string? Website { get; set; }
    public string? PoBox { get; set; }
    public string? Address { get; set; }
    public int? EstablishedYear { get; set; }
    public int MemberCount { get; set; }
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    // Social Media
    public string? Facebook { get; set; }
    public string? Twitter { get; set; }
    public string? Instagram { get; set; }
    public string? LinkedIn { get; set; }
    public string? WhatsApp { get; set; }
    public string? Telegram { get; set; }
    public string? YouTube { get; set; }
    public int? BoardMembersCount { get; set; }
    public int? GeneralAssemblyCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Member> Members { get; set; } = new List<Member>();
}

public class Member {
    public int Id { get; set; }
    public string FullName { get; set; } = "";        // اسم العضو والقب
    public string? Title { get; set; }                 // المنصب: رئيس/نائب أول/نائب ثاني/نائب ثالث/عضو
    public string? ChamberName { get; set; }           // اسم الغرفة التجارية
    public int? ChamberId { get; set; }                // رابط الغرفة التجارية
    public Chamber? Chamber { get; set; }
    public string? PhotoUrl { get; set; }              // صورة شخصية
    public string? Bio { get; set; }                   // نبذة شخصية
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Facebook { get; set; }
    public string? Twitter { get; set; }
    public string? Instagram { get; set; }
    public string? LinkedIn { get; set; }
    public string? YouTube { get; set; }
    public int SortOrder { get; set; } = 0;
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class News {
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Body { get; set; } = "";
    public string? Category { get; set; }
    public string? ImageUrl { get; set; }
    public string? Images { get; set; } // JSON array of up to 5 image URLs
    public string? VideoUrl { get; set; } // YouTube URL (optional)
    public DateTime PublishedAt { get; set; } = DateTime.UtcNow;
    public string? Author { get; set; }
    public bool IsFeatured { get; set; }
    public int ViewCount { get; set; }
}

public class Certificate {
    public int Id { get; set; }
    public int MemberId { get; set; }
    public Member? Member { get; set; }
    public string Type { get; set; } = "";
    public DateTime IssuedDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? SerialNo { get; set; }
    public string Status { get; set; } = "Active";
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Request {
    public int Id { get; set; }
    public int MemberId { get; set; }
    public Member? Member { get; set; }
    public string Type { get; set; } = "";
    public string? Description { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
    public string? Response { get; set; }
}

public class Exhibition {
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string? Location { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int? OrganizerChamberId { get; set; }
    public Chamber? OrganizerChamber { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = "Upcoming";
    public int? MaxParticipants { get; set; }
    public DateTime? RegistrationDeadline { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ExhibitionParticipant> Participants { get; set; } = new List<ExhibitionParticipant>();
}

public class ExhibitionParticipant {
    public int Id { get; set; }
    public int ExhibitionId { get; set; }
    public Exhibition? Exhibition { get; set; }
    public int MemberId { get; set; }
    public Member? Member { get; set; }
    public string? BoothNo { get; set; }
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Registered";
    public string? Notes { get; set; }
}

public class Conference {
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string? Location { get; set; }
    public DateTime Date { get; set; }
    public TimeOnly? Time { get; set; }
    public int? OrganizerChamberId { get; set; }
    public Chamber? OrganizerChamber { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = "Upcoming";
    public int? MaxAttendees { get; set; }
    public DateTime? RegistrationDeadline { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ConferenceSession> Sessions { get; set; } = new List<ConferenceSession>();
    public ICollection<ConferenceAttendee> Attendees { get; set; } = new List<ConferenceAttendee>();
}

public class ConferenceAttendee {
    public int Id { get; set; }
    public int ConferenceId { get; set; }
    public Conference? Conference { get; set; }
    public int MemberId { get; set; }
    public Member? Member { get; set; }
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
    public string AttendanceStatus { get; set; } = "Registered";
}

public class ConferenceSession {
    public int Id { get; set; }
    public int ConferenceId { get; set; }
    public Conference? Conference { get; set; }
    public string Title { get; set; } = "";
    public string? Speaker { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Room { get; set; }
    public string? Description { get; set; }
}

public class TraderDirectory {
    public int Id { get; set; }
    public string CompanyName { get; set; } = "";
    public string? TradeName { get; set; }       // الاسم التجاري
    public string? BusinessType { get; set; }    // شركة / مكتب / محل / صيدلية
    public string? OwnerName { get; set; }
    public string? TradeCategory { get; set; }
    public string? SubCategory { get; set; }
    public string? Governorate { get; set; }
    public string? City { get; set; }
    public string? Area { get; set; }             // المنطقة
    public string? Address { get; set; }
    public string? Description { get; set; }      // نبذة عن النشاط
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? LicenseNo { get; set; }
    public int? RegisteredYear { get; set; }
    public bool IsVerified { get; set; }
    public string? LogoUrl { get; set; }
    public string? PhotoUrl { get; set; }        // صورة المدير
    public int? ChamberId { get; set; }
    public string? ChamberName { get; set; }     // الغرفة التجارية
    // Social Media
    public string? Facebook { get; set; }
    public string? Twitter { get; set; }
    public string? Instagram { get; set; }
    public string? WhatsApp { get; set; }
    public string? Telegram { get; set; }
    public string? YouTube { get; set; }
    public string? Notes { get; set; }           // ملاحظات
    public string? IdFileUrl { get; set; }       // وجه هوية التجارة
    public string? IdFileBackUrl { get; set; }   // خلف هوية التجارة
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class User {
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = "Member";
    public int? ChamberId { get; set; }
    public Chamber? Chamber { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? FullName { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsEmailVerified { get; set; } = false;
    public bool IsFirstLogin { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class OtpCode {
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Code { get; set; } = "";
    public string Type { get; set; } = "";
    public string Channel { get; set; } = "";
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }
}

// تتبع محاولات OTP الفاشلة
public class OtpAttempt {
    public int Id { get; set; }
    public string Contact { get; set; } = "";      // email or phone
    public string Channel { get; set; } = "";       // email | sms
    public string? IpAddress { get; set; }
    public bool Success { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// قائمة الحجب
public class BlockedContact {
    public int Id { get; set; }
    public string Contact { get; set; } = "";       // email or phone
    public string Channel { get; set; } = "";        // email | sms
    public string Reason { get; set; } = "too_many_attempts";
    public bool IsActive { get; set; } = true;
    public string? IpAddress { get; set; }
    public DateTime BlockedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UnblockedAt { get; set; }
    public string? UnblockedBy { get; set; }
}

public class Setting {
    public int Id { get; set; }
    public string SettingKey { get; set; } = "";
    public string? SettingValue { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class ShippingCompany {
    public int Id { get; set; }
    public string CompanyName { get; set; } = "";
    public string? ShippingType { get; set; }  // comma-separated e.g. 'شحن بري,شحن جوي'
    public string? Country { get; set; }
    public string? Governorate { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    public string? Facebook { get; set; }
    public string? Instagram { get; set; }
    public string? WhatsApp { get; set; }
    public string? Telegram { get; set; }
    public string? YouTube { get; set; }
    public bool IsVerified { get; set; } = false;
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
// ─── Registration Submissions ───
public class Submission {
    public int Id { get; set; }
    public string EntityType { get; set; } = ""; // "chamber" | "member" | "trader" | "shipping" | ...
    public string FormData { get; set; } = "{}"; // JSON of form fields
    public string Status { get; set; } = "pending"; // pending | approved | rejected
    public string? ReviewToken { get; set; }  // One-time admin review token
    public string? ReviewNote { get; set; }
    public int? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    // Contact info for notifications
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    // Logo stored as base64 data URL
    public string? LogoData { get; set; }
}

public class SiteVisit {
    public int Id { get; set; }
    public long Count { get; set; } = 0;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class ClearContactDto {
    public string Field { get; set; } = ""; // "phone" or "email"
}

// ==================== نظام المراسلات ====================
public class Correspondence {
    public int Id { get; set; }
    public string? ReferenceNumber { get; set; }
    public string Subject { get; set; } = "";
    public string Body { get; set; } = "";
    public int SenderId { get; set; }            // 0 = الاتحاد
    public string? SenderName { get; set; }
    public string Priority { get; set; } = "normal"; // normal, urgent, secret
    public string Status { get; set; } = "draft";    // draft, sent, archived
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SentAt { get; set; }
    public ICollection<CorrespondenceRecipient> Recipients { get; set; } = new List<CorrespondenceRecipient>();
    public ICollection<CorrespondenceAttachment> Attachments { get; set; } = new List<CorrespondenceAttachment>();
    public ICollection<CorrespondenceReply> Replies { get; set; } = new List<CorrespondenceReply>();
}

public class CorrespondenceRecipient {
    public int Id { get; set; }
    public int CorrespondenceId { get; set; }
    public Correspondence Correspondence { get; set; } = null!;
    public int? ChamberId { get; set; }
    public string? ChamberName { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
}

public class CorrespondenceAttachment {
    public int Id { get; set; }
    public int CorrespondenceId { get; set; }
    public string? FileName { get; set; }
    public string? FilePath { get; set; }
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

public class CorrespondenceReply {
    public int Id { get; set; }
    public int CorrespondenceId { get; set; }
    public int SenderId { get; set; }
    public string? SenderName { get; set; }
    public string Body { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class CorrespondenceNotification {
    public int Id { get; set; }
    public int? ChamberId { get; set; }
    public string? ChamberName { get; set; }
    public int CorrespondenceId { get; set; }
    public string? Type { get; set; }
    public string? Title { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AcknowledgeDto { public int ChamberId { get; set; } }

public class SystemConstant {
    public int Id { get; set; }
    public string Category { get; set; } = ""; // trader_classification, trader_sector, news_type
    public string Value { get; set; } = "";
    public string? Label { get; set; }
    public int SortOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Subscriber {
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string? WhatsApp { get; set; }
    public string? Email { get; set; }
    public string? Sectors { get; set; }    // JSON array (legacy)
    public string? NotifyBy { get; set; }   // JSON array: ["whatsapp","sms","email"]
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Profile
    public string? ProfileImage { get; set; }
    public string? NationalIdFront { get; set; }
    public string? NationalIdBack { get; set; }
    public string? Passport { get; set; }
    public string? TradeIdFront { get; set; }
    public string? TradeIdBack { get; set; }
    public string? CV { get; set; }

    // أوراق الشركة
    public string? CompanyReg { get; set; }    // شهادة تسجيل الشركة
    public string? ChamberCert { get; set; }   // شهادة اتحاد الغرف
    public string? TaxCert { get; set; }       // شهادة الإفادة الضريبية
    public string? CompanyStamp { get; set; }  // ختم الشركة
    public string? OtherDoc { get; set; }      // وثيقة أخرى

    // Social Links
    public string? Facebook { get; set; }
    public string? Instagram { get; set; }
    public string? Twitter { get; set; }
    public string? LinkedIn { get; set; }
    public string? TikTok { get; set; }

    // Interests — أقسام المتابعة (الريادة/العلاقات/المنظمات)
    public string? Interests { get; set; } // JSON array of SectorIds: [1,2,3]
    // TraderSectors — قطاعات التاجر من ثوابت النظام
    public string? TraderSectors { get; set; } // JSON array of SystemConstant IDs
}

// جدول الأقسام — Single Source of Truth
public class Sector {
    public int Id { get; set; }
    public string Name { get; set; } = "";        // الريادة
    public string Slug { get; set; } = "";        // entrepreneurship
    public string? Description { get; set; }
    public string? Icon { get; set; }             // 🎯
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}

public class RateLimitBlock {
    public int Id { get; set; }
    public string Key { get; set; } = "";       // رقم الهاتف أو الإيميل
    public string KeyType { get; set; } = "";   // phone / whatsapp / email
    public string Action { get; set; } = "";    // subscribe
    public int Attempts { get; set; } = 0;
    public DateTime FirstAttemptAt { get; set; } = DateTime.UtcNow;
    public DateTime? BlockedUntil { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsManual { get; set; } = false;  // حجب يدوي = لا يُفك تلقائياً
    public string? BlockReason { get; set; }     // سبب الحجب
    public string? UnblockedAt { get; set; }     // وقت فك الحجب
    public string? UnblockedBy { get; set; }     // من فك الحجب
}

// قاعدة بيانات المعرفة
public class KnowledgeBase {
    public int Id { get; set; }
    public string Title { get; set; } = "";           // العنوان
    public string Keywords { get; set; } = "";        // المفاتيح (مفصولة بفاصلة)
    public string Type { get; set; } = "text";        // text / file / link
    public string? Answer { get; set; }               // الإجابة النصية
    public string? FilePath { get; set; }             // مسار الملف
    public string? LinkUrl { get; set; }              // الرابط
    public string? Category { get; set; }             // التصنيف
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

// محادثات المتابعين
public class SubscriberChat {
    public int Id { get; set; }
    public int SubscriberId { get; set; }
    public string Subject { get; set; } = "استفسار";
    public string Status { get; set; } = "open";     // open / answered / closed
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public Subscriber? Subscriber { get; set; }
    public List<SubscriberChatMessage>? Messages { get; set; }
}

// رسائل المحادثة
public class SubscriberChatMessage {
    public int Id { get; set; }
    public int ChatId { get; set; }
    public string Sender { get; set; } = "user";     // user / ai / admin
    public string Body { get; set; } = "";
    public string? AttachmentUrl { get; set; }
    public int? KnowledgeBaseId { get; set; }        // مصدر الإجابة
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public SubscriberChat? Chat { get; set; }
}
