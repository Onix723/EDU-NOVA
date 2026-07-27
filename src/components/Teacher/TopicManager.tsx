import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GripVertical, BookOpen, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { generateQuizWithAI } from '../../services/geminiService';

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
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [savedQuestions, setSavedQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [selectedTopicForQuestions, setSelectedTopicForQuestions] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [questionDraft, setQuestionDraft] = useState({
    topic_id: '',
    question_text: '',
    options: ['', '', '', ''],
    correct_option_index: 0,
  });

  useEffect(() => {
    fetchTopics();
  }, [courseId]);

  useEffect(() => {
    void loadExistingQuizAndQuestions();
  }, [courseId]);

  useEffect(() => {
    if (topics.length > 0 && (!questionDraft.topic_id || !topics.some(topic => topic.id === questionDraft.topic_id))) {
      setQuestionDraft(prev => ({ ...prev, topic_id: topics[0].id }));
    }
  }, [topics, questionDraft.topic_id]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (quizId) {
      fetchSavedQuestions(quizId);
    }
  }, [quizId]);

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

  const loadExistingQuizAndQuestions = async () => {
    try {
      const { data: existingQuizzes, error } = await supabase
        .from('quizzes')
        .select('id')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      const activeQuizId = existingQuizzes?.[0]?.id || null;
      setQuizId(activeQuizId);

      if (activeQuizId) {
        await fetchSavedQuestions(activeQuizId);
      } else {
        setSavedQuestions([]);
      }
    } catch (err) {
      console.error('Error loading existing quiz:', err);
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
      setToast({ type: 'success', message: 'Tema agregado correctamente.' });
    } catch (err) {
      setToast({ type: 'error', message: 'No se pudo agregar el tema.' });
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
      setToast({ type: 'success', message: 'Tema eliminado.' });
    } catch (err) {
      setToast({ type: 'error', message: 'No se pudo eliminar el tema.' });
    } finally {
      setSaving(false);
    }
  };

  const fetchSavedQuestions = async (activeQuizId: string) => {
    setLoadingQuestions(true);
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', activeQuizId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSavedQuestions(data || []);
    } catch (err) {
      console.error('Error fetching saved questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const ensureQuiz = async () => {
    if (quizId) return quizId;

    const { data: existingQuizzes, error: existingError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingError) throw existingError;

    if (existingQuizzes?.[0]?.id) {
      setQuizId(existingQuizzes[0].id);
      return existingQuizzes[0].id;
    }

    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .insert([{ course_id: courseId, title: `Evaluación - ${courseName}` }])
      .select()
      .single();

    if (quizError) throw quizError;

    setQuizId(quizData.id);
    return quizData.id;
  };

  const handleAddQuestion = async () => {
    if (topics.length === 0) {
      setToast({ type: 'error', message: 'Añade un tema antes de guardar preguntas.' });
      return;
    }

    if (!questionDraft.question_text.trim()) {
      setToast({ type: 'error', message: 'Escribe la pregunta antes de guardar.' });
      return;
    }

    if (!questionDraft.topic_id) {
      setToast({ type: 'error', message: 'Selecciona un tema para la pregunta.' });
      return;
    }

    if (questionDraft.options.some(option => !option.trim())) {
      setToast({ type: 'error', message: 'Completa las 4 opciones de respuesta.' });
      return;
    }

    setCreatingQuestion(true);
    try {
      const activeQuizId = await ensureQuiz();

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert([{
          quiz_id: activeQuizId,
          topic_id: questionDraft.topic_id,
          question_text: questionDraft.question_text.trim(),
          options: questionDraft.options.map(option => option.trim()),
          correct_option_index: questionDraft.correct_option_index,
          published: false,
        }]);

      if (questionsError) throw questionsError;

      setQuestionDraft(prev => ({
        ...prev,
        question_text: '',
        options: ['', '', '', ''],
        correct_option_index: 0,
      }));

      await fetchSavedQuestions(activeQuizId);
      setShowQuestionForm(false);
      setToast({ type: 'success', message: 'Pregunta guardada correctamente.' });
    } catch (err) {
      console.error('Question Save Error:', err);
      setToast({ type: 'error', message: 'No se pudo guardar la pregunta.' });
    } finally {
      setCreatingQuestion(false);
    }
  };

  const handleGenerateAIQuestions = async () => {
    if (topics.length === 0) {
      setToast({ type: 'error', message: 'Añade un tema antes de generar preguntas.' });
      return;
    }

    if (!confirm('Generar preguntas automáticas reemplazará las preguntas actuales. ¿Deseas continuar?')) {
      return;
    }

    setGeneratingQuestions(true);
    try {
      const activeQuizId = await ensureQuiz();
      const aiQuestions = await generateQuizWithAI(courseName, topics.map(({ id, title, description }) => ({ id, title, description })));

      if (!Array.isArray(aiQuestions) || aiQuestions.length === 0) {
        throw new Error('No se generaron preguntas con IA.');
      }

      const { error: deleteError } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', activeQuizId);

      if (deleteError) throw deleteError;

      const insertPayload = aiQuestions.map((question) => ({
        quiz_id: activeQuizId,
        topic_id: question.topic_id,
        question_text: question.question_text,
        options: question.options,
        correct_option_index: question.correct_option_index,
      }));

      const { error: insertError } = await supabase
        .from('quiz_questions')
        .insert(insertPayload.map((question) => ({ ...question, published: false })));

      if (insertError) throw insertError;

      await fetchSavedQuestions(activeQuizId);
      setShowQuestionForm(false);
      setToast({ type: 'success', message: 'Preguntas generadas correctamente con IA. Marca 7 para publicar.' });
    } catch (err) {
      console.error('AI Generate Error:', err);
      setToast({ type: 'error', message: 'No se pudieron generar las preguntas automáticas.' });
    } finally {
      setGeneratingQuestions(false);
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
            <p className="text-gray-400 text-sm mt-1">Define los temas y las preguntas que el profesor quiere evaluar.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
          >
            ✕
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className={`fixed top-4 left-1/2 z-[120] -translate-x-1/2 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur ${toast.type === 'success' ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' : 'border-red-400/40 bg-red-500/15 text-red-200'}`}
            >
              {toast.message}
            </motion.div>
          )}
          {/* Manual quiz setup */}
          <div className="bg-gradient-to-r from-[#12B1D1]/10 to-purple-500/10 border border-[#12B1D1]/30 p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#12B1D1] rounded-2xl text-white shadow-lg shadow-[#12B1D1]/20">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="text-white font-bold">Crear preguntas para la evaluación</h4>
                <p className="text-gray-400 text-xs">Puedes agregar tantas preguntas como quieras y revisarlas después, organizadas por tema.</p>
              </div>
            </div>

            <button
              onClick={() => setShowQuestionForm(prev => !prev)}
              className="w-full rounded-2xl border border-[#12B1D1]/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/15"
            >
              {showQuestionForm ? 'Cerrar formulario' : 'Añadir preguntas'}
            </button>

            {showQuestionForm && (
              <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <select
                  value={questionDraft.topic_id}
                  onChange={(e) => setQuestionDraft(prev => ({ ...prev, topic_id: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-2xl p-3 text-white focus:outline-none focus:border-[#12B1D1] transition-all"
                  style={{ color: '#fff' }}
                >
                  {topics.length === 0 ? (
                    <option value="">Agrega un tema primero</option>
                  ) : (
                    topics.map((topic) => (
                      <option key={topic.id} value={topic.id} style={{ backgroundColor: '#0f172a', color: '#fff' }}>{topic.title}</option>
                    ))
                  )}
                </select>

                <textarea
                  placeholder="Escribe la pregunta que verá el estudiante"
                  value={questionDraft.question_text}
                  onChange={(e) => setQuestionDraft(prev => ({ ...prev, question_text: e.target.value }))}
                  rows={3}
                  className="bg-white/5 border border-white/10 rounded-2xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#12B1D1] transition-all"
                />

                {questionDraft.options.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    placeholder={`Opción ${index + 1}`}
                    value={option}
                    onChange={(e) => {
                      const nextOptions = [...questionDraft.options];
                      nextOptions[index] = e.target.value;
                      setQuestionDraft(prev => ({ ...prev, options: nextOptions }));
                    }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#12B1D1] transition-all"
                  />
                ))}

                <select
                  value={questionDraft.correct_option_index}
                  onChange={(e) => setQuestionDraft(prev => ({ ...prev, correct_option_index: Number(e.target.value) }))}
                  className="bg-white/5 border border-white/10 rounded-2xl p-3 text-white focus:outline-none focus:border-[#12B1D1] transition-all"
                  style={{ color: '#fff' }}
                >
                  {questionDraft.options.map((option, index) => (
                    <option key={index} value={index} style={{ backgroundColor: '#0f172a', color: '#fff' }}>
                      {`Respuesta correcta: ${option || `Opción ${index + 1}`}`}
                    </option>
                  ))}
                </select>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={handleAddQuestion}
                    disabled={creatingQuestion || topics.length === 0}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingQuestion ? 'Guardando...' : 'Guardar pregunta'}
                  </button>
                  <button
                    onClick={() => setShowQuestionForm(false)}
                    className="w-full rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-gray-300 transition-all hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleGenerateAIQuestions}
                disabled={generatingQuestions || topics.length === 0}
                className="w-full rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] px-4 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingQuestions ? 'Generando preguntas...' : 'Generar preguntas con IA'}
              </button>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Preguntas guardadas</h4>
                <p className="text-xs text-gray-500">Selecciona hasta 7 preguntas para publicar a estudiantes.</p>
              </div>
              <div className="flex items-center gap-2">
                {loadingQuestions && <span className="text-xs text-gray-500">Cargando...</span>}
                <span className="text-xs text-gray-400">Publicadas: {savedQuestions.filter((q) => q.published).length}/7</span>
              </div>
            </div>

            <div className="space-y-3">
            {savedQuestions.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no hay preguntas generadas. Usa el botón para crear 10 preguntas con IA.</p>
            ) : (
              savedQuestions.map((question) => {
                const topic = topics.find((topic) => topic.id === question.topic_id);
                return (
                  <div key={question.id} className="rounded-3xl border border-white/10 bg-black/20 p-4 transition-all hover:border-white/30">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{topic?.title || 'Tema desconocido'}</p>
                        <p className="text-xs text-gray-400">{topic?.description || 'Sin descripción del tema'}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${question.published ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-gray-300'}`}>
                        {question.published ? 'Publicado' : 'Borrador'}
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-white">{question.question_text}</p>
                    <div className="mt-3 grid gap-2 text-xs">
                      {question.options?.map((option: string, index: number) => (
                        <div
                          key={`${question.id}-${index}`}
                          className={`rounded-2xl px-3 py-2 ${index === question.correct_option_index ? 'bg-emerald-500/10 text-emerald-200' : 'bg-white/5 text-gray-300'}`}
                        >
                          <span className="font-semibold">{String.fromCharCode(65 + index)}.</span> {option}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
                      <button
                        onClick={async () => {
                          const publishCount = savedQuestions.filter((q) => q.published).length;
                          const shouldPublish = !question.published;
                          if (shouldPublish && publishCount >= 7) {
                            setToast({ type: 'error', message: 'Solo puedes publicar 7 preguntas.' });
                            return;
                          }

                          const { error } = await supabase
                            .from('quiz_questions')
                            .update({ published: shouldPublish })
                            .eq('id', question.id);

                          if (error) {
                            setToast({ type: 'error', message: 'No se pudo actualizar el estado de publicación.' });
                            return;
                          }

                          setSavedQuestions((prev) => prev.map((q) =>
                            q.id === question.id ? { ...q, published: shouldPublish } : q
                          ));
                          setToast({ type: 'success', message: shouldPublish ? 'Pregunta publicada.' : 'Pregunta despublicada.' });
                        }}
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${question.published ? 'bg-white/10 text-gray-200 hover:bg-white/15' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/25'}`}
                      >
                        {question.published ? 'Despublicar' : 'Publicar'}
                      </button>
                      <span className="text-[11px] text-gray-400">Correcta: {question.options?.[question.correct_option_index] || '—'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          </div>


          <AnimatePresence>
            {selectedTopicForQuestions && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                onClick={() => setSelectedTopicForQuestions(null)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.98 }}
                  className="w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-[32px] border border-white/10 bg-[#0a0a0a] shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {topics.find((topic) => topic.id === selectedTopicForQuestions)?.title || 'Preguntas guardadas'}
                      </h4>
                      <p className="text-sm text-gray-400">Todas las preguntas guardadas para este tema.</p>
                    </div>
                    <button
                      onClick={() => setSelectedTopicForQuestions(null)}
                      className="rounded-full p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto p-6 custom-scrollbar">
                    <div className="space-y-3">
                      {savedQuestions
                        .filter((question) => question.topic_id === selectedTopicForQuestions)
                        .map((question) => (
                          <div key={question.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-sm font-medium text-white">{question.question_text}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {(question.options || []).map((option: string, index: number) => (
                                <span
                                  key={`${question.id}-${index}`}
                                  className={`rounded-full px-2.5 py-1 text-xs ${index === question.correct_option_index ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-gray-300'}`}
                                >
                                  {String.fromCharCode(65 + index)}. {option}
                                </span>
                              ))}
                            </div>
                            <p className="mt-3 text-[11px] uppercase tracking-wide text-gray-400">
                              Respuesta correcta: {question.options?.[question.correct_option_index] || '—'}
                            </p>
                            <button
                              onClick={async () => {
                                const publishCount = savedQuestions.filter((q) => q.published).length;
                                const shouldPublish = !question.published;
                                if (shouldPublish && publishCount >= 7) {
                                  setToast({ type: 'error', message: 'Solo puedes publicar 7 preguntas.' });
                                  return;
                                }

                                const { error } = await supabase
                                  .from('quiz_questions')
                                  .update({ published: shouldPublish })
                                  .eq('id', question.id);

                                if (error) {
                                  setToast({ type: 'error', message: 'No se pudo actualizar el estado de publicación.' });
                                  return;
                                }

                                setSavedQuestions((prev) => prev.map((q) =>
                                  q.id === question.id ? { ...q, published: shouldPublish } : q
                                ));
                                setToast({ type: 'success', message: shouldPublish ? 'Pregunta publicada.' : 'Pregunta despublicada.' });
                              }}
                              className={`mt-3 rounded-full px-4 py-2 text-xs font-semibold transition-all ${question.published ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/25' : 'bg-white/10 text-gray-200 hover:bg-white/15'}`}
                            >
                              {question.published ? 'Publicado' : 'Publicar'}
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

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
