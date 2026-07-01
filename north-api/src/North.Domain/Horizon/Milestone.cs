using North.Domain.Common;
using North.Domain.Ventures;

namespace North.Domain.Horizon;

public enum MilestoneStatus
{
    /// <summary>Not yet workable — waiting on a prerequisite milestone.</summary>
    Locked = 0,
    /// <summary>Currently in play on the roadmap.</summary>
    Active = 1,
    /// <summary>Done. If it carries a gate key, that gate is now open.</summary>
    Achieved = 2,
}

/// <summary>
/// A macro goal on the Horizon (e.g. "Ship MVP", "First 10 users").
/// Milestones are the stage-gate backbone of North:
///  - <see cref="GateKey"/> identifies what this milestone unlocks across the app.
///  - <see cref="DependsOnMilestoneId"/> chains milestones so later ones start Locked.
///  - <see cref="StageOnAchieve"/> optionally advances the venture's macro stage.
/// State transitions are only performed by the owning <see cref="Venture"/> aggregate.
/// </summary>
public class Milestone : Entity
{
    public Guid VentureId { get; private set; }
    public string Title { get; private set; }
    public string Description { get; private set; }
    public int SortOrder { get; private set; }
    public MilestoneStatus Status { get; private set; }
    public DateOnly? TargetDate { get; private set; }
    public DateTimeOffset? AchievedAt { get; private set; }

    /// <summary>Unique-per-venture key other modules check against, e.g. "mvp_shipped".</summary>
    public string? GateKey { get; private set; }
    public Guid? DependsOnMilestoneId { get; private set; }
    public VentureStage? StageOnAchieve { get; private set; }

    private readonly List<MicroTask> _tasks = new();
    public IReadOnlyCollection<MicroTask> Tasks => _tasks.AsReadOnly();

    private Milestone() { Title = null!; Description = null!; } // EF Core

    internal Milestone(
        Guid ventureId,
        string title,
        string description,
        int sortOrder,
        DateOnly? targetDate,
        string? gateKey,
        Guid? dependsOnMilestoneId,
        VentureStage? stageOnAchieve)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("A milestone needs a title.");

        VentureId = ventureId;
        Title = title.Trim();
        Description = description?.Trim() ?? string.Empty;
        SortOrder = sortOrder;
        TargetDate = targetDate;
        GateKey = NormalizeGateKey(gateKey);
        DependsOnMilestoneId = dependsOnMilestoneId;
        StageOnAchieve = stageOnAchieve;
        // A milestone with an unmet prerequisite starts Locked; the venture
        // flips it to Active when the prerequisite is achieved.
        Status = dependsOnMilestoneId is null ? MilestoneStatus.Active : MilestoneStatus.Locked;
    }

    public MicroTask AddTask(string title, ImpactLevel impact, int? estimateMinutes = null, DateOnly? dueDate = null)
    {
        if (Status == MilestoneStatus.Achieved)
            throw new DomainException("Cannot add tasks to an achieved milestone.");

        var task = new MicroTask(Id, title, impact, estimateMinutes, dueDate);
        _tasks.Add(task);
        return task;
    }

    internal void Activate()
    {
        if (Status == MilestoneStatus.Locked)
            Status = MilestoneStatus.Active;
    }

    internal void Achieve(DateTimeOffset now)
    {
        if (Status == MilestoneStatus.Locked)
            throw new DomainException($"\"{Title}\" is locked. Complete its prerequisite milestone first.");
        if (Status == MilestoneStatus.Achieved)
            throw new DomainException($"\"{Title}\" is already achieved.");

        // Deliberate product rule: a milestone is only "achieved" when its
        // breakdown is actually done. This keeps the roadmap honest.
        var openTasks = _tasks.Count(t => !t.IsCompleted);
        if (openTasks > 0)
            throw new DomainException($"\"{Title}\" still has {openTasks} open task(s). Complete or remove them first.");

        Status = MilestoneStatus.Achieved;
        AchievedAt = now;
    }

    private static string? NormalizeGateKey(string? gateKey)
    {
        if (string.IsNullOrWhiteSpace(gateKey)) return null;
        return gateKey.Trim().ToLowerInvariant().Replace(' ', '_');
    }
}
