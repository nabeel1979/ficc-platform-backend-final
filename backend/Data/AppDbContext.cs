using Microsoft.EntityFrameworkCore;
using FICCPlatform.Models;

namespace FICCPlatform.Data;

public class AppDbContext : DbContext {
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

    public DbSet<Chamber> Chambers => Set<Chamber>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<Subscriber> Subscribers => Set<Subscriber>();
    public DbSet<RateLimitBlock> RateLimitBlocks => Set<RateLimitBlock>();
    public DbSet<Setting> Settings => Set<Setting>();
    public DbSet<ShippingCompany> ShippingCompanies => Set<ShippingCompany>();
    public DbSet<OtpCode> OtpCodes => Set<OtpCode>();
    public DbSet<News> News => Set<News>();
    public DbSet<Certificate> Certificates => Set<Certificate>();
    public DbSet<Request> Requests => Set<Request>();
    public DbSet<Exhibition> Exhibitions => Set<Exhibition>();
    public DbSet<ExhibitionParticipant> ExhibitionParticipants => Set<ExhibitionParticipant>();
    public DbSet<Conference> Conferences => Set<Conference>();
    public DbSet<ConferenceAttendee> ConferenceAttendees => Set<ConferenceAttendee>();
    public DbSet<ConferenceSession> ConferenceSessions => Set<ConferenceSession>();
    public DbSet<TraderDirectory> TraderDirectory => Set<TraderDirectory>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<SiteVisit> SiteVisits => Set<SiteVisit>();
    // Correspondence System
    public DbSet<Correspondence> Correspondences => Set<Correspondence>();
    public DbSet<CorrespondenceRecipient> CorrespondenceRecipients => Set<CorrespondenceRecipient>();
    public DbSet<CorrespondenceAttachment> CorrespondenceAttachments => Set<CorrespondenceAttachment>();
    public DbSet<CorrespondenceReply> CorrespondenceReplies => Set<CorrespondenceReply>();
    public DbSet<CorrespondenceNotification> CorrespondenceNotifications => Set<CorrespondenceNotification>();
    // Organizations
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<OrganizationChamber> OrganizationChambers => Set<OrganizationChamber>();

    // Forms module
    public DbSet<Form> Forms => Set<Form>();
    public DbSet<FormField> FormFields => Set<FormField>();
    public DbSet<FormResponse> FormResponses => Set<FormResponse>();
    public DbSet<FormAnswer> FormAnswers => Set<FormAnswer>();
    public DbSet<FormTemplate> FormTemplates => Set<FormTemplate>();

    // Directories module
    public DbSet<CustomsAgent> CustomsAgents => Set<CustomsAgent>();
    public DbSet<Lawyer> Lawyers => Set<Lawyer>();
    public DbSet<DirectoryReview> DirectoryReviews => Set<DirectoryReview>();
    public DbSet<ConsultationRequest> ConsultationRequests => Set<ConsultationRequest>();
    public DbSet<Startup> Startups => Set<Startup>();
    public DbSet<StartupAttachment> StartupAttachments => Set<StartupAttachment>();
    public DbSet<OtpAttempt> OtpAttempts => Set<OtpAttempt>();
    public DbSet<BlockedContact> BlockedContacts => Set<BlockedContact>();
    public DbSet<SystemConstant> SystemConstants => Set<SystemConstant>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) {
        modelBuilder.Entity<ExhibitionParticipant>()
            .HasIndex(e => new { e.ExhibitionId, e.MemberId }).IsUnique();
        modelBuilder.Entity<ConferenceAttendee>()
            .HasIndex(c => new { c.ConferenceId, c.MemberId }).IsUnique();
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username).IsUnique();
        // OrganizationChamber - Composite Primary Key
        modelBuilder.Entity<OrganizationChamber>()
            .HasKey(oc => new { oc.OrganizationId, oc.ChamberId });
        modelBuilder.Entity<OrganizationChamber>()
            .HasOne(oc => oc.Organization)
            .WithMany(o => o.OrganizationChambers)
            .HasForeignKey(oc => oc.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
