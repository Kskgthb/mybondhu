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
          style={{ backgroundColor: '#000000' }}
        >
          <div className="flex flex-col items-center justify-center gap-4">
            {/* Lottie Animation */}
            {animationData && (
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 0.8,
                  delay: 0.15,
                  ease: [0.43, 0.13, 0.23, 0.96],
                }}
                className="w-[280px] h-[280px] sm:w-[350px] sm:h-[350px]"
              >
                <Lottie
                  animationData={animationData}
                  loop={true}
                  autoplay={true}
                  style={{ width: '100%', height: '100%' }}
                />
              </motion.div>
            )}

            {/* BondhuApp Logo Image */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col items-center gap-4"
            >
              <img 
                src="/logo.png" 
                alt="BondhuApp Logo" 
                className="h-20 sm:h-28 w-auto object-contain"
              />
              <div className="text-sm sm:text-base font-semibold tracking-wider mt-1">
                <span style={{ color: '#641acc' }}>TASK DONE</span>
                <span className="mx-1" style={{ color: '#94a3b8' }}>,</span>
                <span style={{ color: '#2fbe6b' }}>TRUST DELIVERED</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
