# TheCore Production Audit Report

**Date:** October 12, 2026  
**Auditor Roles:** Principal Engineer, Security Reviewer, QA Lead, SEO Specialist  
**Application:** TheCore (Next.js App Router 16.3.8, React 19, TypeScript 5, Tailwind v4, Supabase, Vercel)  
**Target Domain:** https://thecore.isroot.in  

---

## 1. Executive Summary

| Risk Level | Finding Count |
|:---|:---:|
| **Critical** | 2 |
| **High** | 3 |
| **Medium** | 7 |
| **Low** | 6 |
| **Total Findings** | **18** |

### Overall Risk Assessment: HIGH
While TheCore implements client-side Web Crypto (AES-256-GCM / PBKDF2-SHA256 with 250,000 iterations) and auto-locking, the application currently faces critical operational and security vulnerabilities:
1. **Live Domain Inaccessibility (Critical):** The production domain `https://thecore.isroot.in` does not resolve via DNS (`curl: (6) Could not resolve host`). No DNS A or CNAME record is configured for `thecore.isroot.in`.
2. **Database Authorization Vulnerability (Critical):** Row-Level Security (RLS) policies on child tables (`services`, `todos`, `env_files`) verify `auth.uid() = user_id`, but fail to verify that the parent `project_id` belongs to the authenticated user. An authenticated attacker can forge `project_id` to insert records into another user's project.
3. **Unprotected File Upload Endpoint (High):** `/api/imagekit/auth/route.ts` lacks authentication checks, allowing unauthenticated third parties to acquire ImageKit upload signatures.
4. **Missing Account Deletion RPC (High):** `deleteAccount()` invokes `supabase.rpc("delete_user")`, but this function was never defined in any migration, preventing complete account deletion.
5. **Missing Data Export / Import (High):** Settings page has no export/import UI, failing GDPR/DPDP data portability requirements.

---

## 2. Findings Table

