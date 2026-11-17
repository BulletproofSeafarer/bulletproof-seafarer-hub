# Toolbox preview

A document-first, iPhone-sized web preview built with React, TypeScript, Vite, and compiled Tailwind CSS.

## Run locally

Use Node 22.16 or newer.

```sh
npm ci
npm run build
npm run preview -- --port 4173
```

Open http://localhost:4173. To try offline use, open the production preview online at least once so the service worker can finish caching the app.

## Try the sample voyage

1. Open **Home**. The sample voyage has one of three required documents ready. The dock links to Home, Documents, Tools, and Account.
2. Select **Voyage Ready** and open **Basic Safety Training**. Edit its expiry to a date after joining. The requirement should change to Met, and its renewal reminder should disappear if the new date is outside the reminder window.
3. From Voyage, open the missing **Medical Certificate**, enter a future expiry date and attach a sample PDF or image. Save, reload, open it from Documents, and try Download. Mark the remaining checklist task complete to see **Voyage Ready**.
4. Open **Tools** and try a utility. The calculations come from the documents-first branch. Weather resources open external links and need connectivity.
5. Open **Account → Maritime CV**, choose certificates, and select **Download PDF**. The top Account toolbar also gives direct access to Edit, Download CV, and Settings. The preview uses the profile, sea-service records, and selected certificates. Self-entered certificates are labeled Self-reported.

## Code and scope

- `src/storage.ts` defines the shared record model and the storage interface. The preview persists records and attachments together in browser IndexedDB.
- `src/readiness.ts`, `src/reminders.ts`, and `src/cv.ts` derive their outputs from that model.
- The original seven utility implementations and app icon come from `toolbox-documents-first` at commit `6851b7afe37e221b334fa9ad870e065649f17a1c`. The preview builds a new voyage screen for a single active voyage and reimplements the career screens around the shared records. Legacy voyage history and the learning library are outside this preview.
- Use fictional documents. This browser preview does not provide the existing app’s encrypted vault or migrate its records. Authentication, cross-device sync, and TestFlight publishing are outside this build.
- The static output can serve as a Capacitor web directory. A native iOS package is outside this deliverable. On a physical iPhone, verify the Files and Photos pickers, PDF preview, share sheet, print export, safe areas, and offline storage before a TestFlight release. iOS notifications require separate integration.

## Seafarer Services

Open **Tools** and use a task shortcut, category, or search. The directory retains the 22 links from the existing Toolbox source. For providers with physical locations, **Find on map** opens a provider-name search in Apple Maps or Google Maps. These searches can return multiple branches. Confirm the branch with the provider before travelling. The app lists services offline, but external sites and maps require connectivity.
