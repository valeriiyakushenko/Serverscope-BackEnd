# Serverscope-BackEnd — контекст репозитория

> Общая картина проекта — в `../PROJECT.md` (корневая папка `Serverscope/`, она не git-репозиторий). Здесь только Backend.
> Что нужно исправить — в `TODO.md` рядом с этим файлом; порядок работ между репозиториями — в `../TODO.md`.
> Пути указаны относительно `Serverscope-BackEnd/`. Номера строк — на состояние `main` от 2026-05-28 (3 коммита).

## Назначение

REST API только для чтения поверх PostgreSQL, которую наполняет Worker. Сам в Steam не ходит и в БД ничего не пишет. Единственный потребитель сейчас — Frontend.

## Стек и запуск

- NestJS 11 (platform-express), `@nestjs/typeorm` + TypeORM (`^1.0.0` в `package.json`; в Worker — `^0.3.20`), pg, `class-validator` / `class-transformer`, `@nestjs/swagger`, `@nestjs/config`.
- `npm run start:dev` (watch), `npm run build` + `npm run start:prod`.
- Переменные окружения (`.env.example`): `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `PORT` (по умолчанию 3000).
- Swagger UI: `/api/docs`. Глобального префикса и версионирования нет: маршруты начинаются сразу с `/games`, `/servers`.
- Jest, ESLint и Prettier настроены, но **ни одного теста нет** (нет `*.spec.ts`, нет папки `test/`, на которую ссылается `test:e2e`).
- `README.md` — нетронутый шаблон NestJS. Dockerfile нет.

## Структура

```
src/
  main.ts                    bootstrap: ValidationPipe (transform, whitelist), Swagger, listen
  app.module.ts              ConfigModule (global), TypeORM (synchronize: false), GamesModule, ServersModule
  games/
    games.controller.ts      GET /games, GET /games/:appid
    games.service.ts
    games.entity.ts          свойства в snake_case
    dto/                     QueryGamesDto, GameDto, GamesListResponseDto
  servers/
    servers.controller.ts    6 маршрутов
    servers.service.ts       вся логика и SQL (387 строк)
    servers.entity.ts        свойства в camelCase
    online-record.entity.ts
    server-ranking.entity.ts
    dto/                     query-servers.dto.ts, server-response.dto.ts
