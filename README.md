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

## Local URLs

- Frontend: [http://localhost:3000](http://localhost:3000)
- Gateway: [http://localhost:8090](http://localhost:8090)
- Auth health: [http://localhost:8081/actuator/health](http://localhost:8081/actuator/health)
- Application health: [http://localhost:8082/actuator/health](http://localhost:8082/actuator/health)
- Notification health: [http://localhost:8083/actuator/health](http://localhost:8083/actuator/health)

## Run it locally

Start infrastructure first:

```powershell
docker compose up -d
```

Then start the backend services in separate terminals:

```powershell
cd backend/auth-service
.\mvnw.cmd spring-boot:run
```

```powershell
cd backend/application-service
.\mvnw.cmd spring-boot:run
```

```powershell
cd backend/notification-service
.\mvnw.cmd spring-boot:run
```

```powershell
cd backend/api-gateway
.\mvnw.cmd spring-boot:run
```

Start the frontend last:

```powershell
cd frontend
npm install
npm run dev
```

## Local defaults

- The frontend talks to `http://localhost:8090`.
- PostgreSQL runs on `localhost:5433` with `postgres/postgres`.
- Redpanda exposes Kafka on `localhost:9092`.
- All Spring services use the same JWT secret through `APP_JWT_SECRET`.

## A couple of practical notes

- The gateway uses `8090` in this project, not `8080`.
- Reminder notifications appear after the reminder time has passed and the notification service scheduler picks them up.
- The long-form study notes for this project are intentionally kept outside this repo.
