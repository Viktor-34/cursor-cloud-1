# CRM

Рабочее пространство для проектов и задач. Интерфейс на React и Vite, оформление QUIRE, данные рассчитаны на Postgres.

```bash
npm install
npm run dev
```

Приложение открывается на http://localhost:5173. `GET /api/workspace` читает Postgres. Пустая база при первом запросе получает стартовые проекты и задачи. Новая задача создаётся через `POST /api/tasks`, статус меняется через `PATCH /api/tasks/:id`.

Схема лежит в `db/schema.ts`. На Netlify база подключается через Netlify Database. На другом хостинге тот же код читает Postgres по переменной `DATABASE_URL`.
