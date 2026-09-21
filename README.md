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

## Sign-in and demo journey

The app opens on a role-based sign-in screen. For a presentation, use either demo button:

- **Enter as Grace (Senior):** medication reminders, daily check-in, CareCircle assistant, family calls, and help requests.
- **Enter as Amara (Family):** medication status, check-in status, urgent help alerts, and assignable care tasks.

Actions are shared between both roles on the same browser. For example, request help as Grace, sign out, then enter as Amara to see and resolve the alert.

The current sign-in and data store are an interactive local prototype, not production authentication. Real multi-device accounts require the planned API, encrypted database, verified contact invitations, role permissions, and notification service.

## What the current AI does

The CareCircle assistant accepts typed questions about Grace's medicines, appointments, trusted family, and help flow. It reads answers aloud when browser speech synthesis is available. It intentionally uses controlled answers in this offline health demo. Connecting a general AI model requires a protected server-side API key, consent rules, audit logging, and medical-safety guardrails; never put an AI API key in frontend code.

## Production build

```bash
npm run build
npm run preview
```

## Safety note

This prototype is a care-coordination demonstration, not a medical device. It does not diagnose conditions, contact emergency services, or perform validated fall detection. Production emergency and health features require reliable integrations, explicit consent, security review, clinical input, and applicable regulatory review.

## Suggested next phase

Connect a FastAPI/PostgreSQL backend, authentication, role-based permissions, push notifications, speech-to-text, consent records, audit logs, and a validated device integration layer.
