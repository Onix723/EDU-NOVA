import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error('Falta VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey)

async function run() {
  try {
    const email = process.env.TEST_USER_EMAIL || `dev.confirmed.${Date.now()}@example.com`
    const password = process.env.TEST_USER_PASSWORD || 'P@ssw0rd1234'
    const username = process.env.TEST_USER_USERNAME || `devuser${Date.now()}`
    const role = process.env.TEST_USER_ROLE || 'student'

    console.log('Creando usuario confirmado:', email)

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, role }
    })

    if (error) {
      console.error('Error al crear usuario:', error)
      process.exit(1)
    }

    console.log('Usuario creado:', data)

    const userId = data?.user?.id
    if (userId) {
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({ user_id: userId, email, username, role }, { onConflict: 'user_id' })

      if (profileErr) {
        console.error('Error creando/actualizando profile:', profileErr)
        process.exit(1)
      }

      console.log('Profile creado/actualizado para user id:', userId)
    }

    console.log('✅ Hecho')
  } catch (err) {
    console.error('Exception:', err)
    process.exit(1)
  }
}

run()
