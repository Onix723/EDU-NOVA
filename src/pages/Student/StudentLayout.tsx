import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, BookOpen, GraduationCap, User, LogOut } from 'lucide-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
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
    { icon: LayoutDashboard, label: 'Mi Panel', path: '/student/dashboard' },
    { icon: BookOpen, label: 'Mis Cursos', path: '/student/courses' },
    { icon: GraduationCap, label: 'Mis Calificaciones', path: '/student/grades' },
    { icon: User, label: 'Mi Perfil', path: '/student/profile' },
  ];

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden font-sans">
      {/* Cinematic Sidebar */}
      <motion.aside 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-64 h-full glass flex flex-col z-20"
      >
        <div className="p-8 mb-4">
          <h1 className="text-2xl font-bold text-gradient">
            EDU NOVA
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Panel del Estudiante</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button 
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-150 group relative overflow-hidden ${
                  isActive ? 'bg-white/[0.1] text-[#12B1D1]' : 'hover:bg-white/[0.08] hover:text-[#12B1D1]'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-6 bg-[#12B1D1] rounded-r-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon size={20} className={`${isActive ? 'text-[#12B1D1]' : 'text-gray-400 group-hover:text-[#12B1D1]'} transition-colors duration-150`} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all duration-150"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full relative overflow-y-auto overflow-x-hidden bg-black">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#12B1D1]/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
        
        <div className="relative z-10 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
