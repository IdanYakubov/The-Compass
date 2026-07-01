using North.Application.Abstractions;

namespace North.Infrastructure.Persistence;

public sealed class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
