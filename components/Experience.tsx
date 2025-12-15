import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars as DreiStars, Sparkles, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { PostProcessing } from './PostProcessing';
import { Pearl } from './Pearl';
import { Stars } from './Stars';
import { StarData } from '../types';

interface ExperienceProps {
  stars: StarData[];
  onStarClick: (id: number) => void;
  onStarView: (id: number) => void;
}

const GalaxyBackground: React.FC = () => {
    const texture = useMemo(() => {
        const size = 2048;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // 1. Deep Space Base
            const gradient = ctx.createLinearGradient(0, 0, 0, size);
            gradient.addColorStop(0, '#020008'); 
            gradient.addColorStop(0.5, '#0a0514'); 
            gradient.addColorStop(1, '#020008');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);

            // 2. Background Star Dust (Reduced count, bigger size)
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 3000; i++) { // Reduced from 15000
                const x = Math.random() * size;
                const y = Math.random() * size;
                const opacity = Math.random() * 0.3 + 0.1; // Brighter
                const s = Math.random() * 1.5; // Bigger
                ctx.globalAlpha = opacity;
                ctx.fillRect(x, y, s, s);
            }

            // 3. Helper: Draw Spiral Galaxy
            const drawSpiralGalaxy = (cx: number, cy: number, radius: number, color: string) => {
                const arms = 3 + Math.floor(Math.random() * 3); 
                const particles = 200; // Reduced particles per galaxy
                
                for (let i = 0; i < particles; i++) {
                    const dist = Math.pow(Math.random(), 2); 
                    const angle = Math.random() * Math.PI * 2;
                    const armOffset = (Math.floor(Math.random() * arms) / arms) * Math.PI * 2;
                    
                    const spiralAngle = dist * Math.PI * 4 + armOffset; 
                    
                    const r = dist * radius;
                    const x = cx + Math.cos(spiralAngle) * r + (Math.random() - 0.5) * (radius * 0.2); 
                    const y = cy + Math.sin(spiralAngle) * r + (Math.random() - 0.5) * (radius * 0.2);

                    const size = Math.random() * 2.5 + 1.0; // Much bigger galaxy stars
                    
                    const radGrad = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
                    radGrad.addColorStop(0, color);
                    radGrad.addColorStop(1, 'transparent');
                    
                    ctx.fillStyle = radGrad;
                    ctx.globalAlpha = (1 - dist) * 0.9 + 0.1; 
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Core Glow
                const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.3);
                coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                coreGrad.addColorStop(0.5, color);
                coreGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = coreGrad;
                ctx.globalAlpha = 0.4;
                ctx.beginPath();
                ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
                ctx.fill();
            };

            // 4. Generate Random Galaxies
            const galaxyColors = [
                '#ff3366', // Hot Red/Pink
                '#3366ff', // Deep Blue
                '#00ffff', // Cyan
                '#aa00ff', // Violet
                '#ffaa00', // Gold/Warm
            ];

            // ~8 prominent galaxies
            for (let i = 0; i < 8; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const r = 80 + Math.random() * 150; 
                const color = galaxyColors[Math.floor(Math.random() * galaxyColors.length)];
                drawSpiralGalaxy(x, y, r, color);
            }

            // 5. Large Nebula Clouds
            for (let i = 0; i < 15; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const r = 300 + Math.random() * 400;
                
                const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
                const color = galaxyColors[Math.floor(Math.random() * galaxyColors.length)];
                
                grad.addColorStop(0, color);
                grad.addColorStop(1, 'transparent');
                
                ctx.globalAlpha = 0.08; 
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }

            // 6. Bright Foreground Stars on Texture (Reduced count, significantly bigger)
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 80; i++) { // Reduced from 500
                const x = Math.random() * size;
                const y = Math.random() * size;
                const s = Math.random() * 5 + 2; // Size 2 to 7 pixels
                
                // Add a glow to these stars
                const starGrad = ctx.createRadialGradient(x, y, 0, x, y, s * 2);
                starGrad.addColorStop(0, '#ffffff');
                starGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
                starGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = starGrad;

                ctx.globalAlpha = Math.random() * 0.5 + 0.5;
                ctx.beginPath();
                ctx.arc(x, y, s, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        return new THREE.CanvasTexture(canvas);
    }, []);

    return (
        <mesh>
            <sphereGeometry args={[100, 64, 64]} />
            <meshBasicMaterial map={texture} side={THREE.BackSide} />
        </mesh>
    );
};

