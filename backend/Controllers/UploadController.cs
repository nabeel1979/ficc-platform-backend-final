using Microsoft.AspNetCore.Mvc;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase {

    [HttpPost]
    public IActionResult Upload(IFormFile file, string folder = "courses") {
        if (file == null) return BadRequest("No file");
        
        try {
            var ext = Path.GetExtension(file.FileName).ToLower();
            if (!new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" }.Contains(ext))
                return BadRequest("Invalid type");

            var dir = Path.Combine("/app/uploads", folder);
            Directory.CreateDirectory(dir);

            var fileName = Guid.NewGuid() + ext;
            var path = Path.Combine(dir, fileName);

            using (var f = System.IO.File.Create(path)) {
                file.CopyTo(f);
            }

            return Ok(new { url = $"/media/{folder}/{fileName}", success = true });
        } catch (Exception ex) {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
