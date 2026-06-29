import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const anonClient = createClient(url, anonKey);
const serviceClient = createClient(url, serviceKey);

const username = 'teachertest';
const email = 'teacher.test.auto@example.com';
const password = 'Testing123!';

console.log('=== Service role: list all profiles ===');
const allProfiles = await serviceClient.from('profiles').select('*').limit(20);
console.log(allProfiles);

console.log('=== Anon client: search by username exact eq ===');
const eqResult = await anonClient.from('profiles').select('*').eq('username', username).single();
console.log(eqResult);

console.log('=== Anon client: search by username ilike ===');
const ilikeResult = await anonClient.from('profiles').select('*').ilike('username', username).single();
console.log(ilikeResult);

console.log('=== Anon client: search by email ===');
const emailResult = await anonClient.from('profiles').select('*').eq('email', email).single();
console.log(emailResult);

console.log('=== Anon client: Attempt signInWithPassword ===');
const authResult = await anonClient.auth.signInWithPassword({ email, password });
console.log(authResult);
