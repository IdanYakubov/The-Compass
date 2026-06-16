using Compass.Domain.Ventures;

namespace Compass.Application.Abstractions;

/// <summary>
/// Persistence port for the Venture aggregate. Implemented by Infrastructure (EF Core),
/// keeping the Application layer free of any data-access dependency.
/// </summary>
public interface IVentureRepository
{
    /// <summary>Loads a venture with its full roadmap (milestones + tasks), or null.</summary>
    Task<Venture?> GetWithRoadmapAsync(Guid ventureId, CancellationToken ct = default);

    Task<IReadOnlyList<Venture>> ListAsync(CancellationToken ct = default);

    void Add(Venture venture);

    Task SaveChangesAsync(CancellationToken ct = default);
}
