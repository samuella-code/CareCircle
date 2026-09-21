# CareCircle AI

**Independent living, connected care.**

CareCircle is an accessible care-coordination MVP for adults aged 65+ and their trusted family members. This first version demonstrates a voice-first senior experience and a caregiver dashboard.

## Included in this MVP

- Senior-friendly home screen with large, high-contrast controls
- Simulated voice assistant interaction
- Medication and appointment schedule
- Daily wellbeing check-in
- Help-request contact flow
- Trusted-family quick calling
- Caregiver overview, medication status, care tasks, and activity history
- Responsive mobile and desktop layouts
- Synthetic demonstration data only

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown by Vite. Use the **Senior view / Family view** switch at the top to test both experiences.

## Production build

```bash
npm run build
npm run preview
```

## Safety note

This prototype is a care-coordination demonstration, not a medical device. It does not diagnose conditions, contact emergency services, or perform validated fall detection. Production emergency and health features require reliable integrations, explicit consent, security review, clinical input, and applicable regulatory review.

## Suggested next phase

Connect a FastAPI/PostgreSQL backend, authentication, role-based permissions, push notifications, speech-to-text, consent records, audit logs, and a validated device integration layer.
