# NutriPK — Project README

This repository contains NutriPK: a food-tracking/training project with a React Native Expo mobile app and a FastAPI + MongoDB backend. This README documents the recent changes made across the codebase (frontend and backend), how to run the project locally, how to verify timezone correctness for Pakistan (Asia/Karachi), files edited during the session, and next steps.

---

## Summary of recent work

During the current development session several focused changes were implemented to improve the Home screen UX, timezone correctness, Weekly Summary visuals, camera scrolling, and data persistence for water intake. Key highlights:

- Home screen

  - Top attached header with profile, PK-local date display, and bell icon UI (visual adjustments done in `app/Home.jsx`).
  - Previous/Next date arrows implemented so users can browse days other than today.
  - Calories donut now shows the consumed value in the center and animates when values change.
  - Macronutrient stat cards show consumed grams and percent-of-target (uses public profile targets fetched from the backend).
  - Water input uses 8 tappable glass icons; saving water persists to the backend using FormData (POST `/api/user/water`) and triggers a UI update in Weekly Summary via an in-app event emitter.
  - Recent Meals list now filters meals by Pakistan local date (Asia/Karachi) so meals saved after midnight PK are grouped correctly into 'today'.

- Weekly Summary

  - Reordered weekly summary to show Monday → Sunday consistently.
  - Water visualization changed from line strokes to rounded bar rectangles (with numeric labels above each bar) for clarity.
  - Nutrients trend chart improved with gridlines, point markers, and dual scales (calories vs macros) to avoid flattening macro lines.
  - Card background updated to white and a heading `Nutrients Trend` added for visual consistency.

- Date/time handling

  - Robust date parsing utilities were added/updated in `app/utils/dateUtils.js`. These handle numeric epoch values, timezone-aware ISO strings, and timezone-less ISO strings (treated as UTC). A `toPKDate` utility is exported and used across the app to compute the Pakistan local wall-clock date for grouping meals and water by day.

- Camera

  - Fixed the Camera screen scroll behavior on small devices by adjusting `ScrollView` content styles.

- Small infrastructure additions
  - Added a tiny in-app event emitter (`app/utils/events.js`) used to notify Weekly Summary to refresh after water updates.

---

## Files changed (important ones)

Frontend (mobile-app/NutriPKExpo/app):

- `Home.jsx` — main dashboard: PK date handling, donuts showing center values, macronutrient computations, water FormData POST, event emit on water save, recent meals filtering by PK date, navigation wiring to MealDetails/Camera.
- `WeeklySummary.jsx` — weekly aggregation visualizations: ordered Mon→Sun summary, water rounded bar glyphs with labels, nutrients chart dual scales and gridlines, white card + heading.
- `utils/dateUtils.js` — robust date parsing and formatting helpers; exports `toPKDate` used for all PK date comparisons.
- `utils/events.js` — very small in-process event emitter.
- `tabs/Camera.jsx` — camera screen scroll behavior fix.

Backend (backend/app):

- `routes/user.py` — (reviewed): exposes endpoints for meals, public profile and water save/get. Water POST will upsert a document keyed by `{ email, date }`.
- `routes/weekly_summary.py` — (reviewed): builds PK weekly buckets (Monday start) and aggregates meals and water counts. Returned summary includes day labels and totals used by the frontend.

Note: The above list focuses on the files edited/inspected during this session. Other files exist in the repo (models, utilities, and dataset folders) but were not modified.

---

## How to run locally

Prerequisites

- Node.js + npm (for running the Expo app and installing packages).
- Expo CLI (recommended): `npm install -g expo-cli`.
- Python 3.10+ and pip for the backend.
- MongoDB (local or remote) and the backend `.env` configured to point to it.

Backend (FastAPI)

1. Open a terminal and change to the backend folder:

```powershell
cd backend
```

2. (Optional) Create and activate a virtual environment.

3. Install Python dependencies:

```powershell
pip install -r requirements.txt
```

4. Start the uvicorn server (recommended to run from the `backend` directory so `app` resolves):

```powershell
# from repository root
cd backend; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

If you prefer running uvicorn from the repo root, use the `--app-dir` flag:

```powershell
uvicorn app.main:app --reload --app-dir backend --host 0.0.0.0 --port 8000
```

Frontend (Expo / React Native)

1. Open a terminal and change to the mobile app folder:

```powershell
cd mobile-app\NutriPKExpo
```

2. Install node dependencies:

```powershell
npm install
# or
pnpm install
```

3. Start the Expo dev server (Tunnel recommended for a real device):

```powershell
npx expo start -c --tunnel
```

4. Open the project on your device or emulator via the Expo Go app or a native build.

API base URL

By default the mobile app expects the backend at `http://127.0.0.1:8000` while testing on an emulator. If you run the app on a real device, update the API base URL to your machine's LAN IP (or configure an ngrok/tunnel).

