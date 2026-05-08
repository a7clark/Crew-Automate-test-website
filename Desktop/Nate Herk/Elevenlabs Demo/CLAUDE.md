# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

Demo project for a YouTube tutorial on building ElevenLabs voice agents with Claude Code. The goal is a single-page web demo that showcases ElevenLabs conversational AI integration (voice widget, agent config, etc.).

## Local Dev Server

```bash
node serve.mjs          # serves project root at http://localhost:3000
node screenshot.mjs http://localhost:3000
```

`serve.mjs` and `screenshot.mjs` live in the project root. Always screenshot from `localhost`, never `file:///`.

## Output Convention

- Single `index.html` with all styles inline
- Tailwind CSS via CDN
- Mobile-first responsive

## ElevenLabs Integration

- Conversational AI widget is embedded via the ElevenLabs script tag (`elevenlabs.io/convai`)
- Agent IDs and API keys go in `.env` — never hardcode in HTML
- Widget config options: `agent-id`, `action-text`, `start-call-text`

## Environment Variables

Copy `.env.example` → `.env` before running. Required keys:
- `ELEVENLABS_AGENT_ID` — the Conversational AI agent ID
- `ELEVENLABS_API_KEY` — only needed for server-side calls (not required for public widget embed)
