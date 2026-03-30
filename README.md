# InterviewFlow

InterviewFlow is a job application tracker for the messy part of the job search: referrals, recruiter calls, stage changes, and follow-ups that are easy to lose in chats, spreadsheets, and memory.

The app has a Next.js frontend, four Spring Boot services, PostgreSQL for storage, and Redpanda as the Kafka-compatible event broker for reminder and activity flow.

## Project layout

- `frontend` - Next.js app on `3000`
- `backend/api-gateway` - gateway on `8090`
- `backend/auth-service` - login and signup on `8081`
- `backend/application-service` - applications, notes, and status changes on `8082`
- `backend/notification-service` - activity feed and reminder handling on `8083`
- `infra/postgres/init` - database bootstrap SQL
- `docker-compose.yml` - local Postgres and Redpanda setup

## How the app works

1. The frontend sends every API request to the gateway.
2. The auth service handles signup and login, then returns a JWT.
3. The frontend stores that token and sends it with later requests.
4. The application service saves job applications, notes, and reminder times.
5. When something important happens, the application service publishes an event.
6. The notification service listens for those events and turns them into dashboard notifications.
7. Reminder schedules are checked on a timer, and due reminders are added to the feed.

## Production deployment

The production shape for this repo is:

- Vercel hosts the Next.js frontend.
- Render hosts the Spring Boot gateway as the only public backend URL.
- Render hosts auth, application, notification, and Redpanda as private services.
- Render Postgres is shared by the backend services.

Files added for that setup:

- `render.yaml`
- `backend/*/Dockerfile`
- `infra/redpanda/Dockerfile`

Important configuration rules:

- The frontend must use `NEXT_PUBLIC_API_URL` and point to the public gateway URL.
- The backend services must receive their database, Kafka, JWT, and internal service settings from environment variables.
- `.env.example` is only a template of variable names and placeholder values. It must never contain real passwords, real API keys, or production secrets.

After Render gives you the gateway URL, set this in Vercel:

```text
NEXT_PUBLIC_API_URL=https://your-gateway.onrender.com
```

Then redeploy the frontend so every request goes straight to the backend gateway over HTTPS.

## Local development

Local development is optional and should use a private `.env` file that is never committed.

- `docker-compose.yml` is kept in the repo only for local infrastructure.
- `.env.example` is intentionally safe for GitHub and should be copied into a private env file with real values on your machine or hosting platform.

## A couple of practical notes

- The gateway uses `8090` in this project, not `8080`.
- `docker-compose.yml` belongs in the repo because it is part of the local development setup for Postgres and Redpanda.
- The databases are created automatically by `infra/postgres/init/01-create-databases.sql` when Postgres starts for the first time.
- The frontend API helper strips BOM characters, trims whitespace, normalizes missing protocols, and avoids malformed URLs in production.
- Reminder notifications appear after the reminder time has passed and the notification service scheduler picks them up.
- The long-form study notes for this project are intentionally kept outside this repo.
