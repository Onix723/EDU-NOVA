import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const email = process.env.CHECK_EMAIL || 'teacher.test.auto@example.com'
  const { data, error } = await supabase.from('profiles').select('*').eq('email', email)
  if (error) {
    console.error('Error querying profiles:', error)
    process.exit(1)
  }
  console.log('Profiles found:', data)
}

run()
