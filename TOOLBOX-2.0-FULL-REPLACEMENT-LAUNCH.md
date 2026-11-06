# Toolbox 2.0 — Full Replacement and Google Play Launch Plan

Decision (2026-11-06): Toolbox 2.0 development is the complete replacement for the existing Toolbox. This supersedes TOOLBOX-1.0-LAUNCH-SCOPE.md and any earlier proposal to launch a reduced 1.0 instead. Do not discard planned features solely to accelerate an MVP.

## Source of truth
- Complete and stabilize the existing Toolbox 2.0 roadmap on toolbox-2-development.
- Preserve Toolbox's anchor logo, wrench mascot, offline-first behavior and established product identity.
- Include core Home, Plus, Account, Learn, Documents with verified encrypted sensitive storage, Voyage/Sea Service, Maritime CV, reminders and the agreed interaction refinements.
- Maintain lightweight smooth animations, offline operation, accessible gestures and persistent record ordering where agreed.
- Optional cloud and purchase features must follow the agreed product model and store rules, with explicit validation of security and entitlements.

## Execution sequence
1. Diagnose and fix the failing GitHub Actions npm test step; obtain passing CI on the exact branch commit.
2. Finish and validate secure storage/migration/recovery and remaining planned Toolbox 2.0 features, using synthetic data until safe.
3. Produce a consolidated phone-test build; collect user screen recordings and prioritized feedback in one batch.
4. Fix issues, run automated tests and real-device QA; verify offline behavior, privacy, accessibility and performance.
5. Prepare Android packaging, signing, app bundle (.aab), Play Console metadata, privacy disclosures and testing requirements.
6. Merge toolbox-2-development into main only after the release candidate is approved and verified.
7. Build a signed release artifact from the verified source and submit to Google Play, subject to account access and store review.
8. Continue iOS packaging/TestFlight/App Store after Android milestone.

## Release safeguards
- A successful Cloudflare Pages build is not proof that GitHub tests pass or that an Android release artifact exists.
- No real sensitive documents in plaintext; migration must be proven before activation.
- Never claim a signed .aab, store submission, or approved release without actual artifacts and confirmation.
