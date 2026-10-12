# TheCore

TheCore is a multi-user SaaS designed to help developers keep track of all their side projects in one beautifully designed, secure place. 

Have you ever returned to a project 6 months later and forgotten which email you used for Vercel, what database you used, or what the actual `.env` variables were? **TheCore solves this.**

## Features

- **Soft Modern UI:** A custom Tailwind CSS design system using CSS variables, featuring soft shadows, rounded corners, and a clean layout without relying on bulky component libraries.
- **Client-Side Encrypted `.env` Vault:** Safely store your environment variables. Using the Web Crypto API, your `.env` contents are encrypted in your browser (AES-256-GCM, PBKDF2-SHA256, 250k iterations). The server only sees encrypted gibberish. 
- **Accounts Organizer:** Automatically groups your platforms by the login email used.
- **Project Tracking:** Track tech stacks, to-dos, deployment statuses, and live URLs.
- **Dashboard Stats:** A custom, dependency-free SVG donut chart for visual tracking.
- **Import / Export:** Download a complete JSON backup of all your data (with the `.env` records remaining safely encrypted).

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4) with custom CSS variables
- **Database & Auth:** Supabase (Postgres, GoTrue) with strict Row Level Security (RLS)
- **Validation:** Zod + React Hook Form
- **Icons:** Lucide React

## Security

1. **No Platform Passwords:** The system explicitly does not accept passwords for third-party platforms. It only stores the platform name and login email, guiding the user to a proper password manager.
2. **True End-to-End Encryption:** The Vault Master Password never leaves the client. A random salt and IV are used per record. The `VaultProvider` auto-locks after 10 minutes of inactivity and clears the key from memory.
3. **Row Level Security (RLS):** Every single query requires the user ID to match `auth.uid()`, strictly enforced at the Postgres database level.
4. **Security Headers:** Strict headers (CSP, X-Frame-Options, Referrer-Policy) are implemented via `next.config.mjs`.
5. **Rate Limiting:** Auth endpoints are natively rate-limited by Supabase GoTrue.

## Local Development

1. Clone the repository.
2. Run `npm install`.
3. Rename `.env.example` to `.env.local` and add your Supabase credentials.
4. Apply the database migrations by running the SQL in `supabase/migrations/20230101000000_init.sql` inside your Supabase project's SQL editor.
5. Run `npm run dev` and open `http://localhost:3000`.

## Design System

The app utilizes a centralized token system inside `app/globals.css`. By modifying the variables (e.g., `--radius-card`, `--shadow-card-soft`, `--color-accent-primary`), you can instantly restyle the entire application.

---
Built with Next.js and Supabase.
