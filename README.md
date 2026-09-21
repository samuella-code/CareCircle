# CareCircle AI

**Independent living, connected care.**

CareCircle is an accessible care-coordination MVP for adults aged 65+ and their trusted family members. This first version demonstrates a voice-first senior experience and a caregiver dashboard.

## Included in this MVP

- Senior-friendly home screen with large, high-contrast controls
- Voice assistant with spoken schedule and medication answers
- Persistent medication completion and appointment schedule
- Daily wellbeing check-in with mood sharing
- Help requests that appear as resolvable caregiver alerts
- Trusted-family quick calling
- Caregiver overview with live medication and check-in status
- Add, assign, complete, and persist family care tasks
- Responsive mobile and desktop layouts
- Browser storage so demo changes survive refreshes
- Synthetic demonstration contacts and health data only

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown by Vite and choose a role on the sign-in screen.

No API keys are needed for the current local-first MVP. Clear the site's browser storage to reset the demo.

## Full-stack sign-in and care-circle journey

CareCircle now includes a FastAPI backend with password hashing, signed sessions, SQLite storage, protected care records, and role-based Senior/Family accounts.

- A senior creates an account and receives a private six-character invitation code under **My Circle**.
- A family caregiver creates a caregiver account and enters that code to join the senior's circle.
- Medication updates, check-ins, help alerts, and tasks are saved in the backend database and appear for linked accounts.

Run the backend before starting the frontend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export CARECIRCLE_SECRET="replace-with-a-long-random-secret"
uvicorn main:app --reload --port 8000
```

In a second terminal, run `npm run dev`. The frontend uses `http://localhost:8000` by default. For a deployed API, set `VITE_API_URL` before building.

## What the current AI does

The CareCircle assistant sends authenticated questions to the backend and answers from the signed-in senior's care data. It reads answers aloud when browser speech synthesis is available. It intentionally uses controlled health-safe answers. A later provider integration can be added server-side without exposing an AI API key in frontend code.

## Production build

```bash
npm run build
npm run preview
```

## Safety note

This prototype is a care-coordination demonstration, not a medical device. It does not diagnose conditions, contact emergency services, or perform validated fall detection. Production emergency and health features require reliable integrations, explicit consent, security review, clinical input, and applicable regulatory review.

## Suggested next phase

Connect a FastAPI/PostgreSQL backend, authentication, role-based permissions, push notifications, speech-to-text, consent records, audit logs, and a validated device integration layer.
