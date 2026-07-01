using North.Domain.Horizon;
using North.Domain.Ventures;
using North.Infrastructure.Persistence;

namespace North.Infrastructure.Seeding;

/// <summary>
/// Seeds a realistic demo venture on first run so the dashboard is never empty.
/// Demonstrates the stage-gate chain: Validation → MVP → First 10 Users.
/// </summary>
public static class DevSeeder
{
    public static void Seed(AppDbContext db)
    {
        if (db.Ventures.Any()) return;

        var venture = new Venture("My Startup");

        var validation = venture.AddMilestone(
            "Validate the problem",
            "Talk to real people in the target market and confirm the pain is worth paying for.",
            targetDate: DateOnly.FromDateTime(DateTime.Today.AddDays(21)),
            gateKey: "validation_done",
            stageOnAchieve: VentureStage.Validation);

        validation.AddTask("Interview 10 potential customers", ImpactLevel.High, estimateMinutes: 600);
        validation.AddTask("Write down the top 3 recurring pain points", ImpactLevel.High, estimateMinutes: 90);
        validation.AddTask("Draft a one-sentence value proposition", ImpactLevel.Medium, estimateMinutes: 60);
        validation.AddTask("Set up a landing page with a waitlist", ImpactLevel.Medium, estimateMinutes: 180);

        var mvp = venture.AddMilestone(
            "Ship the MVP",
            "Smallest version that delivers the core value. Nothing more.",
            targetDate: DateOnly.FromDateTime(DateTime.Today.AddDays(60)),
            gateKey: "mvp_shipped",
            dependsOnMilestoneId: validation.Id,
            stageOnAchieve: VentureStage.Mvp);

        mvp.AddTask("Define the single core user flow", ImpactLevel.High, estimateMinutes: 120);
        mvp.AddTask("Build the core flow end-to-end", ImpactLevel.High, estimateMinutes: 2400);
        mvp.AddTask("Deploy to production", ImpactLevel.Medium, estimateMinutes: 120);

        var firstUsers = venture.AddMilestone(
            "First 10 active users",
            "Get the MVP into the hands of 10 people who use it more than once.",
            gateKey: "first_10_users",
            dependsOnMilestoneId: mvp.Id,
            stageOnAchieve: VentureStage.Traction);

        firstUsers.AddTask("Onboard the waitlist personally, one by one", ImpactLevel.High);
        firstUsers.AddTask("Collect feedback after each first session", ImpactLevel.High);

        db.Ventures.Add(venture);
        db.SaveChanges();
    }
}
