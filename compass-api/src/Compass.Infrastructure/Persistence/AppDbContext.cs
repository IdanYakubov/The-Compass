using Compass.Domain.Horizon;
using Compass.Domain.Ventures;
using Microsoft.EntityFrameworkCore;

namespace Compass.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Venture> Ventures => Set<Venture>();
    public DbSet<Milestone> Milestones => Set<Milestone>();
    public DbSet<MicroTask> MicroTasks => Set<MicroTask>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Venture>(e =>
        {
            e.HasKey(v => v.Id);
            e.Property(v => v.Name).IsRequired().HasMaxLength(120);
            e.Property(v => v.CurrentStage).HasConversion<string>().HasMaxLength(20);
            // Aggregate boundary: milestones are always loaded/saved through the venture.
            e.HasMany(v => v.Milestones)
                .WithOne()
                .HasForeignKey(m => m.VentureId)
                .OnDelete(DeleteBehavior.Cascade);
            e.Navigation(v => v.Milestones).UsePropertyAccessMode(PropertyAccessMode.Field);
        });

        b.Entity<Milestone>(e =>
        {
            e.HasKey(m => m.Id);
            e.Property(m => m.Title).IsRequired().HasMaxLength(160);
            e.Property(m => m.Description).HasMaxLength(2000);
            e.Property(m => m.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(m => m.StageOnAchieve).HasConversion<string>().HasMaxLength(20);
            e.Property(m => m.GateKey).HasMaxLength(60);
            // A gate key opens exactly one gate per venture.
            e.HasIndex(m => new { m.VentureId, m.GateKey }).IsUnique();
            e.HasMany(m => m.Tasks)
                .WithOne()
                .HasForeignKey(t => t.MilestoneId)
                .OnDelete(DeleteBehavior.Cascade);
            e.Navigation(m => m.Tasks).UsePropertyAccessMode(PropertyAccessMode.Field);
        });

        b.Entity<MicroTask>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Title).IsRequired().HasMaxLength(300);
            e.Property(t => t.Impact).HasConversion<string>().HasMaxLength(10);
        });
    }
}
