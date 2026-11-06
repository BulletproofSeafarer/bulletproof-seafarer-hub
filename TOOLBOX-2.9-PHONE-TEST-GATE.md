# Toolbox 2.9 — Consolidated phone-test gate

## Scope
This is a product-feedback preview, NOT a production Secure Vault release.
Use only dummy documents and attachments. Existing document attachments are unencrypted.
No account, payment, cloud sync, or real identity-document testing.

## Phone-test pass
1. Home: ship name visibility, voyage card readability, progress, small-screen wrapping.
2. Plus: quick-action layout, tap targets, action destinations, modal behavior.
3. Account: rounded profile cards, editing, legibility, scroll and navigation.
4. Voyage Ready: create/edit voyage, packing and requirements, persistence after restart.
5. Documents: dummy metadata, dummy attachment capture, expiry reminders, backup/export and restore using dummy data only.
6. Learn: offline launch, navigation, existing learning content and imported questions.
7. General: airplane mode, reopen app, pull-to-refresh where supported, back navigation, accessibility text size.

## Release conditions
- Run npm test and record result; resolve any regressions.
- Verify preview URL points to development branch, not production.
- Confirm no production secrets, payments, or real-data prompts.
- Verify visible test-only warnings remain on Documents and Account.
- Test install/open/offline smoke behavior on at least one device.
- Record known limitations for tester.

## Feedback format
For each issue: screen, action, expected behavior, actual behavior, severity, screenshot/video timestamp.
Collect issues in one batch. Prioritize data loss/crashes first, then navigation and layout.
