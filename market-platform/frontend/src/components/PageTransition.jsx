import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    rotateX: 10,
    z: -100,
    filter: 'blur(20px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    z: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.1,
    rotateX: -5,
    z: 50,
    filter: 'blur(15px)',
    transition: {
      duration: 0.4,
      ease: [0.32, 0, 0.67, 0],
    },
  },
};

export default function PageTransition({ children }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Wrapper for staggered child animations within a page
export function StaggerContainer({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={{
        animate: { transition: { staggerChildren: 0.07 } },
      }}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={{
        initial: { opacity: 0, y: 20, scale: 0.96 },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
