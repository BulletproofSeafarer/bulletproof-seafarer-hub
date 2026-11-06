# Toolbox 2.0 — Google Play Production & Closed-Test Acceptance Gate

Status: planning and verification checklist, NOT a claim of launch readiness.
Supersedes any reduced 1.0/MVP proposal. Toolbox 2.0 replaces the existing product only after validation.

## Automated and functional acceptance
- GitHub Actions npm test must pass on the exact candidate commit; collect failing test names/logs and fix root causes.
- Test all shipped flows with synthetic data: Home, Plus, Account, Learn, Voyage/Sea Service, historical entries, CV, Reminders, Documents, ordering, backup/recovery.
- Test cold start, app update, offline launch, offline writes, restart persistence, slow network, low-memory device, permission denial, and no data loss.
- Sensitive documents must use verified encryption at rest, secure migration and recovery. Never expose unencrypted legacy records as production-safe.
- Verify accessibility, text scaling, reduced motion, touch targets, safe areas and responsive transitions. Avoid heavy animation libraries.

## Android release
- Decide and implement native packaging; a Cloudflare URL is not a Google Play Android bundle.
- Confirm application ID, version code/name, app signing, release keystore custody, reproducible signed .aab, target API >=36 for new phone apps as of November 2026, supported minimum API and device compatibility.
- Verify app icon, launch screen, offline assets, storage permissions, back navigation, updates, billing/entitlements and privacy policy.
- Complete Play Console Data Safety, content rating, target audience, app access instructions if needed, screenshots, listing, support contact and disclosures.
- Validate purchase model and Google Play Billing if charging for digital features or app access.

## Closed testing
- Internal test first; closed test on signed candidate build with representative seafarers.
- For qualifying personal developer accounts created after 2023-11-13: >=12 opted-in testers continuously for >=14 days, then apply for production access. Confirm actual Play Console account requirements.
- Capture crash reports, feature coverage, offline tests, data safety findings and tester feedback. Fix blocking issues; submit updated builds as needed.
- Record what changed from tester feedback and evidence for production access questionnaire.

## Merge and production
- Approve candidate, green CI, device QA, security checks and store requirements before merging toolbox-2-development to main.
- Build and sign .aab from approved source, retain release tag and version metadata.
- Submit to Play Console, respond to review feedback, monitor staged rollout, preserve rollback/recovery plan.
- Post-launch changes use versioned updates, regression tests and controlled rollout; no silent data-destructive migrations.

## Current known blockers
- Latest shown GitHub Actions workflow fails at 'Run full automated test suite' (exit code 1); exact failing assertions not yet retrieved.
- Sensitive Documents encryption is not integrated into live storage and has not passed device migration/recovery tests.
- Android signed AAB and Play Console closed test have not been verified.
