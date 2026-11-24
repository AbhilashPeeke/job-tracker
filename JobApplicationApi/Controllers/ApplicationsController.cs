using System.Security.Claims;
using JobApplicationApi.Dtos;
using JobApplicationApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobApplicationApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ApplicationsController : ControllerBase
{
    private readonly IApplicationService _service;
    public ApplicationsController(IApplicationService service) => _service = service;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private bool IsAdmin => User.IsInRole("Admin");

    [HttpGet]
    public async Task<ActionResult<List<ApplicationResponse>>> GetAll(CancellationToken ct) =>
        Ok(await _service.GetAllAsync(UserId, IsAdmin, ct));

    [HttpGet("{id}")]
    public async Task<ActionResult<ApplicationResponse>> Get(int id, CancellationToken ct)
    {
        var item = await _service.GetAsync(id, UserId, IsAdmin, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<ApplicationResponse>> Create(ApplicationRequest request, CancellationToken ct)
    {
        var created = await _service.CreateAsync(request, UserId, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, ApplicationRequest request, CancellationToken ct) =>
        await _service.UpdateAsync(id, request, UserId, IsAdmin, ct) ? NoContent() : NotFound();

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct) =>
        await _service.DeleteAsync(id, UserId, IsAdmin, ct) ? NoContent() : NotFound();
}