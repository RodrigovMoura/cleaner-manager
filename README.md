# 🧹 Cleaner Manager

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Vitest](https://img.shields.io/badge/Vitest-4.x-FCC72B?style=flat-square&logo=vitest&logoColor=black)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Cleaner Manager** is a modern, full-stack SaaS CRM, schedule manager, and automated invoicing platform tailored specifically for independent cleaning contractors and residential/commercial cleaning businesses.

It streamlines day-to-day operations by automating client communications, generating compliant Australian tax invoices in PDF format, managing recurring appointments across interactive calendar views, and handling automated pre-clean reminders and payment follow-ups.

---

## 📑 Table of Contents

- [Overview & Purpose](#-overview--purpose)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Requirements](#-system-requirements)
- [Installation & Getting Started](#-installation--getting-started)
- [Environment Variables](#-environment-variables)
- [Automations & Background Cron](#-automations--background-cron)
- [Project Architecture & Directory Structure](#-project-architecture--directory-structure)
- [Available Scripts](#-available-scripts)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Security & Multi-Tenancy](#-security--multi-tenancy)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview & Purpose

Independent cleaners and small cleaning businesses often struggle with fragmented administrative tasks:
- Tracking client appointments across notes, paper calendars, or generic messaging apps.
- Manually writing, converting, and emailing PDF invoices after every service.
- Chasing overdue payments and manually sending reminder notices.
- Forgetting to notify clients before visits to ensure property access.

**Cleaner Manager** solves these pain points in an integrated, mobile-first web application. Cleaners can manage their customer database, schedule recurring visits, track financials with real-time KPI metrics, and let background automation handle reminders and invoice dispatching.

---

## ✨ Key Features

### 👥 Client Relationship Management (CRM)
- **Comprehensive Client Profiles**: Store names, phone numbers, email addresses, property addresses, custom notes, and default cleaning rates.
- **Address Autocomplete**: Powered by the Google Places API with Australian boundary filters (`country:au`) and seamless fallback for manual typing.
- **Granular Automation Toggles**: Configure communication preferences per client (enable/disable reminders, set custom lead time in days, auto-generate invoices, auto-send invoices via email, and enable overdue payment chasers).

### 📅 Smart Scheduling & Calendar Views
- **4 Interactive Calendar Views**:
  - **Month View**: Full monthly schedule with demand indicators and quick-add actions.
  - **Fortnight View**: 2-week rolling perspective optimized for bi-weekly recurring cleans.
  - **Week View**: Detailed 7-day breakdown showing times, client initials, and job status.
  - **Day View**: Focused single-day schedule with full appointment breakdowns.
- **Flexible Recurrence Engine**: Schedule single, weekly, fortnightly, or monthly recurring appointments in batch.
- **One-Click Status Workflow**: Transition jobs between `SCHEDULED`, `COMPLETED`, and `CANCELLED`.

### 🧾 Australian Tax Invoicing & PDF Generation
- **Automated Invoice Creation**: Completing an appointment can automatically generate an invoice with sequential numbering (e.g. `INV-2026-0001`).
- **Dynamic PDF Rendering**: Produces professional, print-ready PDF invoices on the fly using `@react-pdf/renderer`.
- **Australian Banking Details**: Native support for Australian BSB (`XXX-XXX`), Bank Account Number, Account Name, and PayID.
- **Historical Snapshot Guarantee**: Invoices capture an immutable snapshot of banking details at issuance time, ensuring invoice integrity even if settings are updated later.
- **Transactional Email Dispatch**: Send and resend tax invoices with PDF attachments via the [Resend](https://resend.com) API.

### ⚡ Automation Hub & Background Cron Worker
- **Pre-Cleaning Reminders**: Automatically emails clients 1–7 days before their scheduled service with address, date, and time details.
- **Overdue Payment Chaser**: Identifies unpaid past-due invoices and dispatches polite follow-up emails with a built-in 3-day cooldown to prevent spamming.
- **Safety Pause (Master Kill-Switch)**: Temporarily halt all automated background dispatching across all clients with a single toggle.
- **Secure Cron Endpoint**: Protected `/api/cron` HTTP route designed for Vercel Cron, GitHub Actions, or server cron jobs.

### 📱 Modern, Mobile-First UI/UX
- **Responsive Layout**: Tailored for both desktop desks and mobile phones on the go.
- **Slide-Over Navigation Drawer**: Clean mobile navigation with quick shortcuts to schedule cleanings or register clients.
- **Skeleton Loaders**: Zero layout shifts with dedicated skeleton states for every route.
- **Financial Dashboard**: Live KPI cards displaying today's cleanings, pending revenue, monthly earnings, and total clients.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16.3](https://nextjs.org/) (App Router) | Server Components, Server Actions, API routes, optimized routing |
| **UI Library** | [React 19.2](https://react.dev/) | Component architecture & modern hooks |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | End-to-end type safety in strict mode |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern utility-first CSS framework |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Relational database storage |
| **ORM** | [Prisma 7](https://www.prisma.io/) (`@prisma/adapter-pg`) | Type-safe schema, migrations, and database queries |
| **Authentication** | [jose](https://github.com/panva/jose) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Stateless JWT cookie sessions with password hashing |
| **PDF Engine** | [@react-pdf/renderer](https://react-pdf.org/) | Server-side vector PDF generation for tax invoices |
| **Email Delivery** | [Resend](https://resend.com/) | Transactional email delivery with PDF attachments |
| **Maps & Places** | [Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview) | Address autocomplete with Australian geo-restraints |
| **Testing** | [Vitest 4](https://vitest.dev/) + Testing Library | Unit and integration test runner with JSDOM |
| **Code Quality** | [ESLint 9](https://eslint.org/) | Code formatting and linting rules |

---

## 📋 System Requirements

Ensure your development environment meets the following requirements:

- **Node.js**: `v20.x` or higher (Node 20 or 22 LTS recommended)
- **npm**, **pnpm**, **yarn**, or **bun**
- **PostgreSQL Database**: Local installation or hosted instance (e.g., [Supabase](https://supabase.com/), [Neon](https://neon.tech/), [AWS RDS](https://aws.amazon.com/rds/))
- **Google Cloud Account**: (Optional) API key with Places API enabled for address autocomplete
- **Resend Account**: (Optional) API key for sending live emails

---

## 🚀 Installation & Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/RodrigovMoura/cleaner-manager.git
cd cleaner-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment template to create your local `.env`:

```bash
cp .env.example .env
```

Open `.env` and fill in your values (see [Environment Variables](#-environment-variables) below for details).

### 4. Run Database Migrations

Apply the Prisma schema to your PostgreSQL database and generate the Prisma Client:

```bash
# Push migrations to the database
npx prisma migrate dev

# Generate Prisma Client types
npx prisma generate
```

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Create an Account

Navigate to [http://localhost:3000/register](http://localhost:3000/register) to create your primary cleaner account and get started!

---

## 🔐 Environment Variables

The project requires the following environment variables defined in your `.env` file:

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/cleaner_manager` |
| `DIRECT_URL` | Optional | Direct connection string for migrations (when using pooled connections) | `postgresql://user:pass@localhost:5432/cleaner_manager` |
| `JWT_SECRET` | **Yes** | Secret string used to sign session JWTs (minimum 32 characters) | `openssl rand -base64 48` |
| `CRON_SECRET` | **Yes** | Bearer authorization token used to protect `/api/cron` | `super-secret-cron-token-12345` |
| `RESEND_API_KEY` | Optional* | API key from Resend for email dispatching | `re_1234567890abcdef` |
| `RESEND_FROM_EMAIL` | Optional | Custom sender email/name | `Cleaning Management <info@yourdomain.com>` |
| `GOOGLE_PLACES_API_KEY`| Optional* | Google Places API key for address autocomplete | `AIzaSy...` |
| `ALLOWED_REGISTRATION_EMAILS` | Optional | Comma-separated allowlist of emails allowed to register | `cleaner@example.com,admin@company.com` |

*\* Note: If Resend or Google Places keys are omitted, core scheduling and manual CRM workflows will still function. Address inputs will fall back to standard text fields, and email dispatch calls will log warnings in development.*

---

## ⏰ Automations & Background Cron

The application features a built-in background scheduler endpoint at `/api/cron`. It performs two critical batch tasks:

1. **Pre-Service Reminders**: Scans for appointments within each client's configured alert window (e.g. 1 or 2 days ahead) that have not yet received a reminder, then dispatches an email notification.
2. **Overdue Invoices & Payment Chase**: Scans for unpaid invoices past their due date, checks whether payment reminders are enabled, applies a 3-day cooldown interval to avoid duplicate harassment, and sends follow-up payment requests.

### Securing & Triggering the Cron Job

The route verifies a Bearer token matching `CRON_SECRET`.

#### Local Testing via cURL:
```bash
curl -X GET http://localhost:3000/api/cron \
  -H "Authorization: Bearer your-secure-cron-secret-token"
```

#### Production Setup (Vercel Cron):
Add a `vercel.json` configuration or configure an external cron provider (such as Cron-Job.org, Upstash, or GitHub Actions) to trigger `GET https://your-domain.com/api/cron` once daily with the `Authorization: Bearer <CRON_SECRET>` header.

---

## 🏗️ Project Architecture & Directory Structure

```text
cleaner-manager/
├── prisma/
│   ├── migrations/              # Prisma migration history
│   └── schema.prisma            # PostgreSQL schema definitions & models
├── public/                      # Static assets, icons, manifest, favicon
├── src/
│   ├── actions/                 # Next.js Server Actions ("use server")
│   │   ├── appointment.ts       # Appointment CRUD & status lifecycle
│   │   ├── auth.ts              # Authentication actions (login, register, logout)
│   │   ├── automation.ts        # Client automation toggle mutations
│   │   ├── client.ts            # Client creation, editing, deletion
│   │   ├── invoice.ts           # Invoice generation, PDF rendering & emailing
│   │   └── settings.ts          # Australian bank details settings
│   ├── app/                     # App Router pages, layouts, and API routes
│   │   ├── api/
│   │   │   ├── cron/            # Background cron automation runner
│   │   │   ├── invoices/        # PDF streaming route
│   │   │   └── places/          # Google Places autocomplete proxy
│   │   ├── automations/         # Automations dashboard & safety pause
│   │   ├── calendar/            # Interactive multi-view calendar
│   │   ├── clients/             # Client list, new client, and client details
│   │   ├── invoices/            # Invoice list, payment recording & status
│   │   ├── login/               # Sign-in page
│   │   ├── register/            # Sign-up page (with allowlist support)
│   │   ├── schedule/            # Schedule agenda & appointment forms
│   │   ├── settings/            # Banking details & PayID configuration
│   │   ├── globals.css          # Tailwind CSS v4 stylesheets
│   │   ├── layout.tsx           # Global HTML layout with Geist font & Navbar
│   │   ├── loading.tsx          # Global route loading skeleton
│   │   └── page.tsx             # Main dashboard (KPIs, today's cleans, revenue)
│   ├── components/              # Shared React components
│   │   ├── AddressAutocomplete.tsx # Google Places autocomplete input with fallback
│   │   ├── InvoicePDF.tsx       # React-PDF invoice document template
│   │   └── Navbar.tsx           # Responsive navigation header & mobile drawer
│   ├── lib/                     # Server utilities & shared helpers
│   │   ├── auth.ts              # JWT creation, verification & cookies
│   │   ├── date.ts              # Date calculation, calendar grid & timezone utilities
│   │   ├── email.ts             # Resend SDK client configuration
│   │   ├── email-templates.ts   # HTML email templates (invoices & reminders)
│   │   ├── pdf.ts               # Buffer rendering wrapper for react-pdf
│   │   ├── prisma.ts            # PrismaClient singleton instance
│   │   └── validation.ts        # Security, BSB, email, and input sanitizers
│   ├── proxy.ts                 # Next.js middleware & route guard logic
│   └── types/                   # Shared TypeScript type definitions
├── .env.example                 # Example environment variables template
├── eslint.config.mjs            # ESLint 9 configuration
├── next.config.ts               # Next.js compiler & build configuration
├── package.json                 # Project dependencies and script commands
├── tsconfig.json                # Strict TypeScript configuration (@/* alias)
└── vitest.config.ts             # Vitest test runner configuration
```

---

## 📜 Available Scripts

In the project directory, you can run:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server on `http://localhost:3000` |
| `npm run build` | Generates the Prisma client and builds the application for production |
| `npm run start` | Starts the production server after building |
| `npm run test` | Runs the Vitest test suite once across all unit & integration tests |
| `npm run test:watch` | Runs the Vitest test suite in interactive watch mode |
| `npm run lint` | Checks TypeScript and JSX files using ESLint 9 |
| `npx prisma migrate dev` | Creates and applies new database migrations |
| `npx prisma generate` | Regenerates Prisma Client TypeScript definitions |
| `npx prisma studio` | Opens Prisma Studio in your browser to inspect database tables |

---

## 🧪 Testing & Quality Assurance

The project includes an automated test suite powered by **Vitest** and **@testing-library/react**.

To execute all tests:
```bash
npm run test
```

### What is tested:
- **Date & Calendar Calculations**: Week start offsets, leap year handling, month clamping, and calendar grid generation.
- **Data Validation & Sanitization**: Australian BSB format verification, phone formatting, RFC-compliant email checks, password strength boundaries, and XSS sanitization.
- **Server Actions & Permissions**: Multi-tenant authorization checks, recurring appointment generation, and client automation rules.
- **User Authentication**: Password hashing verification, session cookies, and registration allowlist restrictions.

---

## 🔒 Security & Multi-Tenancy

Data privacy and multi-tenant isolation are core architectural priorities:

1. **Strict Multi-Tenancy**: Every client, appointment, and invoice belongs to a specific user. Every database query in Prisma is strictly scoped to `session.userId`. Users can never access or modify another cleaner's data.
2. **Stateless JWT Sessions**: Sessions are managed with cryptographic tokens signed with `jose` using HS256, stored in secure `HttpOnly`, `SameSite: Lax` cookies.
3. **Password Security**: Passwords are encrypted using `bcryptjs` with salt rounds before being stored. Plaintext passwords and hashes are never exposed in responses.
4. **Input Sanitization**: All form inputs are sanitized using dedicated regex utility functions to strip harmful control characters, prevent script injection, and prevent ReDoS attacks.
5. **Registration Allowlist**: For private installations, set `ALLOWED_REGISTRATION_EMAILS` in `.env` to restrict user sign-ups strictly to authorized email addresses.

---

## 🤝 Contributing

Contributions, feedback, and suggestions are welcome!

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes: `git commit -m "feat: add amazing feature"`.
4. Run tests and linting: `npm run test && npx eslint .`.
5. Push to the branch: `git push origin feature/amazing-feature`.
6. Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.

---

Made with ❤️ for cleaning professionals and independent businesses.
