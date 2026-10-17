# Deploy the Hub

## 1. GitHub

Create a separate private repository: bulletproof-seafarer-hub. Extract this ZIP and upload its **contents**, including dist, supabase, scripts, tests, package.json, and package-lock.json. Do not upload the ZIP itself. Keep the existing folder structure. No .git, Sites identity, node_modules, or private environment file belongs in the upload.

## 2. Supabase database

Create a **new Hub-only Supabase project**. In SQL Editor, run these once, in order:

1. supabase/migrations/001_hub.sql
2. supabase/migrations/002_leaderboard.sql
3. supabase/migrations/003_reporting_limits.sql

Alternatively run supabase/INSTALL.sql once; it contains those same three migrations. Do not run both methods. Keep migrations in Git for later upgrades.

Copy the project URL and **publishable key** from project settings. The older anon key is also supported. Never put a secret key, service_role key, database password, or connection string in frontend code or Cloudflare build variables used by this app.

## 3. Cloudflare Pages

Import the GitHub repository into a Pages project.

- Production branch: main
- Framework: None
- Build command: npm run build
- Build output: dist
- Root: repository root
- NODE_VERSION: 22

Set these build environment variables for the target production/preview deployment:

- HUB_SUPABASE_URL: the new project’s https://…supabase.co URL
- HUB_SUPABASE_PUBLISHABLE_KEY: its publishable or anon key
- HUB_REGISTRATION_OPEN: false initially
- HUB_PRIVACY_CONTACT: JV’s working privacy/support contact
- HUB_FACEBOOK_GROUP_URL: optional exact official group URL
- HUB_TURNSTILE_SITE_KEY: the public Turnstile site key after configuring CAPTCHA

Redeploy after changing build environment variables. A placeholder config.js in the ZIP intentionally does not connect to any database.

## 4. Authentication and email

In Supabase Auth, enable email/password and **keep email confirmation enabled**. Turn **Allow new users to sign up OFF** while preparing the beta; HUB_REGISTRATION_OPEN only controls the interface, not the Auth server. Set Site URL to the actual Pages/custom-domain origin. Add exact allowed redirect URLs for that origin’s / and /?recovery=1. Add trusted preview origins only when needed; avoid broad wildcard production redirects.

Configure production SMTP and verify signup/reset email delivery. Supabase’s test email service is not a launch email system.

For open registration: create a Cloudflare Turnstile widget for your domains, enable the same provider in Supabase Auth bot protection, set its secret **inside Supabase Auth only**, and put only the public site key in HUB_TURNSTILE_SITE_KEY. The app renders the challenge and submits its token to Auth. Test sign-in, signup, expired challenge, and recovery. The build refuses open registration without a site key and privacy contact.

While registration is closed, create two test users through Supabase’s trusted dashboard/administration path. Use disposable test accounts with confirmed email; do not weaken verification for public accounts.

After acceptance checks, enable new-user signup in Supabase Auth, set HUB_REGISTRATION_OPEN=true, and redeploy. Finalize the operator’s privacy/retention settings and support handling before inviting members.

## 5. Moderator access

After JV’s real account exists, run this in Supabase SQL Editor with that account’s actual UUID from Auth → Users:

```sql
insert into public.hub_roles(user_id,role)
values ('REPLACE_WITH_JVS_AUTH_USER_UUID'::uuid,'admin')
on conflict(user_id) do update set role=excluded.role;
```

Reload/sign in again. Profile now offers the moderator queue. To grant another moderator, use the same trusted SQL path with role moderator. Users cannot grant themselves roles through the app. Taxonomy editing remains a source-controlled change in this release.

## 6. Acceptance checks before inviting crew

- Account A finishes welcome/setup; re-login restores the dashboard without replaying setup. Account B gets its own first-time flow.
- A posts a question with a permitted photo; B sees it after Refresh and answers; A sees B’s reply, accepts it, and records an outcome. Re-login on another browser restores the shared discussion.
- B cannot edit A’s profile/question or read A’s private workspace/email. Self-votes, duplicate votes, invalid accepted-answer references, and client role changes fail.
- Signed photo URLs work and renew after returning to the app; unpublished images are private to their uploader.
- Review answers, mistakes, saved questions, and last view restore per account. Scores never change contribution points.
- Interrupt a save. Recovery stays under the same account. Another account does not see it. A stale-device save shows a conflict; it does not overwrite a newer version. Sign-out remains possible via the explicit sign-out-anyway choice.
- Submit feedback/report; JV sees it in the moderator queue. Hide/restore requires a reason and leaves a server audit record.
- Weekly points qualify eligible members; only those candidates receive support. Test at least one simulated cutoff in a nonproduction project. Never alter live score timestamps to simulate a week.
- Check iPhone Safari and Android: stable field focus, readable text, camera/photo selection, keyboard clearance, active tabs, and dark mode.
- Verify signup confirmation, password reset, CAPTCHA, support contact, privacy handling, quota alerts, backups, and restore procedure.

Keep noindex until you deliberately create useful crawlable public pages. Current Q&A reads require sign-in; this build is not a public SEO question directory.
