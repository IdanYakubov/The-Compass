namespace North.Domain.Common;

/// <summary>
/// Thrown when a domain invariant is violated (e.g. completing a locked milestone).
/// The API layer translates these into 409 Conflict responses — they represent
/// a valid request that the current state of the venture does not allow.
/// </summary>
public sealed class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
}