```

Слои: контроллер (маршрут, Swagger-декораторы) → сервис (QueryBuilder или сырой SQL) → TypeORM-репозиторий. Guard'ов, interceptor'ов, фильтров исключений, middleware нет.

## API

| Метод и путь | Параметры | Ответ |
|---|---|---|
| `GET /games` | `page`=1, `limit`=20 (≤100), `sortBy` = `players`\|`servers`\|`name`, `order` = `asc`\|`desc` (по умолчанию `desc`), `search` | `{ data: Game[], total, page, limit }` |
| `GET /games/:appid` | — | `Game` или 404 |
| `GET /servers` | `appid` (обязателен), `page`=1, `limit`=25 (≤100), `search`, `ip`, `map`, `isSecure`, `isOnline`, `sortBy` = `rank`\|`players`\|`name`, `sortOrder` = `asc`\|`desc` | `{ data: ServerItem[], total, page, limit, totalPages }` |
| `GET /servers/maps` | `appid`, `minServers`=100 | `[{ map, serverCount }]` |
| `GET /servers/:id` | — | `ServerItem` + `createdAt`, или 404 |
| `GET /servers/:id/chart` | `period` = `24h`\|`3d`\|`7d`\|`30d` | `{ points: [{ time, players }] }` |
| `GET /servers/:id/rank-chart` | `period` = `3d`\|`7d`\|`30d` | `{ points: [{ time, rank, score, uptimeRatio }] }` |
| `GET /servers/:id/uptime-chart` | `period` = `24h`\|`3d`\|`7d`\|`30d` | `{ points: [{ time, uptimeRatio, downtimeRatio }] }` |

Формы объектов:
- `Game`: `id, appid, name, image_link, players, servers, hourly_online[24], updated_at` — **snake_case**.
- `ServerItem`: `id, ip, queryPort, gamePort, name, appid, map, isSecure, isDedicated, os, region, maxPlayers, players, rank, hourlyOnline[24], isOnline, version, lastSeenAt, updatedAt, popularity, stability` — **camelCase**.
- Не отдаются наружу, хотя есть в БД: `steamid`, `gametypeRaw`, `gametypeTags`.

Непринятые параметры молча отбрасываются (`whitelist: true`, `forbidNonWhitelisted: false`). Так теряется параметр `location`, который шлёт Frontend.

## Как устроены запросы (`servers/servers.service.ts`)

**`findAll` (`:40-106`)** — список серверов
- QueryBuilder: `WHERE appid = :appid` плюс необязательные `name ILIKE '%…%'`, `ip =`, `map =`, `is_secure =`, `is_online =`.
- Сортировка по рангу: сначала `CASE WHEN rank = 0 THEN 1 ELSE 0 END`, затем `rank` — неранжированные всегда в конце. Из-за выражения в `ORDER BY` индекс `(appid, rank)` не даёт готового порядка.
- `skip/take` + `getManyAndCount()` — два запроса: страница и `COUNT(*)` по всему отфильтрованному набору.
- Затем отдельный запрос `getLatestRankingStats` (`:108-127`): `SELECT DISTINCT ON (server_id) … FROM server_rankings WHERE server_id = ANY($1) ORDER BY server_id, calculated_at DESC` — подмешивает `popularity` и `stability`.

**`findMaps` (`:129-140`)** — `GROUP BY map HAVING COUNT(*) >= minServers` по всем серверам игры при каждом вызове.

**`findChart` (`:184-243`)**
- `24h`: `generate_series` с шагом 15 минут от округлённого `now − 24h` до округлённого `now` включительно (97 точек); `LEFT JOIN online_records` по выражению округления `recorded_at` до 15 минут.
- `3d`/`7d`/`30d`: шаг час, границы включены (`N·24 + 1` точек), соединение по `date_trunc('hour', recorded_at)`.
- В условии соединения нет ограничения по времени — читается вся история сервера по индексу `(server_id, …)` (до ~800 строк, приемлемо). `AVG(players)::int`, пропуски → 0.

**`findRankChart` (`:245-299`)** — по дням из `server_rankings` (`DISTINCT ON (day)`, последний расчёт за день); дни без данных получают `rank = 0`, `score = 0`.

**`findUptimeChart` (`:301-386`)** — `24h`: по часам, `LEAST(COUNT(*) / 4.0, 1.0)` из `online_records`; иначе по дням `uptime_ratio` из `server_rankings`.

Перед каждым графиком — отдельный `existsBy({ id })` для 404.

Интервалы подставляются в SQL строкой, но только из белого списка, проверенного `@IsIn` — инъекции нет.

## Сущности и схема

Сущности — копия сущностей Worker; схему Backend не создаёт (`synchronize: false`). Расхождения с Worker:
- `online-record.entity.ts:12` объявляет индекс `(server_id, recorded_at)` уникальным, в Worker он неуникальный. В реальной БД действует вариант Worker.
- `games.entity.ts:32`: `updated_at` — `timestamp`, в Worker — `timestamptz`.
- Нет индекса `idx_online_records_recorded_at`, который есть в Worker (на работу не влияет).
- Именование свойств: `Game` — snake_case, остальные — camelCase.

## Чего нет

| Тема | Состояние |
|---|---|
| Кеширование | нет; каждый запрос идёт в БД |
| Ограничение частоты | нет |
| Авторизация, API-ключи, пользователи | нет |
| Вебхуки, события | нет |
| CORS | не включён (`main.ts`); Frontend работает через прокси Vite |
| Заголовки безопасности (helmet), сжатие | нет |
| Версионирование (`/v1`) | нет |
| Health-check, метрики | нет |
| Единый формат ошибок | стандартный NestJS |
| Тесты, Docker, CI | нет |
| Аналитика по регионам и картам | только `GET /servers/maps` |
| История онлайна игры | только `hourly_online` за 24 ч |
| Прогноз, аномалии | нет |

## Известные проблемы (сводка)

Замечания аудита от 2026-11-10 (идентификаторы `A…`) с готовыми шагами исправления лежат в `TODO.md`. Таблица ниже — исходный список.

| № | Проблема | Где |
|---|---|---|
| B1 | `COUNT(*)` на каждый запрос списка; для игр с десятками тысяч серверов это основная стоимость | `servers.service.ts:88` |
| B2 | `ILIKE '%…%'` без триграммного индекса — последовательный просмотр серверов игры | `servers.service.ts:60` |
| B3 | `OFFSET`-пагинация: дальние страницы дорожают линейно | `servers.service.ts:86` |
| B4 | Выражение `CASE` в сортировке по рангу мешает использовать индекс `(appid, rank)` | `servers.service.ts:80-81` |
| B5 | `isOnline` фильтрует по полю, которое Worker никогда не сбрасывает | `servers.service.ts:75-77` |
| B6 | Сортировка по `players` использует устаревшие значения у опустевших серверов (см. W3 в `../Serverscope-Worker/CONTEXT.md`) | — |
| B7 | Нет фильтра по `region`, хотя поле в БД есть, а Frontend его отправляет | `dto/query-servers.dto.ts` |
| B8 | `findMaps` агрегирует всю игру без кеша | `servers.service.ts:129-140` |
| B9 | Точек на графиках на одну больше, чем заявлено в отчёте (97 и 169) | `servers.service.ts:196-201, 222-226` |
| B10 | График ранга отдаёт `0` за дни без расчёта — на фронте это выглядит как провал | `servers.service.ts:276` |
| B11 | Два стиля именования в ответах API | `games.entity.ts` против `servers.entity.ts` |
| B12 | Дублирование сущностей с Worker и расхождение версий TypeORM | `package.json`, `src/**/**.entity.ts` |
