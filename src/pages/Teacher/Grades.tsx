import { motion } from 'framer-motion';
import { Award, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export default function TeacherGrades() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('teacher_id', user?.id);

      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseStudents = async (course: any) => {
    setSelectedCourse(course);
    try {
      // Join course_students with profiles and grades
      const { data, error } = await supabase
        .from('course_students')
        .select(`
          student_id,
          profiles (username, email),
          grades (score, feedback)
        `)
        .eq('course_id', course.id);

      if (error) throw error;
      
      setStudents(data?.map(item => ({
        id: item.student_id,
        username: (item.profiles as any)?.username || 'Desconocido',
        email: (item.profiles as any)?.email || 'Sin email',
        score: item.grades?.[0]?.score || '',
        feedback: item.grades?.[0]?.feedback || ''
      })) || []);
    } catch (err) {
      console.error('Error loading students:', err);
    }
  };

  const handleSaveGrade = async (studentId: string, score: number, feedback: string) => {
    setSaving(true);
    try {
      // Upsert grade: Update if exists, otherwise insert
      const { error } = await supabase
        .from('grades')
        .upsert({
          student_id: studentId,
          course_id: selectedCourse.id,
          score,
          feedback,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      
      // Update local state
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, score, feedback } : s));
    } catch (err) {
      alert('Error al guardar la calificación: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
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
          <h2 className="text-4xl font-bold text-white">Asignación de Calificaciones</h2>
          <p className="text-gray-400 mt-2">Evalúa el desempeño de tus alumnos en cada curso.</p>
        </div>
        <Award size={40} className="text-[#12B1D1] opacity-50" />
      </motion.div>

      {!selectedCourse ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-10 text-gray-400">Cargando cursos...</div>
          ) : (
            courses.map((course, i) => (
              <motion.div 
                key={course.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => loadCourseStudents(course)}
                className="bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 rounded-3xl cursor-pointer hover:border-[#12B1D1] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1089D3] to-[#12B1D1] text-white shadow-lg group-hover:scale-110 transition-transform">
                    <BookOpen size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{course.title}</h3>
                    <p className="text-gray-500 text-sm">Haz clic para calificar</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
          {courses.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500">
              No tienes cursos creados. Crea uno primero en Gestión de Cursos.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedCourse(null)}
            className="flex items-center gap-2 text-[#12B1D1] hover:text-white transition-colors text-sm font-medium"
          >
            ← Volver a la lista de cursos
          </button>

          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Alumnos de: {selectedCourse.title}</h3>
              <div className="text-xs text-gray-500">Cerrar sesión para guardar cambios automáticamente</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-white/10">
                    <th className="pb-4 font-medium">Estudiante</th>
                    <th className="pb-4 font-medium w-32">Nota (0-10)</th>
                    <th className="pb-4 font-medium">Feedback</th>
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
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                            {student.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{student.username}</p>
                            <p className="text-[10px] text-gray-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <input 
                          type="number" 
                          min="0" 
                          max="10" 
                          step="0.1"
                          value={student.score}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setStudents(prev => prev.map(s => s.id === student.id ? { ...s, score: val } : s));
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white text-center focus:outline-none focus:border-[#12B1D1] transition-all"
                        />
                      </td>
                      <td className="py-4">
                        <input 
                          type="text" 
                          value={student.feedback}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStudents(prev => prev.map(s => s.id === student.id ? { ...s, feedback: val } : s));
                          }}
                          placeholder="Agregar comentario..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#12B1D1] transition-all"
                        />
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => handleSaveGrade(student.id, student.score, student.feedback)}
                          disabled={saving}
                          className="p-2 rounded-xl bg-[#12B1D1]/20 text-[#12B1D1] hover:bg-[#12B1D1] hover:text-white transition-all disabled:opacity-50"
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
      )}
    </div>
  );
}

function BookOpen({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3H22z" />
    </svg>
  );
}
