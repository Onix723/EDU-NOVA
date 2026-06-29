-- Ejecuta esto en Supabase SQL Editor para DESACTIVAR la confirmación de email obligatoria

-- Opción 1: Confirmar todos los usuarios registrados
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- Opción 2: Si quieres una solución más permanente, modifica la tabla auth.users para que nuevos usuarios se confirmen automáticamente
-- (Nota: Esto requiere acceso más avanzado a Supabase)

-- Para la mayoría de casos, la Opción 1 es suficiente
-- Después de ejecutar esto, los usuarios pueden registrarse e iniciar sesión sin esperar confirmación de email