---

## How to verify Pakistan (Asia/Karachi) date handling

The core requirement is: any timestamp saved by the backend (which may be an ISO string in UTC or with offsets) should be grouped into the user's local PK date (YYYY-MM-DD) for the Home 'today' and for Weekly aggregation. To verify:

1. Start the backend and the Expo app.
2. In the app, create/save a meal with a timestamp close to midnight UTC (for example: `2025-11-08T19:03:28.062+00:00` which is `2025-11-09T00:03:28.062+05:00` PK).
3. Open the Home screen; switch to the PK date that corresponds to the PK local wall-clock date for that meal (the app's date header displays PK dates). The meal should appear under 'Recent Meals' for that PK date.

Automated sanity check (example server request):

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/user/weekly-summary?email=youremail@example.com' -Method GET | ConvertTo-Json -Depth 6
```

The returned JSON `summary` contains 7 days (Mon→Sun) and `waterGlasses` per day. Verify that the day counts match expectations for PK local dates.

---

## API endpoints used by the mobile app (important)

- `GET /api/user/meals?email=<email>` — returns all meals for a user.
- `GET /api/user/profile-public?email=<email>` — returns public profile with nutrient targets.
- `GET /api/user/water?email=<email>` — returns water records for this user.
- `POST /api/user/water` — upserts water record for `email` and `date` (YYYY-MM-DD) with `glasses` count.
- `GET /api/user/weekly-summary?email=<email>` — returns aggregated week summary used by Weekly Summary.

If you change backend host/port, update the mobile app's API base URL accordingly.

---

## How the date logic works (short technical note)

- Meals timestamps may be stored in various ISO formats or as numeric epochs. The frontend `app/utils/dateUtils.js` parser handles these formats, converts parsed datetimes to UTC when offsets are present, and then computes the Pakistan local date (Asia/Karachi) by applying the +05:00 offset (or using a timezone library's conversion). The `toPKDate` function returns a Date object representing the PK local wall-clock time for a given timestamp; `toISODate` produces the YYYY-MM-DD string used for grouping.

Important: Always convert stored timestamps to PK local date with `toPKDate` before comparing or grouping by calendar day.

---

## Known issues and notes

- Dev-only console logging was added during debugging to trace problematic timestamps and nutrient extraction logic. These logs are useful during QA but should be removed or gated behind a debug flag before production.
- The in-app event emitter is an in-memory pub/sub mechanism for immediate frontend refreshes and does not replace persistent synchronization. If the app reloads or a new session starts, the Weekly Summary will fetch data from the backend on mount.
- The backend must be started from the `backend` folder or with `--app-dir backend` to avoid `ModuleNotFoundError: No module named 'app'`.

---

## Next steps / recommended follow-ups

1. Verify navigation: ensure tapping a meal opens `MealDetails` and that the 'Add your first meal' link opens the Camera. (Todo: `Home.jsx` and `MealDetails.jsx` navigation tests.)
2. Remove or gate console logs used for debugging.
3. Optional: polish the nutrients chart in Weekly Summary (legend, unit labels, tooltips on point tap).
4. Add unit/integration tests for date parsing (examples: timezone-less ISO strings, numeric epoch seconds vs milliseconds, ISO with offset) to prevent regressions.
5. Add an automated e2e test (Detox or similar) to confirm the PK 'today' behavior for edge-case timestamps.

---

## Changes recorded in this session (short changelog)

- Exported `toPKDate` and improved date parsing in `app/utils/dateUtils.js`.
- Updated `app/Home.jsx` to:
  - use PK-based date filtering for Recent Meals,
  - show consumed calories inside the donut and animate changes,
  - post water using FormData and emit an update event.
- Updated `app/WeeklySummary.jsx` to reorder Mon→Sun and show water as rounded bars with numeric labels and a dual-scale nutrients chart.
- Added `app/utils/events.js` (tiny subscribe/emit module).
- Fixed `app/tabs/Camera.jsx` ScrollView content style for small screens.

- Added `app/OnboardingSetupProfile.jsx` to initially mnage user;s profile.
