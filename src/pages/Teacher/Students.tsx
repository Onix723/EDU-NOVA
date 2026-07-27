import { motion } from 'framer-motion';
import { UserPlus, Search, Mail, GraduationCap, Send, X, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { addStoredMessage, getStoredMessages } from '../../lib/studentMessages';

export default function TeacherStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('Profesor');
  const [selectedSubject, setSelectedSubject] = useState('General');

  useEffect(() => {
    fetchStudents();
    fetchTeacherData();
  }, [user]);

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

  const fetchTeacherData = async () => {
    if (!user?.id) return;

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profileData?.username) {
        setTeacherName(profileData.username);
      }

    } catch (err) {
      console.error('Error fetching teacher courses:', err);
    }
  };

  const openMessages = async (student: any) => {
    setSelectedStudent(student);
    setMessageText('');
    setFeedback(null);
    setLoadingMessages(true);

    try {
      const { data, error } = await supabase
        .from('student_messages')
        .select('*')
        .eq('recipient_id', student.id)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      setMessages(data || []);
    } catch (err) {
      console.warn('No se pudo cargar desde Supabase, se usarán los mensajes locales.', err);
      setMessages(getStoredMessages(student.id));
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!messageText.trim() || !selectedStudent || !user?.id) {
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const payload = {
        recipient_id: selectedStudent.id,
        sender_id: user.id,
        sender_role: 'teacher' as const,
        content: messageText.trim(),
        sender_name: teacherName,
        subject: selectedSubject || 'General',
      };

      const { data, error } = await supabase
        .from('student_messages')
        .insert([payload])
        .select()
        .single();

      if (error) {
        throw error;
      }

      addStoredMessage({
        id: data.id,
        recipient_id: selectedStudent.id,
        sender_id: user.id,
        sender_role: 'teacher',
        content: messageText.trim(),
        sender_name: teacherName,
        subject: selectedSubject || 'General',
        created_at: data.created_at || new Date().toISOString(),
      });

      setMessages((prev) => [...prev, data]);
      setMessageText('');
      setFeedback('Mensaje enviado al estudiante.');
    } catch (err) {
      console.warn('Fallo el envío por Supabase, se guardará como mensaje local.', err);
      const fallbackMessage = addStoredMessage({
        id: `${Date.now()}`,
        recipient_id: selectedStudent.id,
        sender_id: user.id,
        sender_role: 'teacher',
        content: messageText.trim(),
        sender_name: teacherName,
        subject: selectedSubject || 'General',
        created_at: new Date().toISOString(),
      });

      setMessages((prev) => [...prev, fallbackMessage]);
      setMessageText('');
      setFeedback('Mensaje guardado y visible para el estudiante.');
    } finally {
      setSending(false);
    }
  };

  const filteredStudents = students.filter((s) =>
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
          <p className="text-gray-400 mt-2">Administra la lista de alumnos y envía avisos directos.</p>
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
                      <button
                        onClick={() => openMessages(student)}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                        title="Enviar aviso"
                      >
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

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#050816] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-cyan-400">Aviso directo</p>
                <p className="text-sm text-gray-400">De: <span className="text-white font-medium">{teacherName}</span></p>
                <h3 className="text-xl font-semibold text-white mt-2">{selectedStudent.username}</h3>
                <p className="text-sm text-gray-400">{selectedStudent.email}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-full p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm text-gray-400">Materia</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#12B1D1] focus:outline-none"
              >
                <option value="General" className="bg-[#050816] text-white">General</option>
              </select>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto space-y-3">
              {loadingMessages ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-sm text-gray-400">
                  Cargando mensajes...
                </div>
              ) : messages.length > 0 ? (
                messages
                  .filter((message) => !selectedSubject || selectedSubject === 'General' ? !message.subject || message.subject === 'General' : message.subject === selectedSubject)
                  .map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-2xl border p-4 ${message.sender_role === 'teacher' ? 'border-cyan-400/20 bg-cyan-500/10' : 'border-white/10 bg-white/[0.04]'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-white">
                        {message.sender_role === 'teacher' ? (message.sender_name || 'Profesor') : selectedStudent.username}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(message.created_at).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-300">{message.content}</p>
                    {message.subject && (
                      <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-cyan-300">
                        Materia: {message.subject}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-sm text-gray-400">
                  Todavía no hay mensajes para este estudiante.
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="mt-6 space-y-3">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
                placeholder="Escribe un aviso para el estudiante. Solo tú podrás responder; él podrá leerlo."
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#12B1D1] focus:outline-none"
              />
              {feedback && <p className="text-sm text-cyan-300">{feedback}</p>}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1089D3] to-[#12B1D1] px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  Enviar aviso
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
