import { handleSlots, handleBook, json } from './cal.js';
import { verifyAdminAuth } from './auth.js';
import { handleAdminAPI, handleClientAPI } from './admin-api.js';
import { adminHTML } from './admin-html.js';
import { clientHTML } from './client-html.js';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Password',
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Admin panel HTML — always serve the page, auth happens via JS in the browser
    if (path === '/admin' || path === '/admin/') {
      return new Response(adminHTML(), { headers: { 'Content-Type': 'text/html' } });
    }

    // Admin API — requires Bearer auth
    if (path.startsWith('/admin/api')) {
      if (!verifyAdminAuth(request, env)) return json({ error: 'Unauthorized' }, 401);
      return handleAdminAPI(request, env);
    }

    // Client portal HTML
    if (path.startsWith('/client/')) {
      return new Response(clientHTML(), { headers: { 'Content-Type': 'text/html' } });
    }

    // Client API — requires X-Client-Password header
    if (path.startsWith('/client-api/')) {
      return handleClientAPI(request, env);
    }

    // Multi-tenant Cal.com proxy: /:slug/slots and /:slug/book
    const slotsMatch = path.match(/^\/([^/]+)\/slots$/);
    if (slotsMatch && request.method === 'GET') {
      const slug = slotsMatch[1];
      const client = await env.CLIENTS.get(`client:${slug}`, 'json');
      if (!client) return json({ error: 'Client not found' }, 404);
      return handleSlots(url, client, env);
    }

    const bookMatch = path.match(/^\/([^/]+)\/book$/);
    if (bookMatch && request.method === 'POST') {
      const slug = bookMatch[1];
      const client = await env.CLIENTS.get(`client:${slug}`, 'json');
      if (!client) return json({ error: 'Client not found' }, 404);
      return handleBook(request, client, env);
    }

    return json({ error: 'Not found' }, 404);
  },
};
