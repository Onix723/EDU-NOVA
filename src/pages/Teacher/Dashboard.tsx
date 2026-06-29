import { motion } from 'framer-motion';
import { Users, TrendingUp, AlertCircle, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [aiAnalysis, setAIAnalysis] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('teacher_id', user?.id);

      if (!courses || courses.length === 0) {
        setLoading(false);
        return;
      }

      const courseIds = courses.map(c => c.id);
      const { data: grades } = await supabase
        .from('grades')
        .select('student_id, score')
        .in('course_id', courseIds);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, email')
        .eq('role', 'student');

      if (grades && profiles) {
        const studentAnalysis = profiles.map(profile => {
          const studentGrades = grades.filter(g => g.student_id === profile.id);
          const avg = studentGrades.length > 0 
            ? studentGrades.reduce((acc, curr) => acc + Number(curr.score), 0) / studentGrades.length 
            : null;

          let risk = 'Estable';
          if (avg !== null && avg < 6) risk = 'Alto';
          else if (avg !== null && avg > 8.5) risk = 'Bajo (Sobresaliente)';

          return {
            name: profile.username,
            risk,
            avg: avg ? avg.toFixed(1) : 'N/A',
            reason: avg === null ? 'Sin calificaciones' : 
                    avg < 6 ? 'Bajo rendimiento en módulos base' : 
                    avg > 8.5 ? 'Desempeño superior al promedio' : 'Progreso constante'
          };
        });

        setAIAnalysis(studentAnalysis);
        const totalStudents = profiles.length;
        const atRisk = studentAnalysis.filter(s => s.risk === 'Alto').length;
        const outstanding = studentAnalysis.filter(s => s.risk === 'Bajo (Sobresaliente)').length;

        setStats([
          { icon: Users, label: 'Estudiantes Totales', value: totalStudents.toString(), color: 'from-blue-500 to-cyan-400' },
          { icon: TrendingUp, label: 'Promedio General', value: '8.4', color: 'from-emerald-500 to-teal-400' },
          { icon: AlertCircle, label: 'En Riesgo (AI)', value: atRisk.toString(), color: 'from-orange-500 to-red-400' },
          { icon: BookOpen, label: 'Sobresalientes', value: outstanding.toString(), color: 'from-purple-500 to-indigo-400' },
        ]);
      }
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-end"
      >
        <div>
          <h2 className="text-4xl font-bold text-white">Bienvenido, Prof.</h2>
          <p className="text-gray-400 mt-2">Análisis adaptativo de tu aula inteligente hoy.</p>
        </div>
        <div className="text-right text-gray-500 text-sm">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-10 text-gray-400">Analizando datos con IA...</div>
      ) : (
        <>
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
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <AlertCircle size={20} className="text-[#12B1D1]" />
                Análisis Predictivo de AI
              </h3>
              <div className="space-y-4">
                {aiAnalysis.map((student, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 border border-white/20 flex items-center justify-center text-xs font-bold">
                        {student.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{student.name} (Prom: {student.avg})</p>
                        <p className="text-xs text-gray-500">{student.reason}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      student.risk === 'Alto' ? 'bg-red-500/20 text-red-400' : 
                      student.risk === 'Bajo (Sobresaliente)' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {student.risk}
                    </div>
                  </div>
                ))}
                {aiAnalysis.length === 0 && (
                  <div className="py-10 text-center text-gray-500">No hay datos suficientes para el análisis de IA.</div>
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-6">Acciones Rápidas</h3>
              <div className="space-y-3">
                <button className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all group">
                  <p className="text-sm font-medium text-white group-hover:text-[#12B1D1]">Subir Nuevo Material</p>
                  <p className="text-xs text-gray-500">Cargar PDFs, Videos o Enlaces</p>
                </button>
                <button className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all group">
                  <p className="text-sm font-medium text-white group-hover:text-[#12B1D1]">Generar Reporte AI</p>
                  <p className="text-xs text-gray-500">Resumen de rendimiento del grupo</p>
                </button>
                <button className="w-//full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all group">
                  <p className="text-sm font-medium text-white group-hover:text-[#12B1D1]">Enviar Notificación</p>
                  <p className="text-xs text-gray-500">Avisar a todos los estudiantes</p>
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
