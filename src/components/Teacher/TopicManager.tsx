import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GripVertical, BookOpen, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { generateQuizWithAI } from '../../services/geminiService';

interface Topic {
  id: string;
  title: string;
  description: string;
  order_index: number;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  order_index: number;
}

interface TopicManagerProps {
  courseId: string;
  courseName: string;
  onClose: () => void;
}

export default function TopicManager({ courseId, courseName, onClose }: TopicManagerProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopic, setNewTopic] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, [courseId]);

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('course_topics')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setTopics(data || []);
    } catch (err) {
      console.error('Error fetching topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTopic = async () => {
    if (!newTopic.title.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('course_topics')
        .insert([
          { 
            course_id: courseId, 
            title: newTopic.title, 
            description: newTopic.description, 
            order_index: topics.length 
          }
        ])
        .select()
        .single();

      if (error) throw error;
      setTopics([...topics, data]);
      setNewTopic({ title: '', description: '' });
    } catch (err) {
      alert('Error adding topic: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const deleteTopic = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este tema?')) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('course_topics')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTopics(topics.filter(t => t.id !== id));
    } catch (err) {
      alert('Error deleting topic: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (topics.length === 0) {
      alert('Primero debes añadir al menos un tema para generar el quiz.');
      return;
    }

    setGeneratingQuiz(true);
    try {
      // 1. Llamar a la IA para generar las preguntas
      const aiQuestions = await generateQuizWithAI(courseName, topics);

      // 2. Crear el registro del Quiz en Supabase
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert([{ 
          course_id: courseId, 
          title: `Evaluación Diagnóstica - ${courseName}` 
        }])
        .select()
        .single();

      if (quizError) throw quizError;

      // 3. Insertar las preguntas generadas
      const questionsToInsert = aiQuestions.map(q => ({
        quiz_id: quizData.id,
        topic_id: q.topic_id,
        question_text: q.question_text,
        options: q.options,
        correct_option_index: q.correct_option_index
      }));

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      alert('¡Quiz generado con éxito por la IA!');
    } catch (err) {
      console.error('Quiz Gen Error:', err);
      alert('Error al generar el quiz: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setGeneratingQuiz(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-white/[0.02] to-transparent">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <BookOpen className="text-[#12B1D1]" />
              Temas de {courseName}
            </h3>
            <p className="text-gray-400 text-sm mt-1">Define los módulos que la IA usará para evaluar al alumno.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
          >
            ✕
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* AI Quiz Action */}
          <div className="bg-gradient-to-r from-[#12B1D1]/10 to-purple-500/10 border border-[#12B1D1]/30 p-6 rounded-3xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#12B1D1] rounded-2xl text-white shadow-lg shadow-[#12B1D1]/20">
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="text-white font-bold">Generador de Quiz IA</h4>
                <p className="text-gray-400 text-xs">Crea automáticamente preguntas basadas en tus temas.</p>
              </div>
            </div>
            <button 
              onClick={handleGenerateQuiz}
              disabled={generatingQuiz || topics.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingQuiz ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generando...
                </>
              ) : (
                'Generar Ahora'
              )}
            </button>
          </div>

          {/* Add New Topic */}
          <div className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl space-y-4">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Añadir Nuevo Tema</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text"
                placeholder="Ej: Introducción a React"
                value={newTopic.title}
                onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-2xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#12B1D1] transition-all"
              />
              <input 
                type="text"
                placeholder="Descripción breve..."
                value={newTopic.description}
                onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-2xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#12B1D1] transition-all"
              />
            </div>
            <button 
              onClick={addTopic}
              disabled={saving || !newTopic.title}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#1089D3] to-[#12B1D1] text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              <Plus size={20} />
              Agregar Tema
            </button>
          </div>

          {/* Topics List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-10 text-gray-500">Cargando temas...</div>
            ) : topics.length === 0 ? (
              <div className="text-center py-10 text-gray-500 border-2 border-dashed border-white/5 rounded-3xl">
                No hay temas creados aún.
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {topics.map((topic) => (
                  <motion.div 
                    key={topic.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    layout
                    className="group flex items-center gap-4 p-4 bg-white/[0.02] border border-white/10 rounded-2xl hover:bg-white/[0.05] transition-all"
                  >
                    <div className="text-gray-600 cursor-grab active:cursor-grabbing">
                      <GripVertical size={20} />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-white font-medium">{topic.title}</h5>
                      <p className="text-gray-500 text-xs line-clamp-1">{topic.description || 'Sin descripción'}</p>
                    </div>
                    <button 
                      onClick={() => deleteTopic(topic.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        <div className="p-6 bg-white/[0.01] border-t border-white/10 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-gray-400 hover:text-white font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </motion.div>
  );
}
