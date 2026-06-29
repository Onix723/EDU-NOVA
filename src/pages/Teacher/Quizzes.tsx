import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Trash2, Eye, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export default function TeacherQuizzes() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, [user]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          courses (title),
          quiz_questions (id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const quizzesWithCount = data?.map(q => ({
        ...q,
        questionCount: q.quiz_questions?.length || 0
      })) || [];
      
      setQuizzes(quizzesWithCount);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuiz = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este quiz y todas sus preguntas?')) return;
    try {
      const { error } = await supabase.from('quizzes').delete().eq('id', id);
      if (error) throw error;
      setQuizzes(quizzes.filter(q => q.id !== id));
    } catch (err) {
      alert('Error al eliminar el quiz: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h2 className="text-4xl font-bold text-white">Biblioteca de Quizzes</h2>
          <p className="text-gray-400 mt-2">Gestiona todas las evaluaciones generadas para tus cursos.</p>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-10 text-gray-400">Cargando quizzes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz, i) => (
            <motion.div 
              key={quiz.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 rounded-3xl relative group hover:border-white/30 transition-all"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
                  <FileText size={24} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => deleteQuiz(quiz.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  {quiz.courses?.title || 'Curso desconocido'}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">{quiz.title}</h3>
              </div>

              <div className="flex items-center gap-4 text-gray-400 text-sm mb-6">
                <div className="flex items-center gap-1">
                  <BookOpen size={14} />
                  {quiz.questionCount} preguntas
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(quiz.created_at).toLocaleDateString()}
                </div>
              </div>

              <button className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all flex items-center justify-center gap-2 border border-white/10">
                <Eye size={16} />
                Revisar Preguntas
              </button>
            </motion.div>
          ))}
          {quizzes.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500">
              No hay quizzes generados aún. Ve a la sección de Cursos para crear uno.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
