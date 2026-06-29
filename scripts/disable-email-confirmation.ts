import { createClient } from '@supabase/supabase-js';

// Configuración - Reemplaza con tus valores
const SUPABASE_URL = 'https://mqsceivqltmegwxbaovq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'tu_service_role_key_aqui'; // Obtén de: Settings → API → Service Role Key

async function disableEmailConfirmation() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Obtener configuración actual
    const { data, error } = await supabase.auth.admin.updateAuthUser('system', {
      email_confirm: true, // Confirmar todos los emails automáticamente
    });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('✅ Email confirmation deshabilitada');
  } catch (err) {
    console.error('Error:', err);
  }
}

disableEmailConfirmation();
