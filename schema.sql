-- =============================================
-- FICC Platform - SQL Server Schema
-- اتحاد الغرف التجارية العراقية
-- =============================================

CREATE DATABASE FICCPlatform;
GO
USE FICCPlatform;
GO

-- Chambers (الغرف التجارية)
CREATE TABLE Chambers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    City NVARCHAR(100) NOT NULL,
    Governorate NVARCHAR(100) NOT NULL,
    Phone NVARCHAR(20),
    Email NVARCHAR(100),
    EstablishedYear INT,
    MemberCount INT DEFAULT 0,
    Description NVARCHAR(MAX),
    LogoUrl NVARCHAR(500),
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Users (المستخدمون)
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(500) NOT NULL,
    Role NVARCHAR(50) NOT NULL CHECK (Role IN ('Admin','ChamberAdmin','Member')),
    ChamberId INT REFERENCES Chambers(Id),
    Email NVARCHAR(100),
    FullName NVARCHAR(200),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Members (الأعضاء / الشركات)
CREATE TABLE Members (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ChamberId INT NOT NULL REFERENCES Chambers(Id),
    CompanyName NVARCHAR(200) NOT NULL,
    OwnerName NVARCHAR(200),
    TradeType NVARCHAR(100),
    LicenseNo NVARCHAR(100),
    Phone NVARCHAR(20),
    Email NVARCHAR(100),
    Address NVARCHAR(500),
    JoinedDate DATE,
    Status NVARCHAR(50) DEFAULT 'Active' CHECK (Status IN ('Active','Inactive','Suspended')),
    LogoUrl NVARCHAR(500),
    Website NVARCHAR(200),
    Description NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- News (الأخبار)
CREATE TABLE News (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(500) NOT NULL,
    Body NVARCHAR(MAX) NOT NULL,
    Category NVARCHAR(100),
    ImageUrl NVARCHAR(500),
    PublishedAt DATETIME2 DEFAULT GETDATE(),
    Author NVARCHAR(200),
    IsFeatured BIT DEFAULT 0,
    ViewCount INT DEFAULT 0
);

-- Certificates (الشهادات)
CREATE TABLE Certificates (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MemberId INT NOT NULL REFERENCES Members(Id),
    Type NVARCHAR(100) NOT NULL,
    IssuedDate DATE NOT NULL,
    ExpiryDate DATE,
    SerialNo NVARCHAR(100) UNIQUE,
    Status NVARCHAR(50) DEFAULT 'Active' CHECK (Status IN ('Active','Expired','Revoked')),
    Notes NVARCHAR(500),
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Service Requests (الطلبات)
CREATE TABLE Requests (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MemberId INT NOT NULL REFERENCES Members(Id),
    Type NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    Status NVARCHAR(50) DEFAULT 'Pending' CHECK (Status IN ('Pending','InProgress','Resolved','Rejected')),
    SubmittedAt DATETIME2 DEFAULT GETDATE(),
    ResolvedAt DATETIME2,
    Response NVARCHAR(MAX)
);

-- Exhibitions (المعارض)
CREATE TABLE Exhibitions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(300) NOT NULL,
    Description NVARCHAR(MAX),
    Location NVARCHAR(300),
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    OrganizerChamberId INT REFERENCES Chambers(Id),
    ImageUrl NVARCHAR(500),
    Status NVARCHAR(50) DEFAULT 'Upcoming' CHECK (Status IN ('Upcoming','Active','Completed','Cancelled')),
    MaxParticipants INT,
    RegistrationDeadline DATE,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Exhibition Participants (المشاركون بالمعرض)
CREATE TABLE ExhibitionParticipants (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ExhibitionId INT NOT NULL REFERENCES Exhibitions(Id),
    MemberId INT NOT NULL REFERENCES Members(Id),
    BoothNo NVARCHAR(50),
    RegisteredAt DATETIME2 DEFAULT GETDATE(),
    Status NVARCHAR(50) DEFAULT 'Registered' CHECK (Status IN ('Registered','Confirmed','Cancelled')),
    Notes NVARCHAR(500),
    UNIQUE (ExhibitionId, MemberId)
);

-- Conferences (المؤتمرات)
CREATE TABLE Conferences (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(300) NOT NULL,
    Description NVARCHAR(MAX),
    Location NVARCHAR(300),
    Date DATE NOT NULL,
    Time TIME,
    OrganizerChamberId INT REFERENCES Chambers(Id),
    ImageUrl NVARCHAR(500),
    Status NVARCHAR(50) DEFAULT 'Upcoming' CHECK (Status IN ('Upcoming','Active','Completed','Cancelled')),
    MaxAttendees INT,
    RegistrationDeadline DATE,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Conference Attendees (الحضور)
CREATE TABLE ConferenceAttendees (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ConferenceId INT NOT NULL REFERENCES Conferences(Id),
    MemberId INT NOT NULL REFERENCES Members(Id),
    RegisteredAt DATETIME2 DEFAULT GETDATE(),
    AttendanceStatus NVARCHAR(50) DEFAULT 'Registered' CHECK (AttendanceStatus IN ('Registered','Attended','Absent','Cancelled')),
    UNIQUE (ConferenceId, MemberId)
);

-- Conference Sessions (جلسات المؤتمر)
CREATE TABLE ConferenceSessions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ConferenceId INT NOT NULL REFERENCES Conferences(Id),
    Title NVARCHAR(300) NOT NULL,
    Speaker NVARCHAR(200),
    StartTime DATETIME2,
    EndTime DATETIME2,
    Room NVARCHAR(100),
    Description NVARCHAR(MAX)
);

-- Trader/Company Directory (دليل التجار والشركات)
CREATE TABLE TraderDirectory (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CompanyName NVARCHAR(300) NOT NULL,
    OwnerName NVARCHAR(200),
    TradeCategory NVARCHAR(100),
    SubCategory NVARCHAR(100),
    Governorate NVARCHAR(100),
    City NVARCHAR(100),
    Address NVARCHAR(500),
    Phone NVARCHAR(20),
    Mobile NVARCHAR(20),
    Email NVARCHAR(100),
    Website NVARCHAR(200),
    LicenseNo NVARCHAR(100),
    RegisteredYear INT,
    IsVerified BIT DEFAULT 0,
    LogoUrl NVARCHAR(500),
    Description NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Sample Data
INSERT INTO Chambers (Name, City, Governorate, Phone, Email, EstablishedYear, MemberCount)
VALUES 
(N'غرفة تجارة بغداد', N'بغداد', N'بغداد', '07800000001', 'info@bcc.iq', 1950, 1200),
(N'غرفة تجارة البصرة', N'البصرة', N'البصرة', '07800000002', 'info@basrah-chamber.iq', 1955, 800),
(N'غرفة تجارة نينوى', N'الموصل', N'نينوى', '07800000003', 'info@ninevah-chamber.iq', 1960, 600),
(N'غرفة تجارة أربيل', N'أربيل', N'أربيل', '07800000004', 'info@erbil-chamber.iq', 1958, 700),
(N'غرفة تجارة النجف', N'النجف', N'النجف', '07800000005', 'info@najaf-chamber.iq', 1965, 450);

INSERT INTO Users (Username, PasswordHash, Role, FullName)
VALUES ('admin', '$2b$10$examplehash', 'Admin', N'مدير النظام');

GO

-- Subscribers (المتابعون)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Subscribers' AND xtype='U')
CREATE TABLE Subscribers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(200) NOT NULL,
    Phone NVARCHAR(20) NOT NULL UNIQUE,
    WhatsApp NVARCHAR(20),
    Email NVARCHAR(200),
    Sectors NVARCHAR(MAX),
    NotifyBy NVARCHAR(200),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2
);
