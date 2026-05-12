import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import splashAnimation from '/bondhu-splash.json?url';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export default function SplashScreen({ onComplete, duration = 3500 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    // Load the Lottie JSON
    fetch('/bondhu-splash.json')
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch(() => {
        // If Lottie fails to load, just complete the splash
        setIsVisible(false);
        onComplete();
      });
  }, [onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 600);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: '#f1f5f9' }}
        >
          <div className="flex flex-col items-center justify-center gap-2">

            {/* BondhuApp Logo — hero element */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.43, 0.13, 0.23, 0.96] }}
              className="flex flex-col items-center"
            >
              <img
                src="/logo.png"
                alt="BondhuApp"
                className="h-40 sm:h-56 w-auto object-contain"
                style={{ mixBlendMode: 'multiply' }}
              />
            </motion.div>

            {/* Lottie Animation */}
            {animationData && (
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 0.8,
                  delay: 0.3,
                  ease: [0.43, 0.13, 0.23, 0.96],
                }}
                className="w-[220px] h-[220px] sm:w-[280px] sm:h-[280px]"
              >
                <Lottie
                  animationData={animationData}
                  loop={true}
                  autoplay={true}
                  style={{ width: '100%', height: '100%' }}
                />
              </motion.div>
            )}

            {/* Tagline */}
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex items-center gap-1 text-sm sm:text-base font-semibold tracking-widest mt-1"
            >
              <span style={{ color: '#641acc' }}>TASK DONE</span>
              <span className="mx-1" style={{ color: '#94a3b8' }}>,</span>
              <span style={{ color: '#2fbe6b' }}>TRUST DELIVERED</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
