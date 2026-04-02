-- =============================================
-- FICC Forms Module - الاستمارات الإلكترونية
-- =============================================

USE FICCPlatform;
GO

-- Forms (الاستمارات)
CREATE TABLE Forms (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(300) NOT NULL,
    Description NVARCHAR(MAX),
    CreatedBy INT REFERENCES Users(Id),
    ChamberId INT REFERENCES Chambers(Id),
    Status NVARCHAR(50) DEFAULT 'Active' CHECK (Status IN ('Draft','Active','Closed')),
    IsPublic BIT DEFAULT 1,
    AllowAnonymous BIT DEFAULT 0,
    StartDate DATETIME2,
    EndDate DATETIME2,
    MaxResponses INT,
    ResponseCount INT DEFAULT 0,
    ShareToken NVARCHAR(100) UNIQUE,  -- رابط مشاركة فريد
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Form Fields (حقول الاستمارة)
CREATE TABLE FormFields (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    FormId INT NOT NULL REFERENCES Forms(Id) ON DELETE CASCADE,
    FieldOrder INT NOT NULL,
    Label NVARCHAR(300) NOT NULL,
    FieldType NVARCHAR(50) NOT NULL CHECK (FieldType IN (
        'text','textarea','number','email','phone',
        'date','time','dropdown','radio','checkbox',
        'file','rating','section_header'
    )),
    IsRequired BIT DEFAULT 0,
    Placeholder NVARCHAR(300),
    HelpText NVARCHAR(500),
    Options NVARCHAR(MAX),  -- JSON array للقوائم والاختيارات
    Validation NVARCHAR(MAX),  -- JSON للتحقق (min, max, pattern)
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Form Responses (الردود)
CREATE TABLE FormResponses (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    FormId INT NOT NULL REFERENCES Forms(Id),
    RespondentName NVARCHAR(200),
    RespondentPhone NVARCHAR(20),
    RespondentEmail NVARCHAR(100),
    MemberId INT REFERENCES Members(Id),
    SubmittedAt DATETIME2 DEFAULT GETDATE(),
    IpAddress NVARCHAR(50),
    Status NVARCHAR(50) DEFAULT 'Submitted' CHECK (Status IN ('Submitted','Reviewed','Approved','Rejected'))
);

-- Form Response Answers (إجابات كل رد)
CREATE TABLE FormAnswers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ResponseId INT NOT NULL REFERENCES FormResponses(Id) ON DELETE CASCADE,
    FieldId INT NOT NULL REFERENCES FormFields(Id),
    Answer NVARCHAR(MAX),  -- النص أو القيمة
    FileUrl NVARCHAR(500)  -- للملفات المرفوعة
);

-- Form Templates (قوالب جاهزة)
CREATE TABLE FormTemplates (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Category NVARCHAR(100),
    Description NVARCHAR(500),
    FieldsJson NVARCHAR(MAX),  -- JSON للحقول الجاهزة
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Sample Templates
INSERT INTO FormTemplates (Name, Category, Description, FieldsJson) VALUES
(N'طلب عضوية', N'عضوية', N'استمارة طلب الانتساب للغرفة التجارية', 
N'[{"label":"اسم الشركة","type":"text","required":true},{"label":"اسم صاحب العمل","type":"text","required":true},{"label":"نوع النشاط التجاري","type":"dropdown","required":true,"options":["تجارة","صناعة","خدمات","استيراد وتصدير","مقاولات"]},{"label":"رقم الهاتف","type":"phone","required":true},{"label":"البريد الإلكتروني","type":"email"},{"label":"العنوان","type":"textarea","required":true}]'),
(N'تسجيل معرض', N'معارض', N'استمارة تسجيل المشاركة في المعرض',
N'[{"label":"اسم الشركة","type":"text","required":true},{"label":"القطاع","type":"dropdown","required":true,"options":["غذاء","تقنية","مقاولات","ملابس","سيارات","أخرى"]},{"label":"المساحة المطلوبة (م²)","type":"number","required":true},{"label":"المنتجات المعروضة","type":"textarea","required":true},{"label":"بيانات التواصل","type":"text","required":true}]'),
(N'استطلاع رأي', N'استطلاعات', N'قياس رضا الأعضاء',
N'[{"label":"كيف تقيّم خدمات الاتحاد؟","type":"rating","required":true},{"label":"ما أكثر الخدمات استخداماً؟","type":"checkbox","options":["الشهادات","الاستشارات","المعارض","المؤتمرات","الدليل التجاري"]},{"label":"مقترحاتك لتحسين الخدمات","type":"textarea"}]');

GO
