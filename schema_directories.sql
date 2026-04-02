-- =============================================
-- FICC Directories - وكلاء الإخراج والمحامون
-- =============================================

USE FICCPlatform;
GO

-- Customs Clearance Agents (وكلاء الإخراج الكمركي)
CREATE TABLE CustomsAgents (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AgentName NVARCHAR(200) NOT NULL,
    CompanyName NVARCHAR(300),
    LicenseNo NVARCHAR(100),
    LicenseExpiry DATE,
    Governorate NVARCHAR(100),
    City NVARCHAR(100),
    Address NVARCHAR(500),
    Phone NVARCHAR(20),
    Mobile NVARCHAR(20),
    Email NVARCHAR(100),
    Specializations NVARCHAR(MAX),  -- JSON: ["بضائع عامة","مواد غذائية","سيارات"]
    CustomsPorts NVARCHAR(MAX),     -- JSON: ["ام قصر","المنذرية","الشلامجة"]
    YearsExperience INT,
    IsVerified BIT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    Rating DECIMAL(3,2) DEFAULT 0,
    ReviewCount INT DEFAULT 0,
    Description NVARCHAR(MAX),
    LogoUrl NVARCHAR(500),
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Lawyers Directory (دليل المحامين)
CREATE TABLE Lawyers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(200) NOT NULL,
    LicenseNo NVARCHAR(100),
    LicenseExpiry DATE,
    BarAssociation NVARCHAR(100),   -- نقابة المحامين
    Governorate NVARCHAR(100),
    City NVARCHAR(100),
    Address NVARCHAR(500),
    Phone NVARCHAR(20),
    Mobile NVARCHAR(20),
    Email NVARCHAR(100),
    Website NVARCHAR(200),
    Specializations NVARCHAR(MAX),  -- JSON: ["تجاري","شركات","عقاري","جمركي","عمالي"]
    YearsExperience INT,
    Education NVARCHAR(300),
    Languages NVARCHAR(200),        -- العربية، الإنگليزية، الكردية
    IsVerified BIT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    AcceptsOnlineConsultation BIT DEFAULT 0,
    Rating DECIMAL(3,2) DEFAULT 0,
    ReviewCount INT DEFAULT 0,
    Description NVARCHAR(MAX),
    PhotoUrl NVARCHAR(500),
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Reviews (تقييمات مشتركة)
CREATE TABLE DirectoryReviews (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    EntityType NVARCHAR(50) NOT NULL CHECK (EntityType IN ('CustomsAgent','Lawyer','Trader')),
    EntityId INT NOT NULL,
    ReviewerName NVARCHAR(200),
    ReviewerPhone NVARCHAR(20),
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(MAX),
    IsApproved BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Consultation Requests (طلبات الاستشارة)
CREATE TABLE ConsultationRequests (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    LawyerId INT REFERENCES Lawyers(Id),
    AgentId INT REFERENCES CustomsAgents(Id),
    RequesterName NVARCHAR(200) NOT NULL,
    RequesterPhone NVARCHAR(20) NOT NULL,
    RequesterEmail NVARCHAR(100),
    Subject NVARCHAR(300),
    Description NVARCHAR(MAX),
    PreferredDate DATE,
    Status NVARCHAR(50) DEFAULT 'Pending' CHECK (Status IN ('Pending','Confirmed','Completed','Cancelled')),
    SubmittedAt DATETIME2 DEFAULT GETDATE()
);

-- Sample Data
INSERT INTO CustomsAgents (AgentName, CompanyName, LicenseNo, Governorate, City, Phone, Specializations, CustomsPorts, YearsExperience, IsVerified)
VALUES
(N'أحمد علي الموسوي', N'مكتب الموسوي للخدمات الكمركية', N'CA-2021-001', N'البصرة', N'أبو الخصيب', N'07700000001',
 N'["بضائع عامة","مواد غذائية","إلكترونيات"]', N'["ام قصر","خور الزبير"]', 15, 1),
(N'محمد حسين الزيدي', N'الزيدي للتخليص الكمركي', N'CA-2020-002', N'بغداد', N'بغداد', N'07700000002',
 N'["سيارات","مكائن","مواد بناء"]', N'["المنذرية","البصرة الجوي"]', 12, 1),
(N'كريم عبد الله النجار', N'مؤسسة النجار للخدمات التجارية', N'CA-2019-003', N'نينوى', N'الموصل', N'07700000003',
 N'["بضائع عامة","ألبسة","أدوية"]', N'["إبراهيم الخليل","المنفذ السوري"]', 20, 1);

INSERT INTO Lawyers (FullName, LicenseNo, BarAssociation, Governorate, City, Phone, Specializations, YearsExperience, Languages, IsVerified, AcceptsOnlineConsultation)
VALUES
(N'م.م. خالد إبراهيم العبيدي', N'LAW-BG-1234', N'نقابة محامي بغداد', N'بغداد', N'الكرادة', N'07800000010',
 N'["تجاري","شركات","عقود","استثمار"]', 18, N'العربية، الإنگليزية', 1, 1),
(N'أ. سارة محمد الحيدري', N'LAW-BG-2567', N'نقابة محامي بغداد', N'بغداد', N'المنصور', N'07800000011',
 N'["عمالي","تجاري","جمركي"]', 12, N'العربية، الإنگليزية، الفرنسية', 1, 1),
(N'أ. عمر فاضل الجبوري', N'LAW-BS-0891', N'نقابة محامي البصرة', N'البصرة', N'البصرة', N'07800000012',
 N'["جمركي","شحن بحري","تجاري دولي"]', 22, N'العربية، الإنگليزية', 1, 0);

GO