| ID | Severity | Area | File & Line | Issue Summary | Exact Fix | Effort | Carried Over Status |
|:---|:---|:---|:---|:---|:---|:---:|:---:|
| **SEO-01** | **Critical** | Infra/DNS | Live Domain | `thecore.isroot.in` DNS does not resolve (`curl (6) Could not resolve host`). | Add CNAME record `thecore.isroot.in` -> `cname.vercel-dns.com` in DNS management. | 5 min | New |
| **SEC-01** | **Critical** | Database/RLS | `supabase/migrations/20230101000000_init.sql:88-105` | Child table RLS policies on `services`, `todos`, `env_files` only check `user_id = auth.uid()`. They do not verify parent `project_id` ownership, enabling forged project ID insertion. | Add `AND EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid())` to INSERT and UPDATE policies. | 20 min | Carry-over (B-RLS) - **UNFIXED** |
| **SEC-02** | **High** | API/Auth | `app/api/imagekit/auth/route.ts:4` | Unauthenticated GET endpoint generates ImageKit upload signatures signed with private key. | Check `await supabase.auth.getUser()`; return 401 Unauthorized if unauthenticated. | 10 min | New |
| **SEC-03** | **High** | Auth/Database | `app/dashboard/settings/actions.ts:19` | `deleteAccount()` calls `supabase.rpc("delete_user")`, which does not exist in any migration. | Create PostgreSQL `SECURITY DEFINER` function `delete_user()` in a migration. | 15 min | New |
| **FUNC-01** | **High** | Functionality | `app/dashboard/settings/SettingsClient.tsx:50-160` | JSON Data Export and Import are completely missing from the Settings page. | Implement JSON export button and JSON import input with schema validation in Settings. | 45 min | New |
| **SEC-04** | **Medium** | Auth/Bypass | `utils/supabase/middleware.ts:35`, `app/login/page.tsx:50` | Hardcoded bypass `mock-project` allows bypassing authentication checks in production code. | Remove mock bypass or restrict strictly to `process.env.NODE_ENV === 'test'`. | 10 min | New |
| **SEC-05** | **Medium** | Infra/Git | `.git` (Root) | Git repository was initialized at `C:\Users\Dharani` (user home directory), not in `thecore`. `thecore` lacks its own `.git` repo. | Run `git init` inside `thecore`, create `.gitignore`, and commit project files. | 10 min | New |
| **SEC-06** | **Medium** | Config/Env | `.env:1` | Typo in `.env`: `NEXT_PUBLIC_SUPABASE_URL=:https://...` (extra colon). | Remove colon typo in `.env`. | 2 min | New |
| **SEC-07** | **Medium** | Database | `supabase/migrations/20230101000000_init.sql:124` | `handle_new_user()` trigger function lacks `SET search_path = public, pg_temp;`. | Add `SET search_path = public, pg_temp;` to prevent search path hijacking. | 5 min | New |
| **SEC-08** | **Medium** | Validation | `lib/validations.ts:8-10` | `repo_url` and `live_url` schemas allow non-http/https URL schemes. | Refine with `.refine(url => !url \|\| /^https?:\/\//i.test(url))` to reject `javascript:` and `data:`. | 10 min | New |
| **CQ-02** | **Medium** | Code Quality | `app/dashboard/projects/` | Duplicate route and client code between `/dashboard` and `/dashboard/projects`. | Delete `app/dashboard/projects/` and point navigation to `/dashboard`. | 20 min | Carry-over (A-1) - **UNFIXED** |
| **CQ-03** | **Medium** | Architecture | `components/ui/ProjectCard.tsx:29`, `AccountsClient.tsx:89` | Links hardcode `/dashboard/projects/${id}` instead of `projectPath(id)` from `lib/routes.ts`, causing 308 redirects. | Use `projectPath(id)` consistently across all navigation components. | 15 min | Carry-over (A-dupl) - **UNFIXED** |
| **SEC-09** | **Medium** | Web/Headers | `next.config.mjs:10` | CSP contains `unsafe-eval` and `unsafe-inline` in `script-src`. | Migrate to nonces or strict hashes for scripts. | 30 min | Carry-over (B-1) - **UNFIXED** |
| **CQ-01** | **Low** | Code Quality | Root directory | 11 leftover scripts (`extract.js`, `fix.js`, `fix.py`, `rewrite.py`, `next.config.ts`, etc.) clutter root. | Delete unused migration/helper scripts and redundant `next.config.ts`. | 5 min | Carry-over (A-1) - **PARTIALLY FIXED** |
| **CQ-04** | **Low** | Code Quality | Multiple files | Unhandled `console.error` calls scattered across client components. | Replace with structured toast notifications. | 15 min | Carry-over (A-4) - **PARTIALLY FIXED** |
| **CQ-05** | **Low** | Types | Multiple files | 26 instances of `any` types across UI and server actions. | Replace with proper TypeScript interfaces. | 25 min | Carry-over (A-3) - **PARTIALLY FIXED** |
| **CQ-06** | **Low** | Code Quality | `components/ui/CodeSlots.tsx:85` | 5 `eslint-disable-next-line react-hooks/exhaustive-deps` comments. | Properly memoize dependencies or refactor slot transitions. | 15 min | Carry-over (A-3) - **UNFIXED** |
| **CQ-07** | **Low** | Code Quality | `components/layout/Sidebar.tsx:70`, `app/login/page.tsx:168` | Placeholder email `user@example.com` and `John Doe` hardcoded in UI. | Display clean skeletons or empty placeholders. | 5 min | Carry-over (A-seed) - **UNFIXED** |

---

## 3. Pass/Fail Checklist With Evidence

### A. Code Cleanliness
- [x] **`npx tsc --noEmit`**: **PASS**  
  *Evidence:* Exit code 0, 0 TypeScript errors.
- [ ] **`npx eslint . --max-warnings 0`**: **FAIL**  
  *Evidence:* `eslint.config.mjs` lacked `node_modules` exclusion, causing long evaluation times. Client code contains 5 `eslint-disable` comments and 26 `any` casts.
- [ ] **Dependencies (`depcheck` / `npm audit`)**: **FAIL**  
  *Evidence:* `npm audit --omit=dev` reported 2 moderate vulnerabilities in `uuid < 11.1.1` via `imagekit`. `tailwind-merge` and `tsx` remain in dependencies.
- [ ] **Leftover code and scripts**: **FAIL**  
  *Evidence:* 11 unneeded scripts present in root (`extract.js`, `fix.js`, `fix.py`, `fix_page.py`, `fix_ui.py`, `revert_ui.py`, `rewrite.py`, `remove_banner.py`, `upgrade_ui.py`, `next.config.ts`, `prompt.txt`).
- [ ] **Duplicated routes**: **FAIL**  
  *Evidence:* `app/dashboard/projects/page.tsx` duplicate of `app/dashboard/page.tsx`.

### B. Security
- [ ] **Secrets & Git**: **FAIL**  
  *Evidence:* `thecore` directory has no `.git` folder (`Test-Path .git` returned False). `git status` revealed `.git` is located in `C:\Users\Dharani`.
