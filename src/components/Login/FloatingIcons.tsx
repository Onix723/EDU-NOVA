import baseImg from '../../assets/CELULAR-dark.avif';

export default function FloatingIcons() {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
      {/* Base Image - Positioned on the left side */}
      <div className="absolute bottom-[-10%] left-[-5%] w-full max-w-[700px] z-0">
        <img 
          src={baseImg} 
          alt="Base Surface" 
          className="w-full h-auto object-contain drop-shadow-[0_0_50px_rgba(255,255,255,0.3)]" 
        />
      </div>
    </div>
  );
}
