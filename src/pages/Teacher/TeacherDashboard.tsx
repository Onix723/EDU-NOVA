import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';

export default function TeacherDashboard() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold">Hola {profile?.username}</h1>
            <p className="text-gray-400 mt-2">Dashboard de Profesor</p>
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
            <h2 className="text-xl font-bold mb-4">Mis Clases</h2>
            <p className="text-gray-400">Gestiona tus clases aquí</p>
          </div>

          <div className="bg-white/10 backdrop-blur p-6 rounded-lg border border-white/20">
            <h2 className="text-xl font-bold mb-4">Estudiantes</h2>
            <p className="text-gray-400">Visualiza tus estudiantes</p>
          </div>

          <div className="bg-white/10 backdrop-blur p-6 rounded-lg border border-white/20">
            <h2 className="text-xl font-bold mb-4">Contenido Adaptativo</h2>
            <p className="text-gray-400">Ajusta contenidos según desempeño</p>
          </div>
        </div>
      </div>
    </div>
  );
}
