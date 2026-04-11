using FICCPlatform.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// =======================
// DB
// =======================
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));


// =======================
// JWT
// =======================
var jwt = builder.Configuration.GetSection("JwtSettings");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwt["Secret"]!))
        };
    });

builder.Services.AddAuthorization();


// =======================
// Controllers + Swagger
// =======================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "FICC Platform API",
        Version = "v1",
        Description = "اتحاد الغرف التجارية العراقية"
    });

    c.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());
    c.CustomSchemaIds(type => type.FullName);
});


// =======================
// CORS (FROM appsettings)
// =======================
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("AllowFrontend", policy =>
    {
        var origins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>()
            ?? new[] { "http://localhost:7000" };

        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});


// =======================
// Services
// =======================
builder.Services.AddScoped<FICCPlatform.Services.NotificationService>();
builder.Services.AddScoped<FICCPlatform.Services.OtpSecurityService>();
builder.Services.AddSingleton<FICCPlatform.Services.StorageService>();


var app = builder.Build();


// =======================
// ✅ CORS FIRST (CRITICAL)
// =======================
app.UseCors("AllowFrontend");


// =======================
// 🔐 BASIC AUTH (Swagger + Root)
// =======================
app.Use(async (context, next) =>
{
    var path = context.Request.Path;

    // allow API + uploads only
    if (path.StartsWithSegments("/api") || path.StartsWithSegments("/uploads"))
    {
        await next();
        return;
    }

    var config = context.RequestServices.GetRequiredService<IConfiguration>();
    var username = config["SwaggerAuth:Username"];
    var password = config["SwaggerAuth:Password"];

    var authHeader = context.Request.Headers["Authorization"].ToString();

    if (authHeader.StartsWith("Basic "))
    {
        var encoded = authHeader["Basic ".Length..].Trim();
        var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(encoded));
        var parts = decoded.Split(':', 2);

        if (parts.Length == 2 &&
            parts[0] == username &&
            parts[1] == password)
        {
            await next();
            return;
        }
    }

    context.Response.Headers["WWW-Authenticate"] = "Basic realm=\"FICC API Docs\"";
    context.Response.StatusCode = 401;
    await context.Response.WriteAsync("401 - Unauthorized");
});


// =======================
// Swagger (ROOT)
// =======================
app.UseSwagger();

app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "FICC API v1");
    c.RoutePrefix = ""; // Swagger at "/"
});


// =======================
// Static files
// =======================
var storage = app.Services.GetRequiredService<FICCPlatform.Services.StorageService>();

storage.GetFolder("news");
storage.GetFolder("shipping");
storage.GetFolder("members");
storage.GetFolder("chambers");
storage.GetFolder("traders");
storage.GetFolder("submissions");
storage.GetFolder("startups");
storage.GetFolder("lawyers");
storage.GetFolder("correspondence");

var wwwroot = app.Environment.WebRootPath
    ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");

Directory.CreateDirectory(wwwroot);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(wwwroot),
    RequestPath = ""
});

if (storage.UploadsRoot != Path.Combine(wwwroot, "uploads"))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(storage.UploadsRoot),
        RequestPath = "/uploads"
    });
}


// تحديث قاعدة البيانات تلقائياً بدون حذف البيانات
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FICCPlatform.Data.AppDbContext>();
    try
    {
        db.Database.EnsureCreated();
        app.Logger.LogInformation("✅ FICC Database schema verified");
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning("⚠️ DB init warning: {msg}", ex.Message);
    }
}


// =======================
// Database Migration & Seeding
// =======================
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    
    // Seed permissions data
    await SeedPermissions.SeedPermissionsDataAsync(db);
}


// =======================
// Auth
// =======================
app.UseAuthentication();
app.UseAuthorization();


// =======================
// Routes
// =======================
app.MapControllers();

// optional API root
app.MapGet("/api", () =>
{
    return Results.Ok(new
    {
        message = "API is running 🚀"
    });
});


app.Run();