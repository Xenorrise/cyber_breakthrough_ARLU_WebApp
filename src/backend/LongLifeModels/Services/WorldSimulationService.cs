using LongLifeModels.Data;
using LongLifeModels.Domain;
using LongLifeModels.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;
using System.Text.Json;

namespace LongLifeModels.Services;

public sealed class WorldSimulationService(
    IServiceScopeFactory scopeFactory,
    IEventService eventService,
    ILogger<WorldSimulationService> logger) : IWorldSimulationService
{
    private const string ReasonSystemPrompt =
        """
        Ты пишешь ОДНУ живую причину для социального эпизода в симуляции.
        Требования:
        - Язык: русский.
        - 1 короткое предложение, до 140 символов.
        - Никаких списков, кавычек, префиксов "Причина:".
        - Причина должна быть конкретной и человеческой (мотив, страх, цель, триггер).
        - Не повторяй шаблонные формулировки вроде "пересмотрены приоритеты".
        Верни только текст причины.
        """;

    private static readonly DateTimeOffset DefaultWorldStart = new(2087, 04, 12, 8, 0, 0, TimeSpan.Zero);
    private static readonly ConcurrentDictionary<string, UserWorldState> States = new(StringComparer.Ordinal);
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private static readonly HeroTemplate[] Heroes =
    [
        new("Алексей", "Исследователь и оптимист.", "общительный, оптимист, любопытный", "Поговорить с Мариной о событии на площади.", "вдохновлен", 0.82f, new PersonalityTraits { Openness = 0.86f, Conscientiousness = 0.58f, Extraversion = 0.78f, Agreeableness = 0.71f, Neuroticism = 0.29f }, ["Встретил Марину на площади.", "Поспорил с Виктором."]),
        new("Марина", "Художница-интроверт.", "задумчивая, художница, интроверт", "Закончить серию эскизов заката.", "спокойствие", 0.65f, new PersonalityTraits { Openness = 0.91f, Conscientiousness = 0.49f, Extraversion = 0.24f, Agreeableness = 0.63f, Neuroticism = 0.45f }, ["Закат вдохновил на новый набросок.", "Разговор с Алексеем оказался теплым."]),
        new("Виктор", "Бывший военный, жесткий лидер.", "прямолинейный, амбициозный, упрямый", "Проверить слухи о ночном инциденте.", "напряжение", 0.57f, new PersonalityTraits { Openness = 0.31f, Conscientiousness = 0.84f, Extraversion = 0.64f, Agreeableness = 0.22f, Neuroticism = 0.54f }, ["Спор с Алексеем закончился ничем.", "Марина отвернулась при встрече."]),
        new("Елена", "Врач и миротворец.", "энергичная, лидер, эмпат", "Организовать общий ужин и снизить напряжение.", "энтузиазм", 0.88f, new PersonalityTraits { Openness = 0.73f, Conscientiousness = 0.79f, Extraversion = 0.74f, Agreeableness = 0.88f, Neuroticism = 0.18f }, ["Помогла незнакомцу на улице.", "Заметила конфликт Виктора и Алексея."]),
        new("Дмитрий", "Замкнутый ученый после пожара.", "замкнутый, умный, меланхоличный", "Восстановить уцелевшие записи лаборатории.", "усталость", 0.34f, new PersonalityTraits { Openness = 0.77f, Conscientiousness = 0.83f, Extraversion = 0.16f, Agreeableness = 0.42f, Neuroticism = 0.72f }, ["Пожар уничтожил десять лет работы.", "Не доверяет Виктору."]),
        new("Ольга", "Торговка, знающая слухи города.", "осторожная, наблюдательная, скрытная", "Понять, кто следит за рынком.", "тревога", 0.43f, new PersonalityTraits { Openness = 0.51f, Conscientiousness = 0.67f, Extraversion = 0.46f, Agreeableness = 0.41f, Neuroticism = 0.76f }, ["Видела Виктора в переулке ночью.", "Елена часто покупает у нее травы."]),
        new("Игорь", "Сторож библиотеки и хранитель архивов.", "спокойный, справедливый, старомодный", "Разобрать архив и найти новые упоминания.", "сдержанность", 0.61f, new PersonalityTraits { Openness = 0.58f, Conscientiousness = 0.86f, Extraversion = 0.19f, Agreeableness = 0.74f, Neuroticism = 0.21f }, ["Помнит город до войны.", "Алексей часто просит у него совет."]),
        new("Настя", "Студентка-музыкант, новенькая в городе.", "жизнерадостная, наивная, творческая", "Найти место для репетиций и познакомиться с людьми.", "воодушевление", 0.79f, new PersonalityTraits { Openness = 0.89f, Conscientiousness = 0.47f, Extraversion = 0.69f, Agreeableness = 0.77f, Neuroticism = 0.37f }, ["Услышала громкий спор на площади.", "Марина улыбнулась ей на улице."])
    ];

    private static readonly (string From, string To, float Score)[] SeedRelations =
    [
        ("Алексей", "Марина", 0.7f), ("Алексей", "Виктор", -0.4f), ("Алексей", "Игорь", 0.4f),
        ("Марина", "Дмитрий", 0.3f), ("Марина", "Настя", 0.5f), ("Виктор", "Елена", -0.2f),
        ("Виктор", "Игорь", -0.3f), ("Елена", "Ольга", 0.4f), ("Елена", "Алексей", 0.5f),
        ("Ольга", "Виктор", -0.1f), ("Настя", "Алексей", 0.2f), ("Дмитрий", "Игорь", 0.2f)
    ];

    public async Task EnsureUserWorldAsync(string userId, CancellationToken cancellationToken)
    {
        var normalized = NormalizeUserId(userId);
        var state = States.GetOrAdd(normalized, CreateState);
        await state.Gate.WaitAsync(cancellationToken);
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AgentDbContext>();
            var existing = await db.Agents.Where(x => x.UserId == normalized && !x.IsArchived).ToListAsync(cancellationToken);
            if (existing.Count == 0)
            {
                await SeedWorldUnsafeAsync(db, normalized, state.GameTime, cancellationToken);
                state.NextEventAt = state.GameTime.AddMinutes(8 + state.Random.Next(16));
            }

            if (state.NextEventAt <= state.GameTime)
            {
                state.NextEventAt = state.GameTime.AddMinutes(8 + state.Random.Next(16));
            }
        }
        finally
        {
            state.Gate.Release();
        }
    }

    public async Task<WorldTimeDto> GetWorldTimeAsync(string userId, CancellationToken cancellationToken)
    {
        var normalized = NormalizeUserId(userId);
        await EnsureUserWorldAsync(normalized, cancellationToken);
        var state = States[normalized];
        await state.Gate.WaitAsync(cancellationToken);
        try
        {
            return new WorldTimeDto { GameTime = state.GameTime, Speed = state.Speed };
        }
        finally
        {
            state.Gate.Release();
        }
    }

    public async Task<WorldTimeDto> UpdateSpeedAsync(string userId, float speed, CancellationToken cancellationToken)
    {
        var normalized = NormalizeUserId(userId);
        await EnsureUserWorldAsync(normalized, cancellationToken);
        var state = States[normalized];
        await state.Gate.WaitAsync(cancellationToken);
        try
        {
            state.Speed = Math.Clamp(speed, 0f, 20f);
            return new WorldTimeDto { GameTime = state.GameTime, Speed = state.Speed };
        }
        finally
        {
            state.Gate.Release();
        }
    }

    public async Task<WorldTimeDto> AdvanceTimeAsync(string userId, int minutes, CancellationToken cancellationToken)
    {
        var normalized = NormalizeUserId(userId);
        await EnsureUserWorldAsync(normalized, cancellationToken);
        var state = States[normalized];
        await state.Gate.WaitAsync(cancellationToken);
        try
        {
            var target = state.GameTime.AddMinutes(Math.Clamp(minutes, 1, 60 * 24 * 30));
            await SimulateUntilUnsafeAsync(normalized, state, target, cancellationToken);
            return new WorldTimeDto { GameTime = state.GameTime, Speed = state.Speed };
        }
        finally
        {
            state.Gate.Release();
        }
    }

    public async Task TickAsync(TimeSpan elapsedRealTime, CancellationToken cancellationToken)
    {
        if (elapsedRealTime <= TimeSpan.Zero)
        {
            return;
        }

        using (var scope = scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AgentDbContext>();
            var userIds = await db.Agents
                .Where(x => !x.IsArchived)
                .Select(x => x.UserId)
                .Distinct()
                .ToArrayAsync(cancellationToken);

            foreach (var userId in userIds)
            {
                States.TryAdd(NormalizeUserId(userId), CreateState(userId));
            }
        }

        foreach (var userId in States.Keys)
        {
            var state = States[userId];
            await state.Gate.WaitAsync(cancellationToken);
            try
            {
                if (state.Speed <= 0f)
                {
                    continue;
                }

                var target = state.GameTime.AddSeconds(elapsedRealTime.TotalSeconds * state.Speed * 60d);
                await SimulateUntilUnsafeAsync(userId, state, target, cancellationToken);
            }
            finally
            {
                state.Gate.Release();
            }
        }
    }

    private async Task SeedWorldUnsafeAsync(AgentDbContext db, string userId, DateTimeOffset gameTime, CancellationToken cancellationToken)
    {
        var agents = Heroes.Select(hero => new Agent
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = hero.Name,
            Model = "story.hero.v1",
            Status = AgentStatuses.Idle,
            State = hero.Plan,
            Description = hero.Description,
            CurrentEmotion = hero.Emotion,
            TraitSummary = hero.TraitSummary,
            Energy = hero.Energy,
            ThreadId = Guid.NewGuid(),
            CreatedAt = gameTime,
            LastActiveAt = gameTime,
            PersonalityTraits = hero.PersonalityTraits
        }).ToArray();

        db.Agents.AddRange(agents);
        await db.SaveChangesAsync(cancellationToken);

        var byName = agents.ToDictionary(x => x.Name, StringComparer.Ordinal);
        foreach (var (from, to, score) in SeedRelations)
        {
            if (!byName.TryGetValue(from, out var source) || !byName.TryGetValue(to, out var target))
            {
                continue;
            }

            var (a, b) = OrderPair(source.Id, target.Id);
            db.Relationships.Add(new Relationship { Id = Guid.NewGuid(), AgentAId = a, AgentBId = b, Score = score, InteractionCount = 2, LastInteractionTime = gameTime });
        }

        foreach (var hero in Heroes)
        {
            if (!byName.TryGetValue(hero.Name, out var agent))
            {
                continue;
            }

            var memoryTime = gameTime.AddHours(-2);
            foreach (var memory in hero.Memories)
            {
                db.MemoryLogs.Add(new MemoryLog { Id = Guid.NewGuid(), AgentId = agent.Id, Description = memory, Importance = 0.65f, Timestamp = memoryTime });
                memoryTime = memoryTime.AddMinutes(20);
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task SimulateUntilUnsafeAsync(string userId, UserWorldState state, DateTimeOffset targetTime, CancellationToken cancellationToken)
    {
        if (targetTime <= state.GameTime)
        {
            state.GameTime = targetTime;
            return;
        }

        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AgentDbContext>();
        var llm = scope.ServiceProvider.GetService<ILLMService>();
        var agents = await db.Agents.Where(x => x.UserId == userId && !x.IsArchived).ToListAsync(cancellationToken);
        if (agents.Count == 0)
        {
            state.GameTime = targetTime;
            return;
        }

        var relMap = await LoadRelationshipsUnsafeAsync(db, agents, cancellationToken);
        var generated = 0;
        while (state.NextEventAt <= targetTime && generated < 240)
        {
            var eventTime = state.NextEventAt;
            var actor = agents[state.Random.Next(agents.Count)];
            var target = PickTarget(state, actor, agents);
            var category = PickCategory(state.Random);
            var sentiment = PickSentiment(state.Random, category, relMap, actor, target);
            actor.CurrentEmotion = SentimentToEmotion(sentiment);
            actor.State = BuildPlan(state.Random, actor.Name, target?.Name);
            actor.Energy = Math.Clamp(actor.Energy + (category == "system" ? 0.03f : -0.03f), 0.05f, 1f);
            actor.LastActiveAt = eventTime;
            var fallbackReason = BuildReason(actor.Name, target?.Name, actor.State, category, sentiment);
            var reason = await BuildReasonWithLlmAsync(
                llm,
                actor.Name,
                target?.Name,
                actor.State,
                category,
                sentiment,
                actor.CurrentEmotion,
                fallbackReason,
                cancellationToken);

            if (target is not null)
            {
                var relationship = UpdateRelationship(db, relMap, actor.Id, target.Id, sentiment, eventTime);
                db.MemoryLogs.Add(new MemoryLog
                {
                    Id = Guid.NewGuid(),
                    AgentId = actor.Id,
                    RelatedAgentId = target.Id,
                    Description = $"{actor.Name}: {category} -> {target.Name}. Причина: {reason}",
                    Importance = 0.4f + MathF.Abs(sentiment) * 0.4f,
                    Timestamp = eventTime
                });
                db.MemoryLogs.Add(new MemoryLog
                {
                    Id = Guid.NewGuid(),
                    AgentId = target.Id,
                    RelatedAgentId = actor.Id,
                    Description = $"{actor.Name} повлиял на отношение: {LabelForScore(relationship.Score)}. Причина: {reason}",
                    Importance = 0.35f,
                    Timestamp = eventTime
                });
            }

            var text = BuildEventText(actor.Name, target?.Name, actor.State, actor.CurrentEmotion, category, sentiment, reason);
            var payload = JsonSerializer.SerializeToElement(new
            {
                agentId = actor.Id,
                agentName = actor.Name,
                toAgentId = target?.Id,
                toAgentName = target?.Name,
                text,
                message = text,
                sentiment,
                label = LabelForScore(sentiment),
                category,
                emotion = actor.CurrentEmotion,
                currentPlan = actor.State,
                reason,
                gameTime = eventTime.ToString("O")
            }, JsonOptions);

            await eventService.CreateAsync(new CreateEventRequestDto { Type = $"simulation.{category}", Payload = payload, OccurredAt = eventTime }, userId, eventTime, cancellationToken);

            generated++;
            state.NextEventAt = state.NextEventAt.AddMinutes(6 + state.Random.Next(22));
        }

        if (generated > 0)
        {
            await db.SaveChangesAsync(cancellationToken);
        }

        state.GameTime = targetTime;
        if (state.NextEventAt <= state.GameTime)
        {
            state.NextEventAt = state.GameTime.AddMinutes(8 + state.Random.Next(16));
        }
    }

    private static async Task<Dictionary<RelationKey, Relationship>> LoadRelationshipsUnsafeAsync(AgentDbContext db, IReadOnlyCollection<Agent> agents, CancellationToken cancellationToken)
    {
        var ids = agents.Select(x => x.Id).ToHashSet();
        var relationships = await db.Relationships.Where(x => ids.Contains(x.AgentAId) && ids.Contains(x.AgentBId)).ToListAsync(cancellationToken);
        return relationships.ToDictionary(x => new RelationKey(x.AgentAId, x.AgentBId), x => x);
    }

    private static Relationship UpdateRelationship(AgentDbContext db, IDictionary<RelationKey, Relationship> map, Guid first, Guid second, float sentiment, DateTimeOffset eventTime)
    {
        var (a, b) = OrderPair(first, second);
        var key = new RelationKey(a, b);
        if (!map.TryGetValue(key, out var relationship))
        {
            relationship = new Relationship { Id = Guid.NewGuid(), AgentAId = a, AgentBId = b, Score = 0f, LastInteractionTime = eventTime };
            map[key] = relationship;
            db.Relationships.Add(relationship);
        }

        relationship.Score = Math.Clamp(relationship.Score * 0.72f + sentiment * 0.28f, -1f, 1f);
        relationship.InteractionCount += 1;
        relationship.LastInteractionTime = eventTime;
        return relationship;
    }

    private static string PickCategory(Random random) => random.NextDouble() switch { < 0.42 => "chat", < 0.76 => "action", < 0.92 => "emotion", _ => "system" };
    private static string SentimentToEmotion(float sentiment) => sentiment >= 0.55f ? "радость" : sentiment >= 0.2f ? "спокойствие" : sentiment > -0.2f ? "напряжение" : sentiment > -0.55f ? "тревога" : "раздражение";
    private static string LabelForScore(float score) => score >= 0.55f ? "дружба" : score >= 0.2f ? "симпатия" : score > -0.2f ? "нейтрально" : score > -0.55f ? "напряжение" : "конфликт";
    private static string BuildPlan(Random random, string actor, string? target) => $"{(random.NextDouble() < 0.5 ? "Днем" : "Вечером")} {actor.ToLowerInvariant()} планирует обсудить приоритеты с {(target ?? "горожанами")}.";
    private static string BuildEventText(string actor, string? target, string plan, string emotion, string category, float sentiment, string reason) => category == "emotion"
        ? $"{actor} фиксирует эмоцию: {emotion}. Причина: {reason}"
        : category == "system"
            ? $"{actor} обновляет план: {plan} Причина: {reason}"
            : target is null
                ? $"{actor} действует самостоятельно. Причина: {reason}"
                : sentiment >= 0
                    ? $"{actor} взаимодействует с {target} и усиливает контакт. Причина: {reason}"
                    : $"{actor} конфликтует с {target}, напряжение растет. Причина: {reason}";

    private static string BuildReason(string actor, string? target, string plan, string category, float sentiment)
    {
        if (category == "system")
        {
            return "пересмотрены приоритеты после оценки текущей обстановки";
        }

        if (category == "emotion")
        {
            return sentiment >= 0
                ? "появились сигналы поддержки и доверия"
                : "накопилось напряжение после предыдущих контактов";
        }

        if (target is null)
        {
            return "агент работал в одиночку и опирался на собственные выводы";
        }

        if (sentiment >= 0.35f)
        {
            return $"у {actor} и {target} совпали цели: {ShortenPlan(plan)}";
        }

        if (sentiment <= -0.35f)
        {
            return $"{actor} и {target} разошлись во взглядах на приоритеты и сроки";
        }

        return $"{actor} и {target} уточняют позиции по плану: {ShortenPlan(plan)}";
    }

    private static string ShortenPlan(string plan)
    {
        if (string.IsNullOrWhiteSpace(plan))
        {
            return "план уточняется";
        }

        return plan.Length <= 80 ? plan : $"{plan[..77]}...";
    }

    private async Task<string> BuildReasonWithLlmAsync(
        ILLMService? llm,
        string actor,
        string? target,
        string plan,
        string category,
        float sentiment,
        string emotion,
        string fallbackReason,
        CancellationToken cancellationToken)
    {
        if (llm is null)
        {
            return fallbackReason;
        }

        var targetLabel = string.IsNullOrWhiteSpace(target) ? "нет прямого собеседника" : target;
        var userPrompt =
            $"Актор: {actor}.{Environment.NewLine}" +
            $"Собеседник: {targetLabel}.{Environment.NewLine}" +
            $"Категория: {category}.{Environment.NewLine}" +
            $"Текущий план: {plan}.{Environment.NewLine}" +
            $"Эмоция: {emotion}.{Environment.NewLine}" +
            $"Тон взаимодействия (sentiment): {sentiment:F2}.{Environment.NewLine}" +
            "Сгенерируй причину эпизода.";

        try
        {
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            linkedCts.CancelAfter(TimeSpan.FromSeconds(5));

            var raw = await llm.GenerateAsync(ReasonSystemPrompt, userPrompt, linkedCts.Token);
            var cleaned = CleanupReason(raw);
            return string.IsNullOrWhiteSpace(cleaned) ? fallbackReason : cleaned;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogDebug("LLM reason generation timeout, using fallback reason.");
            return fallbackReason;
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "LLM reason generation failed, using fallback reason.");
            return fallbackReason;
        }
    }

    private static string CleanupReason(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return string.Empty;
        }

        var value = raw.Trim();
        value = value.Trim('"', '\'', '«', '»');

        if (value.StartsWith("Причина:", StringComparison.OrdinalIgnoreCase))
        {
            value = value["Причина:".Length..].Trim();
        }

        if (value.Length > 140)
        {
            value = value[..140].TrimEnd();
        }

        return value;
    }

    private static float PickSentiment(Random random, string category, IReadOnlyDictionary<RelationKey, Relationship> relationships, Agent actor, Agent? target)
    {
        var baseValue = category switch { "chat" => 0.2f, "action" => 0.1f, "emotion" => 0.05f, _ => 0f };
        var relationScore = 0f;
        if (target is not null)
        {
            var (a, b) = OrderPair(actor.Id, target.Id);
            if (relationships.TryGetValue(new RelationKey(a, b), out var relationship))
            {
                relationScore = relationship.Score;
            }
        }

        var jitter = (float)(random.NextDouble() * 0.36d - 0.18d);
        return Math.Clamp(baseValue + relationScore * 0.45f + jitter, -1f, 1f);
    }

    private static Agent? PickTarget(UserWorldState state, Agent actor, IReadOnlyList<Agent> agents)
    {
        if (agents.Count < 2 || state.Random.NextDouble() < 0.2d)
        {
            return null;
        }

        var candidates = agents.Where(x => x.Id != actor.Id).ToArray();
        return candidates.Length == 0 ? null : candidates[state.Random.Next(candidates.Length)];
    }

    private static (Guid A, Guid B) OrderPair(Guid left, Guid right) => left.CompareTo(right) <= 0 ? (left, right) : (right, left);
    private static string NormalizeUserId(string userId) => string.IsNullOrWhiteSpace(userId) ? "demo-user" : userId.Trim();
    private static UserWorldState CreateState(string userId) => new() { GameTime = DefaultWorldStart, Speed = 1f, NextEventAt = DefaultWorldStart.AddMinutes(8), Random = new Random(Math.Abs(StringComparer.Ordinal.GetHashCode(NormalizeUserId(userId)))) };

    private sealed class UserWorldState
    {
        public required DateTimeOffset GameTime { get; set; }
        public required float Speed { get; set; }
        public required DateTimeOffset NextEventAt { get; set; }
        public required Random Random { get; init; }
        public SemaphoreSlim Gate { get; } = new(1, 1);
    }

    private sealed record HeroTemplate(string Name, string Description, string TraitSummary, string Plan, string Emotion, float Energy, PersonalityTraits PersonalityTraits, IReadOnlyCollection<string> Memories);
    private readonly record struct RelationKey(Guid AgentAId, Guid AgentBId);
}
