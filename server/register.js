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

async function callGeminiApi(apiKey, prompt) {
  let modelName = 'gemini-2.0-flash'

  try {
    const modelResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    const modelData = await modelResponse.json().catch(() => ({}))
    const availableModel = modelData.models?.find((m) => m.name?.includes('gemini-2.0-flash') || m.name?.includes('gemini-1.5-flash'))
    if (availableModel) {
      modelName = availableModel.name.split('/')[1]
    }
  } catch (error) {
    console.warn('No se pudo consultar la lista de modelos Gemini, se usará gemini-2.0-flash por defecto.', error)
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || 'No se pudo contactar a Gemini')
  }

  const data = await response.json()
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!textResponse) {
    throw new Error('Gemini no devolvió contenido')
  }

  return textResponse
}

function parseJsonFromText(text) {
  const jsonString = text.replace(/```json|```/g, '').trim()
  return JSON.parse(jsonString)
}

function buildFallbackQuestions(courseTitle, topics) {
  const templates = [
    '¿Cuál es el concepto clave de',
    '¿Cuál es un ejemplo típico de',
    '¿Qué sucede cuando',
    '¿Cómo se explica',
    '¿Cuál es la diferencia principal entre',
    '¿Por qué es importante',
    '¿Qué estrategia se usa para',
    '¿Cuál es la mejor descripción de',
    '¿Qué paso sigue después de',
    '¿Qué representa',
  ]

  return Array.from({ length: 10 }, (_, index) => {
    const topic = topics[index % topics.length]
    const title = topic.title || 'este tema'
    return {
      topic_id: topic.id,
      question_text: `${templates[index]} ${title}?`,
      options: [
        `Una explicación directa de ${title}`,
        `Un ejemplo práctico de ${title}`,
        `Una alternativa incorrecta sobre ${title}`,
        `Una idea no relacionada con ${title}`,
      ],
      correct_option_index: 0,
    }
  })
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
      let body = {}
      try {
        body = JSON.parse(rawBody || '{}')
      } catch (parseError) {
        console.error('Invalid JSON body:', rawBody, parseError)
        sendJson(res, 400, { error: 'JSON inválido en el cuerpo de la solicitud' })
        return
      }

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
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
        if (!apiKey) {
          sendJson(res, 500, { error: 'No hay API key de Gemini configurada en el servidor' })
          return
        }

        const task = String(body.task || 'generate-quiz').trim()

        if (task === 'generate-quiz') {
          const courseTitle = String(body.courseTitle || '').trim()
          const topics = Array.isArray(body.topics) ? body.topics : []

          console.log('[generate-quiz] incoming request', { courseTitle, topicsCount: topics.length })

          if (!courseTitle || topics.length === 0) {
            sendJson(res, 400, { error: 'Faltan datos para generar el quiz' })
            return
          }

          const topicsPrompt = topics.map((t) => `- topic_id: ${t.id}\n  title: ${t.title}\n  description: ${t.description}`).join('\n')
          const prompt = `
            Actúa como un experto diseñador instruccional.
            Crea un banco de 10 preguntas para el curso "${courseTitle}".
            Usa los temas siguientes para generar preguntas claras, razonables y variadas:
            ${topicsPrompt}

            Genera exactamente 10 preguntas de opción múltiple con 4 opciones cada una, donde solo una sea correcta.
            Asigna cada pregunta a un tema usando el campo "topic_id" con uno de los IDs listados arriba.
            No inventes nuevos IDs, solo utiliza los que aparecen en la lista.
            Devuelve únicamente un JSON puro con esta estructura:
            [
              {
                "topic_id": "<uno de los topic_id listados arriba>",
                "question_text": "Texto de la pregunta",
                "options": ["Opción 0", "Opción 1", "Opción 2", "Opción 3"],
                "correct_option_index": 0
              }
            ]
          `

          try {
            const textResponse = await callGeminiApi(apiKey, prompt)
            const parsed = parseJsonFromText(textResponse)
            sendJson(res, 200, { questions: parsed })
          } catch (error) {
            const fallbackQuestions = buildFallbackQuestions(courseTitle, topics)
            console.warn('Error al generar el quiz con Gemini, usando preguntas de respaldo:', error)
            sendJson(res, 200, {
              questions: fallbackQuestions,
              warning: error instanceof Error ? error.message : 'Error al generar el quiz con Gemini',
            })
          }

          return
        }

        if (task === 'evaluate-answer') {
          const questionText = String(body.questionText || '').trim()
          const options = Array.isArray(body.options) ? body.options : []
          const selectedOption = String(body.selectedOption || '').trim()
          const correctOption = String(body.correctOption || '').trim()

          if (!questionText || options.length === 0 || !selectedOption || !correctOption) {
            sendJson(res, 400, { error: 'Faltan datos para evaluar la respuesta' })
            return
          }

          const prompt = `
            Eres un evaluador de respuestas de examen. Recibirás la pregunta, las opciones del examen, la opción seleccionada por el estudiante y la opción correcta que definió el profesor.
            Responde únicamente con JSON válido y pulcro, sin texto adicional, con estas propiedades:
            {
              "isCorrect": true|false,
              "feedback": "Explicación breve y útil para el estudiante."
            }

            Pregunta: ${questionText}
            Opciones: ${options.map((opt) => `"${opt}"`).join(', ')}
            Seleccionada por el estudiante: "${selectedOption}"
            Opción correcta del profesor: "${correctOption}"
          `

          try {
            const textResponse = await callGeminiApi(apiKey, prompt)
            const parsed = parseJsonFromText(textResponse)
            sendJson(res, 200, {
              isCorrect: Boolean(parsed.isCorrect),
              feedback: String(parsed.feedback || 'Respuesta evaluada por la IA.'),
            })
          } catch (error) {
            sendJson(res, 502, { error: error instanceof Error ? error.message : 'Error al evaluar la respuesta con Gemini' })
          }

          return
        }

        if (task === 'analyze-results') {
          const correctCount = Number(body.correctCount)
          const totalQuestions = Number(body.totalQuestions)
          const correctPercentage = Number(body.correctPercentage)
          const incorrectPercentage = Number(body.incorrectPercentage)

          if (Number.isNaN(correctCount) || Number.isNaN(totalQuestions) || Number.isNaN(correctPercentage) || Number.isNaN(incorrectPercentage)) {
            sendJson(res, 400, { error: 'Faltan datos numéricos para analizar los resultados' })
            return
          }

          const prompt = `
            Actúa como un tutor que resume el desempeño de un estudiante.
            Recibe los resultados de un examen y devuelve únicamente un JSON válido con esta propiedad:
            {
              "summary": "Un resumen claro y breve del desempeño, indicando qué puede mejorar y qué hizo bien el estudiante."
            }

            Respuestas correctas: ${correctCount}
            Total de preguntas: ${totalQuestions}
            Porcentaje correctas: ${correctPercentage.toFixed(1)}%
            Porcentaje incorrectas: ${incorrectPercentage.toFixed(1)}%
          `

          try {
            const textResponse = await callGeminiApi(apiKey, prompt)
            const parsed = parseJsonFromText(textResponse)
            sendJson(res, 200, { summary: String(parsed.summary || `Obtuviste ${correctPercentage.toFixed(1)}% de respuestas correctas.`) })
          } catch (error) {
            sendJson(res, 502, { error: error instanceof Error ? error.message : 'Error al analizar los resultados con Gemini' })
          }

          return
        }

        sendJson(res, 400, { error: 'Tarea de IA desconocida' })
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
