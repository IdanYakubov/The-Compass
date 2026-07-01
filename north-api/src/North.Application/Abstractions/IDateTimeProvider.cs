namespace North.Application.Abstractions;

/// <summary>Abstracts "now" so time-dependent logic (achievements, focus sessions) is testable.</summary>
public interface IDateTimeProvider
{
    DateTimeOffset UtcNow { get; }
}