- [x] **Vault Crypto (`lib/crypto.ts`)**: **PASS**  
  *Evidence:* Verified line-by-line: AES-256-GCM, PBKDF2-SHA256 with 250,000 iterations (`ITERATIONS = 250000`). Random 16-byte salt and 12-byte IV generated on every encryption call via `crypto.getRandomValues()`. Test suite `test-crypto.ts` executed with 5/5 assertions passing.
- [x] **Vault Auto-lock & Clipboard**: **PASS**  
  *Evidence:* `VaultProvider.tsx` sets a 10-minute inactivity timer (`INACTIVITY_TIMEOUT = 10 * 60 * 1000`) listening on `mousemove` and `keydown`. `EnvClient.tsx` clears clipboard after 30 seconds.
- [ ] **Database RLS Child Table Scoping**: **FAIL**  
  *Evidence:* `supabase/migrations/20230101000000_init.sql` policies on `services`, `todos`, and `env_files` only evaluate `auth.uid() = user_id`. No foreign key check on parent `projects.user_id`.
- [ ] **API Endpoint Protection**: **FAIL**  
  *Evidence:* `app/api/imagekit/auth/route.ts` executes without inspecting `supabase.auth.getUser()`.
- [ ] **Account Deletion RPC**: **FAIL**  
  *Evidence:* `app/dashboard/settings/actions.ts:19` calls `delete_user` RPC which does not exist in any migration file.
- [ ] **Live Site Security Headers**: **FAIL (Domain Unreachable)**  
  *Evidence:* `curl: (6) Could not resolve host: thecore.isroot.in`. DNS not resolving.
