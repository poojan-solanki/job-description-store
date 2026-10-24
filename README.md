# Job Description Store

**Live Application**: [https://job-description-store-czkn4gr8d-poojan9.vercel.app/](https://job-description-store-czkn4gr8d-poojan9.vercel.app/)

A web application to archive, organize, and search company job descriptions with user authentication.

## Overview

Job Description Store helps job seekers maintain a private, searchable repository of company job postings and interview notes. It features real-time search across company names and descriptions, dedicated editing and reader views, and application status tracking across the hiring lifecycle.

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