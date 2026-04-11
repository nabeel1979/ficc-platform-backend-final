using Microsoft.AspNetCore.Mvc;

namespace FICCPlatform.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class ArchiveController : ControllerBase {
        [HttpGet("status")]
        public IActionResult Status() {
            return Ok(new { message = "Archive service ready", year = DateTime.Now.Year });
        }
    }
}
