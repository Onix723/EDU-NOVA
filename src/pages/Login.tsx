import { motion } from 'framer-motion';
import LoginForm from '../components/Login/LoginForm';
import fondoNegro from '../assets/fondo-negro.avif';
import particulasDark from '../assets/particulas-dark.avif';
import celularImg from '../assets/CELULAR-dark.avif';
import brilloImg from '../assets/brillo-blackmode-mobile.avif';
import lapizImg from '../assets/Iconoss/lapiz.avif';
import calcImg from '../assets/Iconoss/calculadora.avif';
import lupaImg from '../assets/Iconoss/lupa.avif';
import libritoImg from '../assets/Iconoss/librito.avif';
import laptopImg from '../assets/Iconoss/laptop.avif';
import portaImg from '../assets/Iconoss/porta.avif';
import globoImg from '../assets/Iconoss/globo.avif';
import focoImg from '../assets/Iconoss/foco.avif';

export default function Login() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Background Layer - Absolute Bottom */}
      <img 
        src={fondoNegro} 
        alt="Background" 
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none select-none brightness-[0.3]"
      />
      
       {/* Particles Layer - Just above background */}
       <img 
         src={particulasDark} 
         alt="Particles" 
         className="absolute inset-0 w-full h-full object-cover z-10 opacity-80 mix-blend-screen pointer-events-none select-none"
       />
       
       {/* Phone Image */}
       <img 
         src={celularImg} 
         alt="Phone" 
         className="absolute left-[13%] top-[75%] -translate-y-1/2 z-20 w-auto h-[24%] object-contain pointer-events-none select-none"
       />

      {/* Glow Effect on top of phone */}
      <motion.img 
        src={brilloImg} 
        alt="Phone Glow" 
        className="absolute left-[-5%] top-[40%] -translate-y-1/2 z-21 w-auto h-[115%] object-contain pointer-events-none select-none mix-blend-screen"
        animate={{ 
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />

      {/* Circle Layout Icons */}
      {/* 1. Top Center */}
      <motion.img 
        src={laptopImg} 
        alt="Laptop" 
        className="absolute left-[26%] top-[15%] z-22 object-contain pointer-events-none select-none"
        style={{ width: '100px', height: '100px' }}
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0 }}
      />
      {/* 2. Top Right */}
      <motion.img 
        src={lapizImg} 
        alt="Lapiz" 
        className="absolute left-[36%] top-[22%] z-22 object-contain pointer-events-none select-none"
        style={{ width: '100px', height: '100px' }}
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      {/* 3. Right */}
      <motion.img 
        src={lupaImg} 
        alt="Lupa" 
        className="absolute left-[42%] top-[32%] z-22 object-contain pointer-events-none select-none"
        style={{ width: '100px', height: '100px' }}
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      {/* 4. Bottom Right */}
      <motion.img 
        src={globoImg} 
        alt="Globo" 
        className="absolute left-[36%] top-[42%] z-22 object-contain pointer-events-none select-none"
        style={{ width: '100px', height: '100px' }}
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />
      {/* 5. Bottom */}
      <motion.img 
        src={libritoImg} 
        alt="Librito" 
        className="absolute left-[26%] top-[50%] z-22 object-contain pointer-events-none select-none"
        style={{ width: '100px', height: '100px' }}
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      {/* 6. Bottom Left */}
      <motion.img 
        src={calcImg} 
        alt="Calculadora" 
        className="absolute left-[16%] top-[42%] z-22 object-contain pointer-events-none select-none"
        style={{ width: '100px', height: '100px' }}
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
      />
      {/* 7. Top Left */}
      <motion.img 
        src={focoImg} 
        alt="Foco" 
        className="absolute left-[16%] top-[22%] z-22 object-contain pointer-events-none select-none"
        style={{ width: '100px', height: '100px' }}
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      {/* Center Icon */}
      <motion.img 
        src={portaImg} 
        alt="Porta" 
        className="absolute left-[26%] top-[32%] z-22 object-contain pointer-events-none select-none"
        style={{ width: '100px', height: '100px' }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0 }}
      />

       {/* Right Side: Login Form */}
       <div className="absolute right-[12%] top-1/2 -translate-y-1/2 z-50">
         <LoginForm />
       </div>
    </div>
  );
}
