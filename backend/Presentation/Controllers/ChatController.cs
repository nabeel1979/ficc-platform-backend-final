using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase {
    private readonly AppDbContext _db;
    public ChatController(AppDbContext db) { _db = db; }

    // POST /api/chat/start — بدء محادثة جديدة
    [HttpPost("start")]
    public async Task<IActionResult> Start([FromBody] StartChatDto dto) {
        var sub = await _db.Subscribers.FirstOrDefaultAsync(s => s.Id == dto.SubscriberId && s.IsActive);
        if (sub == null) return NotFound(new { message = "المتابع غير موجود" });

        var chat = new SubscriberChat {
            SubscriberId = dto.SubscriberId,
            Subject = dto.Subject ?? "استفسار",
            Status = "open",
            CreatedAt = DateTime.UtcNow
        };
        _db.SubscriberChats.Add(chat);
        await _db.SaveChangesAsync();
        return Ok(chat);
    }

    // GET /api/chat/{chatId}/messages — جلب الرسائل
    [HttpGet("{chatId}/messages")]
    public async Task<IActionResult> GetMessages(int chatId, [FromQuery] int subscriberId) {
        var chat = await _db.SubscriberChats.FirstOrDefaultAsync(c => c.Id == chatId && c.SubscriberId == subscriberId);
        if (chat == null) return NotFound();
        var messages = await _db.SubscriberChatMessages
            .Where(m => m.ChatId == chatId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
        return Ok(new { chat, messages });
    }

    // GET /api/chat/my/{subscriberId} — محادثات المتابع
    [HttpGet("my/{subscriberId}")]
    public async Task<IActionResult> MyChats(int subscriberId) {
        var chats = await _db.SubscriberChats
            .Where(c => c.SubscriberId == subscriberId)
            .OrderByDescending(c => c.UpdatedAt ?? c.CreatedAt)
            .Include(c => c.Messages)
            .ToListAsync();
        return Ok(chats);
    }

    // POST /api/chat/{chatId}/send — إرسال رسالة + رد AI
    [HttpPost("{chatId}/send")]
    public async Task<IActionResult> Send(int chatId, [FromBody] SendMessageDto dto) {
        var chat = await _db.SubscriberChats.FirstOrDefaultAsync(c => c.Id == chatId && c.SubscriberId == dto.SubscriberId);
        if (chat == null) return NotFound();

        // حفظ رسالة المستخدم
        var userMsg = new SubscriberChatMessage {
            ChatId = chatId, Sender = "user", Body = dto.Body, CreatedAt = DateTime.UtcNow
        };
        _db.SubscriberChatMessages.Add(userMsg);
        chat.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // البحث في قاعدة المعرفة
        var query = dto.Body.ToLower();
        var words = query.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var allKb = await _db.KnowledgeBase.Where(k => k.IsActive).ToListAsync();
        var best = allKb
            .Select(k => {
                var kw = k.Keywords.ToLower(); var title = k.Title.ToLower();
                int score = 0;
                foreach (var w in words) {
                    if (title.Contains(w)) score += 3;
                    if (kw.Contains(w)) score += 2;
                    if (k.Answer != null && k.Answer.ToLower().Contains(w)) score += 1;
                }
                return new { k, score };
            })
            .Where(x => x.score > 0)
            .OrderByDescending(x => x.score)
            .FirstOrDefault();

        SubscriberChatMessage aiMsg;
        if (best != null) {
            var kb = best.k;
            string aiBody = kb.Type switch {
                "link" => $"{kb.Answer ?? kb.Title}\n\n🔗 {kb.LinkUrl}",
                "file" => $"{kb.Answer ?? kb.Title}\n\n📎 {kb.FilePath}",
                _ => kb.Answer ?? kb.Title
            };
            aiMsg = new SubscriberChatMessage {
                ChatId = chatId, Sender = "ai", Body = aiBody,
                KnowledgeBaseId = kb.Id, CreatedAt = DateTime.UtcNow
            };
        } else {
            aiMsg = new SubscriberChatMessage {
                ChatId = chatId, Sender = "ai",
                Body = "شكراً لتواصلك مع اتحاد الغرف التجارية العراقية 🏛️\n\nلم أجد إجابة محددة لسؤالك حالياً. سيتواصل معك أحد المختصين في أقرب وقت ✅",
                CreatedAt = DateTime.UtcNow
            };
        }
        _db.SubscriberChatMessages.Add(aiMsg);
        await _db.SaveChangesAsync();

        return Ok(new { userMessage = userMsg, aiMessage = aiMsg });
    }

    // GET /api/chat/all — كل المحادثات للأدمن
    [HttpGet("all")]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = null) {
        var q = _db.SubscriberChats.Include(c => c.Subscriber).AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(c => c.Status == status);
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(c => c.UpdatedAt ?? c.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }

    // POST /api/chat/{chatId}/admin-reply — رد الأدمن
    [HttpPost("{chatId}/admin-reply")]
    public async Task<IActionResult> AdminReply(int chatId, [FromBody] AdminReplyDto dto) {
        var chat = await _db.SubscriberChats.FindAsync(chatId);
        if (chat == null) return NotFound();
        var msg = new SubscriberChatMessage {
            ChatId = chatId, Sender = "admin", Body = dto.Body, CreatedAt = DateTime.UtcNow
        };
        _db.SubscriberChatMessages.Add(msg);
        chat.Status = "answered"; chat.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(msg);
    }
}

public record StartChatDto(int SubscriberId, string? Subject);
public record SendMessageDto(int SubscriberId, string Body);
public record AdminReplyDto(string Body);
