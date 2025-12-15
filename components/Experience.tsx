import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars as DreiStars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { PostProcessing } from './PostProcessing';
import { Ocean } from './Ocean';
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
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Lighter cosmic base
            const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
            gradient.addColorStop(0, '#050520'); // Dark Blue start
            gradient.addColorStop(0.5, '#151030'); // Mid purple
            gradient.addColorStop(1, '#050520');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1024, 1024);

            // Brighter Nebula Clouds
            for (let i = 0; i < 300; i++) {
                const x = Math.random() * 1024;
                const y = Math.random() * 1024;
                const r = Math.random() * 200 + 50;
                const opacity = Math.random() * 0.2; 
                
                // Colors: Vivid Blue, Magenta, Cyan
                const colors = ['#5555ff', '#ff33cc', '#33ffff', '#9933ff'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.globalAlpha = opacity;
                ctx.fill();
            }
            
            // Distant bright stars
            for (let i = 0; i < 600; i++) {
                const x = Math.random() * 1024;
                const y = Math.random() * 1024;
                const size = Math.random() * 1.5;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = Math.random() * 0.9 + 0.1;
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
    const mesh = useRef<THREE.Mesh>(null);
    const trailRef = useRef<THREE.Mesh>(null);
    
    // Timer to track 5s intervals
    const timer = useRef(0);
    const isAnimating = useRef(false);
    
    // Animation progress (0 to 1)
    const progress = useRef(0);
    
    // Start and End vectors
    const startPos = useRef(new THREE.Vector3());
    const endPos = useRef(new THREE.Vector3());

    useFrame((state, delta) => {
        if (!isAnimating.current) {
            timer.current += delta;
            if (timer.current >= 5) {
                // Trigger Animation
                timer.current = 0;
                isAnimating.current = true;
                progress.current = 0;

                // Randomize positions on the upper hemisphere
                // Radius around 60-70 to be visible in sky
                const r = 70;
                const theta1 = Math.random() * Math.PI * 2;
                const phi1 = Math.acos(Math.random() * 0.5); // Top hemisphere
                
                startPos.current.setFromSphericalCoords(r, phi1, theta1);
                
                // End position: some distance away
                const theta2 = theta1 + (Math.random() - 0.5) * 2; // Random direction
                const phi2 = Math.min(Math.PI / 2, phi1 + 0.5); // Generally falling down
                
                endPos.current.setFromSphericalCoords(r, phi2, theta2);
                
                // Orient mesh
                if (mesh.current) {
                    mesh.current.position.copy(startPos.current);
                    mesh.current.lookAt(endPos.current);
                }
            }
        } else {
            // Animate
            progress.current += delta * 1.5; // Speed of meteor
            
            if (progress.current >= 1) {
                isAnimating.current = false;
                if (mesh.current) mesh.current.scale.set(0,0,0); // Hide
            } else {
                if (mesh.current) {
                    // Move
                    mesh.current.position.lerpVectors(startPos.current, endPos.current, progress.current);
                    
                    // Scale effect (grow then shrink)
                    const s = Math.sin(progress.current * Math.PI);
                    mesh.current.scale.set(s, s, s * 15); // Long tail
                    
                    // Simple visibility toggle
                    mesh.current.visible = true;
                }
            }
        }
    });

    return (
        <group>
            <mesh ref={mesh} visible={false}>
                {/* A long thin cone or cylinder for the meteor */}
                <cylinderGeometry args={[0, 0.4, 4, 8]} rotation={[Math.PI / 2, 0, 0]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
            </mesh>
        </group>
    );
};

export const Experience: React.FC<ExperienceProps> = ({ stars, onStarClick, onStarView }) => {
  return (
    <Canvas shadows dpr={[1, 2]}>
      <PerspectiveCamera makeDefault position={[0, 4, 14]} fov={50} />
      
      <OrbitControls 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={8}
        maxDistance={40}
        enablePan={false}
      />

      <GalaxyBackground />
      
      <ShootingStar />

      {/* Fog - Lighter to match background and show depth without hiding water */}
      <fog attach="fog" args={['#101025', 20, 100]} />

      {/* Lighting - Increased brightness */}
      <ambientLight intensity={1.5} color="#8888ff" />
      
      {/* Main Moonlight */}
      <spotLight 
        position={[15, 20, -10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={3} 
        color="#cceeff" 
        castShadow 
      />
      
      {/* Rim light for the pearl */}
      <pointLight position={[-10, 5, 10]} intensity={2} color="#88aaff" />

      {/* Scene Objects */}
      <Pearl />
      <Ocean />
      
      {/* Pass the click handler to the Stars component */}
      <Stars data={stars} onStarClick={onStarClick} onStarView={onStarView} />
      
      {/* Intense Cosmic Sparkles */}
      <Sparkles 
        count={800} 
        scale={40} 
        size={4} 
        speed={0.3} 
        opacity={0.6} 
        color="#aaddff" 
        position={[0, 5, 0]}
      />
      
      {/* Background Stars (Far away) */}
      <DreiStars radius={95} depth={50} count={6000} factor={5} saturation={0} fade speed={0.5} />
      
      <PostProcessing />
    </Canvas>
  );
};