export function clientHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Agent Settings</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #0f0f11; color: #e4e4e7; min-height: 100vh; padding: 2rem; }
  h1 { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.25rem; }
  .sub { color: #888; font-size: 0.875rem; margin-bottom: 1.5rem; }
  .card { background: #1a1a1f; border: 1px solid #2a2a35; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem; }
  label { display: block; font-size: 0.8rem; color: #888; margin-bottom: 0.25rem; margin-top: 0.75rem; }
  input, textarea, select { width: 100%; background: #0f0f11; border: 1px solid #2a2a35; border-radius: 6px; color: #e4e4e7; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
  textarea { min-height: 100px; resize: vertical; }
  .faq-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
  .faq-row input { flex: 1; }
  .faq-row button { background: #3f1a1a; border: none; color: #f87171; border-radius: 6px; padding: 0.5rem 0.75rem; cursor: pointer; flex-shrink: 0; }
  button.primary { background: #6366f1; color: white; border: none; border-radius: 8px; padding: 0.6rem 1.25rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; margin-top: 1rem; }
  button.secondary { background: #1a1a1f; border: 1px solid #2a2a35; color: #e4e4e7; border-radius: 8px; padding: 0.5rem 1rem; font-size: 0.8rem; cursor: pointer; }
  .snippet { background: #0f0f11; border: 1px solid #2a2a35; border-radius: 6px; padding: 0.75rem; font-family: monospace; font-size: 0.75rem; color: #a78bfa; white-space: pre-wrap; word-break: break-all; }
  #status { margin-top: 1rem; font-size: 0.8rem; }
  .error { color: #f87171; }
  .success { color: #34d399; }
  #login-screen { max-width: 400px; margin: 6rem auto; }
</style>
</head>
<body>

<div id="login-screen" class="card">
  <h1>Agent Settings</h1>
  <p class="sub">Log in to update your voice agent.</p>
  <label>Password</label>
  <input type="password" id="password-input" placeholder="Your portal password" />
  <button class="primary" onclick="login()">Login</button>
  <div id="login-error" style="color:#f87171;margin-top:0.5rem;font-size:0.8rem;"></div>
</div>

<div id="app" style="display:none;max-width:700px;margin:0 auto;">
  <h1 id="app-title">Agent Settings</h1>
  <p class="sub">Changes go live immediately after saving.</p>

  <div class="card">
    <label>Agent Name</label>
    <input id="f-agentName" />
    <label>Widget Color (hex)</label>
    <input id="f-widgetColor" />
    <label>Tone</label>
    <select id="f-tone">
      <option value="professional">Professional</option>
      <option value="friendly and casual">Friendly & Casual</option>
      <option value="consultative and warm">Consultative & Warm</option>
    </select>
    <label>Services Description</label>
    <textarea id="f-services"></textarea>
    <label>FAQs</label>
    <div id="faqs-container"></div>
    <button class="secondary" onclick="addFAQ()">+ Add FAQ</button>
    <button class="primary" onclick="save()">Save & Push to Agent</button>
    <div id="status"></div>
  </div>

  <div class="card">
    <h2 style="font-size:0.9rem;font-weight:600;margin-bottom:0.75rem;">Your Embed Snippet</h2>
    <div class="snippet" id="snippet-text"></div>
    <button class="secondary" style="margin-top:0.5rem;" onclick="copySnippet()">Copy</button>
  </div>
</div>

<script>
const slug = location.pathname.split('/client/')[1];
let clientPassword = '';

function addFAQ(q = '', a = '') {
  const row = document.createElement('div');
  row.className = 'faq-row';
  row.innerHTML = \`<input placeholder="Question" value="\${q}" class="faq-q" />
    <input placeholder="Answer" value="\${a}" class="faq-a" />
    <button onclick="this.parentElement.remove()">×</button>\`;
  document.getElementById('faqs-container').appendChild(row);
}

function getFAQs() {
  return Array.from(document.querySelectorAll('.faq-row')).map(r => ({
    q: r.querySelector('.faq-q').value.trim(),
    a: r.querySelector('.faq-a').value.trim(),
  })).filter(f => f.q && f.a);
}

async function login() {
  clientPassword = document.getElementById('password-input').value;
  const res = await fetch(\`/client-api/\${slug}\`, {
    headers: { 'X-Client-Password': clientPassword }
  });
  if (res.status === 401) {
    document.getElementById('login-error').textContent = 'Incorrect password.';
    return;
  }
  const data = await res.json();
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('app-title').textContent = data.businessName + ' — Agent Settings';
  document.getElementById('f-agentName').value = data.agentName || '';
  document.getElementById('f-widgetColor').value = data.widgetColor || '';
  document.getElementById('f-tone').value = data.tone || 'professional';
  document.getElementById('f-services').value = data.services || '';
  (data.faqs || []).forEach(f => addFAQ(f.q, f.a));
  document.getElementById('snippet-text').textContent = data.embedSnippet || '';
}

async function save() {
  const body = {
    agentName: document.getElementById('f-agentName').value.trim(),
    widgetColor: document.getElementById('f-widgetColor').value.trim(),
    tone: document.getElementById('f-tone').value,
    services: document.getElementById('f-services').value.trim(),
    faqs: getFAQs(),
  };
  const statusEl = document.getElementById('status');
  statusEl.textContent = 'Saving...';
  statusEl.className = '';

  const res = await fetch(\`/client-api/\${slug}\`, {
    method: 'PATCH',
    headers: { 'X-Client-Password': clientPassword, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    statusEl.textContent = 'Error: ' + (data.error || 'Unknown');
    statusEl.className = 'error';
    return;
  }
  statusEl.textContent = 'Saved! Your agent is updated.';
  statusEl.className = 'success';
  if (data.embedSnippet) document.getElementById('snippet-text').textContent = data.embedSnippet;
}

function copySnippet() {
  navigator.clipboard.writeText(document.getElementById('snippet-text').textContent);
}

document.getElementById('password-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') login();
});
</script>
</body>
</html>`;
}
