import { readFileSync } from 'node:fs';

const errors = [];
const env = process.env;
function required(name) {
  const value = env[name]?.trim();
  if (!value || /^(your_|placeholder|xxx)/i.test(value)) errors.push(`${name} is required`);
  return value;
}
function httpsOrigin(name) {
  const value = required(name);
  if (!value) return;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || /^(localhost|127\.|0\.|\[|host\.docker)/i.test(url.hostname)) {
      errors.push(`${name} must be a public HTTPS origin`);
    }
  } catch { errors.push(`${name} must be a valid URL`); }
}

httpsOrigin('NEXT_PUBLIC_SUPABASE_URL');
httpsOrigin('NEXT_PUBLIC_APP_URL');
const publicKey = required('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const serviceKey = required('SUPABASE_SERVICE_ROLE_KEY');
if (publicKey && serviceKey && publicKey === serviceKey) errors.push('Public and service keys must differ');
for (const [name, key, role, prefix] of [
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', publicKey, 'anon', 'sb_publishable_'],
  ['SUPABASE_SERVICE_ROLE_KEY', serviceKey, 'service_role', 'sb_secret_'],
]) {
  if (!key) continue;
  if (key.startsWith(prefix)) continue;
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
    if (payload.role !== role) errors.push(`${name} has the wrong key role`);
    if (payload.exp && payload.exp * 1000 <= Date.now()) errors.push(`${name} is expired`);
    if (payload.ref && new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname !== `${payload.ref}.supabase.co`) errors.push(`${name} belongs to a different project`);
  } catch { errors.push(`${name} has an unsupported key format`); }
}
if (env.SKIP_AUTH === 'true') errors.push('SKIP_AUTH must be unset or false');
if (env.ALLOW_UNVERIFIED_WEBHOOKS === 'true') errors.push('ALLOW_UNVERIFIED_WEBHOOKS must be unset or false');
if (env.NEXT_PUBLIC_PILOT_MODE !== 'true') errors.push('NEXT_PUBLIC_PILOT_MODE must be true for this private pilot');
if (!!env.UPSTASH_REDIS_REST_URL !== !!env.UPSTASH_REDIS_REST_TOKEN) errors.push('Configure both Redis values or neither (database limits are the default)');
const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
if (JSON.stringify(config.regions) !== '["syd1"]') errors.push('Pilot functions must use the Sydney region');
for (const fn of Object.values(config.functions ?? {})) {
  if (fn.regions && JSON.stringify(fn.regions) !== JSON.stringify(config.regions)) errors.push('Function regions conflict with the project region');
}
if (errors.length) {
  console.error(`Pilot preflight failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('Pilot configuration passed. Hosted Auth signup restrictions and migrations still require live verification.');
}
