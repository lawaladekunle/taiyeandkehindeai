# Taiye & Kehinde

Medical Communications & Scheduling Assistant — an AI-powered WhatsApp-based scheduling system for clinics and patients.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Styling:** Tailwind CSS
- **Auth:** NextAuth.js (Auth.js v4)
- **Testing:** Jest + React Testing Library

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env

# 3. Generate Prisma client
npx prisma generate

# 4. Start dev server
npm run dev

# 5. Verify health
curl http://localhost:3000/api/health
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/
│   ├── api/health/route.ts   # Health check endpoint
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
├── __tests__/                # Test files
prisma/
└── schema.prisma             # Database schema
```

## Models

- **Patient** — patient profiles with contact info
- **Clinician** — clinician profiles with availability
- **Appointment** — scheduled appointments with status tracking
- **Reminder** — automated reminders via WhatsApp

## CI/CD

GitHub Actions runs lint → test → build on every push to `main`.

## License

Proprietary — all rights reserved.
