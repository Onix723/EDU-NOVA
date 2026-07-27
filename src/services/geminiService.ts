const AI_PROXY_URL = (import.meta.env.VITE_AI_PROXY_URL || 'http://localhost:8787/generate-quiz').trim();

export interface QuizQuestion {
  topic_id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
}

export interface AnswerEvaluation {
  isCorrect: boolean;
  feedback: string;
}

export interface QuizAnalysisResult {
  correctPercentage: number;
  incorrectPercentage: number;
  summary: string;
}

function buildFallbackQuiz(_courseTitle: string, topics: { id: string; title: string; description: string }[]): QuizQuestion[] {
  const result: QuizQuestion[] = [];
  for (let i = 0; i < 10; i++) {
    const topic = topics[i % topics.length];
    result.push({
      topic_id: topic.id,
      question_text: `Pregunta ${i + 1} sobre ${topic.title}: identifica la respuesta correcta.`,
      options: [
        `Resumen del concepto de ${topic.title}`,
        `Ejemplo práctico de ${topic.title}`,
        `Detalle secundario de ${topic.title}`,
        `Idea no relacionada con ${topic.title}`,
      ],
      correct_option_index: 0,
    });
  }
  return result;
}

export async function generateQuizWithAI(courseTitle: string, topics: { id: string; title: string; description: string }[]): Promise<QuizQuestion[]> {
  try {
    const response = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'generate-quiz', courseTitle, topics }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'No se pudo generar el quiz');
    }

    const data = await response.json();
    if (data?.warning) {
      console.warn('AI proxy warning:', data.warning)
    }

    if (Array.isArray(data.questions) && data.questions.length > 0) {
      return data.questions
    }

    return buildFallbackQuiz(courseTitle, topics)
  } catch (err) {
    console.warn('La generación con IA falló. Se usará un quiz local de respaldo.', err);
    return buildFallbackQuiz(courseTitle, topics);
  }
}

export async function analyzeAnswerWithAI(
  questionText: string,
  options: string[],
  selectedOption: string,
  correctOption: string
): Promise<AnswerEvaluation> {
  try {
    const response = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'evaluate-answer',
        questionText,
        options,
        selectedOption,
        correctOption,
      }),
    });

    if (!response.ok) {
      throw new Error('La evaluación con IA no está disponible');
    }

    const data = await response.json();
    if (typeof data?.isCorrect === 'boolean') {
      return {
        isCorrect: data.isCorrect,
        feedback: data.feedback || 'Respuesta evaluada por la IA.',
      };
    }
  } catch (err) {
    console.warn('La evaluación con IA falló. Se usará la comparación directa.', err);
  }

  const normalizedSelected = selectedOption.trim().toLowerCase();
  const normalizedCorrect = correctOption.trim().toLowerCase();
  const isCorrect = normalizedSelected === normalizedCorrect;
  return {
    isCorrect,
    feedback: isCorrect
      ? 'Respuesta correcta. Coincide con la opción marcada por el profesor.'
      : `Respuesta incorrecta. La opción correcta según el profesor fue “${correctOption}”.`,
  };
}

export async function analyzeQuizResultsWithAI(
  correctCount: number,
  totalQuestions: number
): Promise<QuizAnalysisResult> {
  const correctPercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const incorrectPercentage = totalQuestions > 0 ? 100 - correctPercentage : 0;

  try {
    const response = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'analyze-results',
        correctCount,
        totalQuestions,
        correctPercentage,
        incorrectPercentage,
      }),
    });

    if (!response.ok) {
      throw new Error('No se pudo analizar el resultado con IA');
    }

    const data = await response.json();

    if (data?.summary) {
      return {
        correctPercentage,
        incorrectPercentage,
        summary: data.summary,
      };
    }
  } catch (err) {
    console.warn('El análisis con IA falló. Se usará el cálculo local.', err);
  }

  return {
    correctPercentage,
    incorrectPercentage,
    summary: `Tu resultado muestra ${correctCount} respuestas correctas de ${totalQuestions} preguntas.`,
  };
}
