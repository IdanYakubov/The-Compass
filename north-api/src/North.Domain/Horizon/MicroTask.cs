using North.Domain.Common;

namespace North.Domain.Horizon;

public enum ImpactLevel
{
    Low = 0,
    Medium = 1,
    High = 2,
}

/// <summary>
/// The smallest unit of execution — a concrete task under a milestone.
/// Impact level drives the Daily Alignment "Top 3" selection.
/// </summary>
public class MicroTask : Entity
{
    public Guid MilestoneId { get; private set; }
    public string Title { get; private set; }
    public ImpactLevel Impact { get; private set; }
    public int? EstimateMinutes { get; private set; }
    public DateOnly? DueDate { get; private set; }
    public DateTimeOffset? CompletedAt { get; private set; }

    public bool IsCompleted => CompletedAt is not null;

    private MicroTask() { Title = null!; } // EF Core

    internal MicroTask(Guid milestoneId, string title, ImpactLevel impact, int? estimateMinutes, DateOnly? dueDate)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("A task needs a title.");

        MilestoneId = milestoneId;
        Title = title.Trim();
        Impact = impact;
        EstimateMinutes = estimateMinutes;
        DueDate = dueDate;
    }

    public void Complete(DateTimeOffset now)
    {
        if (IsCompleted)
            throw new DomainException("This task is already completed.");
        CompletedAt = now;
    }

    public void Reopen() => CompletedAt = null;
}
