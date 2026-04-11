using FICCPlatform.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FICCPlatform.Infrastructure.Persistence;

/// <summary>
/// Seed data for permissions system
/// </summary>
public static class SeedPermissions
{
    public static async Task SeedPermissionsDataAsync(AppDbContext context)
    {
        // Seed Organizational Structures
        if (!await context.Set<OrganizationalStructure>().AnyAsync())
        {
            var structures = new[]
            {
                new OrganizationalStructure
                {
                    Name = "إدارة المحتوى",
                    NameEn = "Content Management",
                    Description = "إدارة الأخبار والمقالات"
                },
                new OrganizationalStructure
                {
                    Name = "إدارة الدورات",
                    NameEn = "Course Management",
                    Description = "إدارة الدورات التدريبية"
                },
                new OrganizationalStructure
                {
                    Name = "إدارة الأعضاء",
                    NameEn = "Member Management",
                    Description = "إدارة أعضاء الاتحاد"
                },
                new OrganizationalStructure
                {
                    Name = "إدارة الأمان",
                    NameEn = "Security Management",
                    Description = "إدارة الأمان والصلاحيات"
                }
            };

            await context.Set<OrganizationalStructure>().AddRangeAsync(structures);
            await context.SaveChangesAsync();
        }

        // Seed Menu Items
        if (!await context.Set<MenuItem>().AnyAsync())
        {
            var menuItems = new[]
            {
                new MenuItem { Name = "الرئيسية", NameEn = "Dashboard", Icon = "📊", Route = "/admin", Order = 0 },
                new MenuItem { Name = "الغرف التجارية", NameEn = "Chambers", Icon = "🏛️", Route = "/admin/chambers", Order = 1 },
                new MenuItem { Name = "الأعضاء", NameEn = "Members", Icon = "👥", Route = "/admin/members", Order = 2 },
                new MenuItem { Name = "دليل التجار", NameEn = "Traders", Icon = "🏢", Route = "/admin/traders", Order = 3 },
                new MenuItem { Name = "الأخبار", NameEn = "News", Icon = "📰", Route = "/admin/news", Order = 4 },
                new MenuItem { Name = "المحامون", NameEn = "Lawyers", Icon = "⚖️", Route = "/admin/lawyers", Order = 5 },
                new MenuItem { Name = "وكلاء الإخراج", NameEn = "Agents", Icon = "🏭", Route = "/admin/agents", Order = 6 },
                new MenuItem { Name = "شركات الشحن", NameEn = "Shipping", Icon = "🚢", Route = "/admin/shipping", Order = 7 },
                new MenuItem { Name = "المستخدمين", NameEn = "Users", Icon = "🔑", Route = "/admin/users", Order = 8 },
                new MenuItem { Name = "طلبات الإضافة", NameEn = "Submissions", Icon = "📬", Route = "/admin/submissions", Order = 9 },
                new MenuItem { Name = "المتابعون", NameEn = "Subscribers", Icon = "🔔", Route = "/admin/subscribers", Order = 10 },
                new MenuItem { Name = "قاعدة المعرفة", NameEn = "Knowledge Base", Icon = "🧠", Route = "/admin/knowledge", Order = 11 },
                new MenuItem { Name = "المحادثات", NameEn = "Chats", Icon = "💬", Route = "/admin/chats", Order = 12 },
                new MenuItem { Name = "ريادة الأعمال", NameEn = "Startups", Icon = "🚀", Route = "/admin/startups", Order = 13 },
                new MenuItem { Name = "الدورات الريادية", NameEn = "Courses", Icon = "🎓", Route = "/admin/courses", Order = 14 },
                new MenuItem { Name = "ثوابت النظام", NameEn = "Constants", Icon = "⚙️", Route = "/admin/constants", Order = 15 },
                new MenuItem { Name = "إدارة الأمان", NameEn = "Security", Icon = "🔒", Route = "/admin/security", Order = 16 },
                new MenuItem { Name = "إدارة جهات الاتصال", NameEn = "Contacts", Icon = "📋", Route = "/admin/contacts", Order = 17 },
                new MenuItem { Name = "إدارة الصلاحيات", NameEn = "Permissions", Icon = "🔐", Route = "/admin/permissions", Order = 18 }
            };

            await context.Set<MenuItem>().AddRangeAsync(menuItems);
            await context.SaveChangesAsync();
        }
    }
}
