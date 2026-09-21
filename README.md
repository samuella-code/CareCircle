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

Open the URL shown by Vite. Use the **Senior view / Family view** switch at the top to test both experiences.

No API keys are needed for the current local-first MVP. Clear the site's browser storage to reset the demo.

## Production build

```bash
npm run build
npm run preview
```

## Safety note

This prototype is a care-coordination demonstration, not a medical device. It does not diagnose conditions, contact emergency services, or perform validated fall detection. Production emergency and health features require reliable integrations, explicit consent, security review, clinical input, and applicable regulatory review.

## Suggested next phase

Connect a FastAPI/PostgreSQL backend, authentication, role-based permissions, push notifications, speech-to-text, consent records, audit logs, and a validated device integration layer.
