using North.Application.Abstractions;
using North.Domain.Common;
using North.Domain.Horizon;
using North.Domain.Ventures;

namespace North.Application.Horizon;

public interface IRoadmapService
{
    Task<RoadmapDto?> GetRoadmapAsync(Guid ventureId, CancellationToken ct = default);
    Task<MilestoneDto> CreateMilestoneAsync(Guid ventureId, CreateMilestoneRequest request, CancellationToken ct = default);
    Task<MicroTaskDto> AddTaskAsync(Guid ventureId, Guid milestoneId, CreateTaskRequest request, CancellationToken ct = default);
    Task CompleteTaskAsync(Guid ventureId, Guid taskId, CancellationToken ct = default);
    Task<CompleteMilestoneResultDto> CompleteMilestoneAsync(Guid ventureId, Guid milestoneId, CancellationToken ct = default);
    Task<UnlocksDto?> GetUnlocksAsync(Guid ventureId, CancellationToken ct = default);
    Task<TodayDto?> GetTodayAsync(Guid ventureId, CancellationToken ct = default);
}

/// <summary>
/// Application service for The Horizon module. Orchestrates the Venture aggregate;
/// all stage-gate rules themselves live in the domain layer.
/// </summary>
public sealed class RoadmapService : IRoadmapService
{
    private readonly IVentureRepository _ventures;
    private readonly IDateTimeProvider _clock;

    public RoadmapService(IVentureRepository ventures, IDateTimeProvider clock)
    {
        _ventures = ventures;
        _clock = clock;
    }

    public async Task<RoadmapDto?> GetRoadmapAsync(Guid ventureId, CancellationToken ct = default)
    {
        var venture = await _ventures.GetWithRoadmapAsync(ventureId, ct);
        return venture is null ? null : ToRoadmapDto(venture);
    }

    public async Task<MilestoneDto> CreateMilestoneAsync(Guid ventureId, CreateMilestoneRequest request, CancellationToken ct = default)
    {
        var venture = await RequireVenture(ventureId, ct);

        var milestone = venture.AddMilestone(
            request.Title,
            request.Description ?? string.Empty,
            request.TargetDate,
            request.GateKey,
            request.DependsOnMilestoneId,
            request.StageOnAchieve);

        await _ventures.SaveChangesAsync(ct);
        return ToMilestoneDto(milestone);
    }

    public async Task<MicroTaskDto> AddTaskAsync(Guid ventureId, Guid milestoneId, CreateTaskRequest request, CancellationToken ct = default)
    {
        var venture = await RequireVenture(ventureId, ct);
        var milestone = venture.Milestones.FirstOrDefault(m => m.Id == milestoneId)
            ?? throw new DomainException("Milestone not found on this venture.");

        var task = milestone.AddTask(request.Title, request.Impact, request.EstimateMinutes, request.DueDate);
        await _ventures.SaveChangesAsync(ct);
        return ToTaskDto(task);
    }

    public async Task CompleteTaskAsync(Guid ventureId, Guid taskId, CancellationToken ct = default)
    {
        var venture = await RequireVenture(ventureId, ct);
        var task = venture.Milestones.SelectMany(m => m.Tasks).FirstOrDefault(t => t.Id == taskId)
            ?? throw new DomainException("Task not found on this venture.");

        task.Complete(_clock.UtcNow);
        await _ventures.SaveChangesAsync(ct);
    }

    public async Task<CompleteMilestoneResultDto> CompleteMilestoneAsync(Guid ventureId, Guid milestoneId, CancellationToken ct = default)
    {
        var venture = await RequireVenture(ventureId, ct);

        // The aggregate performs the full stage-gate cascade and tells us what opened up.
        var unlocked = venture.CompleteMilestone(milestoneId, _clock.UtcNow);
        await _ventures.SaveChangesAsync(ct);

        var achieved = venture.Milestones.First(m => m.Id == milestoneId);
        return new CompleteMilestoneResultDto(
            milestoneId,
            achieved.GateKey,
            unlocked.Select(ToMilestoneDto).ToList(),
            venture.CurrentStage.ToString());
    }

    public async Task<UnlocksDto?> GetUnlocksAsync(Guid ventureId, CancellationToken ct = default)
    {
        var venture = await _ventures.GetWithRoadmapAsync(ventureId, ct);
        if (venture is null) return null;

        return new UnlocksDto(venture.Id, venture.CurrentStage.ToString(), venture.UnlockedGateKeys());
    }

    public async Task<TodayDto?> GetTodayAsync(Guid ventureId, CancellationToken ct = default)
    {
        var venture = await _ventures.GetWithRoadmapAsync(ventureId, ct);
        if (venture is null) return null;

        // The active milestone is the earliest non-achieved, workable one on the timeline.
        var activeMilestone = venture.Milestones
            .Where(m => m.Status == MilestoneStatus.Active)
            .OrderBy(m => m.SortOrder)
            .FirstOrDefault();

        // "Top 3" candidates: open tasks from active milestones, highest impact first,
        // earliest due date breaking ties. This is the anti-overwhelm core of the product:
        // the founder sees three things, not thirty.
        var topTasks = venture.Milestones
            .Where(m => m.Status == MilestoneStatus.Active)
            .OrderBy(m => m.SortOrder)
            .SelectMany(m => m.Tasks
                .Where(t => !t.IsCompleted)
                .Select(t => (Milestone: m, Task: t)))
            .OrderByDescending(x => x.Task.Impact)
            .ThenBy(x => x.Task.DueDate ?? DateOnly.MaxValue)
            .ThenBy(x => x.Milestone.SortOrder)
            .Take(3)
            .Select(x => new FocusTaskDto(
                x.Task.Id,
                x.Milestone.Id,
                x.Milestone.Title,
                x.Task.Title,
                x.Task.Impact.ToString(),
                x.Task.EstimateMinutes,
                x.Task.DueDate))
            .ToList();

        var progress = activeMilestone is null || activeMilestone.Tasks.Count == 0
            ? 0
            : (double)activeMilestone.Tasks.Count(t => t.IsCompleted) / activeMilestone.Tasks.Count;

        return new TodayDto(
            venture.Id,
            venture.Name,
            venture.CurrentStage.ToString(),
            activeMilestone?.Title,
            progress,
            topTasks);
    }

    // ---------- helpers ----------

    private async Task<Venture> RequireVenture(Guid ventureId, CancellationToken ct)
        => await _ventures.GetWithRoadmapAsync(ventureId, ct)
           ?? throw new DomainException("Venture not found.");

    private static RoadmapDto ToRoadmapDto(Venture v) => new(
        v.Id,
        v.Name,
        v.CurrentStage.ToString(),
        v.Milestones.OrderBy(m => m.SortOrder).Select(ToMilestoneDto).ToList());

    private static MilestoneDto ToMilestoneDto(Milestone m) => new(
        m.Id,
        m.Title,
        m.Description,
        m.Status.ToString(),
        m.SortOrder,
        m.TargetDate,
        m.AchievedAt,
        m.GateKey,
        m.DependsOnMilestoneId,
        m.StageOnAchieve?.ToString(),
        m.Tasks.Count,
        m.Tasks.Count(t => t.IsCompleted),
        m.Tasks.Select(ToTaskDto).ToList());

    private static MicroTaskDto ToTaskDto(MicroTask t) => new(
        t.Id, t.Title, t.Impact.ToString(), t.EstimateMinutes, t.DueDate, t.IsCompleted);
}
