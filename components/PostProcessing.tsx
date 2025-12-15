import React from 'react';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export const PostProcessing: React.FC = () => {
  return (
    <EffectComposer enableNormalPass={false}>
      <Noise opacity={0.05} blendFunction={BlendFunction.OVERLAY} />
      
      {/* Bloom settings tuned for the glowing pearl */}
      <Bloom 
        luminanceThreshold={1.0} // Only very bright (emissive > 1) objects will bloom
        mipmapBlur 
        intensity={0.6} // Moderate intensity for a soft glow
        radius={0.4} // Spread of the bloom
      />
      
      <Vignette eskil={false} offset={0.1} darkness={0.8} />
    </EffectComposer>
  );
};