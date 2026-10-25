# Job Description Store

**Live Application**: [https://job-description-store.vercel.app/](https://job-description-store.vercel.app/)

A web application to archive, organize, and search company job descriptions with user authentication.

## Overview

During active job searches, candidates often apply to numerous positions across different companies. Even with identical job titles, roles frequently demand vastly different skill sets, responsibilities, and technical stacks that require tailored interview preparation.

A common challenge arises weeks later when interview invitations arrive: emails often omit the original job description, and the public listings on career portals have frequently expired or been taken down.

**Job Description Store** provides a private, searchable repository to archive complete job postings at the time of application. When a company reaches out, candidates can instantly search the company name, review the exact requirements and expectations, and prepare for interviews with clarity.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL (`pg` / `@neondatabase/serverless`) with local file-based fallback
- **Authentication**: JWT session cookies (`jose`), password hashing (`bcryptjs`)

## Getting Started

### Prerequisites

- Node.js 18.18 or later
- npm, pnpm, or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/poojan-solanki/job-description-store.git
   cd job-description-store
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

> In development mode without a database URL configured, the application automatically uses a local file store at `.local_data/jd_store.json`.

## Configuration

The application can be configured using environment variables:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Optional in dev / Required in prod | PostgreSQL connection string (Neon, Supabase, Railway, etc.). |
| `SESSION_SECRET` | Recommended | Secret key used to sign JWT session cookies. |

Database tables (`users` and `job_descriptions`) are created automatically upon initial connection.

## Deployment on Vercel

The repository includes a [vercel.json](file:///p:/Syncthing/personal-progs/Job%20Description%20Store/vercel.json) that automatically pins serverless functions to the **Singapore (`sin1`)** region to co-locate
 compute with your PostgreSQL database:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["sin1"]
}
```

If your database is in a different region, update `"regions": ["<region_code>"]` in [vercel.json](file:///p:/Syncthing/personal-progs/Job%20Description%20Store/vercel.json) or adjust **Settings > Functions > Function Region** in the Vercel dashboard. Co-locating Vercel functions with your database reduces round-trip query latency from ~280ms down to <5ms.