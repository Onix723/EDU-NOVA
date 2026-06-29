import { motion } from 'framer-motion';
import { BookOpen, FileText, PlayCircle, Download, BrainCircuit, CheckCircle2, Circle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';


export default function StudentCourses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [courseTopics, setCourseTopics] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCourses();
  }, [user]);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('course_students')
        .select(`
          course_id,
          courses (*)
        `)
        .eq('student_id', user?.id);

      if (error) throw error;
      const myCourses = data?.map(item => item.courses) || [];
      setCourses(myCourses);

      // Fetch topics and mastery for each course
      const topicsMap: Record<string, any[]> = {};
      for (const course of myCourses) {
        const courseId = typeof course === 'string' ? course : (course as any).id;
        const { data: topics } = await supabase
          .from('course_topics')
          .select(`*, student_mastery(mastery_level)`)
          .eq('course_id', courseId)
          .eq('student_mastery.student_id', user?.id);
        
        topicsMap[String(courseId)] = topics || [];
      }
      setCourseTopics(topicsMap);
    } catch (err) {
      console.error('Error fetching student courses:', err);
    } finally {
      setLoading(false);
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
          <h2 className="text-4xl font-bold text-white">Mis Cursos</h2>
          <p className="text-gray-400 mt-2">Accede a tus materiales de estudio y continúa tu aprendizaje.</p>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-10 text-gray-400">Cargando cursos...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, i) => (
            <motion.div 
              key={course.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:border-white/30 transition-all"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 opacity-10 blur-2xl group-hover:opacity-20 transition-opacity" />
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1089D3] to-[#12B1D1] text-white shadow-lg">
                  <BookOpen size={24} />
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">En Progreso</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
              <p className="text-gray-400 text-sm mb-6">{course.description || 'Sin descripción.'}</p>
               <div className="space-y-3">
                 <button 
                   onClick={() => navigate(`/student/quiz/${course.id}`)}
                   className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95"
                 >
                   <BrainCircuit size={16} />
                   Test de Nivel IA
                 </button>
                 
                 <div className="py-2">
                   <p className="text-[10px] uppercase font-bold text-gray-500 mb-2 ml-1">Progreso de Temas</p>
                   <div className="space-y-2">
                     {(courseTopics[course] || []).map((topic: any) => (
                       <div key={topic.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs">
                         <span className="text-gray-300 truncate mr-2">{topic.title}</span>
                         {topic.student_mastery ? (
                           <div className="flex items-center gap-2">
                             <span className="text-[#12B1D1] font-bold">{(topic.student_mastery.mastery_level * 100).toFixed(0)}%</span>
                             <CheckCircle2 size={12} className="text-emerald-400" />
                           </div>
                         ) : (
                           <Circle size={12} className="text-gray-600" />
                         )}
                       </div>
                     ))}
                   </div>
                 </div>

                 <button className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all flex items-center justify-center gap-2 border border-white/10">
                   <PlayCircle size={16} />
                   Continuar Lección
                 </button>
                 <button className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-2 border border-white/10">
                   <Download size={16} />
                   Descargar Guía
                 </button>
                 <button className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-2 border border-white/10">
                   <FileText size={16} />
                   Ver Tareas
                 </button>
               </div>
            </motion.div>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500">
              No estás inscrito en ningún curso todavía.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
