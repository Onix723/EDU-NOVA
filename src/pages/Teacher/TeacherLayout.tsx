import { motion } from 'framer-motion';
import { LayoutDashboard, Users, BookOpen, Settings, LogOut, Award } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function TeacherLayout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Panel Principal', path: '/teacher/dashboard' },
    { icon: Users, label: 'Estudiantes', path: '/teacher/students' },
    { icon: BookOpen, label: 'Cursos', path: '/teacher/courses' },
    { icon: Award, label: 'Calificaciones', path: '/teacher/grades' },
    { icon: Settings, label: 'Configuración', path: '/teacher/settings' },
  ];

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden font-sans">
      {/* Cinematic Sidebar */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 h-full bg-white/[0.03] backdrop-blur-xl border-r border-white/10 flex flex-col z-20"
      >
        <div className="p-8 mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1089D3] to-[#12B1D1] bg-clip-text text-transparent">
            EDU NOVA
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Panel del Maestro</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <button 
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 hover:bg-white/[0.08] hover:text-[#12B1D1] group"
            >
              <item.icon size={20} className="text-gray-400 group-hover:text-[#12B1D1] transition-colors" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all duration-300"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full relative overflow-y-auto overflow-x-hidden bg-black">
        {/* Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#12B1D1]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
