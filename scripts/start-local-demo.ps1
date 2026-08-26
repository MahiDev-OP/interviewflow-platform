# Starts InterviewFlow locally for a fast interview demonstration.
# Prerequisites: Docker Desktop running, Java 21 recommended, Node.js/npm installed.
# Run from the repository root:
#   .\scripts\start-local-demo.ps1

[CmdletBinding()]
param(
    [switch]$SkipInfrastructure
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

# Local Postgres supplied by docker-compose.yml.
$env:AUTH_DB_URL = "jdbc:postgresql://localhost:5433/interviewflow_auth"
$env:AUTH_DB_USERNAME = "postgres"
$env:AUTH_DB_PASSWORD = "postgres"
$env:APPLICATION_DB_URL = "jdbc:postgresql://localhost:5433/interviewflow_application"
$env:APPLICATION_DB_USERNAME = "postgres"
$env:APPLICATION_DB_PASSWORD = "postgres"
$env:NOTIFICATION_DB_URL = "jdbc:postgresql://localhost:5433/interviewflow_notification"
$env:NOTIFICATION_DB_USERNAME = "postgres"
$env:NOTIFICATION_DB_PASSWORD = "postgres"

# Local Redpanda is exposed by docker-compose.yml on localhost:9092.
$env:KAFKA_HOST = "localhost"
$env:KAFKA_PORT = "9092"
$env:APPLICATION_EVENTS_TOPIC = "application-events"
$env:REMINDER_EVENTS_TOPIC = "reminder-events"
$env:NOTIFICATION_CONSUMER_GROUP = "notification-service"

# One shared secret is required because services must create and validate the same JWTs.
# This is intentionally a local-only development secret. Do not use it in production.
$env:APP_JWT_SECRET = "bG9jYWwtaW50ZXJ2aWV3Zmxvdy1kZXYtc2VjcmV0LWNoYW5nZS1pbi1wcm9kdWN0aW9uLTIwMjY="
$env:APP_JWT_EXPIRATION_MILLIS = "86400000"
$env:APP_CORS_ALLOWED_ORIGIN_PATTERNS = "http://localhost:3000"

# Gateway-to-service routing for local development.
$env:AUTH_SERVICE_SCHEME = "http"
$env:AUTH_SERVICE_HOST = "localhost"
$env:AUTH_SERVICE_PORT = "8081"
$env:APPLICATION_SERVICE_SCHEME = "http"
$env:APPLICATION_SERVICE_HOST = "localhost"
$env:APPLICATION_SERVICE_PORT = "8082"
$env:NOTIFICATION_SERVICE_SCHEME = "http"
$env:NOTIFICATION_SERVICE_HOST = "localhost"
$env:NOTIFICATION_SERVICE_PORT = "8083"
$env:NEXT_PUBLIC_API_URL = "http://localhost:8090"

if (-not $SkipInfrastructure) {
    Write-Host "Starting PostgreSQL and Redpanda..." -ForegroundColor Cyan
    Push-Location $projectRoot
    try {
        docker compose up -d
        docker compose ps
    }
    finally {
        Pop-Location
    }
    Write-Host "Waiting briefly for local infrastructure..." -ForegroundColor Cyan
    Start-Sleep -Seconds 8
}

$services = @(
    @{ Name = "Auth service"; Path = (Join-Path $projectRoot "backend\auth-service"); Command = ".\mvnw.cmd spring-boot:run" },
    @{ Name = "Application service"; Path = (Join-Path $projectRoot "backend\application-service"); Command = ".\mvnw.cmd spring-boot:run" },
    @{ Name = "Notification service"; Path = (Join-Path $projectRoot "backend\notification-service"); Command = ".\mvnw.cmd spring-boot:run" },
    @{ Name = "API Gateway"; Path = (Join-Path $projectRoot "backend\api-gateway"); Command = ".\mvnw.cmd spring-boot:run" },
    @{ Name = "Next.js frontend"; Path = (Join-Path $projectRoot "frontend"); Command = "npm run dev" }
)

foreach ($service in $services) {
    Write-Host "Launching $($service.Name)..." -ForegroundColor Green
    Start-Process -FilePath "powershell.exe" `
        -WorkingDirectory $service.Path `
        -ArgumentList @("-NoExit", "-Command", $service.Command)
}

Write-Host ""
Write-Host "Started separate terminals for all services." -ForegroundColor Green
Write-Host "Frontend:  http://localhost:3000"
Write-Host "Gateway:   http://localhost:8090/actuator/health"
Write-Host "Auth:      http://localhost:8081/actuator/health"
Write-Host "App:       http://localhost:8082/actuator/health"
Write-Host "Notify:    http://localhost:8083/actuator/health"
