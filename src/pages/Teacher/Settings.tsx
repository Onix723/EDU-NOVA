import { motion } from 'framer-motion';
import { User, Bell, Lock, Palette } from 'lucide-react';

export default function TeacherSettings() {
  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h2 className="text-4xl font-bold text-white">Configuración</h2>
          <p className="text-gray-400 mt-2">Personaliza tu cuenta y prefiere la experiencia de la plataforma.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
              <User size={20} className="text-[#12B1D1]" />
              Información Personal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 ml-1">Nombre Completo</label>
                <input 
                  type="text" 
                  defaultValue="Profesor Educación" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#12B1D1] transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 ml-1">Email</label>
                <input 
                  type="email" 
                  defaultValue="teacher@edunova.com" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#12B1D1] transition-all" 
                />
              </div>
            </div>
            <button className="bg-gradient-to-r from-[#1089D3] to-[#12B1D1] text-white px-6 py-2 rounded-xl font-bold hover:scale-105 transition-all">
              Guardar Cambios
            </button>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
              <Bell size={20} className="text-[#12B1D1]" />
              Notificaciones
            </h3>
            <div className="space-y-4">
              {[
                'Alertas de alumnos en riesgo',
                'Nuevas entregas de tareas',
                'Mensajes de estudiantes',
                'Actualizaciones del sistema'
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-sm text-gray-300">{item}</span>
                  <div className="w-10 h-5 bg-white/10 rounded-full relative cursor-pointer hover:bg-white/20 transition-all">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-[#12B1D1] rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
              <Lock size={20} className="text-red-400" />
              Seguridad
            </h3>
            <button className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all flex items-center justify-center gap-2">
              Cambiar Contraseña
            </button>
            <button className="w-full py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium transition-all">
              Cerrar Sesión de todos los dispositivos
            </button>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
              <Palette size={20} className="text-purple-400" />
              Apariencia
            </h3>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 cursor-pointer border-2 border-white"></div>
              <div className="w-8 h-8 rounded-full bg-purple-500 cursor-pointer border-2 border-transparent hover:border-white"></div>
              <div className="w-8 h-8 rounded-full bg-emerald-500 cursor-pointer border-2 border-transparent hover:border-white"></div>
              <div className="w-8 h-8 rounded-full bg-orange-500 cursor-pointer border-2 border-transparent hover:border-white"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
