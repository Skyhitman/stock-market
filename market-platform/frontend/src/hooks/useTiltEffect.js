import { useRef, useState, useCallback } from 'react';

export function useTiltEffect(maxTilt = 12) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});

  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    setStyle({
      transform: `perspective(800px) rotateX(${-y * maxTilt}deg) rotateY(${x * maxTilt}deg) translateZ(10px)`,
      transition: 'transform 0.1s ease-out',
    });
  }, [maxTilt]);

  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
      transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    });
  }, []);

  return { ref, style, handleMouseMove, handleMouseLeave };
}
