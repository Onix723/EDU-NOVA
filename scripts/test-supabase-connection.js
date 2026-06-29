import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment')
  process.exit(1)
}

const supabase = createClient(url, key)

async function run() {
  try {
    // Intentamos crear un usuario de prueba
    const email = `user${Date.now()}@gmail.com`
    const password = 'P@ssw0rd1234'
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      console.error('SignUp error:', error.message || error)
      process.exit(2)
    }
    console.log('SignUp data:', data)

    // Intentamos recuperar lista de tablas básicas para comprobar acceso anónimo
    const { data: tables, error: tableErr } = await supabase.rpc('pg_tables')
    if (tableErr) {
      // RPC probablemente no exista; en ese caso solo señalamos que signup funcionó
      console.warn('RPC call failed (expected in many projects):', tableErr.message || tableErr)
    } else {
      console.log('RPC result:', tables)
    }

  } catch (e) {
    console.error('Unexpected error:', e)
    process.exit(3)
  }
}

run()
