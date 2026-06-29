import 'dotenv/config'
import http from 'http'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const port = process.env.REGISTER_SERVER_PORT || 8787

if (!url || !serviceRoleKey) {
  console.error('Falta VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey)

function sendJson(res, status, payload) {
  // Allow local development origins and wildcard during dev
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(payload))
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {})
    return
  }

  if (req.method !== 'POST' || (req.url !== '/register' && req.url !== '/lookup' && req.url !== '/generate-quiz')) {
    sendJson(res, 404, { error: 'Not found' })
    return
  }

  let rawBody = ''
  req.on('data', (chunk) => {
    rawBody += chunk
  })

  req.on('end', async () => {
    try {
      const body = JSON.parse(rawBody || '{}')
      const { email, password, username, role } = body

      if (req.url === '/lookup') {
        console.log('[lookup] incoming request', { username })

        if (!username) {
          sendJson(res, 400, { error: 'Falta el nombre de usuario' })
          return
        }

        const cleanUsername = String(username).trim().toLowerCase()
        const { data, error: lookupError } = await supabase
          .from('profiles')
          .select('email')
          .ilike('username', cleanUsername)
          .single()

        if (lookupError || !data) {
          sendJson(res, 404, { error: 'El usuario no existe' })
          return
        }

        sendJson(res, 200, { email: data.email })
        return
      }

      if (req.url === '/generate-quiz') {
        console.log('[generate-quiz] incoming request', { courseTitle: body.courseTitle, topicsCount: Array.isArray(body.topics) ? body.topics.length : 0 })

        const courseTitle = String(body.courseTitle || '').trim()
        const topics = Array.isArray(body.topics) ? body.topics : []
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY

        if (!courseTitle || topics.length === 0) {
          sendJson(res, 400, { error: 'Faltan datos para generar el quiz' })
          return
        }

        if (!apiKey) {
          sendJson(res, 500, { error: 'No hay API key de Gemini configurada en el servidor' })
          return
        }

        const topicsPrompt = topics.map((t) => `- ${t.title}: ${t.description}`).join('\n')
        const prompt = `
          Actúa como un experto diseñador instruccional.
          Crea un examen diagnóstico para el curso "${courseTitle}".
          El examen debe consistir en exactamente ${topics.length} preguntas, una por cada tema:
          ${topicsPrompt}

          Para cada pregunta, genera 4 opciones de respuesta, donde solo una sea correcta.
          Devuelve únicamente un JSON puro con esta estructura:
          [
            {
              "topic_id": "id_del_tema",
              "question_text": "Texto de la pregunta",
              "options": ["Opción 0", "Opción 1", "Opción 2", "Opción 3"],
              "correct_option_index": 0
            }
          ]
        `

        const modelResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
        const modelData = await modelResponse.json().catch(() => ({}))
        const availableModel = modelData.models?.find((m) => m.name?.includes('gemini-2.0-flash') || m.name?.includes('gemini-1.5-flash'))
        const modelName = availableModel ? availableModel.name.split('/')[1] : 'gemini-2.0-flash'
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          sendJson(res, 502, { error: errorData.error?.message || 'No se pudo contactar a Gemini' })
          return
        }

        const data = await response.json()
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!textResponse) {
          sendJson(res, 500, { error: 'Gemini no devolvió contenido' })
          return
        }

        const jsonString = textResponse.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(jsonString)
        sendJson(res, 200, { questions: parsed })
        return
      }

      console.log('[register] incoming request', { email, username, role })

      if (!email || !password || !username || !role) {
        sendJson(res, 400, { error: 'Faltan datos requeridos: email, password, username, role' })
        return
      }

      if (!['student', 'teacher'].includes(role)) {
        sendJson(res, 400, { error: 'Role inválido. Debe ser student o teacher' })
        return
      }

      const cleanEmail = String(email).trim().toLowerCase()
      const cleanUsername = String(username).trim().toLowerCase()

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: {
          username: cleanUsername,
          role,
        },
      })

      if (authError) {
        let message = authError.message || 'Error al crear el usuario'
        if (message.includes('already exists') || message.includes('already registered')) {
          message = 'El correo ya está registrado'
        }
        sendJson(res, 400, { error: message })
        return
      }

      const userId = authData?.user?.id
      if (!userId) {
        sendJson(res, 500, { error: 'No se pudo obtener el id del usuario creado' })
        return
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: userId,
            email: cleanEmail,
            username: cleanUsername,
            role,
          },
          { onConflict: 'user_id' }
        )

      if (profileError) {
        sendJson(res, 500, { error: 'Error al crear el perfil: ' + profileError.message })
        return
      }

      sendJson(res, 201, { user: authData.user })
    } catch (error) {
      console.error('Register server error:', error)
      sendJson(res, 500, { error: 'Error interno del servidor' })
    }
  })
})

server.listen(port, () => {
  console.log(`Register server escuchando en http://localhost:${port}`)
})
