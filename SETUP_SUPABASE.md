# 🔧 Configuración de Supabase - Plataforma Educativa

## 1️⃣ Crear la tabla en Supabase

Sigue estos pasos:

1. **Ve a tu Dashboard de Supabase**: [https://app.supabase.com](https://app.supabase.com)
2. **Selecciona tu proyecto**
3. **Ve a "SQL Editor"** (en el menú izquierdo)
4. **Haz clic en "New Query"**
5. **Copia y pega TODO el contenido del archivo `src/lib/supabase.sql`**
6. **Haz clic en "Run"** (o presiona Ctrl+Enter)

### ✅ ¿Qué hace este script?
- Crea la tabla `profiles` con los campos necesarios
- Habilita Row Level Security (RLS) automáticamente
- Configura políticas de seguridad:
  - Los usuarios solo pueden ver su propio perfil
  - Los usuarios solo pueden editar su propio perfil
  - Los usuarios pueden crear su perfil al registrarse

---

## 2️⃣ Variables de entorno ✅

Ya están configuradas en `.env.local`:
```
VITE_SUPABASE_URL=https://mqsceivqltmegwxbaovq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_FN3N09FDEg1tCr1uo1CsQg_nruabxK2
```

---

## 3️⃣ Iniciar la aplicación

```bash
npm run dev
```

---

## 🧪 Prueba la aplicación

### Registrarse como Estudiante:
1. Haz clic en **"Create an account"**
2. Ingresa:
   - **Username**: `estudiante1`
   - **Email**: `estudiante@test.com`
   - **Password**: `Test123!`
   - **Rol**: Estudiante ✓
3. Haz clic en **"Register"**

### Registrarse como Profesor:
1. Repite el proceso pero selecciona **"Profesor"** como rol

### Iniciar sesión:
1. Usa el email y contraseña registrados

---

## 📱 Estructura de la aplicación

```
src/
├── contexts/AuthContext.tsx       ← Manejo de autenticación global
├── lib/
│   ├── supabaseClient.ts          ← Inicialización de Supabase
│   └── supabase.sql               ← Script SQL para BD
├── components/
│   └── Login/LoginForm.tsx        ← Formulario de login/registro
├── pages/
│   ├── Login.tsx                  ← Página de login
│   ├── Student/StudentDashboard   ← Panel de estudiante
│   └── Teacher/TeacherDashboard   ← Panel de profesor
└── App.tsx                        ← Enrutamiento principal
```

---

## 🔐 Seguridad

✅ **RLS Habilitado**: Los estudiantes solo ven sus datos
✅ **Autenticación**: Supabase maneja contraseñas de forma segura
✅ **Variables de entorno**: Credenciales protegidas

---

## ⚠️ Si algo no funciona

1. **Verifica que ejecutaste el SQL script** en Supabase
2. **Revisa la consola de navegador** (F12) para errores
3. **Comprueba que `.env.local` esté en la raíz** del proyecto

¡Listo! 🚀
