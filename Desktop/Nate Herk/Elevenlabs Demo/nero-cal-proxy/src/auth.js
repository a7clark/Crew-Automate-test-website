export async function hashPassword(password) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const hash = await sha256(salt + password);
  return `${salt}:${hash}`;
}

export async function verifyPassword(password, stored) {
  const [salt, storedHash] = stored.split(':');
  const hash = await sha256(salt + password);
  return hash === storedHash;
}

export function verifyAdminAuth(request, env) {
  const auth = request.headers.get('Authorization') || '';
  return auth === `Bearer ${env.ADMIN_PASSWORD}`;
}

export async function verifyClientAuth(password, client) {
  if (!client.clientPassword) return false;
  return verifyPassword(password, client.clientPassword);
}

async function sha256(str) {
  const data = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
