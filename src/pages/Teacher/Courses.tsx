import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Clock, X, Users, UserPlus, LayoutList } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import TopicManager from '../../components/Teacher/TopicManager';

export default function TeacherCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [newCourse, setNewCourse] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select(`*, course_students(student_id)`)
        .eq('teacher_id', user?.id);

      if (error) throw error;
      
      const coursesWithCount = data?.map(course => ({
        ...course,
        studentCount: course.course_students?.length || 0
      })) || [];
      
      setCourses(coursesWithCount);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('courses')
        .insert([{ title: newCourse.title, description: newCourse.description, teacher_id: user?.id }]);

      if (error) throw error;
      
      setNewCourse({ title: '', description: '' });
      setIsModalOpen(false);
      await fetchCourses();
    } catch (err) {
      alert('Error al crear el curso: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const openEnrollModal = async (course: any) => {
    setSelectedCourse(course);
    try {
      const { data: studentsData } = await supabase.from('profiles').select('*').eq('role', 'student');
      setAllStudents(studentsData || []);

      const { data: enrolledData } = await supabase
        .from('course_students')
        .select('student_id')
        .eq('course_id', course.id);
      
      setEnrolledStudents(enrolledData?.map(item => item.student_id) || []);
      setIsEnrollModalOpen(true);
    } catch (err) {
      console.error('Error loading enrollment data:', err);
    }
  };

  const toggleEnrollment = async (studentId: string) => {
    const isEnrolled = enrolledStudents.includes(studentId);
    try {
      if (isEnrolled) {
        const { error } = await supabase.from('course_students').delete().eq('course_id', selectedCourse.id).eq('student_id', studentId);
        if (error) throw error;
        setEnrolledStudents(enrolledStudents.filter(id => id !== studentId));
      } else {
        const { error } = await supabase.from('course_students').insert([{ course_id: selectedCourse.id, student_id: studentId }]);
        if (error) throw error;
        setEnrolledStudents([...enrolledStudents, studentId]);
      }
      await fetchCourses();
    } catch (err) {
      alert('Error al actualizar inscripción: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
          <h2 className="text-4xl font-bold text-white">Gestión de Cursos</h2>
          <p className="text-gray-400 mt-2">Crea y organiza el contenido educativo para tus alumnos.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#1089D3] to-[#12B1D1] text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg"
        >
          <Plus size={20} />
          Nuevo Curso
        </button>
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
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Activo</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
              <p className="text-gray-400 text-sm mb-6 line-clamp-2">{course.description || 'Sin descripción disponible.'}</p>
              <div className="flex items-center gap-4 text-gray-400 text-sm mb-6">
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  {course.studentCount} alumnos
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  En curso
                </div>
              </div>
               <div className="mt-6 pt-6 border-t border-white/10 flex gap-3">
                 <button 
                   onClick={() => openEnrollModal(course)}
                   className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-all flex items-center justify-center gap-2 border border-white/10"
                 >
                   <UserPlus size={14} />
                   Alumnos
                 </button>
                 <button 
                   onClick={() => {
                     setSelectedCourse(course);
                     setIsTopicModalOpen(true);
                   }}
                   className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-all flex items-center justify-center gap-2 border border-white/10"
                 >
                   <LayoutList size={14} />
                   Temas
                 </button>
               </div>
            </motion.div>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500">
              Aún no has creado ningún curso. Haz clic en "Nuevo Curso" para empezar.
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-900 border border-white/10 p-8 rounded-[40px] w-full max-w-md shadow-2xl relative"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <h3 className="text-2xl font-bold text-white mb-6">Crear Nuevo Curso</h3>
              <form onSubmit={handleCreateCourse} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 ml-1">Título del Curso</label>
                  <input required type="text" value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} placeholder="Ej. Matemáticas Avanzadas" className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#12B1D1] transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 ml-1">Descripción</label>
                  <textarea value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} placeholder="Breve descripción del curso..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#12B1D1] transition-all h-32 resize-none" />
                </div>
                <button type="submit" className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#1089D3] to-[#12B1D1] text-white font-bold hover:scale-[1.02] transition-all shadow-lg">
                  Crear Curso
                </button>
              </form>
            </motion.div>
          </div>
        )}

         {isEnrollModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-gray-900 border border-white/10 p-8 rounded-[40px] w-full max-w-lg shadow-2xl relative"
             >
               <button onClick={() => setIsEnrollModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
                 <X size={24} />
               </button>
               <h3 className="text-2xl font-bold text-white mb-2">Inscribir Alumnos</h3>
               <p className="text-gray-400 mb-6">Curso: {selectedCourse?.title}</p>
               <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                 {allStudents.map((student) => (
                   <div key={student.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs">
                         {student.username[0].toUpperCase()}
                       </div>
                       <div className="flex flex-col">
                         <span className="text-sm font-medium text-white">{student.username}</span>
                         <span className="text-xs text-gray-500">{student.email}</span>
                       </div>
                     </div>
                     <button 
                       onClick={() => toggleEnrollment(student.id)}
                       className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                         enrolledStudents.includes(student.id) 
                         ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                         : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                       }`}
                     >
                       {enrolledStudents.includes(student.id) ? 'Quitar' : 'Añadir'}
                     </button>
                   </div>
                 ))}
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
       
       <AnimatePresence>
         {isTopicModalOpen && selectedCourse && (
           <TopicManager 
             courseId={selectedCourse.id} 
             courseName={selectedCourse.title} 
             onClose={() => setIsTopicModalOpen(false)} 
           />
         )}
       </AnimatePresence>
     </div>
   );
}
