using North.Api.Middleware;
using North.Application.Abstractions;
using North.Application.Horizon;
using North.Application.Ventures;
using North.Infrastructure.Persistence;
using North.Infrastructure.Seeding;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// --- Persistence: SQLite for friction-free local dev, PostgreSQL when a
// --- "Postgres" connection string is configured (e.g. in production).
var postgres = builder.Configuration.GetConnectionString("Postgres");
builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (!string.IsNullOrWhiteSpace(postgres))
        options.UseNpgsql(postgres);
    else
        options.UseSqlite(builder.Configuration.GetConnectionString("Sqlite") ?? "Data Source=north.db");
});

// --- Application services (ports wired to their adapters)
builder.Services.AddScoped<IVentureRepository, VentureRepository>();
builder.Services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
builder.Services.AddScoped<IRoadmapService, RoadmapService>();
builder.Services.AddScoped<IVentureService, VentureService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- CORS: the Next.js dev server
const string FrontendCors = "frontend";
builder.Services.AddCors(o => o.AddPolicy(FrontendCors, p => p
    .WithOrigins("http://localhost:3000")
    .AllowAnyHeader()
    .AllowAnyMethod()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    // Create the SQLite schema and seed a demo venture so the app is never empty.
    // Swap to db.Database.Migrate() once EF migrations are introduced (Action Plan, step 2).
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    DevSeeder.Seed(db);
}

app.UseMiddleware<DomainExceptionMiddleware>();
app.UseCors(FrontendCors);
app.MapControllers();

app.Run();
