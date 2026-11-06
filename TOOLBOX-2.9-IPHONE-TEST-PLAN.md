# Toolbox 2.9 — Consolidated iPhone UX Test

This is a **prototype UX test**, not a production/security acceptance test. Use dummy Documents data only.

## One testing session
1. Open the development preview of `toolbox2.html` (not the production/main deployment). Record browser, device and whether installed to Home Screen.
2. Home: create/select a dummy voyage; check ship name clarity, voyage progress, spacing, scrolling, and small-screen layout.
3. Plus: open each Quick Create action; check button sizes, labels, transitions, cancel/back, and return to Home.
4. Account: edit a dummy preferred name; inspect profile cards, text contrast, privacy messages, and bottom navigation.
5. Learn and Voyage Ready: explore existing lessons, check progress and empty states. Avoid importing third-party copyrighted material.
6. Documents: add a dummy record with a synthetic image only. Verify add, reopen, edit and delete. **Do not enter real IDs, passport photos, medical records, or personal documents.**
7. Offline: load the app once while connected; switch to airplane mode and revisit the main tabs. Record exactly what works or fails.
8. Accessibility: check long vessel names, text scaling, keyboard overlap, safe areas and gesture/back behavior.

## Feedback format
For each issue capture: screen, action taken, expected result, actual result, severity (blocker/high/medium/low), and a screenshot or screen-recording timestamp.

## Exit criteria
- One consolidated feedback batch reviewed and prioritized.
- No claim of encrypted Documents, verified CI, or production readiness.
- Security work remains frozen/isolated until independently verified.
