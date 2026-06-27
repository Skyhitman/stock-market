import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Particles({ count = 400 }) {
  const mesh = useRef();

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;

      // Mix cyan and purple
      const t = Math.random();
      col[i * 3] = t * 0 + (1 - t) * 0.66;       // R
      col[i * 3 + 1] = t * 0.94 + (1 - t) * 0.33; // G
      col[i * 3 + 2] = t * 1.0 + (1 - t) * 0.97;  // B
    }
    return [pos, col];
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.elapsedTime;
    const posArray = mesh.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      posArray[i * 3 + 1] += Math.sin(time * 0.3 + i) * 0.003;
      posArray[i * 3] += Math.cos(time * 0.2 + i * 0.5) * 0.001;
      // Reset particles that float too high
      if (posArray[i * 3 + 1] > 25) posArray[i * 3 + 1] = -25;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
    mesh.current.rotation.y = time * 0.015;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function GridFloor() {
  return (
    <gridHelper
      args={[80, 80, '#0a2540', '#0a1628']}
      position={[0, -12, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

export default function ParticleField() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.7 }}>
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        gl={{ alpha: true, antialias: false }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]}
      >
        <Particles />
        <GridFloor />
        <ambientLight intensity={0.2} />
      </Canvas>
    </div>
  );
}
