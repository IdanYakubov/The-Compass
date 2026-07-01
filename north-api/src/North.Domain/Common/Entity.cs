namespace North.Domain.Common;

/// <summary>Base class for all domain entities. Identity-based equality.</summary>
public abstract class Entity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();

    public override bool Equals(object? obj) => obj is Entity other && other.Id == Id;
    public override int GetHashCode() => Id.GetHashCode();
}