- [x] **Local Security Headers (Configured in `next.config.mjs`)**: **PASS**  
  *Evidence:* Added `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `Referrer-Policy: strict-origin-when-cross-origin`.

### C. Responsive and Visual Quality
- [x] **No Horizontal Scroll**: **PASS**  
  *Evidence:* Global CSS uses `overflow-x: clip`, `html` and `body` height locking removed.
- [ ] **Navigation Route Consistency**: **FAIL**  
  *Evidence:* Sidebar "Projects" points to `/dashboard/projects` while project cards point to `/dashboard/projects/[id]` which redirects to `/dashboard/[id]`.
- [ ] **Touch Targets**: **FAIL**  
  *Evidence:* Desktop icon action buttons in `ProjectCard.tsx` (three-dot menu) measure under 44x44px hit target on touch devices.

### D. Accessibility
- [x] **Heading Hierarchy**: **PASS**  
  *Evidence:* Public pages have exactly one H1 (`app/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/cookies/page.tsx`).
- [ ] **Form Labels & Error Announcers**: **FAIL**  
  *Evidence:* Inline errors in `NewTodoModal.tsx` and `NewProjectDialog.tsx` lack `aria-live="polite"` attributes.

### E. Functionality
- [x] **Authentication Flow**: **PASS**  
  *Evidence:* Login, signup, and OAuth callbacks redirect correctly.
- [x] **Vault Verification**: **PASS**  
  *Evidence:* Password challenge verification passes in automated unit tests.
- [ ] **Data Portability (Export/Import)**: **FAIL**  
  *Evidence:* No Export or Import components exist in `app/dashboard/settings/SettingsClient.tsx`.

### F. Performance
- [x] **Production Build**: **PASS**  
  *Evidence:* `npm run build` succeeds without compilation errors.
- [x] **Font Optimization**: **PASS**  
  *Evidence:* Next.js `next/font/google` (`DM_Sans`) configured with `display: 'swap'`.

### G. SEO & Metadata
- [x] **Sitemap (`app/sitemap.ts`)**: **PASS (Updated in Stage 1)**  
  *Evidence:* Lists public indexable routes (`/`, `/login`, `/signup`, `/privacy`, `/terms`, `/cookies`), sets `lastModified` and `changeFrequency`.
- [x] **Robots (`app/robots.ts`)**: **PASS (Updated in Stage 1)**  
  *Evidence:* Allows public pages; disallows `/dashboard/*`, `/todos/*`, `/env/*`, `/accounts/*`, `/settings/*`, `/api/*`, `/auth/*`, `/reset-password`.
- [x] **Private Route Noindex**: **PASS (Updated in Stage 1)**  
  *Evidence:* `app/dashboard/layout.tsx` exports `robots: { index: false, follow: false }`, and `next.config.mjs` sets `X-Robots-Tag: noindex, nofollow` on `/dashboard/:path*`.
- [x] **Icons and PWA Manifest**: **PASS (Created in Stage 1)**  
  *Evidence:* Created `app/manifest.ts`, `app/icon.svg`, `app/apple-icon.tsx` (180x180), and `app/opengraph-image.tsx` (1200x630).
- [x] **JSON-LD Schemas**: **PASS (Implemented in Stage 1)**  
  *Evidence:* `app/page.tsx` now renders `WebApplication` and `FAQPage` structured data.
- [x] **Custom 404 Page**: **PASS (Created in Stage 1)**  
  *Evidence:* `app/not-found.tsx` created with branded UI and `robots: { index: false, follow: false }`.

### H. Legal and Consent
- [x] **Legal Pages Exist**: **PASS**  
  *Evidence:* `/privacy`, `/terms`, and `/cookies` exist with anchor tables of contents, version 1.0, and effective date October 15, 2026.
- [x] **Consent Gate**: **PASS**  
  *Evidence:* `TermsConsentModal.tsx` prompts users when `terms_version` does not match `LEGAL_VERSION`.
- [ ] **Personal Email in Legal Config**: **FAIL**  
  *Evidence:* `lib/legal.ts:3` defines `CONTACT_EMAIL = "palerugopi00@gmail.com"` instead of a dedicated service address (e.g. `support@thecore.isroot.in`).

### I. Production Readiness
- [ ] **DNS Record Active**: **FAIL**  
  *Evidence:* `nslookup thecore.isroot.in` returns empty address.
- [x] **Type Checking**: **PASS**  
  *Evidence:* `.\node_modules\.bin\tsc.cmd --noEmit` exited with code 0.

---

## 4. SEO Changes Made in Stage 1

The following additive SEO files and improvements were created and validated in Stage 1:

1. **`app/manifest.ts` (Created):**
   - Implements standard Web Application Manifest with `display: 'standalone'`, brand theme colors (`#4f46e5`, `#ffffff`), and references to SVG and Apple icons.
2. **`app/icon.svg` (Created):**
   - High-resolution vector SVG icon representing the signature layered squircle brandmark for browser tabs.
3. **`app/apple-icon.tsx` (Created):**
   - Dynamic 180x180 px Apple Touch Icon generated via `next/og` `ImageResponse`.
4. **`app/opengraph-image.tsx` (Created):**
   - Dynamic 1200x630 px Open Graph / Twitter social preview card generated via `ImageResponse`.
5. **`app/sitemap.ts` (Updated):**
   - Included public indexable URLs: `/`, `/login`, `/signup`, `/privacy`, `/terms`, `/cookies`. Added dynamic `lastModified` and proper priority values.
6. **`app/robots.ts` (Updated):**
   - Disallows all internal and authenticated paths (`/dashboard/*`, `/todos/*`, `/env/*`, `/accounts/*`, `/settings/*`, `/api/*`, `/auth/*`, `/reset-password`), allows public indexable paths, and includes the sitemap reference.
7. **`app/signup/layout.tsx` & `app/signup/page.tsx` (Created):**
   - Added canonical `/signup` route with dedicated metadata ("Sign up | TheCore") redirecting to `/login?mode=signup`.
8. **`app/login/layout.tsx` (Created):**
   - Added server-rendered metadata for the login route ("Log in | TheCore", canonical `/login`).
9. **`app/dashboard/layout.tsx` (Updated):**
   - Exported `robots: { index: false, follow: false }` metadata.
10. **`app/not-found.tsx` (Created):**
    - Branded 404 error page with `robots: { index: false, follow: false }`.
11. **`app/page.tsx` (Updated):**
    - Converted from unnecessary client component to Server Component.
    - Added comprehensive `metadata` (title: *"TheCore: track your projects, hosting platforms and .env files"*, description, Open Graph, Twitter, and Search Console verification placeholders).
    - Embedded structured JSON-LD (`WebApplication` and `FAQPage`).
12. **`app/privacy/page.tsx`, `app/terms/page.tsx`, `app/cookies/page.tsx` (Updated):**
    - Corrected titles to prevent double `| TheCore` duplication from layout title template. Added canonical URL alternates.
13. **`next.config.mjs` (Updated):**
    - Added `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
    - Added `X-Robots-Tag: noindex, nofollow` headers for `/dashboard/:path*`, `/api/:path*`, and `/auth/:path*`.
    - Added 308 permanent redirect from `/projects/:id` to `/dashboard/:id`.

---

## 5. Manual Checks for the Owner

### Step 1: DNS & Custom Domain Configuration (Critical)
1. Go to your DNS provider (e.g. Cloudflare, Namecheap, GoDaddy, or isroot.in DNS manager).
2. For domain `thecore.isroot.in`:
   - Add a `CNAME` record:
     - **Name / Host:** `thecore`
     - **Target / Value:** `cname.vercel-dns.com`
     - **TTL:** Automatic or 300 seconds
3. Verify in Vercel Dashboard -> Project Settings -> Domains that `thecore.isroot.in` displays a green checkmark.

### Step 2: Supabase Two-User Project Isolation Verification
Run this SQL in the Supabase SQL Editor to verify child table RLS policies:
```sql
-- 1. Check RLS status on all public tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 2. Inspect existing policies
SELECT tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```
To fix the project-isolation vulnerability (SEC-01), apply the following migration:
```sql
-- Enforce parent project ownership on child tables
DROP POLICY IF EXISTS "Users can insert own services" ON services;
CREATE POLICY "Users can insert own services" ON services 
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own services" ON services;
CREATE POLICY "Users can update own services" ON services 
FOR UPDATE USING (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own todos" ON todos;
CREATE POLICY "Users can insert own todos" ON todos 
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own todos" ON todos;
CREATE POLICY "Users can update own todos" ON todos 
FOR UPDATE USING (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own env_files" ON env_files;
CREATE POLICY "Users can insert own env_files" ON env_files 
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
);
```

### Step 3: Add `delete_user` RPC Function in Supabase
Run the following SQL in Supabase to allow server-side account deletion:
```sql
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp;
```

### Step 4: Search Console & Bing Webmaster Setup
1. Open [Google Search Console](https://search.google.com/search-console).
2. Choose **URL prefix** and enter `https://thecore.isroot.in`.
3. Choose **HTML tag** verification method, copy the token inside `content="..."`, and paste it into `app/page.tsx` under `verification.google`.
4. In Search Console, submit `/sitemap.xml` under the **Sitemaps** menu.
5. Request indexing for the homepage URL `https://thecore.isroot.in`.
6. Repeat for [Bing Webmaster Tools](https://www.bing.com/webmasters) using `verification.other["msvalidate.01"]`.

---

## 6. Prioritized Fix Plan (For Stage 2)

Once approved, fixes will be applied in the following order:

1. **Phase 1: Critical Security & Authentication Fixes**
   - **SEC-01:** Add project-ownership validation to child table RLS policies in a new migration.
   - **SEC-02:** Add session check to `app/api/imagekit/auth/route.ts`.
   - **SEC-03:** Add `delete_user` RPC migration.
   - **SEC-04:** Remove `mock-project` auth bypass code.
   - **SEC-08:** Enforce `http:` / `https:` validation on URLs in `lib/validations.ts`.
   - **SEC-06:** Fix typo in `.env` (`NEXT_PUBLIC_SUPABASE_URL`).

2. **Phase 2: Missing Core Functionality & Data Portability**
   - **FUNC-01:** Implement JSON export and JSON import components in `app/dashboard/settings/`.

3. **Phase 3: Route & Navigation Unification**
   - **CQ-02:** Remove redundant `app/dashboard/projects/` directory; route all project management to `/dashboard`.
   - **CQ-03:** Update all links to use `projectPath(id)` from `lib/routes.ts` (`/dashboard/[id]`).

4. **Phase 4: Code Cleanliness & Maintenance**
   - **CQ-01:** Remove 11 unused root scripts.
   - **CQ-04:** Clean up raw `console.error` calls.
   - **CQ-05:** Replace 26 `any` types with strict interfaces.
   - **CQ-07:** Remove hardcoded placeholder email in Sidebar.

---

## 7. Not Verified

1. **Live Production HTTP Headers via curl:**
   - **Reason:** Domain `thecore.isroot.in` is currently unreachable via DNS (`curl: (6) Could not resolve host`).
   - **Command to run once DNS is configured:**
     ```bash
     curl -I https://thecore.isroot.in
     ```
2. **Gitleaks Git History Scan:**
   - **Reason:** `gitleaks` is not installed on this Windows environment, and the `thecore` directory has not been initialized as an independent git repository.
   - **Command to run:**
     ```bash
     gitleaks detect --source . --verbose
     ```
3. **Playwright E2E & Axe Accessibility on Live Site:**
   - **Reason:** Headless browser execution against the remote domain requires the live DNS record to resolve.
   - **Command to run locally against dev server:**
     ```bash
     npx playwright test e2e.spec.ts
     ```
