# @bogomolcompany/bogo

[![npm version](https://img.shields.io/npm/v/@bogomolcompany/bogo.svg)](https://www.npmjs.com/package/@bogomolcompany/bogo)
[![npm downloads](https://img.shields.io/npm/dm/@bogomolcompany/bogo.svg)](https://www.npmjs.com/package/@bogomolcompany/bogo)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/bogomolcomp/bogo/blob/main/LICENSE)

[English version](README.md)

**`bogo create app`** — Express + TypeScript проект за 10 секунд.
**`bogo g users`** — controller, service, dto, routes, validator одной командой.
**`bogo r users`** — удаляет модуль и убирает роут из index.

CLI-генератор для Express API. Не привязан к конкретному репозиторию — настраивается через `.bogorc.json`.

![bogo demo](docs/demo/bogo-demo.gif)

## Быстрый старт

```bash
npx @bogomolcompany/bogo create app
copy .env.example .env
npm install
npm run dev

npx bogo g users -m getList -m createUser
```

## Почему bogo

| | NestJS CLI | express-generator | **bogo** |
|---|:---:|:---:|:---:|
| Express без своего фреймворка | — | ✓ | ✓ |
| TypeScript из коробки | ✓ | — | ✓ |
| DTO + Zod validator | ✓ | — | ✓ |
| Стартовый проект (server, logger, middleware) | частично | — | ✓ |
| Минимальные зависимости | — | ✓ | ✓ |
| Генерация модулей в существующий проект | ✓ | — | ✓ |

bogo — для тех, кто пишет на чистом Express + TS и устал каждый раз копировать одну и ту же структуру файлов.

## Установка

```bash
npm install -g @bogomolcompany/bogo
# или локально
npm install --save-dev @bogomolcompany/bogo
npx bogo --help
```

Из исходников:

```bash
git clone https://github.com/bogomolcomp/bogo.git
cd bogo
npm install
npm run build
npm link
```

## Создание нового проекта

```bash
bogo create app my-api --with-docker --with-eslint
```

Создаёт:

```
package.json
tsconfig.json
.env.example
.bogorc.json
src/
  index.ts
  types/express.d.ts
  middlewares/
    logger.ts
    formatResponse.ts
    validate.ts
  utils/
    getAllowedIps.ts
  api/
```

Включено: dotenv, body-parser, logger, formatResponse, IP whitelist (`ALLOWED_IPS`), `/health`, глобальный error handler.

```bash
copy .env.example .env
npm install
npm run dev
```

## Инициализация в существующем проекте

```bash
cd /path/to/your-express-app
bogo init
```

Создаёт `.bogorc.json`:

```json
{
  "apiDir": "src/api",
  "indexFile": "src/index.ts",
  "routePrefix": "/api",
  "templatesDir": "./bogo-templates"
}
```

`templatesDir` — опционально. Файлы `controller.template`, `service.template` и т.д. переопределяют встроенные шаблоны.

## Генерация модуля

```bash
bogo g analytics -m getStats -m getReport
bogo g orders -m createOrder:POST:/create -m getOrder:GET:/:id
bogo g posts -m getList:GET:/list -w auth
```

Создаёт:

```
src/api/analytics/
  analytics.controller.ts
  analytics.service.ts
  analytics.dto.ts
  analytics.validator.ts
  analytics.routes.ts
```

Автоматически дописывает import и `app.use` в `src/index.ts`, если файл найден.

## Генерация отдельного файла

```bash
bogo g controller users -m getList
bogo g service users -m getList
bogo g dto users -m getList -m createUser
bogo g validator users -m getList
bogo g routes users -m getList:/list
```

Части: `controller`, `service`, `dto`, `validator`, `routes`.

Папка модуля создаётся автоматически, если её ещё нет. При генерации `routes` index обновляется так же, как при полном модуле.

```bash
bogo r controller users
bogo r routes users
```

## Добавление метода в существующий модуль

```bash
bogo g method users -m getList
bogo g method users -m createUser -m updateUser:/:id
```

Добавляет метод во все существующие файлы модуля: controller, service, dto, validator, routes.

Только в конкретные части:

```bash
bogo g method users -m getList -p controller
bogo g method users -m getList -p controller -p service -p dto
```

`-m` обязателен. `-p` — опционально, без него обновляются все найденные файлы.

## Удаление метода

```bash
bogo r method users -m getList
bogo r method users -m createUser -p controller -p service
```

## Список модулей

```bash
bogo list
```

## Doctor

```bash
bogo doctor
```

Проверяет `.bogorc.json`, index, api-папку и middleware.

## Интерактивный режим

```bash
bogo g --interactive
```

## Удаление модуля

```bash
bogo r analytics
bogo r orders --skip-index
```

Удаляет папку модуля и убирает import + `app.use` из index.

## Формат `-m`

| Пример | Результат |
|--------|-----------|
| `getList` | POST `/get-list` |
| `getList:GET` | GET `/get-list` |
| `getOrder:GET:/:id` | GET `/:id` |
| `createOrder:POST:/create` | POST `/create` |

## Опции

| Флаг | Описание |
|------|----------|
| `-m, --method` | Спецификация метода (повторяемый) |
| `-p, --part` | Только указанная часть |
| `-w, --middleware` | Middleware для роута (повторяемый) |
| `-i, --interactive` | Интерактивная генерация |
| `--dry-run` | Показать изменения без записи |
| `--force` | Перезаписать существующие файлы |
| `--skip-index` | Не править index-файл |
| `--with-docker` | Docker-файлы в `create app` |
| `--with-eslint` | ESLint в `create app` |

## Требования к целевому проекту

- Express + TypeScript
- Zod для валидации
- Middleware `validate` по пути `src/middlewares/validate`
- `res.success` / `res.error` через middleware ответа

`bogo create app` создаёт всё это автоматически.

## Разработка

```bash
npm run build
npm test
npm run dev -- create app ./tmp-app --with-eslint
npm run dev -- g test -m getList:GET
npm run dev -- g method test -m createUser
npm run dev -- r method test -m createUser
npm run dev -- list
npm run dev -- doctor
```

## Ссылки

- npm: https://www.npmjs.com/package/@bogomolcompany/bogo
- GitHub: https://github.com/bogomolcomp/bogo
- Issues / feedback: https://github.com/bogomolcomp/bogo/issues

## Публикация

```bash
npm publish --otp=YOUR_CODE
```

## Лицензия

MIT
