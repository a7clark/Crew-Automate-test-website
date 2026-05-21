export function adminHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Voice Agent Admin</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #0f0f11; color: #e4e4e7; min-height: 100vh; padding: 2rem; }
  h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; }
  h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; }
  .card { background: #1a1a1f; border: 1px solid #2a2a35; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  th, td { text-align: left; padding: 0.6rem 0.8rem; border-bottom: 1px solid #2a2a35; }
  th { color: #888; font-weight: 500; }
  label { display: block; font-size: 0.8rem; color: #888; margin-bottom: 0.25rem; margin-top: 0.75rem; }
  input, textarea, select { width: 100%; background: #0f0f11; border: 1px solid #2a2a35; border-radius: 6px; color: #e4e4e7; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
  textarea { min-height: 100px; resize: vertical; }
  .faq-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: flex-start; }
  .faq-row input { flex: 1; }
  .faq-row button { flex-shrink: 0; background: #3f1a1a; border: none; color: #f87171; border-radius: 6px; padding: 0.5rem 0.75rem; cursor: pointer; }
  button.primary { background: #6366f1; color: white; border: none; border-radius: 8px; padding: 0.6rem 1.25rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; margin-top: 1rem; }
  button.secondary { background: #1a1a1f; border: 1px solid #2a2a35; color: #e4e4e7; border-radius: 8px; padding: 0.5rem 1rem; font-size: 0.8rem; cursor: pointer; }
  button.danger { background: #3f1a1a; border: none; color: #f87171; border-radius: 6px; padding: 0.4rem 0.75rem; font-size: 0.8rem; cursor: pointer; }
  .snippet { background: #0f0f11; border: 1px solid #2a2a35; border-radius: 6px; padding: 0.75rem; font-family: monospace; font-size: 0.75rem; color: #a78bfa; white-space: pre-wrap; word-break: break-all; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  #status { margin-top: 1rem; font-size: 0.8rem; color: #888; }
  .error { color: #f87171; }
  .success { color: #34d399; }
  #login-screen { max-width: 400px; margin: 6rem auto; }
</style>
</head>
<body>

<div id="login-screen" class="card">
  <h1>Admin Login</h1>
  <label>Master Password</label>
  <input type="password" id="password-input" placeholder="Enter admin password" />
  <button class="primary" onclick="login()">Login</button>
  <div id="login-error" style="color:#f87171;margin-top:0.5rem;font-size:0.8rem;"></div>
</div>

<div id="app" style="display:none;max-width:900px;margin:0 auto;">
  <h1>Voice Agent Admin</h1>

  <div class="card">
    <h2>Clients</h2>
    <table>
      <thead><tr><th>Business</th><th>Slug</th><th>Agent ID</th><th>Actions</th></tr></thead>
      <tbody id="client-list"></tbody>
    </table>
  </div>

  <div class="card" id="form-card">
    <h2 id="form-title">New Client</h2>
    <div class="row">
      <div>
        <label>Business Name *</label>
        <input id="f-businessName" placeholder="Acme Corp" />
      </div>
      <div>
        <label>Slug * (URL-safe, lowercase)</label>
        <input id="f-slug" placeholder="acme-corp" />
      </div>
    </div>
    <div class="row">
      <div>
        <label>Agent Name</label>
        <input id="f-agentName" placeholder="Aria" />
      </div>
      <div>
        <label>ElevenLabs Voice ID</label>
        <input id="f-voiceId" placeholder="paste voice ID" />
      </div>
    </div>
    <div class="row">
      <div>
        <label>Widget Color (hex)</label>
        <input id="f-widgetColor" placeholder="#6366f1" />
      </div>
      <div>
        <label>Timezone (IANA)</label>
        <input id="f-timezone" placeholder="America/New_York" />
      </div>
    </div>
    <div class="row">
      <div>
        <label>Cal.com Event Type ID *</label>
        <input id="f-calEventTypeId" type="number" placeholder="12345" />
      </div>
      <div>
        <label>Tone</label>
        <select id="f-tone">
          <option value="professional">Professional</option>
          <option value="friendly and casual">Friendly & Casual</option>
          <option value="consultative and warm">Consultative & Warm</option>
        </select>
      </div>
    </div>
    <label>Services (describe what this business does)</label>
    <textarea id="f-services" placeholder="We help businesses automate..."></textarea>
    <label>FAQs</label>
    <div id="faqs-container"></div>
    <button class="secondary" onclick="addFAQ()">+ Add FAQ</button>
    <label>Client Portal Password *</label>
    <input type="password" id="f-clientPassword" placeholder="Set a password for the client" />
    <button class="primary" id="submit-btn" onclick="submitForm()">Provision Agent</button>
    <div id="status"></div>
    <div id="snippet-area" style="display:none;margin-top:1rem;">
      <label>Embed Snippet (send to client)</label>
      <div class="snippet" id="snippet-text"></div>
      <button class="secondary" style="margin-top:0.5rem;" onclick="copySnippet()">Copy</button>
    </div>
  </div>
</div>

<script>
let adminPassword = '';
let editingSlug = null;

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Authorization': 'Bearer ' + adminPassword,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return res;
}

async function login() {
  const pw = document.getElementById('password-input').value;
  const res = await fetch('/admin/api/clients', {
    headers: { 'Authorization': 'Bearer ' + pw }
  });
  if (res.status === 401) {
    document.getElementById('login-error').textContent = 'Incorrect password.';
    return;
  }
  adminPassword = pw;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  loadClients();
}

async function loadClients() {
  const res = await apiFetch('/admin/api/clients');
  const clients = await res.json();
  const tbody = document.getElementById('client-list');
  tbody.innerHTML = '';
  if (!clients.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="color:#555;padding:1rem;">No clients yet.</td></tr>';
    return;
  }
  for (const c of clients) {
    tbody.innerHTML += \`<tr>
      <td>\${c.businessName}</td>
      <td><code>\${c.slug}</code></td>
      <td><code style="font-size:0.7rem;color:#888;">\${c.elevenLabsAgentId || '—'}</code></td>
      <td>
        <button class="secondary" onclick="editClient('\${c.slug}')">Edit</button>
        <button class="danger" onclick="deleteClient('\${c.slug}')" style="margin-left:0.5rem;">Delete</button>
      </td>
    </tr>\`;
  }
}

function addFAQ(q = '', a = '') {
  const container = document.getElementById('faqs-container');
  const row = document.createElement('div');
  row.className = 'faq-row';
  row.innerHTML = \`<input placeholder="Question" value="\${q}" class="faq-q" />
    <input placeholder="Answer" value="\${a}" class="faq-a" />
    <button onclick="this.parentElement.remove()">×</button>\`;
  container.appendChild(row);
}

function getFAQs() {
  return Array.from(document.querySelectorAll('.faq-row')).map(row => ({
    q: row.querySelector('.faq-q').value.trim(),
    a: row.querySelector('.faq-a').value.trim(),
  })).filter(f => f.q && f.a);
}

function setStatus(msg, isError = false) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = isError ? 'error' : 'success';
}

async function submitForm() {
  const body = {
    slug: document.getElementById('f-slug').value.trim().toLowerCase(),
    businessName: document.getElementById('f-businessName').value.trim(),
    agentName: document.getElementById('f-agentName').value.trim() || 'Aria',
    voiceId: document.getElementById('f-voiceId').value.trim(),
    widgetColor: document.getElementById('f-widgetColor').value.trim() || '#6366f1',
    timezone: document.getElementById('f-timezone').value.trim() || 'America/New_York',
    calEventTypeId: Number(document.getElementById('f-calEventTypeId').value),
    services: document.getElementById('f-services').value.trim(),
    faqs: getFAQs(),
    tone: document.getElementById('f-tone').value,
    clientPassword: document.getElementById('f-clientPassword').value,
  };

  document.getElementById('submit-btn').textContent = editingSlug ? 'Saving...' : 'Provisioning...';
  document.getElementById('submit-btn').disabled = true;
  setStatus(editingSlug ? 'Updating agent...' : 'Provisioning ElevenLabs agent, this takes ~5 seconds...');

  const res = editingSlug
    ? await apiFetch(\`/admin/api/clients/\${editingSlug}\`, { method: 'PATCH', body: JSON.stringify(body) })
    : await apiFetch('/admin/api/clients', { method: 'POST', body: JSON.stringify(body) });

  document.getElementById('submit-btn').disabled = false;
  document.getElementById('submit-btn').textContent = editingSlug ? 'Save & Push' : 'Provision Agent';

  const data = await res.json();
  if (!res.ok) {
    setStatus('Error: ' + (data.error || JSON.stringify(data)), true);
    return;
  }

  setStatus(editingSlug ? 'Agent updated successfully.' : 'Agent provisioned!');
  if (data.embedSnippet) {
    document.getElementById('snippet-text').textContent = data.embedSnippet;
    document.getElementById('snippet-area').style.display = 'block';
  }
  loadClients();
}

async function editClient(slug) {
  const res = await apiFetch(\`/admin/api/clients/\${slug}\`);
  const c = await res.json();
  editingSlug = slug;
  document.getElementById('form-title').textContent = 'Edit: ' + c.businessName;
  document.getElementById('f-slug').value = c.slug;
  document.getElementById('f-slug').disabled = true;
  document.getElementById('f-businessName').value = c.businessName || '';
  document.getElementById('f-agentName').value = c.agentName || '';
  document.getElementById('f-voiceId').value = c.voiceId || '';
  document.getElementById('f-widgetColor').value = c.widgetColor || '';
  document.getElementById('f-timezone').value = c.timezone || '';
  document.getElementById('f-calEventTypeId').value = c.calEventTypeId || '';
  document.getElementById('f-services').value = c.services || '';
  document.getElementById('f-tone').value = c.tone || 'professional';
  document.getElementById('f-clientPassword').placeholder = 'Leave blank to keep existing';
  document.getElementById('faqs-container').innerHTML = '';
  (c.faqs || []).forEach(f => addFAQ(f.q, f.a));
  document.getElementById('submit-btn').textContent = 'Save & Push';
  document.getElementById('snippet-area').style.display = 'none';
  document.getElementById('form-card').scrollIntoView({ behavior: 'smooth' });
}

async function deleteClient(slug) {
  if (!confirm(\`Delete client "\${slug}"? This cannot be undone.\`)) return;
  await apiFetch(\`/admin/api/clients/\${slug}\`, { method: 'DELETE' });
  loadClients();
}

function copySnippet() {
  const text = document.getElementById('snippet-text').textContent;
  navigator.clipboard.writeText(text);
}

document.getElementById('password-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') login();
});
</script>
</body>
</html>`;
}
