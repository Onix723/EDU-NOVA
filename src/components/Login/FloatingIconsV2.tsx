import { motion } from 'framer-motion';

interface IconProps {
  src: string;
  x: string;
  y: string;
  size: number;
  delay: number;
}

const ICONS = [
  { src: '../../assets/Iconoss/calculadora.png', x: '20%', y: '30%', size: 40, delay: 0 },
  { src: '../../assets/Iconoss/escopio.png', x: '30%', y: '25%', size: 45, delay: 0.5 },
  { src: '../../assets/Iconoss/foco.png', x: '40%', y: '20%', size: 40, delay: 1 },
  { src: '../../assets/Iconoss/globo.png', x: '50%', y: '30%', size: 50, delay: 1.5 },
  { src: '../../assets/Iconoss/lapiz.png', x: '60%', y: '25%', size: 35, delay: 2 },
  { src: '../../assets/Iconoss/laptop.png', x: '70%', y: '35%', size: 55, delay: 0.2 },
  { src: '../../assets/Iconoss/librito.png', x: '25%', y: '45%', size: 40, delay: 0.7 },
  { src: '../../assets/Iconoss/libro.png', x: '35%', y: '40%', size: 45, delay: 1.2 },
  { src: '../../assets/Iconoss/lupa.png', x: '45%', y: '50%', size: 35, delay: 1.8 },
  { src: '../../assets/Iconoss/porta.png', x: '55%', y: '45%', size: 40, delay: 2.3 },
];

const Icon = ({ src, x, y, size, delay }: IconProps) => (
  <motion.div 
    className="absolute pointer-events-none"
    style={{ left: x, top: y, width: size, height: size }}
    animate={{ y: [0, -15, 0] }}
    transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut", delay }}
  >
    <img src={src} alt="icon" className="w-full h-full object-contain drop-shadow-lg" />
  </motion.div>
);

export default function FloatingIconsV2() {
  return (
    <div className="absolute inset-0 z-22 pointer-events-none overflow-hidden">
      {ICONS.map((icon, index) => (
        <Icon key={index} {...icon} />
      ))}
    </div>
  );
}
