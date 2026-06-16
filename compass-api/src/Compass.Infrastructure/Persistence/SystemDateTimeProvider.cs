using Compass.Application.Abstractions;

namespace Compass.Infrastructure.Persistence;

public sealed class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
