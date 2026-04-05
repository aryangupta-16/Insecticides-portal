# Insecticides Portal

Production-grade admin dashboard with separate `frontend` and `backend` services for receivables aging management, asynchronous Excel processing, and real-time progress tracking.

## Architecture

- `frontend`: Next.js 15 App Router UI with Tailwind, shadcn-style components, Lucide, TanStack Table, Socket.io client
- `backend`: Express API, BullMQ worker integration, Socket.io server, Prisma ORM, ExcelJS, PostgreSQL, Redis
- `worker`: separate BullMQ processor container using the same backend image
- `docker-compose.yml`: local production-style stack for frontend, backend, worker, PostgreSQL, and Redis

## Prisma ORM note

This project follows the current Prisma ORM configuration flow:

- `backend/prisma.config.ts` defines the schema path, migration path, and `DATABASE_URL`
- `backend/prisma/schema.prisma` uses the generated Prisma Client output under `src/generated/prisma`
- Prisma Client is instantiated with PostgreSQL's Prisma driver adapter via `@prisma/adapter-pg`

Relevant Prisma docs reference used while setting this up:

- Prisma Client setup/configuration
- `DATABASE_URL`-driven datasource configuration
- `prisma generate` after schema changes
- Driver adapter usage for PostgreSQL

## Local development

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 3. Start PostgreSQL and Redis

```bash
docker compose up -d postgres redis
```

This project publishes PostgreSQL on `localhost:5434` to avoid collisions with other local containers using `5432`.

### 4. Generate Prisma client and create the initial migration

Run these from `backend`:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Start the backend locally

For local development with separate API and worker processes:

```bash
cd backend
npm run dev
```

In another terminal:

```bash
cd backend
npm run worker
```

For a single-process backend run that starts the API and worker together:

```bash
cd backend
npm run dev:integrated
```

### 6. Start the frontend

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:3000` and backend on `http://localhost:4000`.

In production, `npm run start` runs the API and upload worker in the same backend service so a single backend deployment can process uploads end-to-end.

## Dockerized workflow

To build and run the full stack:

```bash
docker compose up --build
```

Local database access for Prisma uses `localhost:5434`.

Services:

- frontend: `http://localhost:3000`
- backend API: `http://localhost:4000`
- postgres: `localhost:5434`
- redis: `localhost:6379`

## Backend commands

From `backend`:

```bash
npm run prisma:generate
npm run prisma:migrate:dev -- --name init
npm run prisma:migrate:deploy
npm run dev
npm run dev:integrated
npm run worker
npm run build
npm run typecheck
```

## Frontend commands

From `frontend`:

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Core capabilities

- Scoped overwrite by selected month and year
- Atomic upload semantics: invalid row data fails the entire import
- Queue-driven async Excel processing with BullMQ
- Real-time upload progress via Socket.io
- Premium dashboard with search, sorting, and multi-select filtering
- Inline editable comments for ZM and staff
- Filter-aware Excel export with latest comments merged into the sheet

## Expected workbook columns

The upload parser expects these logical columns in the header row:

- `VP`
- `State`
- `Staff`
- `Party Id`
- `Party`
- `Total O/S`
- `121-150`
- `151-180`
- `181-240`
- `241-365`
- `366-540`
- `>540`
- `ZM Comment`
- `Staff Comment`

Month and year are selected in the upload flow and are not read from the Excel sheet.