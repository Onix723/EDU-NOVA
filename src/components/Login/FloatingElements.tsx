import { motion } from 'framer-motion';

interface FloatingObjectProps {
  color: string;
  x: string;
  y: string;
  size: number;
  delay: number;
  rotate: number;
}

const ELEMENT_DATA = [
  { id: 1, color: 'rgba(255, 77, 77, 0.6)', x: '15%', y: '20%', size: 60, delay: 0, rotate: 45 },
  { id: 2, color: 'rgba(77, 166, 255, 0.6)', x: '25%', y: '35%', size: 80, delay: 1, rotate: -20 },
  { id: 3, color: 'rgba(255, 204, 0, 0.6)', x: '10%', y: '50%', size: 50, delay: 2, rotate: 10 },
  { id: 4, color: 'rgba(0, 255, 204, 0.6)', x: '30%', y: '65%', size: 70, delay: 1.5, rotate: 60 },
  { id: 5, color: 'rgba(204, 77, 255, 0.6)', x: '20%', y: '80%', size: 60, delay: 0.5, rotate: -45 },
  { id: 6, color: 'rgba(255, 128, 191, 0.6)', x: '5%', y: '30%', size: 40, delay: 2.5, rotate: 15 },
  { id: 7, color: 'rgba(170, 255, 77, 0.6)', x: '35%', y: '45%', size: 90, delay: 0.8, rotate: -10 },
  { id: 8, color: 'rgba(255, 170, 77, 0.6)', x: '15%', y: '70%', size: 55, delay: 1.2, rotate: 30 },
];

const FloatingObject = ({ color, x, y, size, delay, rotate }: FloatingObjectProps) => {
  return (
    <motion.div 
      className="absolute pointer-events-none"
      style={{ 
        left: x, 
        top: y,
        width: size, 
        height: size,
      }}
      animate={{ 
        y: [0, -20, 0],
        rotate: [rotate, rotate + 10, rotate],
        scale: [1, 1.1, 1]
      }}
      transition={{ 
        duration: 4 + Math.random() * 2, 
        repeat: Infinity, 
        ease: "easeInOut",
        delay: delay 
      }}
    >
      <div 
        className="w-full h-full rounded-2xl backdrop-blur-md border border-white/30 shadow-xl"
        style={{ 
          backgroundColor: color,
          boxShadow: `0 0 20px ${color}`,
          transform: `rotate(${rotate}deg)`
        }}
      />
    </motion.div>
  );
};

export default function FloatingElements() {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
      {ELEMENT_DATA.map(obj => (
        <FloatingObject key={obj.id} {...obj} />
      ))}
    </div>
  );
}
