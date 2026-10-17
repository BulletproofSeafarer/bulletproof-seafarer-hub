# Bulletproof Seafarer Hub

A seafarer Q&A library with photo context, contribution milestones, a weekly Top 10, and optional OIC NW/EW practice. Original navy/orange UI, light/dark appearance, first-account onboarding, and returning-member welcome.

## Start here

See **DEPLOY.md** for GitHub → Cloudflare Pages → Supabase setup. Use a separate repository and Supabase project. Do not reuse Project Gangway or Next Port data.

```sh
npm ci
npm test
npm run build
npm run preview
```

Cloudflare Pages build: **npm run build**. Output: **dist**. Framework: **None**. Node: **22**. Environment settings are listed in .env.example. Without Supabase settings the build is a browser-local preview, clearly labeled as such. Local preview data is never automatically published when a cloud account is connected.

## Cloud features

- Email/password sign-in, verified-email signup, password recovery, session restore; registration is closed until explicitly configured.
- Profiles separate public member fields from private authentication email.
- Shared questions, answers, permitted photos, helpful/question votes, asker acceptance, and reported outcomes.
- Private saved reads, preferences, quiz progress, and last view. Saves use optimistic versions; failures retain an account-specific device recovery copy. Conflicts require reconciliation rather than overwriting another device.
- Profile edits save explicitly. First-time welcome/setup is per account; returning members get a dismissible welcome and a useful next action.
- Weekly Top 10: pre-Monday contribution points qualify the shortlist, profile support ranks it. Support resets each round. Initial weeks can have no qualifiers. Server rules reject self-votes and votes for ineligible candidates.
- Reports, feedback, staff-only moderation, and server audit records. Grant staff roles through the database, never from a browser control.
- Real loading feedback for retrieval, saving, and photo upload. No simulated loading delay.

## Source layout

- dist: deployable frontend, public configuration, vendored Supabase SDK/license, mascot, and reviewer source PDFs.
- supabase/migrations: ordered database tables, permissions, storage policies, RPCs, and leaderboard rules.
- scripts/configure.mjs: generates public configuration from build settings; rejects service/secret keys.
- tests: frontend integration, cloud adapter mocks, and real PostgreSQL semantics through PGlite.
- review-import-audit.json and scripts/import-review.py: import evidence and reproducible reviewer extraction (PyMuPDF required only to reimport PDFs).

## Review content

4,259 NW + 4,280 EW questions were imported from JV’s supplied PDFs; 213 structurally ambiguous, incomplete, duplicated-option, or explicitly figure-dependent rows were excluded. Sets follow source numbers in blocks of 50, not official competencies. Keys follow the supplied markings and are not independently verified. Source links are intentionally retained. Practice scores remain private and never award contribution points or qualifications.

## Verification limits

Local tests do not prove production readiness. Live Supabase email delivery, CAPTCHA, two-account access, photo serving, device/browser UX, and Cloudflare integration still require the acceptance checks in DEPLOY.md. See SECURITY.md for practical boundaries and remaining release work. No actual GitHub repository, Cloudflare Pages project, or Supabase project is created by extracting this package.

First-time flow: compact English welcome → Getting Started (Ask, Answer, Library, Review) → profile setup → dashboard. Completing setup skips these intro screens on return.
