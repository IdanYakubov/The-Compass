using North.Application.Abstractions;
using North.Domain.Ventures;
using Microsoft.EntityFrameworkCore;

namespace North.Infrastructure.Persistence;

public sealed class VentureRepository : IVentureRepository
{
    private readonly AppDbContext _db;

    public VentureRepository(AppDbContext db) => _db = db;

    public Task<Venture?> GetWithRoadmapAsync(Guid ventureId, CancellationToken ct = default) =>
        _db.Ventures
            .Include(v => v.Milestones)
            .ThenInclude(m => m.Tasks)
            .FirstOrDefaultAsync(v => v.Id == ventureId, ct);

    public async Task<IReadOnlyList<Venture>> ListAsync(CancellationToken ct = default)
    {
        // SQLite cannot ORDER BY DateTimeOffset columns; sort in memory instead.
        var ventures = await _db.Ventures.AsNoTracking().ToListAsync(ct);
        return ventures.OrderBy(v => v.CreatedAt).ToList();
    }

    public void Add(Venture venture) => _db.Ventures.Add(venture);

    public Task SaveChangesAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
