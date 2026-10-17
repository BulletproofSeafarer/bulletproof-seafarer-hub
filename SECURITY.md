# Security and release boundaries

Implemented: immutable Auth identity, row-level policies on all Hub tables, limited column grants, private versioned workspaces, own-content writes, cross-discussion answer checks, no self-votes, unique reactions, frozen weekly qualification, staff-only moderation with audit records, private photo bucket, per-owner upload paths, MIME/size restrictions, signup CAPTCHA integration, and basic per-account posting/report limits.

Tested locally: migrations execute under PostgreSQL semantics (PGlite), two database identities are isolated, forbidden writes fail, unpublished storage objects are private, moderator changes are audited, and eligibility/vote constraints are enforced. Cloud adapter tests cover identity, shared-feed mapping, acknowledgement-based saves, conflict recovery, and double-click handling. SDK/service behavior and full browser UX still need real integration tests.

Do not call this security-audited. Before an open launch:

- Exercise DEPLOY.md with two real accounts against the actual Supabase policies and Storage service.
- Set provider budgets/alerts and Auth limits. CAPTCHA and per-account quotas do not eliminate spam, account farming, or malicious uploads.
- Storage enforces MIME/size and owner paths; it does not independently inspect/re-encode image bytes. The browser resizes images, but an adversarial direct API uploader can bypass browser processing. For a larger public release, add a trusted image validation/re-encoding pipeline and abandoned-upload cleanup. Do not accept sensitive documents.
- Test email/redirect configuration, private recovery copies on shared devices, account deletion handling, backups, and actual provider retention/regions. A privacy contact must be staffed.
- Current library loading has a safety ceiling of 20,000 rows per fetched table. Implement server-side search/pagination before that scale. Refresh is explicit; no push notification or emergency-response promise is made.
- Private practice records can be edited by their owner; quiz results are self-practice, not certified examination results. Participation badges are computed for engagement and do not grant roles or influence server-ranked points.
- Review keys need qualified verification. Distribution rights and attribution for the supplied copies should be confirmed for the intended public release.

Only the public Supabase URL/key belongs in config.js. Browser JavaScript is visible to visitors. Never commit database credentials, service_role/secret keys, private JWT signing material, SMTP credentials, or Turnstile secrets. The SDK license is retained in dist/vendor.