// Shooting Star Component
const ShootingStar: React.FC = () => {
    const mesh = useRef<THREE.Group>(null);
    const timer = useRef(0);
    const isAnimating = useRef(false);
    const progress = useRef(0);
    const startPos = useRef(new THREE.Vector3());
    const endPos = useRef(new THREE.Vector3());

    useFrame((state, delta) => {
        if (!isAnimating.current) {
            timer.current += delta;
            if (timer.current >= 3 + Math.random() * 5) {
                timer.current = 0;
                isAnimating.current = true;
                progress.current = 0;
                const r = 70;
                const theta1 = Math.random() * Math.PI * 2;
                const phi1 = Math.acos(Math.random() * 0.5); 
                startPos.current.setFromSphericalCoords(r, phi1, theta1);
                const theta2 = theta1 + (Math.random() - 0.5) * 2; 
                const phi2 = Math.min(Math.PI / 2, phi1 + 0.5); 
                endPos.current.setFromSphericalCoords(r, phi2, theta2);
                if (mesh.current) {
                    mesh.current.position.copy(startPos.current);
                    mesh.current.lookAt(endPos.current);
                }
            }
        } else {
            progress.current += delta * 1.5;
            if (progress.current >= 1) {
                isAnimating.current = false;
                if (mesh.current) mesh.current.scale.set(0,0,0);
            } else {
                if (mesh.current) {
                    mesh.current.position.lerpVectors(startPos.current, endPos.current, progress.current);
                    const s = Math.sin(progress.current * Math.PI);
                    mesh.current.scale.set(s, s, s * 20);
                    mesh.current.visible = true;
                }
            }
        }
    });

    return (
        <group>
            <group ref={mesh} visible={false}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0, 0.2, 4, 8]} />
                    <meshBasicMaterial color="#ccffff" transparent opacity={0.9} />
                </mesh>
            </group>
        </group>
    );
};

export const Experience: React.FC<ExperienceProps> = ({ stars, onStarClick, onStarView }) => {
  return (
    <Canvas shadows dpr={[1, 2]}>
      <PerspectiveCamera makeDefault position={[0, 4, 14]} fov={50}>
         <spotLight 
            position={[-12, 12, 0]} 
            angle={0.6} 
            penumbra={1} 
            intensity={2} 
            color="#dbeafe" 
            castShadow 
          />
      </PerspectiveCamera>
      
      <OrbitControls 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={8}
        maxDistance={40}
        enablePan={false}
      />

      <GalaxyBackground />
      <Environment preset="night" />
      <ShootingStar />

      <fog attach="fog" args={['#0a0514', 25, 120]} />

      <ambientLight intensity={0.4} color="#aa88ff" />
      <pointLight position={[-10, 5, 10]} intensity={1.5} color="#88aaff" />

      {/* Scene Objects */}
      <Pearl />
      <Stars data={stars} onStarClick={onStarClick} onStarView={onStarView} />
      
      {/* 
          OPTIMIZED SPARKLES:
          Reduced count (saving memory) but Increased Size for "Big & Bright" effect.
      */}
      
      {/* Layer 1: Big Blue Stars */}
      <Sparkles 
        count={150}        // Reduced from 800
        scale={60} 
        size={12}          // Increased from 2 to 12
        speed={0.2} 
        opacity={0.9} 
        color="#aaddff" 
        position={[0, 5, 0]}
      />

      {/* Layer 2: Big Red/Pink Stars */}
      <Sparkles 
        count={100}        // Reduced from 600
        scale={50} 
        size={15}          // Increased from 2.5 to 15
        speed={0.3} 
        opacity={0.8} 
        color="#ff6699" 
        position={[0, 5, 0]}
      />
      
      {/* Layer 3: Scattered Golden Orbs */}
      <Sparkles 
        count={120}        // Reduced from 1200
        scale={45} 
        size={8}           // Increased from 1 to 8
        speed={0.1} 
        opacity={0.7} 
        color="#ffdd88" 
        position={[0, 5, 0]}
      />
      
      {/* Background Stars (Far away) - Reduced density, larger size */}
      <DreiStars 
        radius={90} 
        depth={50} 
        count={1500}       // Reduced from 8000
        factor={12}        // Increased from 6
        saturation={1} 
        fade 
        speed={0.5} 
      />
      
      <PostProcessing />
    </Canvas>
  );
};
