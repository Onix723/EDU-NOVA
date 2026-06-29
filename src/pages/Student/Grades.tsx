import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentGrades() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
  }, [user]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('grades')
        .select(`
          score,
          feedback,
          courses (title)
        `)
        .eq('student_id', user?.id);

      if (error) throw error;
      
      const formattedGrades = data?.map(g => ({
        subject: 'Curso desconocido',
        score: g.score,
        feedback: g.feedback,
        status: Number(g.score) >= 6 ? 'Aprobado' : 'Reprobado',
        color: Number(g.score) >= 6 ? 'text-emerald-400' : 'text-red-400'
      })) || [];

      setGrades(formattedGrades);
    } catch (err) {
      console.error('Error fetching grades:', err);
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
          <h2 className="text-4xl font-bold text-white">Mis Calificaciones</h2>
          <p className="text-gray-400 mt-2">Revisa tu desempeño académico y el feedback de tus profesores.</p>
        </div>
      </motion.div>

      <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6">
        {loading ? (
          <div className="flex justify-center py-10 text-gray-400">Cargando calificaciones...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-white/10">
                  <th className="pb-4 font-medium">Materia</th>
                  <th className="pb-4 font-medium">Calificación</th>
                  <th className="pb-4 font-medium">Estado</th>
                  <th className="pb-4 font-medium text-right">Feedback</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {grades.map((grade, i) => (
                  <motion.tr 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 font-medium">{grade.subject}</td>
                    <td className={`py-4 font-bold text-xl ${grade.color}`}>{grade.score}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {grade.status === 'Aprobado' ? <CheckCircle size={14} className="text-emerald-400" /> : <AlertCircle size={14} className="text-red-400" />}
                        <span className="text-sm">{grade.status}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right text-gray-400 text-xs italic">
                      {grade.feedback || 'Sin comentarios'}
                    </td>
                  </motion.tr>
                ))}
                {grades.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-500">Aún no tienes calificaciones registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
