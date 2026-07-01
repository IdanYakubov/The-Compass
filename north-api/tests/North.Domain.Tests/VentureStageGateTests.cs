using North.Domain.Common;
using North.Domain.Horizon;
using North.Domain.Ventures;

namespace North.Domain.Tests;

/// <summary>
/// Covers the stage-gate cascade in the <see cref="Venture"/> aggregate — the
/// core domain logic behind The Horizon. These are pure, in-memory tests: no EF,
/// no API. They lock down the invariants the README documents as the heart of the
/// product (a milestone is only achievable when its tasks are done; achieving one
/// unlocks its dependents and advances the macro stage).
/// </summary>
public class VentureStageGateTests
{
    private static readonly DateTimeOffset Now = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);

    [Fact]
    public void New_venture_starts_in_ideation()
    {
        var venture = new Venture("Acme");

        Assert.Equal(VentureStage.Ideation, venture.CurrentStage);
    }

    [Fact]
    public void Completing_a_milestone_with_open_tasks_throws()
    {
        var venture = new Venture("Acme");
        var milestone = venture.AddMilestone("Ship the MVP");
        milestone.AddTask("Build the thing", ImpactLevel.High);

        var ex = Assert.Throws<DomainException>(() => venture.CompleteMilestone(milestone.Id, Now));
        Assert.Contains("open task", ex.Message);
    }

    [Fact]
    public void Completing_a_milestone_with_all_tasks_done_achieves_it()
    {
        var venture = new Venture("Acme");
        var milestone = venture.AddMilestone("Ship the MVP", gateKey: "mvp_shipped");
        var task = milestone.AddTask("Build the thing", ImpactLevel.High);
        task.Complete(Now);

        venture.CompleteMilestone(milestone.Id, Now);

        Assert.Equal(MilestoneStatus.Achieved, milestone.Status);
        Assert.Equal(Now, milestone.AchievedAt);
        Assert.Contains("mvp_shipped", venture.UnlockedGateKeys());
    }

    [Fact]
    public void A_milestone_with_an_unmet_prerequisite_starts_locked()
    {
        var venture = new Venture("Acme");
        var validation = venture.AddMilestone("Validate the problem");
        var mvp = venture.AddMilestone("Ship the MVP", dependsOnMilestoneId: validation.Id);

        Assert.Equal(MilestoneStatus.Active, validation.Status);
        Assert.Equal(MilestoneStatus.Locked, mvp.Status);
    }

    [Fact]
    public void Achieving_a_milestone_unlocks_its_dependents()
    {
        var venture = new Venture("Acme");
        var validation = venture.AddMilestone("Validate the problem");
        var mvp = venture.AddMilestone("Ship the MVP", dependsOnMilestoneId: validation.Id);

        var unlocked = venture.CompleteMilestone(validation.Id, Now);

        Assert.Equal(MilestoneStatus.Active, mvp.Status);
        Assert.Contains(mvp, unlocked);
    }

    [Fact]
    public void Achieving_a_locked_milestone_throws()
    {
        var venture = new Venture("Acme");
        var validation = venture.AddMilestone("Validate the problem");
        var mvp = venture.AddMilestone("Ship the MVP", dependsOnMilestoneId: validation.Id);

        var ex = Assert.Throws<DomainException>(() => venture.CompleteMilestone(mvp.Id, Now));
        Assert.Contains("locked", ex.Message);
    }

    [Fact]
    public void Achieving_a_milestone_advances_the_venture_stage()
    {
        var venture = new Venture("Acme");
        var milestone = venture.AddMilestone("Validate the problem", stageOnAchieve: VentureStage.Validation);

        venture.CompleteMilestone(milestone.Id, Now);

        Assert.Equal(VentureStage.Validation, venture.CurrentStage);
    }

    [Fact]
    public void Stage_never_moves_backwards()
    {
        var venture = new Venture("Acme");
        var forward = venture.AddMilestone("Ship the MVP", stageOnAchieve: VentureStage.Mvp);
        // A later milestone that (mistakenly) carries an earlier stage must not regress it.
        var regress = venture.AddMilestone("Side quest", stageOnAchieve: VentureStage.Ideation);

        venture.CompleteMilestone(forward.Id, Now);
        venture.CompleteMilestone(regress.Id, Now);

        Assert.Equal(VentureStage.Mvp, venture.CurrentStage);
    }

    [Fact]
    public void Completing_an_already_achieved_milestone_throws()
    {
        var venture = new Venture("Acme");
        var milestone = venture.AddMilestone("Validate the problem");

        venture.CompleteMilestone(milestone.Id, Now);

        var ex = Assert.Throws<DomainException>(() => venture.CompleteMilestone(milestone.Id, Now));
        Assert.Contains("already achieved", ex.Message);
    }

    [Fact]
    public void UnlockedGateKeys_are_ordered_by_achievement_time()
    {
        var venture = new Venture("Acme");
        var first = venture.AddMilestone("Validate", gateKey: "validation_done");
        var second = venture.AddMilestone("Ship", gateKey: "mvp_shipped");

        venture.CompleteMilestone(first.Id, Now);
        venture.CompleteMilestone(second.Id, Now.AddDays(1));

        Assert.Equal(new[] { "validation_done", "mvp_shipped" }, venture.UnlockedGateKeys());
    }
}
