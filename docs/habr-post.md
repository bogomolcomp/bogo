# Express API за 10 секунд: CLI bogo

**Теги:** nodejs, typescript, express, cli, open source

---

Каждый раз, когда я начинаю новый Express-проект, повторяется одно и то же: `index.ts`, body-parser, logger, middleware для `res.success` / `res.error`, validate на Zod, структура `controller → service → dto → routes → validator`. На модуль уходит 15–20 минут копипасты, и каждый раз что-то забываешь.

NestJS решает это из коробки, но тащит за собой весь фреймворк. `express-generator` устарел и TypeScript там — послеthought. Я хотел минимальный Express + TS без лишнего.

## Что делает bogo

Две команды покрывают 90% старта:

```bash
npx @bogomolcompany/bogo create app
npx bogo g users -m getList -m createUser
```

**`create app`** — готовый Express + TypeScript проект:

- сервер с dotenv и body-parser
- logger, formatResponse, validate (Zod)
- IP whitelist через `ALLOWED_IPS`
- `/health` и глобальный error handler
- `.bogorc.json` для настройки путей

**`g`** — генерирует 5 файлов модуля и дописывает роут в `index.ts`:

```
src/api/users/
  users.controller.ts
  users.service.ts
  users.dto.ts
  users.validator.ts
  users.routes.ts
```

## До и после

**Без bogo:** вручную создать 5+ файлов, прописать import, `app.use`, DTO, Zod-схему, заглушки в service.

**С bogo:** одна команда, структура единообразная во всех проектах.

## Кому подойдёт

- Пишете на чистом Express + TypeScript
- Нужна модульная структура без NestJS
- Часто стартуете новые API-сервисы
- Хотите единый стиль controller/service/dto во всех проектах

## Кому не подойдёт

- Уже на NestJS / Fastify с другой архитектурой
- Нужен ORM, auth, DI из коробки
- Нужен GUI или интерактивный wizard

## Сравнение

| | NestJS CLI | express-generator | bogo |
|---|:---:|:---:|:---:|
| Express без фреймворка | — | ✓ | ✓ |
| TypeScript | ✓ | — | ✓ |
| DTO + Zod | ✓ | — | ✓ |
| Стартовый проект | частично | — | ✓ |
| Генерация в существующий проект | ✓ | — | ✓ |

## Установка

```bash
npm install -g @bogomolcompany/bogo
```

Или без установки:

```bash
npx @bogomolcompany/bogo create app
```

## Пример сессии

```bash
mkdir my-api && cd my-api
bogo create app
copy .env.example .env
npm install
npm run dev

bogo g orders -m createOrder:/create -m getOrder:/:id
```

Сервер поднимается на `PORT` из `.env`. Модуль `orders` сразу подключён к `/api/orders`.

## Кастомизация

`.bogorc.json` в корне проекта:

```json
{
  "apiDir": "src/api",
  "indexFile": "src/index.ts",
  "routePrefix": "/api"
}
```

Кастомные пути для методов:

```bash
bogo g posts -m getList -m getById:/:id
```

## Статус и планы

Сейчас: v0.1.x, open source, MIT.

Буду рад feedback и issue на GitHub — особенно по шаблонам middleware и формату ответов.

## Ссылки

- npm: https://www.npmjs.com/package/@bogomolcompany/bogo
- GitHub: https://github.com/bogomolcomp/bogo
- Issues: https://github.com/bogomolcomp/bogo/issues

---

*Пакет опубликован организацией [bogomolcompany](https://www.npmjs.com/org/bogomolcompany).*
