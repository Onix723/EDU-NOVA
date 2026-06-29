import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';

export default function StudentDashboard() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold">Bienvenido, {profile?.username}</h1>
            <p className="text-gray-400 mt-2">Dashboard de Estudiante</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
          >
            <LogOut size={20} />
            Salir
          </button>
        </div>

        {/* Placeholder Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur p-6 rounded-lg border border-white/20">
            <h2 className="text-xl font-bold mb-4">Mis Cursos</h2>
            <p className="text-gray-400">Los cursos disponibles aparecerán aquí</p>
          </div>

          <div className="bg-white/10 backdrop-blur p-6 rounded-lg border border-white/20">
            <h2 className="text-xl font-bold mb-4">Mi Progreso</h2>
            <p className="text-gray-400">Tu progreso se mostrará aquí</p>
          </div>

          <div className="bg-white/10 backdrop-blur p-6 rounded-lg border border-white/20">
            <h2 className="text-xl font-bold mb-4">Calificaciones</h2>
            <p className="text-gray-400">Tus calificaciones aparecerán aquí</p>
          </div>
        </div>
      </div>
    </div>
  );
}
