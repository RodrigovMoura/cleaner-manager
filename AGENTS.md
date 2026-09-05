# Agent Guidelines for Cleaning Management

This document provides context, architectural guidelines, code conventions, and operational instructions for AI agents working in this codebase.

---

## 1. Project Overview & Tech Stack

**Cleaning Management** is a full-stack SaaS CRM and schedule/billing management platform designed for independent cleaning service professionals and small cleaning businesses. It streamlines client management, recurring appointment scheduling, invoice generation, and automated reminder preferences.

### Core Stack
- **Framework**: [Next.js 16.3 (App Router)](https://nextjs.org/) + [React 19.2](https://react.dev/)
- **Language**: TypeScript 5 (Strict Mode)
- **Database & ORM**: PostgreSQL via [Prisma ORM 7.x](https://www.prisma.io/) with `@prisma/adapter-pg`
- **Authentication**: Custom JWT session authentication using [jose](https://github.com/panva/jose) + HTTP-only cookies + [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/postcss`) + CSS Modules (`*.module.css`)
- **Linting**: ESLint 9 (`eslint-config-next`)

---

## 2. Directory Structure

```text
cleaner-manager/
├── prisma/
│   ├── migrations/          # Prisma database migrations
│   └── schema.prisma        # Database schema definitions
├── public/                  # Static assets (icons, SVGs, logos)
├── src/
│   ├── actions/             # Next.js Server Actions ("use server")
│   │   ├── appointment.ts   # Scheduling & appointment actions
│   │   ├── auth.ts          # Auth actions (login, register, logout)
│   │   ├── client.ts        # Client CRUD actions
│   │   └── invoice.ts       # Invoicing & billing actions
│   ├── app/                 # Next.js App Router pages, layouts, routes
│   │   ├── clients/         # Client list, create, view, and edit pages
│   │   ├── dashboard/       # Main user dashboard
│   │   ├── login/           # User login page
│   │   ├── register/        # User registration page
│   │   ├── schedule/        # Agenda, calendar, and appointment creation
│   │   ├── globals.css      # Tailwind base and theme variables
│   │   ├── layout.tsx       # Root HTML layout with Geist font
│   │   └── page.tsx         # Root / landing page
│   ├── lib/                 # Core server & shared utilities
│   │   ├── auth.ts          # JWT session management (createSession, getSession, destroySession)
│   │   └── prisma.ts        # PrismaClient singleton instance
│   ├── proxy.ts             # Route guard / auth middleware logic
│   └── types/               # Shared TypeScript interfaces and type definitions
├── .env                     # Environment variables (do not commit)
├── eslint.config.mjs        # Flat ESLint configuration
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies and scripts
├── postcss.config.mjs       # PostCSS plugins config
├── prisma.config.ts         # Prisma CLI configuration
└── tsconfig.json            # TypeScript configuration with @/* path alias
```

---

## 3. Domain Models & Business Logic

The schema is defined in `prisma/schema.prisma`.

### Entities
1. **`User`**: The account owner (cleaner/business).
   - Relations: Has many `Client` records.
2. **`Client`**: A customer of the cleaner.
   - Contains contact details (`name`, `phone`, `email`, `address`, `notes`, `defaultPrice`).
   - Contains granular communication/automation toggles:
     - `enableAppointmentReminder` (Boolean, default: `true`)
     - `reminderDaysBefore` (Int, default: `1`)
     - `enableInvoice` (Boolean, default: `true`)
     - `autoSendInvoice` (Boolean, default: `false`)
     - `enablePaymentReminder` (Boolean, default: `true`)
3. **`Appointment`**: A scheduled cleaning session.
   - Status: `AppointmentStatus` (`SCHEDULED`, `COMPLETED`, `CANCELLED`).
   - Stores `date`, `price`, `reminderSentAt`.
   - Supports recurrence generation (e.g. single or bi-weekly batches).
4. **`Invoice`**: A billing document linked to an appointment.
   - Status: `PaymentStatus` (`PENDING`, `PAID`, `OVERDUE`).
   - Stores `invoiceNumber`, `amount`, `dueDate`, `sentAt`, `lastChasedAt`, `paidAt`.

---

## 4. Multi-Tenancy & Security Guidelines

> **Data Isolation Rule**: Cleaning Management is a multi-tenant platform. Every user can ONLY see and mutate their own data.

1. **Always Verify Session**:
   - In Server Actions and Server Components, resolve the session using `getSession()` from `@/lib/auth` (or `@/actions/auth`).
   - If `!session?.userId`, immediately return an unauthorized response (`{ success: false, message: "Unauthorized" }`) or throw an error.
2. **Always Scope Prisma Queries by User**:
   - When fetching clients: `where: { userId: session.userId }`.
   - When querying appointments or invoices: query through the relation, e.g., `where: { client: { userId: session.userId } }`.
   - When updating or deleting: ALWAYS use compound conditions (e.g. `prisma.client.deleteMany({ where: { id, userId: session.userId } })` or check ownership before mutating).
3. **Protect Sensitive Fields**:
   - Never return password hashes in client-facing responses.
   - Keep cookie flags secure (`httpOnly: true`, `sameSite: "lax"`, `secure: process.env.NODE_ENV === "production"`).

---

## 5. Coding & Architectural Conventions

### Server vs Client Components
- **Server Components (Default)**: Use for data fetching, static layouts, and initial page rendering. Import Server Actions directly or query Prisma directly where appropriate.
- **Client Components (`"use client"`)**: Use only when interactivity is needed (form state, modal controls, dropdowns, event listeners).
- Extract interactive subtrees into discrete client components (e.g., `AppointmentActions.tsx`, `EditClientForm.tsx`, `NewAppointmentForm.tsx`).

### Server Actions
- Placed in `src/actions/` with `"use server"` directive at the top.
- Standard return format for mutations:
  ```ts
  type ActionResult = {
    success: boolean;
    message: string;
    error?: string;
    data?: unknown;
  };
  ```
- Always revalidate affected routes with `revalidatePath("/path")` after mutations.
- **Note on `redirect()`**: Next.js `redirect()` throws a special internal exception (`NEXT_REDIRECT`). Do not call `redirect()` inside a `try/catch` block unless you rethrow the error, or place it after the `try/catch`.

### TypeScript & Imports
- Use the `@/*` alias for all internal imports (e.g. `@/lib/prisma`, `@/actions/client`, `@/components/...`).
- Keep TypeScript strict: do not use `any` unless absolutely necessary with explicit justification.
- Type Next.js dynamic route parameters properly:
  ```ts
  interface PageProps {
    params: Promise<{ id: string }>;
  }
  ```

### Styling & UI
- Use **Tailwind CSS v4** utility classes for layout, typography, responsive grids, and standard components.
- Use **CSS Modules** (`*.module.css`) when complex custom animations or bespoke styles are required.
- Format currency in AUD (`$` format, e.g. `$120.00`) and date/times using Australian English (`en-AU` locale) or ISO conventions where appropriate.

---

## 6. Database & Prisma Guidelines

- **Prisma Client**: Import the singleton from `@/lib/prisma` — do NOT instantiate `new PrismaClient()` directly in routes or actions.
- **Migrations**:
  - To apply migrations: `npx prisma migrate dev`
  - To generate the Prisma Client after schema changes: `npx prisma generate`
  - To inspect data: `npx prisma studio`
- **Decimal Fields**: Prisma `Decimal` types map to strings/objects in JS. When passing to client components or formatting, convert using `Number(val)` or `parseFloat(val.toString())`.

---

## 7. Useful Development Commands

```bash
# Start development server
npm run dev

# Run ESLint checks
npm run lint

# Build for production
npm run build

# Start production server
npm run start

# Prisma CLI commands
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

---

## 8. Environment Variables

Ensure `.env` contains the required keys:
```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host:port/database"
JWT_SECRET="your-secure-random-jwt-secret"
NODE_ENV="development"
```
*(Never commit `.env` or sensitive credentials to version control).*
