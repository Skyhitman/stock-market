import { useState, useEffect, useCallback } from 'react';

export function useMouseParallax(intensity = 0.02) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouse({ x, y });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return {
    x: mouse.x,
    y: mouse.y,
    parallaxStyle: {
      transform: `translate(${mouse.x * intensity * 100}px, ${mouse.y * intensity * 100}px)`,
    },
    rotateStyle: {
      transform: `perspective(1000px) rotateY(${mouse.x * 2}deg) rotateX(${-mouse.y * 2}deg)`,
    },
  };
}
