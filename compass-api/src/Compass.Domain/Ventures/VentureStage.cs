namespace Compass.Domain.Ventures;

/// <summary>
/// The macro journey of a venture. Stages only move forward, and are advanced
/// by achieving gate milestones (see <see cref="Horizon.Milestone.StageOnAchieve"/>).
/// </summary>
public enum VentureStage
{
    Ideation = 0,
    Validation = 1,
    Mvp = 2,
    Traction = 3,
    Growth = 4,
}
