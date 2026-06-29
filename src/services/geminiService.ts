const AI_PROXY_URL = (import.meta.env.VITE_AI_PROXY_URL || 'http://localhost:8787/generate-quiz').trim();

export interface QuizQuestion {
  topic_id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
}

function buildFallbackQuiz(courseTitle: string, topics: { id: string; title: string; description: string }[]): QuizQuestion[] {
  return topics.map((topic) => ({
    topic_id: topic.id,
    question_text: `¿Cuál opción describe mejor el tema “${topic.title}” del curso “${courseTitle}”?`,
    options: [
      `Concepto principal de ${topic.title}`,
      `Ejemplo práctico de ${topic.title}`,
      `Detalle secundario de ${topic.title}`,
      `Idea relacionada con ${topic.title}`,
    ],
    correct_option_index: 0,
  }));
}

export async function generateQuizWithAI(courseTitle: string, topics: { id: string; title: string; description: string }[]): Promise<QuizQuestion[]> {
  try {
    const response = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseTitle, topics }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'No se pudo generar el quiz');
    }

    const data = await response.json();
    return Array.isArray(data.questions) ? data.questions : buildFallbackQuiz(courseTitle, topics);
  } catch (err) {
    console.warn('La generación con IA falló. Se usará un quiz local de respaldo.', err);
    return buildFallbackQuiz(courseTitle, topics);
  }
}
