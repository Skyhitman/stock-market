import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

function Globe() {
  const globeRef = useRef();
  const dotsRef = useRef();

  // Create wireframe sphere points for latitude/longitude lines
  const wireframeLines = useMemo(() => {
    const lines = [];
    const radius = 2.05;

    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const points = [];
      const phi = (90 - lat) * (Math.PI / 180);
      for (let lng = 0; lng <= 360; lng += 5) {
        const theta = lng * (Math.PI / 180);
        points.push(new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta)
        ));
      }
      lines.push(points);
    }

    // Longitude lines
    for (let lng = 0; lng < 360; lng += 30) {
      const points = [];
      const theta = lng * (Math.PI / 180);
      for (let lat = -90; lat <= 90; lat += 5) {
        const phi = (90 - lat) * (Math.PI / 180);
        points.push(new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta)
        ));
      }
      lines.push(points);
    }

    return lines;
  }, []);

  // Market centers: Mumbai, Tokyo, London, NYC
  const marketCenters = useMemo(() => {
    const centers = [
      { name: 'Mumbai', lat: 19.08, lng: 72.88, color: '#10b981' },
      { name: 'Tokyo', lat: 35.68, lng: 139.69, color: '#3b82f6' },
      { name: 'London', lat: 51.51, lng: -0.13, color: '#f59e0b' },
      { name: 'NYC', lat: 40.71, lng: -74.01, color: '#a855f7' },
      { name: 'Shanghai', lat: 31.23, lng: 121.47, color: '#ef4444' },
    ];

    return centers.map(c => {
      const phi = (90 - c.lat) * (Math.PI / 180);
      const theta = (c.lng + 180) * (Math.PI / 180);
      const r = 2.1;
      return {
        ...c,
        position: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        ],
      };
    });
  }, []);

  useFrame((state) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={globeRef}>
      {/* Core sphere - dark semi-transparent */}
      <Sphere args={[2, 48, 48]}>
        <meshPhongMaterial
          color="#0a1628"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </Sphere>

      {/* Wireframe lines */}
      {wireframeLines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#00f0ff"
          lineWidth={0.5}
          transparent
          opacity={0.15}
        />
      ))}

      {/* Outer glow sphere */}
      <Sphere args={[2.2, 32, 32]}>
        <meshPhongMaterial
          color="#00f0ff"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Market center dots */}
      {marketCenters.map((center, i) => (
        <mesh key={i} position={center.position}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color={center.color} />
          {/* Glow ring */}
          <mesh>
            <ringGeometry args={[0.08, 0.12, 32]} />
            <meshBasicMaterial
              color={center.color}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        </mesh>
      ))}
    </group>
  );
}

export default function HoloGlobe({ size = 300 }) {
  return (
    <div style={{ width: size, height: size }} className="relative mx-auto">
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full animate-pulse-glow"
        style={{
          background: 'radial-gradient(circle, rgba(0,240,255,0.05) 0%, transparent 70%)',
        }}
      />
      <Canvas
        camera={{ position: [0, 1, 5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#00f0ff" />
        <pointLight position={[-10, -5, 5]} intensity={0.3} color="#a855f7" />
        <Globe />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          rotateSpeed={0.5}
          minPolarAngle={Math.PI * 0.3}
          maxPolarAngle={Math.PI * 0.7}
        />
      </Canvas>
    </div>
  );
}
