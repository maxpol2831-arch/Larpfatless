# LarpFatless

LarpFatless - бесплатное кроссплатформенное приложение для подсчёта калорий по фото еды. Интерфейс русский, дизайн создан с нуля: светлая нейтральная база, зелёный основной акцент `#1E8A63`, отдельные цвета для БЖУ: белки `#2563EB`, жиры `#F59E0B`, углеводы `#7C3AED`.

## Стек

- Mobile: React Native + Expo. Подходит для iOS/Android, камеры, галереи и быстрых OTA-итераций.
- Backend: Node.js + Fastify. Быстрый API-слой для загрузки фото, сжатия, проксирования vision-запросов и защиты API-ключа.
- Database: PostgreSQL + Prisma. Схема уже описывает пользователей, дневник, продукты, вес и AI-кэш.
- AI: OpenAI Responses API с image input и `json_schema` structured output. Модель задаётся через `OPENAI_MODEL`, по умолчанию `gpt-5.5`.

## Структура

```text
LarpFatless/
  apps/
    api/
      prisma/schema.prisma
      src/
        routes/analyzeFood.ts
        lib/visionClient.ts
        lib/image.ts
        prompts/foodVisionPrompt.ts
    mobile/
      App.tsx
      src/
        components/
        screens/
        services/api.ts
        data/mock.ts
  packages/
    shared/
      src/nutrition.js
      src/foodAnalysis.js
      test/nutrition.test.mjs
```

## База данных

Основные таблицы в `apps/api/prisma/schema.prisma`:

- `User`: профиль, цель, активность, дневные нормы калорий и БЖУ.
- `Meal`: запись дневника с типом приёма пищи, временем, фото, калориями и БЖУ.
- `MealItem`: ингредиенты/продукты внутри записи.
- `FoodItem`: база продуктов с питательностью на 100 г.
- `WeightLog`: история веса.
- `FavoriteFood`: избранные блюда для быстрого повторного добавления.
- `AiAnalysis`: кэш результата vision-анализа по SHA-256 хэшу оптимизированного изображения.

## AI endpoint

`POST /v1/food/analyze`

- Принимает `multipart/form-data`, поле `photo`.
- Проверяет MIME-тип и размер.
- Сжимает фото через `sharp` до JPEG 1280px/quality 82.
- Кэширует результат по хэшу изображения.
- Отправляет фото в vision-модель.
- Валидирует JSON-ответ общей схемой `FOOD_ANALYSIS_JSON_SCHEMA`.
- Делает 2 попытки, если модель вернула невалидный JSON или API-запрос сорвался.

Системный промпт лежит в `apps/api/src/prompts/foodVisionPrompt.ts`. Схема ответа:

```json
{
  "dishName": "Омлет с овощами",
  "ingredients": [
    { "name": "яйца", "estimatedGrams": 110, "confidence": 0.86 }
  ],
  "portionGrams": 240,
  "calories": 312,
  "proteinGrams": 22,
  "fatGrams": 21,
  "carbsGrams": 9,
  "confidence": 0.74,
  "notes": "Проверьте количество масла."
}
```

## Локальный запуск

1. Установить зависимости:

```bash
pnpm install
```

2. Создать env для API:

```bash
cp apps/api/.env.example apps/api/.env
```

3. Заполнить `apps/api/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/larpfatless
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.5
```

Для локальной разработки без ключа можно поставить `AI_PROVIDER=mock`; endpoint останется рабочим, но вернёт демонстрационную оценку.

4. Подготовить Prisma:

```bash
pnpm --filter @larpfatless/api prisma:generate
pnpm --filter @larpfatless/api prisma:migrate
```

5. Запустить backend:

```bash
pnpm dev:api
```

6. Запустить мобильное приложение:

```bash
pnpm dev:mobile
```

Если приложение запускается на реальном устройстве, замените `extra.apiBaseUrl` в `apps/mobile/app.json` на LAN-адрес компьютера, например `http://192.168.1.10:4000`.

## Проверки

```bash
pnpm test
pnpm typecheck
```

В этой сборке уже есть unit-тесты для расчёта BMR, дневной нормы, суммирования дневника и пересчёта порции.

## Сборка для iPhone

У iPhone аналог Android `.apk` - это подписанный `.ipa`. Его нельзя просто отправить файлом и установить на любой iPhone: iOS требует подпись Apple и способ распространения.

Подготовленные профили лежат в `apps/mobile/eas.json`:

- `preview` - `.ipa` для установки на зарегистрированные iPhone через internal/ad hoc distribution.
- `production` - сборка для TestFlight/App Store.
- `simulator` - сборка только для iOS Simulator на Mac.

Перед сборкой нужен Expo-аккаунт. Для установки на реальный iPhone через `preview` или TestFlight также нужен Apple Developer Program.

```powershell
cd "C:\Users\maxpo\Documents\Игра\LarpFatless\apps\mobile"
pnpm dlx eas-cli@latest login
pnpm dlx eas-cli@latest build:configure
```

Сборка `.ipa` для своего iPhone:

```powershell
pnpm dlx eas-cli@latest device:create
pnpm dlx eas-cli@latest build --platform ios --profile preview
```

Сборка для TestFlight/App Store:

```powershell
pnpm dlx eas-cli@latest build --platform ios --profile production
pnpm dlx eas-cli@latest submit --platform ios --profile production
```

Если backend не запущен публично в интернете, приложение на телефоне не сможет анализировать фото через `localhost`. Для реальной iPhone-сборки нужно заменить `extra.apiBaseUrl` в `apps/mobile/app.json` на HTTPS-адрес backend-сервера.
