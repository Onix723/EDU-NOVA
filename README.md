# Plataforma Educativa

Esta aplicación es una plataforma educativa desarrollada con React, TypeScript, Vite, Supabase y un servidor Node para funciones de registro y generación de quizzes con IA.

## Requisitos previos

Antes de instalar el proyecto, necesitas tener instalado lo siguiente en tu computadora:

- Node.js 20 o superior (recomendado LTS)
- npm 10 o superior
- Git
- Un proyecto en Supabase
- Una API key de Google Gemini (opcional, pero necesaria si quieres usar generación de quizzes con IA)

### Verificar que Node.js y npm estén instalados

En PowerShell o terminal ejecuta:

```bash
node -v
npm -v
```

Si no aparecen versiones, instala Node.js desde: https://nodejs.org/

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/Onix723/EDU-NOVA.git
cd EDU-NOVA
```

---

## 2. Instalar dependencias

Dentro de la carpeta del proyecto ejecuta:

```bash
npm install
```

Esto instalará todas las dependencias necesarias para correr la app.

---

## 3. Configurar variables de entorno

Crea un archivo llamado `.env` en la raíz del proyecto. En Windows PowerShell puedes hacerlo así:

```powershell
Copy-Item .env.example .env
```

Luego abre el archivo `.env` y completa los valores:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
VITE_REGISTER_URL=http://localhost:8787
VITE_GEMINI_API_KEY=tu_api_key_de_gemini
```

### ¿Dónde conseguir esos valores?

- Supabase URL y anon key:
  - Ve a tu proyecto en Supabase
  - Entra a Project Settings > API
- Service role key:
  - También está en Project Settings > API
  - Esta clave es sensible, no la compartas públicamente
- Gemini API key:
  - Crea una cuenta en Google AI Studio
  - Genera una API key para Gemini

> Importante: el archivo `.env` no debe subirse a GitHub porque contiene datos sensibles.

---

## 4. Configurar la base de datos en Supabase

Este proyecto usa una tabla llamada `profiles`.

Pasos:

1. Entra a tu proyecto de Supabase
2. Abre SQL Editor
3. Crea una nueva consulta
4. Copia y pega todo el contenido del archivo `src/lib/supabase.sql`
5. Ejecuta la consulta

Esto creará las tablas y políticas necesarias para autenticación y perfiles.

---

## 5. Ejecutar la aplicación localmente

Se necesitan dos procesos abiertos al mismo tiempo:

### Terminal 1: servidor de registro y funciones auxiliares

```bash
npm run register-server
```

Este servidor corre en:

```text
http://localhost:8787
```

### Terminal 2: frontend de la aplicación

```bash
npm run dev
```

Luego abre en tu navegador:

```text
http://localhost:5173
```

---

## 6. Cómo usar la plataforma

Una vez que la app esté corriendo:

### Crear una cuenta

Puedes registrarte como:

- Estudiante
- Profesor

### Iniciar sesión

Usa el correo y la contraseña con los que te registraste.

La aplicación permite:

- Iniciar sesión
- Registrar usuarios
- Gestionar cursos y temas
- Generar quizzes
- Evaluar respuestas con IA (si tienes Gemini configurado)

---

## 7. Construir para producción

Si quieres generar una versión lista para despliegue:

```bash
npm run build
```

Luego puedes previsualizarla con:

```bash
npm run preview
```

---

## 8. Scripts disponibles

El proyecto incluye estos comandos:

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run register-server
```

---

## 9. Solución de problemas comunes

### Error: "Missing Supabase environment variables"

Verifica que:

- Exista el archivo `.env` en la raíz del proyecto
- Las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén correctas
- Reiniciastes el servidor de Vite después de crear `.env`

### Error al generar quizzes con IA

Verifica que:

- `VITE_GEMINI_API_KEY` esté bien configurada
- El servidor `npm run register-server` esté corriendo

### No puedes iniciar sesión

Revisa que:

- El SQL del archivo `src/lib/supabase.sql` se haya ejecutado correctamente en Supabase
- El proyecto tenga correctamente configuradas las credenciales de Supabase

---

## 10. Estructura general del proyecto

```text
src/
  components/
  contexts/
  lib/
  pages/
  services/
server/
```

---

Si sigues estos pasos, el sistema debería correr correctamente en cualquier computadora con Node.js y acceso a Supabase.
