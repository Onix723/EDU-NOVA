import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { ChevronRight, ChevronLeft, ArrowLeft, Trophy } from 'lucide-react';
import { calculateAndUpdateMastery } from '../../services/masteryService';

export default function StudentQuiz() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuiz();
  }, [courseId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      // Get the latest quiz for this course
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (quizError || !quizData) throw new Error('No hay evaluaciones disponibles para este curso.');

      // Get questions for this quiz
      const { data: questionsData, error: qError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizData.id);

      if (qError) throw qError;

      setQuiz(quizData);
      setQuestions(questionsData || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error cargando el quiz');
      navigate('/student/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      if (!confirm('Aún no has respondido todas las preguntas. ¿Deseas enviar de todas formas?')) return;
    }

    try {
      // 1. Calculate Score
      let correctCount = 0;
      const answersData = questions.map(q => {
        const isCorrect = selectedAnswers[q.id] === q.correct_option_index;
        if (isCorrect) correctCount++;
        return {
          question_id: q.id,
          selected_option_index: selectedAnswers[q.id],
          is_correct: isCorrect
        };
      });

      const finalScore = (correctCount / questions.length) * 100;

      // 2. Save Attempt
      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert([{
          student_id: profile?.id,
          quiz_id: quiz.id,
          score: finalScore
        }])
        .select()
        .single();

      if (attemptError) throw attemptError;

      // 3. Save Individual Answers
      const answersWithAttemptId = answersData.map(a => ({
        ...a,
        attempt_id: attempt.id
      }));

      const { error: answersError } = await supabase
        .from('quiz_answers')
        .insert(answersWithAttemptId);

      if (answersError) throw answersError;

      // 4. Update Mastery Levels
      await calculateAndUpdateMastery(profile?.id!, attempt.id);

      setScore(finalScore);
      setIsSubmitted(true);
    } catch (err) {
      alert('Error al guardar los resultados: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="animate-pulse text-xl font-bold">Cargando Evaluación...</div>
    </div>
  );

  if (isSubmitted) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black text-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/[0.03] border border-white/10 p-10 rounded-[40px] max-w-md w-full text-center space-y-6 backdrop-blur-xl"
      >
        <div className="flex justify-center">
          <div className="p-4 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full shadow-lg shadow-orange-500/20">
            <Trophy size={48} className="text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold">¡Evaluación Completada!</h2>
          <p className="text-gray-400 mt-2">Tu puntaje ha sido registrado y analizado por la IA.</p>
        </div>
        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#12B1D1] to-blue-400">
          {score.toFixed(1)}%
        </div>
        <button 
          onClick={() => navigate('/student/dashboard')}
          className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all"
        >
          Volver al Dashboard
        </button>
      </motion.div>
    </div>
  );

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen p-6 flex flex-col items-center bg-black text-white">
      <div className="w-full max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/student/courses')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Volver
          </button>
          <div className="text-sm font-medium text-gray-500">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#12B1D1] to-blue-400"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white/[0.03] border border-white/10 p-8 rounded-[40px] backdrop-blur-xl space-y-8"
          >
            <h2 className="text-2xl font-bold leading-relaxed">
              {currentQuestion.question_text}
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {currentQuestion.options.map((option: string, index: number) => (
                <button 
                  key={index}
                  onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                  className={`p-5 rounded-2xl text-left transition-all border ${
                    selectedAnswers[currentQuestion.id] === index 
                    ? 'bg-[#12B1D1]/20 border-[#12B1D1] text-white' 
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      selectedAnswers[currentQuestion.id] === index ? 'border-[#12B1D1] bg-[#12B1D1] text-white' : 'border-gray-600 text-gray-600'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    {option}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center pt-4">
          <button 
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={20} />
            Anterior
          </button>

          {currentQuestionIndex === questions.length - 1 ? (
            <button 
              onClick={handleSubmit}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#1089D3] to-[#12B1D1] text-white font-bold hover:scale-105 transition-all shadow-lg"
            >
              Finalizar Evaluación
            </button>
          ) : (
            <button 
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#1089D3] to-[#12B1D1] text-white font-bold hover:scale-105 transition-all shadow-lg"
            >
              Siguiente
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
