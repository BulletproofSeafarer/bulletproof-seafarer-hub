# Toolbox 2.0 — launch gates and evidence register

Status: Development. This document is a release control, **not a declaration of readiness**.
Branch: `toolbox-2-development`. Production must not receive security claims until verified.

## Rules
- Gates are **NOT TESTED** until evidence exists. A commit or syntax check alone is not a pass.
- Each gate records: build SHA, platform/device/OS, offline/online condition, steps, expected/actual result, tester, date, and linked issue.
- Block release for data loss, plaintext sensitive records, broken purchases/restoration, unauthorized access, or a failing essential offline workflow.
- No real identity, passport, or medical documents in pre-security test builds.
- Preserve existing records and keep reversible migrations; never silently delete legacy data.
- Batch related changes and run automated tests continuously. Request a consolidated device test at each stable phase, not after every commit.

## Phase 1 — Architecture and baseline [IN PROGRESS]
- [ ] Inventory all screens, data stores, and network dependencies.
- [ ] Resolve duplicate Learn renderers without losing progress.
- [ ] Establish test fixtures, CI checks, issue triage, crash logging without personal data.
- [ ] Verify branding, navigation, and accessibility baseline.
Exit: documented architecture and passing baseline regression suite.

## Phase 2 — Offline Secure Vault [IN PROGRESS]
- [x] Disposable AES-GCM/PBKDF2 browser crypto preflight implemented (phone self-test previously reported passed; **not a vault test**).
- [x] Passphrase-encrypted document backup code implemented (restore not device-verified).
- [x] Read-only encrypted backup verification module committed (not device-verified).
- [ ] Verify encrypted backup decryption, attachment integrity, wrong-passphrase rejection and read-only behavior on device.
- [ ] Implement and test encrypted local metadata and attachment storage; no plaintext persistence after safe migration.
- [ ] Provide device-supported unlock, inactivity lock, secure key handling and recovery that works offline.
- [ ] Test migration from legacy plaintext with rollback, storage exhaustion, crash/restart, and interrupted writes.
- [ ] Verify local backup/restore and lost-device recovery with dummy data.
- [ ] Independent security review before accepting real sensitive documents.
Exit: no critical data loss, privacy or cryptographic findings; recovery verified.

## Phase 3 — Core product [NOT STARTED AS A RELEASE GATE]
- [ ] Learn modules, question provenance, accuracy and distribution rights reviewed (especially third-party OLP content).
- [ ] Documents, Voyage Ready, reminders, dates/time zones, utilities, Profile complete.
- [ ] No placeholder actions, raw internal errors, or broken navigation.
- [ ] Premium light UI, mascot/logo identity, native-feeling interactions, accessibility and reduced motion verified.
Exit: all primary journeys complete on supported target devices.

## Phase 4 — Optional Cloud and payments [NOT STARTED]
- [ ] Offline app works without an account; store purchase entitlement and restore tested.
- [ ] Optional Cloud sign-in and secure account recovery; no routine OTP requirement where passkeys work.
- [ ] E2EE cloud backup and cross-device recovery independently validated; server cannot decrypt user files.
- [ ] Backend authorization, RLS/security rules, key rotation, subscription entitlement and cancellation tested.
- [ ] Failed sync, concurrent edits, account deletion and subscription expiration never lock local purchased functionality.
Exit: identity, billing, encryption and recovery scenarios pass.

## Phase 5 — Quality and performance [NOT STARTED]
- [ ] CI unit, integration, end-to-end, and migration regression suites pass.
- [ ] Cold start, interaction latency, memory, battery, storage and large attachments measured against device-specific budgets.
- [ ] Airplane mode, weeks-offline simulation, network flapping, low storage, timezone changes, device reboot tested.
- [ ] Accessibility, screen readers, touch targets, contrast, localization, error states verified.
- [ ] Threat model, dependency review, privacy audit, and critical defect triage complete.
Exit: zero unresolved critical/high release blockers, agreed performance budgets met.

## Phase 6 — Distribution and compliance [NOT STARTED]
- [ ] Native Android and iOS packages built, signed, reproducible and versioned.
- [ ] Google Play Console internal testing and closed-testing requirements for this account verified.
- [ ] Apple Developer enrollment, TestFlight, App Store Connect and platform-specific permissions ready.
- [ ] Google Play Billing / Apple in-app purchase, refund, restore and subscription policies verified.
- [ ] Privacy policy, data safety, nutrition/learning disclaimers as applicable, support, screenshots and listings reviewed.
Exit: store review submissions ready, without overstated security or content claims.

## Phase 7 — Beta, release and operations [NOT STARTED]
- [ ] Internal Android test passed.
- [ ] Google Play closed testing passed.
- [ ] iOS TestFlight passed.
- [ ] Seafarer testers completed representative offline journeys.
- [ ] Release candidate frozen; full regression and recovery rehearsal passed.
- [ ] Rollback, incident response, support and privacy-safe monitoring in place.
- [ ] Go/No-Go signoff: security, reliability, product, stores and support.
Exit: staged public release and post-launch monitoring.

## Evidence log (append only)
| Date | Gate | Build SHA | Device / OS | Evidence | Status | Owner |
|---|---|---|---|---|---|---|
| 2026-11-05 | Phase 2 backup verification | Pending device test | Pending | Code committed; no on-device verification | NOT TESTED | Pending |

## Deferred refinements
Feature ideas discovered during beta go into the backlog unless they fix a release blocker. Do not expand first-release scope merely to match competitors.
