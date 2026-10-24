# 📁 Job Description Vault

A modern, full-stack application built with **Next.js 16 (App Router)** and **shadcn/ui** to store, manage, and instantly search company job descriptions.

---

## ✨ Features

- **🔐 Multi-User Authentication**: Register and login with username and password (hashed with `bcryptjs`).
- **🍪 Persistent Cookie Sessions**: Secure, `httpOnly` JWT session cookies ensure users stay logged in across page refreshes, tabs, and visits without re-entering credentials.
- **🔍 Instant Company Find / Search**: Real-time filtering by company name or role title as you type.
- **📋 1-Click Copy**: Copy the entire job description directly to your clipboard with instant visual feedback.
- **📊 Application Tracker**: Organize jobs by status (`Saved`, `Applied`, `Interviewing`, `Offer`, `Archived`).
- **🎨 Premium shadcn/ui Design**: Built using Radix UI primitives and Tailwind CSS with responsive dark/light support.
- **⚡ Dual Storage Architecture**:
  - **Local Development**: Runs out of the box with zero setup using local persistent storage.
  - **Production (Vercel)**: Connects seamlessly to serverless PostgreSQL (Neon, Supabase, Vercel Postgres, Railway).

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies (already installed in workspace)
npm install

# 2. Start the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying to Vercel

### Step 1: Create a Free Cloud Database
1. Go to [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com) and create a free PostgreSQL database.
2. Copy your connection string (e.g. `postgresql://alex:password@ep-cool-db.us-east-2.aws.neon.tech/neondb?sslmode=require`).

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Initial commit of Job Description Store"
git remote add origin https://github.com/your-username/job-description-store.git
git push -u origin main
```

### Step 3: Deploy on Vercel
1. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
2. Select your GitHub repository.
3. In **Environment Variables**, add:
   - `DATABASE_URL`: Your PostgreSQL connection string from Neon or Supabase.
   - `SESSION_SECRET`: Any random string (e.g. `a-secure-secret-key-at-least-32-characters`).
4. Click **Deploy**.

Vercel will build and assign you a live `.vercel.app` URL. The app will automatically initialize database tables upon your first request!
