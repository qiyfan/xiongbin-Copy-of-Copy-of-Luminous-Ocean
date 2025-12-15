import React, { useMemo } from 'react';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

export const Pearl: React.FC = () => {
  // Generate a glow texture programmatically to act as a lens flare/halo
  const glowTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
      // Center is bright and slightly blue-ish white
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
      // Mid-tone is the primary blue glow color
      gradient.addColorStop(0.3, 'rgba(68, 136, 255, 0.5)'); 
      // Fade out to transparent
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); 
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, 128, 128);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group position={[0, 1, 0]}>
        {/* Main Glowing Sphere - Solid light source */}
        <mesh>
            <sphereGeometry args={[2.5, 64, 64]} />
            <meshStandardMaterial 
                color="#aaddff" 
                emissive="#4488ff"
                emissiveIntensity={4} 
                toneMapped={false} 
            />
        </mesh>

        {/* Halo / Glow Sprite */}
        <sprite scale={[12, 12, 1]}>
             <spriteMaterial 
                map={glowTexture} 
                transparent 
                opacity={0.6} 
                blending={THREE.AdditiveBlending} 
                depthWrite={false} // Prevent sprite from blocking stars behind it
             />
        </sprite>
        
        {/* Main Light Source emitting from the pearl to light up the scene */}
        <pointLight intensity={2} distance={30} color="#4488ff" decay={2} />
      </group>
    </Float>
  );
};