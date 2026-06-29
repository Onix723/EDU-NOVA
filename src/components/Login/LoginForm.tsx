import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoEduNova from '../../assets/EDU NOVA.png';

export default function LoginForm() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  
  const { signIn, signUp } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginUsername.trim()) {
      setError('El nombre de usuario es requerido');
      return;
    }
    if (!loginPassword) {
      setError('La contraseña es requerida');
      return;
    }

    setLoading(true);

    try {
      const userRole = await signIn(loginUsername.trim(), loginPassword);
      setError(null);
      setLoading(false);
      navigate(userRole === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!regUsername.trim()) {
      setError('El nombre de usuario es requerido');
      return;
    }
    if (!regEmail.trim()) {
      setError('El email es requerido');
      return;
    }
    if (!regPassword) {
      setError('La contraseña es requerida');
      return;
    }

    setLoading(true);

    try {
      const userRole = await signUp(
        regEmail.trim().toLowerCase(),
        regPassword,
        regUsername.trim(),
        role
      );
      setError(null);
      setIsRegistering(false);
      setRegUsername('');
      setRegEmail('');
      setRegPassword('');
      
      // Redirigir automáticamente al panel correspondiente
      navigate(userRole === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="relative z-10 w-[350px]" 
      animate={{ height: isRegistering ? 560 : 450 }}
      transition={{ type: "spring", stiffness: 260, damping: 25 }}
      style={{ perspective: '1000px' }}
    >
      <motion.div 
        initial={false}
        animate={{ rotateY: isRegistering ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full h-full"
      >
        {/* Login Face */}
        <div 
          className={`${!isRegistering ? 'relative w-full h-auto' : 'absolute inset-0 w-full h-full'} bg-white/[0.01] backdrop-blur-lg rounded-[40px] p-[25px_35px] border border-white/30 shadow-[0_0_30px_rgba(18,177,209,0.15),0_30px_60px_-12px_rgba(0,0,0,0.7)]`}
          style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden',
            zIndex: isRegistering ? 0 : 1 
          }}
        >
          <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -inset-[1px] rounded-[40px] bg-gradient-to-b from-white/30 via-transparent to-transparent pointer-events-none opacity-50" />
          
          <div className="relative z-10 flex flex-col items-center justify-center text-center h-full">
            <div className="mb-8 flex justify-center w-full">
              <img src={logoEduNova} alt="Edu Nova Logo" className="h-20 w-auto max-w-full object-contain drop-shadow-2xl" />
            </div>
            
            <form className="w-full flex flex-col" onSubmit={handleSignIn}>
               <input 
                 required 
                 type="text" 
                 placeholder="Usuario" 
                 value={loginUsername}
                 onChange={(e) => setLoginUsername(e.target.value)}
                 disabled={loading}
                 className="w-full box-border bg-white/10 border-none p-[15px] rounded-[20px] shadow-[0_10px_10px_-5px_rgba(0,0,0,0.3)] border-x-2 border-transparent focus:outline-none focus:border-x-2 focus:border-[#12B1D1] text-white placeholder-gray-400 transition-all disabled:opacity-50" 
               />
              <div style={{ height: '20px' }}></div>
               <input 
                 required 
                 type="password" 
                 placeholder="Contraseña" 
                 value={loginPassword}
                 onChange={(e) => setLoginPassword(e.target.value)}
                 disabled={loading}
                 className="w-full box-border bg-white/10 border-none p-[15px] rounded-[20px] shadow-[0_10px_10px_-5px_rgba(0,0,0,0.3)] border-x-2 border-transparent focus:outline-none focus:border-x-2 focus:border-[#12B1D1] text-white placeholder-gray-400 transition-all disabled:opacity-50" 
               />
              {error && <div className="mt-3 text-red-400 text-sm">{error}</div>}
               <div style={{ height: '30px' }}></div>
               <button 
                 className="block w-full font-bold bg-gradient-to-r from-[#1089D3] to-[#12B1D1] text-white p-[15px] rounded-[20px] shadow-[0_20px_10px_-15px_rgba(133,189,215,0.5)] border-none transition-all hover:scale-[1.03] active:scale-95 cursor-pointer disabled:opacity-50" 
                 type="submit"
                 disabled={loading}
               >
                 {loading ? 'Iniciando...' : 'Iniciar Sesión'}
               </button>
             </form>
             <div style={{ height: '30px' }}></div>
             <div className="flex justify-center">
              <button 
                type="button" 
                onClick={() => {
                  setIsRegistering(true);
                  setError(null);
                }} 
                className="w-auto font-bold bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 text-white p-[15px] rounded-[20px] shadow-[0_20px_10px_-15px_rgba(0,0,0,0.5)] border-none transition-all hover:scale-[1.03] active:scale-95 cursor-pointer text-sm"
              >
                  Crear una cuenta
              </button>
            </div>
          </div>
        </div>

        {/* Register Face */}
        <div 
          className={`${isRegistering ? 'relative w-full h-auto' : 'absolute inset-0 w-full h-full'} bg-white/[0.01] backdrop-blur-lg rounded-[40px] p-[25px_35px] border border-white/30 shadow-[0_0_30px_rgba(18,177,209,0.15),0_30px_60px_-12px_rgba(0,0,0,0.7)]`}
          style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden', 
            transform: 'rotateY(180deg)',
            zIndex: isRegistering ? 1 : 0 
          }}
        >
          <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -inset-[1px] rounded-[40px] bg-gradient-to-b from-white/30 via-transparent to-transparent pointer-events-none opacity-50" />
          
          <div className="relative z-10 flex flex-col items-center justify-center text-center h-full">
            <div className="mb-8 flex justify-center w-full">
              <img src={logoEduNova} alt="Edu Nova Logo" className="h-20 w-auto max-w-full object-contain drop-shadow-2xl" />
            </div>
            
            <form className="w-full flex flex-col" onSubmit={handleSignUp}>
               <input 
                 required 
                 type="text" 
                 placeholder="Usuario" 
                 value={regUsername}
                 onChange={(e) => setRegUsername(e.target.value)}
                 disabled={loading}
                 className="w-full box-border bg-white/10 border-none p-[15px] rounded-[20px] shadow-[0_10px_10px_-5px_rgba(0,0,0,0.3)] border-x-2 border-transparent focus:outline-none focus:border-x-2 focus:border-[#12B1D1] text-white placeholder-gray-400 transition-all disabled:opacity-50" 
               />
              <div style={{ height: '20px' }}></div>
               <input 
                 required 
                 type="email" 
                 placeholder="Correo electrónico" 
                 value={regEmail}
                 onChange={(e) => setRegEmail(e.target.value)}
                 disabled={loading}
                 className="w-full box-border bg-white/10 border-none p-[15px] rounded-[20px] shadow-[0_10px_10px_-5px_rgba(0,0,0,0.3)] border-x-2 border-transparent focus:outline-none focus:border-x-2 focus:border-[#12B1D1] text-white placeholder-gray-400 transition-all disabled:opacity-50" 
               />
              <div style={{ height: '20px' }}></div>
               <input 
                 required 
                 type="password" 
                 placeholder="Contraseña" 
                 value={regPassword}
                 onChange={(e) => setRegPassword(e.target.value)}
                 disabled={loading}
                 className="w-full box-border bg-white/10 border-none p-[15px] rounded-[20px] shadow-[0_10px_10px_-5px_rgba(0,0,0,0.3)] border-x-2 border-transparent focus:outline-none focus:border-x-2 focus:border-[#12B1D1] text-white placeholder-gray-400 transition-all disabled:opacity-50" 
               />
              
              <div style={{ height: '20px' }}></div>
              <div className="flex gap-3 justify-center">
                <button 
                  type="button"
                  onClick={() => setRole('student')}
                  disabled={loading}
                  className={`flex-1 py-3 rounded-[15px] text-xs font-bold transition-all ${role === 'student' ? 'bg-gradient-to-r from-[#1089D3] to-[#12B1D1] text-white shadow-lg scale-105' : 'bg-white/10 text-gray-400 hover:bg-white/20'} disabled:opacity-50`}
                >
                  Estudiante
                </button>
                <button 
                  type="button"
                  onClick={() => setRole('teacher')}
                  disabled={loading}
                  className={`flex-1 py-3 rounded-[15px] text-xs font-bold transition-all ${role === 'teacher' ? 'bg-gradient-to-r from-[#1089D3] to-[#12B1D1] text-white shadow-lg scale-105' : 'bg-white/10 text-gray-400 hover:bg-white/20'} disabled:opacity-50`}
                >
                  Profesor
                </button>
              </div>

              {error && <div className="mt-3 text-red-400 text-sm text-center">{error}</div>}
              
               <div style={{ height: '30px' }}></div>
               <button 
                 className="block w-full font-bold bg-gradient-to-r from-[#1089D3] to-[#12B1D1] text-white p-[15px] rounded-[20px] shadow-[0_20px_10px_-15px_rgba(133,189,215,0.5)] border-none transition-all hover:scale-[1.03] active:scale-95 cursor-pointer disabled:opacity-50" 
                 type="submit"
                 disabled={loading}
               >
                 {loading ? 'Registrando...' : 'Registrarse'}
               </button>
             </form>
             <div className="flex justify-center mt-6">
               <button 
                 type="button" 
                 onClick={() => {
                   setIsRegistering(false);
                   setError(null);
                 }} 
                 className="w-auto font-bold bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 text-white p-[15px] rounded-[20px] shadow-[0_20px_10px_-15px_rgba(0,0,0,0.5)] border-none transition-all hover:scale-[1.03] active:scale-95 cursor-pointer text-sm"
               >
                 Volver al Inicio
               </button>
             </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}






