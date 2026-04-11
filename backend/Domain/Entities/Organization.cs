using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace FICCPlatform.Models
{
    public class Organization
    {
        public long Id { get; set; }
        public string UserId { get; set; }
        public string Name { get; set; }
        public bool IsShared { get; set; } = false; // مشتركة للجميع (Admin فقط)
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual IdentityUser User { get; set; }
        public virtual ICollection<OrganizationChamber> OrganizationChambers { get; set; } = new List<OrganizationChamber>();
    }

    public class OrganizationChamber
    {
        public long OrganizationId { get; set; }
        public int ChamberId { get; set; }

        // Navigation properties
        public virtual Organization Organization { get; set; }
        public virtual Chamber Chamber { get; set; }
    }

    // DTO for API requests/responses
    public class OrganizationDto
    {
        public long Id { get; set; }
        public string Name { get; set; }
        public List<int> Chambers { get; set; } = new List<int>();
        public bool IsShared { get; set; } = false;
        public bool IsOwner { get; set; } = true; // هل هذا المستخدم هو صاحبها
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateOrganizationRequest
    {
        public string Name { get; set; }
        public List<int> Chambers { get; set; } = new List<int>();
        public bool IsShared { get; set; } = false;
    }

    public class UpdateOrganizationRequest
    {
        public string Name { get; set; }
        public List<int> Chambers { get; set; } = new List<int>();
        public bool IsShared { get; set; } = false;
    }
}
