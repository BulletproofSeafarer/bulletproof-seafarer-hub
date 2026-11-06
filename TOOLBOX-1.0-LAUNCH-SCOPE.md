# Toolbox 1.0 — Launch-First Scope Freeze (2026-11-06)

## Objective
Ship a lightweight, polished, offline-first Toolbox to Google Play and Apple App Store as soon as the minimum safety, functionality and store compliance gates are met. Preserve existing brand, anchor icon and wrench mascot.

## Required launch gates
1. Fix failing GitHub Actions npm test suite and confirm green CI on the exact release candidate.
2. Verify reliable offline launch, navigation, storage persistence, recovery after app restart, and no destructive data migration.
3. Personal documents: ship only if encrypted local storage, migration and recovery are verified on devices. Otherwise disable sensitive document entry/attachments and clearly communicate their future availability; never ship plaintext sensitive storage as secure.
4. Validate voyage, historical Sea Service, CV, Learn and other retained features with synthetic data. Fix blockers, avoid adding new scope.
5. Native Android/iOS packaging, signing, app icons, versioning, privacy disclosures, permissions, support links, store listings, purchase model and store policy checks.
6. Internal testing/closed beta/TestFlight on real devices; resolve crashes and critical UX issues before store submission.
7. Confirm app purchase/offline entitlement handling, or explicitly choose a compliant alternative release model before submission.

## Lightweight premium UX
Native scrolling, CSS transform/opacity transitions, responsive taps, consistent rounded cards, 60fps where feasible, reduced motion, no heavy animation dependencies. Keep Home vessel name, Plus quick actions and Account readable.

## Post-launch backlog
Drag-to-reorder Reminders, Sea Service and Documents; completed reminder check slides to bottom; independent Sea Service/CV ordering; expanded native-like motion; optional Bulletproof Cloud subscription and other enhancements. Preserve historical sea-service requirements and data model in existing specification.

## Release boundary
A successful Cloudflare Pages deployment is not a native store-ready binary. No production release until store-specific builds, privacy and purchase checks, and device testing are complete.
