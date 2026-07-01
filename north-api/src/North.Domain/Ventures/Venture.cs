using North.Domain.Common;
using North.Domain.Horizon;

namespace North.Domain.Ventures;

/// <summary>
/// Aggregate root: a founder's startup. Owns the roadmap (milestones + tasks)
/// and is the single place where stage-gate logic executes, so unlock rules
/// can never drift apart across services.
/// </summary>
public class Venture : Entity
{
    public string Name { get; private set; }
    public VentureStage CurrentStage { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    private readonly List<Milestone> _milestones = new();
    public IReadOnlyCollection<Milestone> Milestones => _milestones.AsReadOnly();

    private Venture() { Name = null!; } // EF Core

    public Venture(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("A venture needs a name.");

        Name = name.Trim();
        CurrentStage = VentureStage.Ideation;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public Milestone AddMilestone(
        string title,
        string description = "",
        DateOnly? targetDate = null,
        string? gateKey = null,
        Guid? dependsOnMilestoneId = null,
        VentureStage? stageOnAchieve = null)
    {
        if (dependsOnMilestoneId is Guid depId && _milestones.All(m => m.Id != depId))
            throw new DomainException("The prerequisite milestone does not exist on this venture.");

        var sortOrder = _milestones.Count == 0 ? 0 : _milestones.Max(m => m.SortOrder) + 1;
        var milestone = new Milestone(Id, title, description, sortOrder, targetDate, gateKey, dependsOnMilestoneId, stageOnAchieve);

        // If the prerequisite is already achieved, the new milestone is immediately workable.
        if (dependsOnMilestoneId is Guid dep &&
            _milestones.First(m => m.Id == dep).Status == MilestoneStatus.Achieved)
        {
            milestone.Activate();
        }

        _milestones.Add(milestone);
        return milestone;
    }

    /// <summary>
    /// Completes a milestone and runs the stage-gate cascade:
    /// 1. The milestone itself transitions to Achieved (validating its invariants).
    /// 2. Milestones that depended on it unlock (Locked → Active).
    /// 3. The venture's macro stage advances if the milestone carries one.
    /// Returns the milestones unlocked by this completion so the API can
    /// surface "you just unlocked X" to the founder.
    /// </summary>
    public IReadOnlyList<Milestone> CompleteMilestone(Guid milestoneId, DateTimeOffset now)
    {
        var milestone = _milestones.FirstOrDefault(m => m.Id == milestoneId)
            ?? throw new DomainException("Milestone not found on this venture.");

        milestone.Achieve(now);

        var unlocked = _milestones
            .Where(m => m.DependsOnMilestoneId == milestoneId && m.Status == MilestoneStatus.Locked)
            .ToList();
        foreach (var m in unlocked)
            m.Activate();

        if (milestone.StageOnAchieve is VentureStage stage && stage > CurrentStage)
            CurrentStage = stage;

        return unlocked;
    }

    /// <summary>Gate keys of all achieved milestones — the unlock state the whole app reads.</summary>
    public IReadOnlyList<string> UnlockedGateKeys() =>
        _milestones
            .Where(m => m.Status == MilestoneStatus.Achieved && m.GateKey is not null)
            .OrderBy(m => m.AchievedAt)
            .Select(m => m.GateKey!)
            .ToList();
}
