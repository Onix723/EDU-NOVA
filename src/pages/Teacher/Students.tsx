import { motion } from 'framer-motion';
import { UserPlus, Search, Mail, GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export default function TeacherStudents() {
  const {} = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h2 className="text-4xl font-bold text-white">Gestión de Estudiantes</h2>
          <p className="text-gray-400 mt-2">Administra la lista de alumnos y monitorea su progreso.</p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-[#1089D3] to-[#12B1D1] text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg">
          <UserPlus size={20} />
          Añadir Estudiante
        </button>
      </motion.div>

      <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Buscar estudiante por nombre o email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#12B1D1] transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10 text-gray-400">Cargando estudiantes...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-white/10">
                  <th className="pb-4 font-medium">Estudiante</th>
                  <th className="pb-4 font-medium">Email</th>
                  <th className="pb-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {filteredStudents.map((student, i) => (
                  <motion.tr 
                    key={student.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center font-bold border border-white/20">
                        {student.username[0].toUpperCase()}
                      </div>
                      <span className="font-medium">{student.username}</span>
                    </td>
                    <td className="py-4 text-gray-400">{student.email}</td>
                    <td className="py-4 text-right">
                      <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                        <Mail size={18} />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all ml-2">
                        <GraduationCap size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-gray-500">No se encontraron estudiantes.</td>
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
