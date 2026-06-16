using Compass.Application.Abstractions;
using Compass.Application.Horizon;
using Compass.Domain.Ventures;

namespace Compass.Application.Ventures;

public interface IVentureService
{
    Task<IReadOnlyList<VentureSummaryDto>> ListAsync(CancellationToken ct = default);
    Task<VentureSummaryDto> CreateAsync(CreateVentureRequest request, CancellationToken ct = default);
}

public sealed class VentureService : IVentureService
{
    private readonly IVentureRepository _ventures;

    public VentureService(IVentureRepository ventures) => _ventures = ventures;

    public async Task<IReadOnlyList<VentureSummaryDto>> ListAsync(CancellationToken ct = default)
    {
        var list = await _ventures.ListAsync(ct);
        return list.Select(ToSummary).ToList();
    }

    public async Task<VentureSummaryDto> CreateAsync(CreateVentureRequest request, CancellationToken ct = default)
    {
        var venture = new Venture(request.Name);
        _ventures.Add(venture);
        await _ventures.SaveChangesAsync(ct);
        return ToSummary(venture);
    }

    private static VentureSummaryDto ToSummary(Venture v) =>
        new(v.Id, v.Name, v.CurrentStage.ToString(), v.CreatedAt);
}
