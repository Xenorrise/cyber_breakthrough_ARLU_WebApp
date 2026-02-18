# Инфраструктура LLM (.NET 8) 

## Компоненты
- `ILLMService` -> генерация текста через OpenAI `/v1/chat/completions`.
- `IEmbeddingService` -> генерация векторов через OpenAI `/v1/embeddings`.
- `IVectorStore` -> абстракция для операций с векторной базой данных.
- `QdrantVectorStore` -> реализация `IVectorStore` для Qdrant.
- `MemoryService` -> хранилище эпизодической памяти + семантическое извлечение.
- `MemoryCompressor` -> суммаризация и сжатие памяти на основе LLM.
- `AgentBrain` -> когнитивный цикл через LLM: Рефлексия -> Цель -> Действие.

## Поток выполнения
1. `MemoryService.StoreMemoryAsync` сохраняет `MemoryLog` в EF и отправляет эмбеддинг в Qdrant.
2. `MemoryService.RecallAsync` строит эмбеддинг для запроса, выполняет семантический поиск в Qdrant и возвращает подходящие записи `MemoryLog`.
3. `AgentBrain.ThinkAsync` загружает контекст агента, извлекает память, при необходимости сжимает её, затем выполняет 3 вызова промптов.
4. `MemoryCompressor.CompressIfNeededAsync` суммирует старые или низкоприоритетные логи в одну компактную запись памяти и удаляет исходные.

## Конфигурация
Не храните ключи в `appsettings.json` и не коммитьте их в git.

Для локальной сборки/запуска используйте файл `./.env.local` в корне проекта (файл игнорируется git):

```env
OPENAI_API_KEY=your_openai_key
OPENAI_BASE_URL=https://api.openai.com
OPENAI_CHAT_BASE_URL=http://192.168.77.11:1234
OPENAI_CHAT_MODEL=openai/gpt-oss-20b
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
QDRANT_BASE_URL=http://host.docker.internal:6333
QDRANT_API_KEY=your_qdrant_key
QDRANT_COLLECTION_NAME=memory_logs
```

`build_and_run.bat` автоматически подхватывает эти значения и передаёт их в backend при запуске контейнера.

Остальные настройки:
- `Qdrant.BaseUrl` (например `http://localhost:6333`)

## Пример API
- `POST /api/agents/{agentId}/memory` - сохранить память.
- `GET /api/agents/{agentId}/memory/recall?query=...&topK=5` - семантическое извлечение памяти.
- `POST /api/agents/{agentId}/brain/step` - выполнить один шаг когнитивного цикла агента.
