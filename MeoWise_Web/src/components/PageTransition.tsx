import { ReactNode, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    prevPath.current = location.pathname;
  }, [location.pathname]);

  const direction = () => {
    const paths = ['/dashboard', '/feeding', '/report', '/profile'];
    const currentIndex = paths.indexOf(location.pathname);
    const prevIndex = paths.indexOf(prevPath.current);
    
    if (prevIndex === -1 || currentIndex === -1) return 0;
    return currentIndex > prevIndex ? 1 : -1;
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ x: direction() * 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: direction() * -50, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}