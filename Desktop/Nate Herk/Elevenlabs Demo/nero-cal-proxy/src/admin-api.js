import { hashPassword, verifyClientAuth } from './auth.js';
import { createAgent, patchAgentPrompt } from './elevenlabs.js';
import { json } from './cal.js';

export async function handleAdminAPI(request, env) {
  const url = new URL(request.url);
  const subpath = url.pathname.replace(/^\/admin\/api/, '');

  if (subpath === '/clients' && request.method === 'GET') {
    return listClients(env);
  }
  if (subpath === '/clients' && request.method === 'POST') {
    return createClient(request, env);
  }

  const slugMatch = subpath.match(/^\/clients\/([^/]+)$/);
  if (slugMatch) {
    const slug = slugMatch[1];
    if (request.method === 'GET') return getClient(slug, env);
    if (request.method === 'PATCH') return updateClient(slug, request, env);
    if (request.method === 'DELETE') return deleteClient(slug, env);
  }

  return json({ error: 'Not found' }, 404);
}

async function listClients(env) {
  const listing = await env.CLIENTS.list({ prefix: 'client:' });
  const clients = await Promise.all(
    listing.keys.map(k => env.CLIENTS.get(k.name, 'json'))
  );
  const safe = clients.filter(Boolean).map(c => ({
    slug: c.slug,
    businessName: c.businessName,
    agentName: c.agentName,
    elevenLabsAgentId: c.elevenLabsAgentId,
    timezone: c.timezone,
    calEventTypeId: c.calEventTypeId,
  }));
  return json(safe);
}

async function getClient(slug, env) {
  const client = await env.CLIENTS.get(`client:${slug}`, 'json');
  if (!client) return json({ error: 'Client not found' }, 404);
  const { clientPassword, ...safe } = client;
  return json(safe);
}

async function createClient(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const required = ['slug', 'businessName', 'agentName', 'voiceId', 'widgetColor',
    'timezone', 'calEventTypeId', 'services', 'tone', 'clientPassword'];
  const missing = required.filter(k => !body[k]);
  if (missing.length) return json({ error: `Missing fields: ${missing.join(', ')}` }, 400);

  const existing = await env.CLIENTS.get(`client:${body.slug}`, 'json');
  if (existing) return json({ error: 'Slug already exists' }, 409);

  const hashedPassword = await hashPassword(body.clientPassword);

  let elevenLabsAgentId;
  try {
    elevenLabsAgentId = await createAgent(
      { ...body, faqs: body.faqs || [] },
      env.WORKER_BASE_URL,
      env.ELEVENLABS_API_KEY
    );
  } catch (err) {
    return json({ error: 'ElevenLabs provisioning failed', details: err.message }, 500);
  }

  const client = {
    slug: body.slug,
    businessName: body.businessName,
    agentName: body.agentName,
    voiceId: body.voiceId,
    widgetColor: body.widgetColor,
    timezone: body.timezone,
    calEventTypeId: Number(body.calEventTypeId),
    services: body.services,
    faqs: body.faqs || [],
    tone: body.tone,
    clientPassword: hashedPassword,
    elevenLabsAgentId,
  };

  await env.CLIENTS.put(`client:${body.slug}`, JSON.stringify(client));

  const { clientPassword, ...safe } = client;
  return json({ ...safe, embedSnippet: buildEmbedSnippet(client) }, 201);
}

async function updateClient(slug, request, env) {
  const existing = await env.CLIENTS.get(`client:${slug}`, 'json');
  if (!existing) return json({ error: 'Client not found' }, 404);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const updatable = ['businessName', 'agentName', 'voiceId', 'widgetColor',
    'timezone', 'calEventTypeId', 'services', 'faqs', 'tone'];
  const updated = { ...existing };
  for (const key of updatable) {
    if (body[key] !== undefined) updated[key] = body[key];
  }

  if (body.clientPassword) {
    updated.clientPassword = await hashPassword(body.clientPassword);
  }

  try {
    await patchAgentPrompt(existing.elevenLabsAgentId, updated, env.ELEVENLABS_API_KEY);
  } catch (err) {
    return json({ error: 'ElevenLabs update failed', details: err.message }, 500);
  }

  await env.CLIENTS.put(`client:${slug}`, JSON.stringify(updated));

  const { clientPassword, ...safe } = updated;
  return json({ ...safe, embedSnippet: buildEmbedSnippet(updated) });
}

async function deleteClient(slug, env) {
  const existing = await env.CLIENTS.get(`client:${slug}`, 'json');
  if (!existing) return json({ error: 'Client not found' }, 404);
  await env.CLIENTS.delete(`client:${slug}`);
  return json({ success: true });
}

export function buildEmbedSnippet(client) {
  return `<elevenlabs-convai agent-id="${client.elevenLabsAgentId}" action-text="Book an appointment?" style="--el-convai-button-color: ${client.widgetColor}"></elevenlabs-convai>\n<script src="https://elevenlabs.io/convai-widget/index.js" async type="text/javascript"></script>`;
}

export async function handleClientAPI(request, env) {
  const url = new URL(request.url);
  const slug = url.pathname.replace(/^\/client-api\//, '').split('/')[0];
  const password = request.headers.get('X-Client-Password') || '';

  const client = await env.CLIENTS.get(`client:${slug}`, 'json');
  if (!client) return json({ error: 'Client not found' }, 404);

  const ok = await verifyClientAuth(password, client);
  if (!ok) return json({ error: 'Unauthorized' }, 401);

  if (request.method === 'GET') {
    const { clientPassword, voiceId, calEventTypeId, timezone, elevenLabsAgentId, ...safe } = client;
    return json({ ...safe, embedSnippet: buildEmbedSnippet(client) });
  }

  if (request.method === 'PATCH') {
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

    const clientEditable = ['agentName', 'widgetColor', 'tone', 'services', 'faqs'];
    const updated = { ...client };
    for (const key of clientEditable) {
      if (body[key] !== undefined) updated[key] = body[key];
    }

    try {
      await patchAgentPrompt(client.elevenLabsAgentId, updated, env.ELEVENLABS_API_KEY);
    } catch (err) {
      return json({ error: 'ElevenLabs update failed', details: err.message }, 500);
    }

    await env.CLIENTS.put(`client:${slug}`, JSON.stringify(updated));
    const { clientPassword: _pw, voiceId: _v, calEventTypeId: _c, timezone: _t, elevenLabsAgentId: _id, ...safe } = updated;
    return json({ ...safe, embedSnippet: buildEmbedSnippet(updated) });
  }

  return json({ error: 'Method not allowed' }, 405);
}
