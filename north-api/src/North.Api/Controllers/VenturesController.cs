using North.Application.Horizon;
using North.Application.Ventures;
using Microsoft.AspNetCore.Mvc;

namespace North.Api.Controllers;

[ApiController]
[Route("api/v1/ventures")]
public sealed class VenturesController : ControllerBase
{
    private readonly IVentureService _ventures;
    private readonly IRoadmapService _roadmap;

    public VenturesController(IVentureService ventures, IRoadmapService roadmap)
    {
        _ventures = ventures;
        _roadmap = roadmap;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<VentureSummaryDto>>> List(CancellationToken ct) =>
        Ok(await _ventures.ListAsync(ct));

    [HttpPost]
    public async Task<ActionResult<VentureSummaryDto>> Create(CreateVentureRequest request, CancellationToken ct)
    {
        var created = await _ventures.CreateAsync(request, ct);
        return CreatedAtAction(nameof(List), new { id = created.Id }, created);
    }

    /// <summary>Stage-gate state: which gates are open and the current macro stage.</summary>
    [HttpGet("{ventureId:guid}/unlocks")]
    public async Task<ActionResult<UnlocksDto>> GetUnlocks(Guid ventureId, CancellationToken ct)
    {
        var unlocks = await _roadmap.GetUnlocksAsync(ventureId, ct);
        return unlocks is null ? NotFound() : Ok(unlocks);
    }

    /// <summary>Composite payload for the Daily Alignment dashboard — one round trip.</summary>
    [HttpGet("{ventureId:guid}/today")]
    public async Task<ActionResult<TodayDto>> GetToday(Guid ventureId, CancellationToken ct)
    {
        var today = await _roadmap.GetTodayAsync(ventureId, ct);
        return today is null ? NotFound() : Ok(today);
    }
}
