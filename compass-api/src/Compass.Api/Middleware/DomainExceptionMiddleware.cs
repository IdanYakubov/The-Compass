using Compass.Domain.Common;

namespace Compass.Api.Middleware;

/// <summary>
/// Translates domain invariant violations into 409 Conflict problem responses,
/// so controllers never need try/catch around business rules.
/// </summary>
public sealed class DomainExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public DomainExceptionMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (DomainException ex)
        {
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            await context.Response.WriteAsJsonAsync(new
            {
                title = "Rule violation",
                detail = ex.Message,
                status = StatusCodes.Status409Conflict,
            });
        }
    }
}
