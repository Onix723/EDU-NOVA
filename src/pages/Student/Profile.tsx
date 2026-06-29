import { motion } from 'framer-motion';
import { User, Lock } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentProfile() {
  const { profile, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    email: profile?.email || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        username: formData.username,
        email: formData.email
      });
      alert('Perfil actualizado correctamente');
    } catch (err) {
      alert('Error al actualizar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setSaving(false);
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
          <h2 className="text-4xl font-bold text-white">Mi Perfil</h2>
          <p className="text-gray-400 mt-2">Gestiona tu información personal y preferencias.</p>
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
                <label className="text-xs font-medium text-gray-400 ml-1">Nombre de Usuario</label>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#12B1D1] transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 ml-1">Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#12B1D1] transition-all" 
                />
              </div>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-[#1089D3] to-[#12B1D1] text-white px-6 py-2 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50"
            >
              {saving ? 'Actualizando...' : 'Actualizar Perfil'}
            </button>
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
          </div>
        </div>
      </div>
    </div>
  );
}

