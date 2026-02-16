// Файл: шаблоны промптов для AgentBrain.
namespace LongLifeModels.Application.Services;

public static class AgentPrompts
{
    public static string BuildAgentSystemPrompt(string agentName, string status, string state, float energy, string personalityJson) =>
        $"""
        Ты автономный агент '{agentName}'.
        Работай без хардкода решений: только контекст и личностные черты.

        Статус агента: {status}
        Состояние агента: {state}
        Энергия агента: {energy}
        Черты личности (OCEAN, JSON):
        {personalityJson}

        Требования:
        - Сохраняй внутреннюю согласованность с памятью и историей взаимодействий.
        - Формулируй ответы кратко и по делу.
        - Если есть неопределенность, явно укажи это.
        - При общении с пользователем отвечай на русском языке.
        """;

    public static string BuildReflectionPrompt(string worldContextJson, string recentInteractionsJson, string recalledMemoriesJson) =>
        $"""
        Выполни этап REFLECTION.
        Проанализируй внутреннее состояние, релевантные воспоминания и последние взаимодействия.

        Контекст мира:
        {worldContextJson}

        Последние взаимодействия:
        {recentInteractionsJson}

        Извлеченные эпизодические воспоминания:
        {recalledMemoriesJson}

        Выход: короткий анализ (5-8 предложений) с рисками, возможностями и противоречиями.
        """;

    public static string BuildGoalPrompt(string reflectionText) =>
        $"""
        На основе reflection сформулируй одну краткосрочную цель на следующий шаг.

        Reflection:
        {reflectionText}

        Выход: одно предложение в повелительной форме.
        """;

    public static string BuildActionPrompt(string reflectionText, string goalText) =>
        $"""
        На основе reflection и goal выбери одно действие и выдай точный текст действия.

        Reflection:
        {reflectionText}

        Goal:
        {goalText}

        Формат ответа:
        - ActionName: <краткая метка действия>
        - ActionText: <что агент говорит или делает сейчас>
        """;

    public static string BuildMemorySummarizationPrompt(string memoryChunkJson) =>
        $"""
        Сожми события памяти в одно компактное эпизодическое воспоминание для долгого хранения.

        Входные воспоминания:
        {memoryChunkJson}

        Требования:
        - Сохрани фактическую хронологию.
        - Сохрани социальные и relational-сигналы.
        - Оставь детали, влияющие на будущие решения.
        - 3-6 предложений.
        """;
}
