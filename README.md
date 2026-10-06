# CRM

Рабочее пространство для проектов и задач. Интерфейс на React и Vite, оформление QUIRE, данные рассчитаны на Postgres.

```bash
npm install
npm run dev
```

Приложение открывается на http://localhost:5173. `GET /api/health` проверяет, настроена ли база. Экран пока читает демо-снимок `GET /api/workspace`.

Схема лежит в `db/schema.ts`. На Netlify база подключается через Netlify Database. На другом хостинге тот же код читает Postgres по переменной `DATABASE_URL`.
