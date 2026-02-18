FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY LongLifeModels/*.csproj LongLifeModels/
RUN dotnet restore LongLifeModels/LongLifeModels.csproj

COPY LongLifeModels/ LongLifeModels/
RUN dotnet publish LongLifeModels/LongLifeModels.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "LongLifeModels.dll"]
