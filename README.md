# CashIn Tap

A full-stack fintech platform built with Next.js, PostgreSQL, Redis, and BullMQ.

## Features

- **Wallet System** — Ledger-based accounting with immutable entries
- **E-Load** — Buy mobile load via GbitsAPI (Globe, Smart, DITO, TM, TNT, Sun)
- **Cash Out** — Disbursements via Xendit with webhook-based finalization
- **Wallet Funding** — Xendit-hosted checkout with webhook verification
- **Fee Engine** — Configurable fee rules (fixed/percentage) per service
- **Admin Panel** — Full user, wallet, transaction, fee, and report management
- **Queue Workers** — BullMQ-based async processing for e-load and cashout
- **Idempotency** — Duplicate webhook protection on all provider events
- **Audit Trail** — Immutable ledger entries for every balance change

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma 7
- **Queue**: BullMQ + Redis
- **Payments**: Xendit (funding + disbursement)
- **E-Load**: GbitsAPI

## Setup

### 1. Prerequisites

- Node.js 20+
- PostgreSQL
- Redis

### 2. Environment Variables

Copy `.env` and fill in your values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cashintap"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
XENDIT_SECRET_KEY="xnd_development_..."
XENDIT_WEBHOOK_TOKEN="your-webhook-token"
GBITS_API_URL="https://api.gbits.com"
GBITS_API_KEY="your-gbits-key"
APP_URL="http://localhost:3000"
```

### 3. Database

```bash
# Push schema to database
npm run db:push

# Seed initial data (fee rules, e-load products, admin user)
npm run db:seed
```

Default admin credentials:
- Mobile: `09000000000`
- Password: `Admin@1234`

### 4. Run

```bash
# Development
npm run dev

# Run queue workers (separate terminal)
npm run worker
```

## Architecture

```
Users → Next.js UI
           ↓
      API Routes
           ↓
    ┌──────┼──────┐
    ↓      ↓      ↓
 Wallet  E-Load  Cashout
Service Service  Service
    ↓      ↓      ↓
 Ledger  Gbits  Xendit
           ↓      ↓
        BullMQ Queues
           ↓
        Workers
           ↓
       PostgreSQL
           ↓
         Redis
```

## Key Design Principles

1. **Ledger-first** — Balances are derived from immutable `wallet_ledger` entries
2. **Reserve before debit** — Funds are held via `wallet_holds` before provider calls
3. **Webhook-only credits** — Wallets are only credited after verified provider webhooks
4. **Idempotency** — Every provider transaction has a unique `idempotency_key`
5. **Provider adapters** — Xendit and GbitsAPI are isolated behind service layers

## API Routes

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/verify-otp`

### Wallet
- `GET /api/wallet`
- `POST /api/wallet/fund`
- `GET /api/wallet/transactions`

### E-Load
- `GET /api/eload/products`
- `POST /api/eload/purchase`

### Cash Out
- `POST /api/cashout/request`

### Webhooks
- `POST /api/webhooks/xendit/payment`
- `POST /api/webhooks/xendit/payout`

### Admin
- `GET /api/admin/users`
- `GET /api/admin/transactions`
- `GET /api/admin/fees` / `POST /api/admin/fees`
- `GET /api/admin/reports`
- `POST /api/admin/wallets/[id]/adjust`
