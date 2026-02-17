using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace LongLifeModels.Services;

public sealed class UserContextService : IUserContextService
{
    private static readonly string[] SupportedClaimTypes =
    [
        ClaimTypes.NameIdentifier,
        "sub",
        "userId"
    ];

    public string GetRequiredUserId(ClaimsPrincipal? principal, IHeaderDictionary headers)
    {
        var fromClaim = SupportedClaimTypes
            .Select(claimType => principal?.FindFirst(claimType)?.Value)
            .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));

        if (!string.IsNullOrWhiteSpace(fromClaim))
        {
            return fromClaim.Trim();
        }

        if (headers.TryGetValue("X-User-Id", out var headerValue))
        {
            var fromHeader = headerValue.ToString().Trim();
            if (!string.IsNullOrWhiteSpace(fromHeader))
            {
                return fromHeader;
            }
        }

        throw new UnauthorizedAccessException(
            "User identifier was not found. Provide authenticated claim (sub/nameidentifier) or X-User-Id header.");
    }
}
