import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';

interface FloatingObjectProps {
  position: [number, number, number];
  color: string;
  shape?: 'sphere' | 'box';
}

const FloatingObject = ({ position, color, shape = 'sphere' }: FloatingObjectProps) => {
  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <mesh position={position}>
        {shape === 'sphere' ? (
          <sphereGeometry args={[0.4, 32, 32]} />
        ) : (
          <boxGeometry args={[0.7, 0.7, 0.7]} />
        )}
        <MeshDistortMaterial 
          color={color} 
          speed={2} 
          distort={0.3} 
          roughness={0} 
          metalness={1} 
          transmission={1} 
          thickness={0.5}
        />
      </mesh>
    </Float>
  );
};

const Scene = () => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
      <ambientLight intensity={0.4} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4444ff" />
      
      {/* Superficie iluminada inferior (mejorada para coincidir con la imagen) */}
      <mesh position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#ffffff" 
          emissiveIntensity={5} 
          transparent 
          opacity={0.3} 
        />
      </mesh>
      <pointLight position={[0, -2, 0]} intensity={10} color="#ffffff" distance={15} />

      {/* Objetos flotantes */}
      <FloatingObject position={[-4, 2, 0]} color="#ff4d4d" shape="box" />
      <FloatingObject position={[-2, 4, -2]} color="#4da6ff" shape="sphere" />
      <FloatingObject position={[0, 3, -1]} color="#ffcc00" shape="box" />
      <FloatingObject position={[3, 2, -3]} color="#00ffcc" shape="sphere" />
      <FloatingObject position={[5, 4, -1]} color="#cc4dff" shape="box" />
      <FloatingObject position={[-5, 0, -2]} color="#ff80bf" shape="sphere" />
      <FloatingObject position={[-3, -2, -1]} color="#aaff4d" shape="box" />
      <FloatingObject position={[2, -1, -2]} color="#ffaa4d" shape="sphere" />

      <Environment preset="city" />
      
      <ContactShadows 
        position={[0, -2.9, 0]} 
        opacity={0.4} 
        scale={20} 
        blur={2} 
        far={4.5} 
      />
    </>
  );
};

export default function LoginScene() {
  return (
    <div className="absolute inset-0 z-15 pointer-events-none" style={{ width: '100vw', height: '100vh' }}>
      <Canvas 
        gl={{ alpha: true, antialias: true, premultipliedAlpha: false }} 
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}

