# Design: Nero — ElevenLabs Voice Sales Agent with Cal.com Booking

**Date:** 2026-05-09  
**Status:** Approved

---

## Problem

Nero (AI automations consultancy) wants a voice sales agent on their Webflow landing page that can answer questions, qualify visitors, and book discovery calls — entirely by voice, with no hand-off to a booking link.

---

## Architecture

```
Visitor on Nero (Webflow site)
        ↓  clicks floating voice button (ElevenLabs widget)
ElevenLabs Conversational AI — "Aria"
        ↓  system prompt: Nero sales persona + business knowledge
        ↓  tool: check_availability  →  Cal.com v2 API  GET /slots/available
        ↓  tool: book_meeting        →  Cal.com v2 API  POST /bookings
        ↓  confirms booking verbally
Visitor ends call — meeting in Nero's Cal.com calendar, confirmation email sent
```

**No backend.** Cal.com API key stored in ElevenLabs tool config (server-side). Three surfaces:
1. ElevenLabs dashboard — agent + tools
2. Cal.com dashboard — API key + event type
3. Webflow custom code — 3-line embed

**Fallback:** If Cal.com free plan rejects booking API (403), replace `book_meeting` with a `get_booking_link` tool that returns the Cal.com URL and have the agent read it aloud.

---

## Agent System Prompt

```
You are Aria, a friendly and knowledgeable AI assistant for Nero, an AI automations
and workflows consultancy. Your job is to have natural conversations with visitors,
answer questions about Nero's services, and help interested prospects book a free
30-minute discovery call.

## About Nero
Nero helps businesses build custom AI automations and workflows — from internal
process automation to customer-facing AI tools. Clients typically include SMBs and
growing companies looking to save time, reduce manual work, and move faster with AI.
Discovery calls are 30 minutes, free, no obligation.

[FILL IN: 2-3 sentences about specific services, results, or differentiators]

## Conversation Playbook
1. Open warmly — "Hi there! I'm Aria from Nero. What brings you to the site today?"
2. Listen and qualify — ask about their current processes and pain points
3. Bridge to the call — when a pain point surfaces, offer the discovery call
4. Collect info — ask for first name and email when they agree
5. Check availability — use check_availability tool, present 2-3 options
6. Book the meeting — use book_meeting tool, confirm verbally with email address

## Hard Rules
- Never quote prices or make financial commitments
- Unknown questions → "Great topic for the call"
- Keep responses concise (voice conversation, not chat)
- Only book the discovery call event type
- If they decline, be gracious and close warmly

## Tone
Professional but warm. Consultative, not pushy.
```

---

## Cal.com Tools (ElevenLabs HTTP Tool Config)

**Tool 1 — `check_availability`**
- Method: GET
- URL: `https://api.cal.com/v2/slots/available`
- Headers: `Authorization: Bearer <cal_key>`, `cal-api-version: 2024-08-13`
- Query params: `eventTypeId`, `startTime` (today ISO), `endTime` (5 days ISO)

**Tool 2 — `book_meeting`**
- Method: POST
- URL: `https://api.cal.com/v2/bookings`
- Headers: `Authorization: Bearer <cal_key>`, `Content-Type: application/json`, `cal-api-version: 2024-08-13`
- Body: `{ "eventTypeId": N, "start": "<ISO>", "attendee": { "name": "...", "email": "...", "timeZone": "America/New_York" } }`

---

## Webflow Embed

```html
<elevenlabs-convai agent-id="agent_XXXXXXXXXXXX"></elevenlabs-convai>
<script src="https://elevenlabs.io/convai-widget/index.js" async type="text/javascript"></script>
```

Place in: Webflow → Site Settings → Custom Code → Footer Code.

Optional brand color:
```css
elevenlabs-convai { --el-convai-button-color: #YOUR_COLOR; }
```

---

## Outstanding Before Implementation

| Item | Source |
|------|--------|
| Cal.com event type URL + numeric ID | cal.com → Event Types → edit URL |
| Cal.com API key | cal.com → Settings → Developer → API Keys |
| Nero-specific copy for system prompt | User to provide |
| Agent name (default: Aria) | User to confirm |
| Nero brand color for widget | Nero site CSS |

---

## Verification

- [ ] Agent responds correctly in ElevenLabs test console
- [ ] `check_availability` returns real slots (no 403)
- [ ] `book_meeting` creates booking visible in Cal.com calendar
- [ ] Confirmation email arrives at test address
- [ ] Widget appears on published Webflow site
- [ ] Full end-to-end voice test passes
