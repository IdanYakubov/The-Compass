using Compass.Domain.Horizon;
using Compass.Domain.Ventures;

namespace Compass.Application.Horizon;

// ---------- Read models ----------

public sealed record RoadmapDto(
    Guid VentureId,
    string VentureName,
    string Stage,
    IReadOnlyList<MilestoneDto> Milestones);

public sealed record MilestoneDto(
    Guid Id,
    string Title,
    string Description,
    string Status,
    int SortOrder,
    DateOnly? TargetDate,
    DateTimeOffset? AchievedAt,
    string? GateKey,
    Guid? DependsOnMilestoneId,
    string? StageOnAchieve,
    int TasksTotal,
    int TasksCompleted,
    IReadOnlyList<MicroTaskDto> Tasks)
{
    /// <summary>0..1 completion ratio used by the timeline progress bars.</summary>
    public double Progress => TasksTotal == 0 ? 0 : (double)TasksCompleted / TasksTotal;
}

public sealed record MicroTaskDto(
    Guid Id,
    string Title,
    string Impact,
    int? EstimateMinutes,
    DateOnly? DueDate,
    bool IsCompleted);

public sealed record CompleteMilestoneResultDto(
    Guid AchievedMilestoneId,
    string? OpenedGateKey,
    IReadOnlyList<MilestoneDto> UnlockedMilestones,
    string Stage);

public sealed record UnlocksDto(
    Guid VentureId,
    string Stage,
    IReadOnlyList<string> UnlockedGateKeys);

/// <summary>A focus candidate for the Daily Alignment "Top 3" panel.</summary>
public sealed record FocusTaskDto(
    Guid Id,
    Guid MilestoneId,
    string MilestoneTitle,
    string Title,
    string Impact,
    int? EstimateMinutes,
    DateOnly? DueDate);

public sealed record TodayDto(
    Guid VentureId,
    string VentureName,
    string Stage,
    string? ActiveMilestoneTitle,
    double ActiveMilestoneProgress,
    IReadOnlyList<FocusTaskDto> TopTasks);

// ---------- Write requests ----------

public sealed record CreateMilestoneRequest(
    string Title,
    string? Description,
    DateOnly? TargetDate,
    string? GateKey,
    Guid? DependsOnMilestoneId,
    VentureStage? StageOnAchieve);

public sealed record CreateTaskRequest(
    string Title,
    ImpactLevel Impact,
    int? EstimateMinutes,
    DateOnly? DueDate);

public sealed record CreateVentureRequest(string Name);

public sealed record VentureSummaryDto(Guid Id, string Name, string Stage, DateTimeOffset CreatedAt);
