using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fotonote.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class NotesController : ControllerBase
{
    // Kimliği doğrulanmış Firebase kullanıcısını döndürür; notlar için başlangıç noktası.
    [HttpGet("me")]
    public IActionResult Me() => Ok(new
    {
        uid = User.FindFirstValue("user_id") ?? User.FindFirstValue(ClaimTypes.NameIdentifier),
        email = User.FindFirstValue("email"),
    });
}
