import { motion } from 'framer-motion';
import { ArrowLeft, Save, Award } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {} = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Course Info
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
      
      setCourse(courseData);

      // 2. Fetch Students in this course and their grades
      const { data: studentsData, error: studentsError } = await supabase
        .from('course_students')
        .select(`
          student_id,
          profiles (username, email),
          grades (score, feedback)
        `)
        .eq('course_id', id);

      if (studentsError) throw studentsError;

      const formattedStudents = studentsData?.map(item => ({
        id: item.student_id,
        username: (item.profiles as any)?.username || 'Desconocido',
        email: (item.profiles as any)?.email || 'Sin email',
        score: item.grades?.[0]?.score || '',
        feedback: item.grades?.[0]?.feedback || ''
      })) || [];

      setStudents(formattedStudents);
    } catch (err) {
      console.error('Error fetching course details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGrade = async (studentId: string, score: number, feedback: string) => {
    try {
      const { error } = await supabase
        .from('grades')
        .upsert({ 
          student_id: studentId, 
          course_id: id, 
          score, 
          feedback 
        }, { onConflict: 'student_id,course_id' });

      if (error) throw error;
      
      // Update local state
      setStudents(prev => prev.map(s => 
        s.id === studentId ? { ...s, score, feedback } : s
      ));
    } catch (err) {
      alert('Error al guardar la calificación: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) return <div className="flex justify-center py-20 text-white">Cargando detalles del curso...</div>;
  if (!course) return <div className="flex justify-center py-20 text-white">Curso no encontrado.</div>;

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <button 
          onClick={() => navigate('/teacher/courses')}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-4xl font-bold text-white">{course.title}</h2>
          <p className="text-gray-400">{course.description}</p>
        </div>
      </motion.div>

      <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Award size={20} className="text-[#12B1D1]" />
            Asignar Calificaciones
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-sm border-b border-white/10">
                <th className="pb-4 font-medium">Estudiante</th>
                <th className="pb-4 font-medium w-32">Nota</th>
                <th className="pb-4 font-medium">Feedback / Comentarios</th>
                <th className="pb-4 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {students.map((student, i) => (
                <motion.tr 
                  key={student.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs">
                      {student.username[0].toUpperCase()}
                    </div>
                    <span className="font-medium">{student.username}</span>
                  </td>
                  <td className="py-4">
                    <input 
                      type="number" 
                      step="0.1"
                      value={student.score}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setStudents(prev => prev.map(s => s.id === student.id ? { ...s, score: val } : s));
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-center text-white focus:outline-none focus:border-[#12B1D1]"
                    />
                  </td>
                  <td className="py-4">
                    <input 
                      type="text" 
                      value={student.feedback}
                      onChange={(e) => {
                        setStudents(prev => prev.map(s => s.id === student.id ? { ...s, feedback: e.target.value } : s));
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#12B1D1]"
                      placeholder="Escribe un comentario..."
                    />
                  </td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => handleSaveGrade(student.id, student.score, student.feedback)}
                      className="p-2 rounded-lg bg-gradient-to-r from-[#1089D3] to-[#12B1D1] text-white hover:scale-110 transition-all"
                    >
                      <Save size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-500">No hay alumnos inscritos en este curso.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
