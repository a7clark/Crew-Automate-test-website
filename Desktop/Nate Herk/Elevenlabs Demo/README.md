# Crew Automate — ElevenLabs Voice Agent Demo

A branded landing page demonstrating a conversational AI voice agent powered by ElevenLabs.

## Setup

1. Get your Agent ID from [ElevenLabs Conversational AI](https://elevenlabs.io/conversational-ai)
2. Open `index.html` and replace `YOUR_AGENT_ID_HERE` with your real agent ID
3. Serve locally: `node serve.mjs` → opens at `http://localhost:3000`

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure and markup |
| `styles.css` | All visual styles and animations |
| `script.js` | Waveform generation + orb→widget click bridge |
| `logo.jpeg` | Crew Automate logo (nav) |

## ElevenLabs Widget

The `<elevenlabs-convai>` custom element renders a floating button. The voice orb on the page forwards its click event to the widget's shadow DOM button so either can start a conversation.
