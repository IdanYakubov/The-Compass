using North.Application.Horizon;
using Microsoft.AspNetCore.Mvc;

namespace North.Api.Controllers;

/// <summary>The Horizon module: milestones, micro-tasks, and the stage-gate cascade.</summary>
[ApiController]
[Route("api/v1/ventures/{ventureId:guid}")]
public sealed class RoadmapController : ControllerBase
{
    private readonly IRoadmapService _roadmap;

    public RoadmapController(IRoadmapService roadmap) => _roadmap = roadmap;

    [HttpGet("roadmap")]
    public async Task<ActionResult<RoadmapDto>> GetRoadmap(Guid ventureId, CancellationToken ct)
    {
        var roadmap = await _roadmap.GetRoadmapAsync(ventureId, ct);
        return roadmap is null ? NotFound() : Ok(roadmap);
    }

    [HttpPost("milestones")]
    public async Task<ActionResult<MilestoneDto>> CreateMilestone(
        Guid ventureId, CreateMilestoneRequest request, CancellationToken ct)
    {
        var milestone = await _roadmap.CreateMilestoneAsync(ventureId, request, ct);
        return CreatedAtAction(nameof(GetRoadmap), new { ventureId }, milestone);
    }

    [HttpPost("milestones/{milestoneId:guid}/tasks")]
    public async Task<ActionResult<MicroTaskDto>> AddTask(
        Guid ventureId, Guid milestoneId, CreateTaskRequest request, CancellationToken ct)
    {
        var task = await _roadmap.AddTaskAsync(ventureId, milestoneId, request, ct);
        return CreatedAtAction(nameof(GetRoadmap), new { ventureId }, task);
    }

    [HttpPost("tasks/{taskId:guid}/complete")]
    public async Task<IActionResult> CompleteTask(Guid ventureId, Guid taskId, CancellationToken ct)
    {
        await _roadmap.CompleteTaskAsync(ventureId, taskId, ct);
        return NoContent();
    }

    /// <summary>
    /// The key Horizon endpoint: marks a milestone achieved and returns what the
    /// founder just unlocked (dependent milestones, gate key, possibly a new stage).
    /// </summary>
    [HttpPost("milestones/{milestoneId:guid}/complete")]
    public async Task<ActionResult<CompleteMilestoneResultDto>> CompleteMilestone(
        Guid ventureId, Guid milestoneId, CancellationToken ct)
    {
        var result = await _roadmap.CompleteMilestoneAsync(ventureId, milestoneId, ct);
        return Ok(result);
    }
}
