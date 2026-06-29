import { motion } from 'framer-motion';
import { BookOpen, TrendingUp, Clock, Award } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [avgGrade, setAvgGrade] = useState('0.0');
  const [pendingTasks, setPendingTasks] = useState(0);

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    try {
      
      // 1. Fetch enrolled courses
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_students')
        .select(`
          course_id,
          courses (*)
        `)
        .eq('student_id', user?.id);

      if (enrollError) throw enrollError;
      const userCourses = enrollments?.map(e => e.courses) || [];
      setCourses(userCourses);

      // 2. Calculate average grade
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('score')
        .eq('student_id', user?.id);

      if (!gradesError && gradesData && gradesData.length > 0) {
        const sum = gradesData.reduce((acc, curr) => acc + Number(curr.score), 0);
        setAvgGrade((sum / gradesData.length).toFixed(1));
      }

      // 3. Pending tasks (mocked as we don't have a tasks table yet, but we use a random number for now or total courses)
      setPendingTasks(userCourses.length * 2); 

    } catch (err) {
      console.error('Error fetching student data:', err);
    }
  };

  const stats = [
    { icon: BookOpen, label: 'Cursos Activos', value: courses.length.toString(), color: 'from-blue-500 to-cyan-400' },
    { icon: TrendingUp, label: 'Promedio Actual', value: avgGrade, color: 'from-emerald-500 to-teal-400' },
    { icon: Clock, label: 'Tareas Pendientes', value: pendingTasks.toString(), color: 'from-orange-500 to-red-400' },
    { icon: Award, label: 'Logros Obtenidos', value: '0', color: 'from-purple-500 to-indigo-400' },
  ];

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-end"
      >
        <div>
          <h2 className="text-4xl font-bold text-white">Hola, Estudiante 👋</h2>
          <p className="text-gray-400 mt-2">Sigue impulsando tu conocimiento hoy.</p>
        </div>
        <div className="text-right text-gray-500 text-sm">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:border-white/30 transition-all"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Mis Cursos Recientes</h3>
          <div className="space-y-4">
            {courses.length > 0 ? courses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-10 rounded-full bg-blue-500"></div>
                  <p className="text-sm font-medium text-white">{course.title}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400">En curso</span>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-gray-500">No estás inscrito en ningún curso aún.</div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Próximas Tareas</h3>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center text-gray-500 text-sm">
              No hay tareas pendientes para el momento.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
