using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace LongLifeModels.Services;

public interface IUserContextService
{
    string GetRequiredUserId(ClaimsPrincipal? principal, IHeaderDictionary headers);
}
