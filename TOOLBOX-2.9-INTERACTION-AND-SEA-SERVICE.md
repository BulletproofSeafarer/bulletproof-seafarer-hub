# Toolbox 2.9 — iOS-Quality Interaction and Record Ordering

## Interaction quality
Use smooth native-feeling transitions, immediate touch feedback, reduced-motion support, responsive scrolling, consistent rounded corners and touch targets. Respect iOS/Android platform conventions and preserve Toolbox's existing branding. Avoid animation that slows navigation or causes layout shifts.

## Reorderable collections
Implement persistent custom ordering for Reminders, Sea Service and Documents list views where relevant. Provide accessible move-up/move-down alternatives to drag handles. Use stable IDs and explicit sortOrder fields, not array positions as identity. Offer custom and date sorting; preserve user choice across restarts and offline operation. Do not modify actual dates when reordering.

## Sea Service data model
Unify voyage-generated sign-on/sign-off records and manually entered historical contracts in one Sea Service history. Store source (voyage/manual), linkedVoyageId when applicable, stable ID, vessel, rank, sign-on/off dates, and user display order. Avoid duplicating linked voyage records. Handle ongoing contracts, missing sign-off dates, date corrections, and historical entries predating app use.

## Maritime CV
Generate CV from unified Sea Service records, with independent CV display ordering (default reverse chronological). Never treat reordered records as altered service dates. Flag incomplete or overlapping periods for review, without silently rewriting data. Keep originals and backups recoverable.

## Security boundary
This is an approved UX/data-model requirement, not authorization to move real sensitive Documents into plaintext or bypass the unfinished vault gate.

## Acceptance
Test with synthetic records: manual historical service, linked voyage, order persistence after reload, date sort reset, CV ordering, reminder reorder, document reorder, keyboard and accessibility, offline behavior, reduced motion.
