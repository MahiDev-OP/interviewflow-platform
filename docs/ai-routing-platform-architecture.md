# AI Routing Platform - Technical Architecture

## 1. System Overview
This platform provides a single, unified API for developers to access multiple LLM providers (OpenAI, Anthropic, Google Gemini) through one gateway. It handles authentication, routing, usage tracking, billing, and conversation storage so clients can integrate once and switch providers without changing their own code.

Primary objectives:
- Unified API surface for multiple providers and models
- API key based access control with credit accounting
- Provider routing with policy and fallback logic
- Usage metering and cost tracking
- Persistent conversation history and auditability

## 2. High Level Architecture
Major components:
- Web frontend (Next.js): developer dashboard, usage analytics, key management, billing UI
- API gateway (ElysiaJS on Bun): public entrypoint, auth, rate limiting, routing
- Core backend services: business logic for credits, users, providers, models, conversations
- Router/adapter layer: provider-specific request mapping, retries, streaming support
- PostgreSQL (Prisma ORM): source of truth for users, keys, usage, conversations
- Background workers: billing reconciliation, usage aggregation, alerting

Interactions:
- The frontend calls the API gateway for all operations.
- The gateway validates API keys, enforces quotas, and routes requests to provider adapters.
- Adapter responses stream back to clients and emit usage events to storage and billing.

## 3. Monorepo Structure
TurboRepo organizes the system into clear boundaries:
- `apps/web` (Next.js): dashboard, account management, key/credit management
- `apps/api-gateway` (Bun + ElysiaJS): unified API entrypoint, auth, routing
- `apps/core` (Bun + ElysiaJS): internal service layer for billing, usage, conversations
- `packages/db` (Prisma): schema, migrations, typed client
- `packages/shared`: common DTOs, error types, provider interfaces, auth utils
- `packages/llm-adapters`: provider-specific clients and request mapping

## 4. Request Flow
Typical inference request flow:
1. User sends request to the public API gateway with an API key.
2. Gateway validates the key and checks credit balance / rate limits.
3. Gateway forwards request to router with desired model or routing policy.
4. Router selects target provider + model and calls adapter.
5. Adapter transforms request to provider-specific format and sends it.
6. Provider returns response (streaming or non-streaming).
7. Gateway streams response to client.
8. Usage is recorded and credits are deducted.

## 5. Authentication Flow
- Users create API keys in the dashboard.
- Each key has a secure hash stored in the database.
- Requests include `Authorization: Bearer <api-key>`.
- Gateway hashes the key and looks up the active record.
- Gateway verifies user status, key status, and credit balance.
- Rate limits and per-key policies are enforced before routing.

## 6. API Routing Logic
Routing decisions are based on:
- Requested model (explicit mapping to provider)
- Policy rules (cost, latency, reliability)
- Provider health and rate limits
- Fallback logic (retry or secondary provider)

The router uses a unified interface, then maps requests to provider-specific parameters, handling streaming vs non-streaming, tool use, and response normalization.

## 7. Data Model Overview
Core entities:
- `User`: account profile, billing plan, status
- `ApiKey`: hashed key, status, quotas, scopes
- `Provider`: provider metadata, API status, quotas
- `Model`: provider model catalog and pricing
- `Conversation`: messages, metadata, owner, timestamps
- `Usage`: request metrics, tokens, cost, provider/model info
- `BillingLedger`: credit debits, top-ups, invoices

## 8. External Dependencies
- LLM APIs: OpenAI, Anthropic, Google Gemini
- Database: PostgreSQL
- Email/notifications (optional): provider for alerts and receipts
- Payment processor (optional): Stripe or equivalent
- Observability: logs, metrics, traces

## 9. Infrastructure Requirements
- API Gateway: stateless, long-running, needs HTTP + streaming support
- Core Backend: stateless, long-running, internal API
- Router/Adapters: stateless, streaming-capable, external egress
- PostgreSQL: persistent storage, backups, migrations
- Background Workers: scheduled jobs for usage aggregation and billing
- Cache (optional): in-memory cache for keys and routing metadata

## 10. Scalability Considerations
Components that scale independently:
- API gateway: scale by request volume and streaming load
- Router/adapters: scale by provider throughput
- Background workers: scale by usage aggregation and billing load
- Database: scale by read/write volume and reporting queries

Rate limiting, batching, and async write patterns reduce pressure on the DB.

## 11. Security Considerations
- API keys stored as hashes only
- Per-key rate limits and quotas
- Abuse detection for abnormal usage
- Billing protection: atomic credit checks and usage writes
- Provider secrets stored in vault or managed secrets
- TLS everywhere, strict CORS, audit logging

## 12. Deployment Components List
- Frontend (Next.js)
- API Gateway (public)
- Core Backend (internal)
- Router/Adapter layer
- PostgreSQL database
- Background/worker services
- Optional cache (Redis)

## 13. Diagram Suggestions
Recommended diagrams:
- High-level system context diagram
- Request flow diagram showing gateway → router → provider
- Data model ER diagram for usage and billing
- Deployment topology diagram (public vs private services)
