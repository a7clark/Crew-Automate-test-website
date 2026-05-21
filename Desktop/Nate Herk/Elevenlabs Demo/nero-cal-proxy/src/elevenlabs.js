import { buildSystemPrompt } from './prompt.js';

const EL_BASE = 'https://api.elevenlabs.io';

export async function createAgent(client, workerBaseUrl, apiKey) {
  const prompt = buildSystemPrompt(client);
  const { slug, businessName, agentName, voiceId } = client;

  const body = {
    name: `${businessName} — ${agentName}`,
    conversation_config: {
      agent: {
        prompt: {
          prompt,
          llm: 'claude-3-5-sonnet',
          tools: [
            buildCheckAvailabilityTool(`${workerBaseUrl}/${slug}/slots`),
            buildBookMeetingTool(`${workerBaseUrl}/${slug}/book`),
          ],
        },
        language: 'en',
      },
      tts: {
        voice_id: voiceId,
      },
    },
  };

  const res = await fetch(`${EL_BASE}/v1/convai/agents/create`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`ElevenLabs createAgent failed (${res.status}): ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.agent_id;
}

export async function patchAgentPrompt(agentId, client, apiKey) {
  const prompt = buildSystemPrompt(client);

  const res = await fetch(`${EL_BASE}/v1/convai/agents/${agentId}`, {
    method: 'PATCH',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation_config: {
        agent: {
          prompt: { prompt },
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`ElevenLabs patchAgent failed (${res.status}): ${JSON.stringify(err)}`);
  }
}

function buildCheckAvailabilityTool(url) {
  return {
    type: 'webhook',
    name: 'check_availability',
    description: 'Get available discovery call time slots. Call this when the visitor agrees to book. Pass their IANA timezone (e.g. America/Chicago). Returns a list of slots with human-readable display strings.',
    api_schema: {
      request_headers: {},
      url,
      method: 'GET',
      path_params_schema: {},
      query_params_schema: {
        properties: {
          timeZone: {
            type: 'string',
            description: "Visitor's IANA timezone string, e.g. America/New_York",
          },
        },
        required: ['timeZone'],
      },
      request_body_schema: null,
      response_body_schema: null,
      content_type: 'application/json',
      auth_connection: null,
    },
  };
}

function buildBookMeetingTool(url) {
  return {
    type: 'webhook',
    name: 'book_meeting',
    description: 'Book a discovery call for the visitor. Call after they confirm a slot. Requires their name, email, the ISO datetime of the chosen slot, and their timezone.',
    api_schema: {
      request_headers: {},
      url,
      method: 'POST',
      path_params_schema: {},
      query_params_schema: null,
      request_body_schema: {
        type: 'object',
        required: ['visitor_name', 'visitor_email', 'start'],
        properties: {
          visitor_name: { type: 'string', description: "Visitor's full name" },
          visitor_email: { type: 'string', description: "Visitor's email address" },
          start: { type: 'string', description: 'ISO 8601 datetime of the chosen slot (the iso field from check_availability)' },
          visitor_timezone: { type: 'string', description: "Visitor's IANA timezone string" },
        },
      },
      response_body_schema: null,
      content_type: 'application/json',
      auth_connection: null,
    },
  };
}
