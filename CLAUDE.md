# Lead to Customer - SaaS Platform

## Project Overview
A SaaS platform for managing and converting leads into customers. Built with Next.js App Router, Supabase, TypeScript, and Tailwind CSS.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS v4
- **State Management**: React Server Components + Zustand (client state)
- **Payments**: Stripe
- **Email**: Resend
- **Deployment**: Vercel

## Project Structure
```
src/
  app/             # Next.js App Router pages and API routes
    (auth)/        # Auth pages (login, register, forgot-password)
    (dashboard)/   # Authenticated dashboard pages
    (marketing)/   # Public marketing pages
    api/           # API route handlers
  components/      # React components
    ui/            # Primitive UI components (Button, Input, Modal, etc.)
    layout/        # Layout components (Sidebar, Header, Footer)
    forms/         # Form components
    shared/        # Shared/composite components
  lib/             # Shared libraries and utilities
    supabase/      # Supabase client and server helpers
    auth/          # Auth helpers and middleware
    stripe/        # Stripe integration
    email/         # Email templates and sending
    utils/         # General utility functions
    validators/    # Zod schemas for validation
  hooks/           # Custom React hooks
  types/           # TypeScript type definitions
  constants/       # App-wide constants and config
  styles/          # Global styles
supabase/
  migrations/      # Database migrations (SQL)
  seed.sql         # Seed data
public/            # Static assets
```

## Commands
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check
- `npx supabase db push` - Push migrations to Supabase
- `npx supabase gen types typescript --local > src/types/supabase.ts` - Generate DB types

## Conventions

### Code Style
- Use `function` declarations for components, arrow functions for utilities
- Prefer named exports over default exports
- Use absolute imports via `@/` prefix (maps to `src/`)
- Colocate test files next to source files with `.test.ts` suffix

### Components
- Server Components by default; only add `"use client"` when needed
- Props interfaces named `{ComponentName}Props`
- One component per file, file named same as component

### API Routes
- Always authenticate with `getUser()` before any DB operation
- Always filter DB queries by `user_id` (prevent IDOR)
- Validate all inputs with Zod schemas from `lib/validators/`
- Return consistent JSON: `{ data }` on success, `{ error }` on failure

### Database
- All tables must have RLS enabled
- All tables must have `user_id` column with FK to `auth.users`
- All tables must have `created_at` and `updated_at` timestamps
- Migration files named: `YYYYMMDD_description.sql`

### Error Handling
- Use custom `AppError` class for application errors
- Log errors server-side, return safe messages client-side
- Never expose stack traces or internal details to the client
