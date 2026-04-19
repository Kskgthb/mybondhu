import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Compass } from 'lucide-react';
import { categoryData, type CategoryData } from '@/lib/categoryData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Lottie from 'lottie-react';

// Custom Map Pin Component - Mobile Friendly
const MapMarker = ({ 
  category, 
  onClick, 
  isSelected,
  position
}: { 
  category: CategoryData; 
  onClick: () => void; 
  isSelected: boolean;
  position: { top: string; left: string };
}) => {
  const Icon = category.icon;
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      className="absolute z-20 cursor-pointer"
      style={{ top: position.top, left: position.left }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div className="relative group flex flex-col items-center">
        {/* Shadow/Ring Effect */}
        <div 
          className={`absolute -inset-2 rounded-full blur-sm transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}
          style={{ backgroundColor: category.color }}
        />
        
        {/* Marker Body */}
        <div 
          className={`relative w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-all duration-300 ${isSelected ? 'scale-110 shadow-xl' : ''}`}
          style={{ backgroundColor: category.color }}
        >
          <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
          
          {/* Bottom Pointer */}
          <div 
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 sm:w-3 sm:h-3 rotate-45 border-r-2 border-b-2 border-white shadow-md"
            style={{ backgroundColor: category.color }}
          />
        </div>

        {/* Label - visible on mobile if selected, or on hover */}
        <div className={`mt-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap text-[9px] sm:text-[10px] font-extrabold text-slate-700 transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 sm:group-hover:opacity-100'}`}>
          {category.label}
        </div>
      </div>
    </motion.div>
  );
};

export default function CategoryMapExplorer() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pre-calculate stable positions for markers
  const markerPositions = useMemo(() => {
    return categoryData.map((category) => {
      const hash = category.value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return {
        top: 15 + (hash % 60) + '%',
        left: 10 + ((hash * 13) % 80) + '%'
      };
    });
  }, []);

  // Bicycle Path Simulation - Moving through markers
  const [bicyclePos, setBicyclePos] = useState({ top: '50%', left: '50%' });
  const [bicycleRotation, setBicycleRotation] = useState(0);
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    fetch('/bondhu-splash.json')
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Failed to load bicycle animation", err));
  }, []);

  useEffect(() => {
    let index = 0;
    const moveBicycle = () => {
      const target = markerPositions[index];
      
      // Calculate rotation based on previous position
      setBicyclePos((prev) => {
          const prevTop = parseFloat(prev.top);
          const prevLeft = parseFloat(prev.left);
          const targetTop = parseFloat(target.top);
          const targetLeft = parseFloat(target.left);
          
          const angle = Math.atan2(targetTop - prevTop, targetLeft - prevLeft) * (180 / Math.PI);
          setBicycleRotation(angle);
          
          return target;
      });

      index = (index + 1) % markerPositions.length;
    };

    const interval = setInterval(moveBicycle, 4000);
    moveBicycle(); // Initial move
    return () => clearInterval(interval);
  }, [markerPositions]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-8 animate-fade-in mb-8 sm:mb-16 overflow-hidden">
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-xs sm:text-sm font-bold mb-3 border border-green-100 shadow-sm">
          <Compass className="w-4 h-4 animate-spin-slow" />
          Interactive Service Map
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight">
          Explore Services Near You
        </h2>
      </div>

      <div 
        ref={containerRef}
        className="relative aspect-[4/3] sm:aspect-[16/9] min-h-[350px] sm:min-h-[500px] w-full bg-[#f1f5f9] rounded-[30px] sm:rounded-[50px] border-4 sm:border-8 border-white shadow-2xl overflow-hidden cursor-crosshair"
      >
        {/* Stylized Realistic Map Layout */}
        <div className="absolute inset-0 z-0">
          <svg width="100%" height="100%" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
             {/* Base Layer */}
             <rect width="1000" height="600" fill="#f8fafc" />
             
             {/* Green Zones (Parks) */}
             <path d="M50 50 Q150 20 250 80 T450 50 L450 200 Q300 250 50 200 Z" fill="#ecfdf5" />
             <path d="M700 400 Q850 350 950 450 L950 550 Q800 600 700 550 Z" fill="#ecfdf5" />
             <path d="M100 400 Q250 450 300 350 T500 400 L450 550 Q200 600 50 500 Z" fill="#ecfdf5" />
             
             {/* River */}
             <path d="M0 100 Q150 80 300 200 T600 150 T1000 250 L1000 300 Q700 200 400 250 T0 150 Z" fill="#e0f2fe" />
             
             {/* Complex Road Network */}
             <g stroke="#cbd5e1" strokeWidth="20" strokeLinecap="round">
                <path d="M0 300 H1000" />
                <path d="M300 0 V600" />
                <path d="M700 0 V600" />
                <path d="M0 150 C300 150 400 450 1000 450" strokeWidth="15" />
                <path d="M0 450 C200 450 500 150 1000 150" strokeWidth="15" />
             </g>
             
             {/* Building Footprints */}
             <g fill="#e2e8f0" opacity="0.6">
                <rect x="320" y="50" width="60" height="40" rx="4" />
                <rect x="400" y="70" width="80" height="30" rx="4" />
                <rect x="720" y="100" width="40" height="80" rx="4" />
                <rect x="50" y="320" width="100" height="40" rx="4" />
                <rect x="800" y="320" width="80" height="50" rx="4" />
             </g>
             
             {/* College Names Watermarks */}
             <g fill="#94a3b8" opacity="0.5" fontSize="12" fontWeight="bold" fontFamily="system-ui, sans-serif">
                <text x="80" y="45">Techno Main Salt Lake</text>
                <text x="450" y="45">Techno India University</text>
                <text x="750" y="80">IIM Calcutta</text>
                <text x="800" y="280">Techno International Newtown</text>
                <text x="60" y="180">IIT KGP</text>
                <text x="350" y="180">NIT DURGAPUR</text>
                <text x="550" y="220">JADAVPUR UNIVERSITY</text>
                <text x="850" y="380">MAKUT</text>
                <text x="120" y="260">IEM</text>
                <text x="420" y="280">IHM</text>
                <text x="680" y="340">Heritage Institute of Technology</text>
                <text x="40" y="370">Haldia Institute of Technology</text>
                <text x="300" y="430">WBNUJS</text>
                <text x="820" y="480">(IIEST)</text>
                <text x="120" y="480">St. Xavier's College</text>
                <text x="480" y="520">BESC</text>
                <text x="750" y="560">Amity University, Kolkata</text>
                <text x="600" y="90">BPPIMT</text>
             </g>
          </svg>
        </div>

        {/* Bicycle Path & Animation */}
        <motion.div 
          className="absolute z-10 pointer-events-none"
          animate={{ 
            top: bicyclePos.top, 
            left: bicyclePos.left,
            rotate: bicycleRotation
          }}
          transition={{ duration: 3.5, ease: "easeInOut" }}
          style={{ width: '40px', height: '40px' }}
        >
          <div className="relative -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
             <div className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-xl bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50">
               {animationData ? (
                 <Lottie
                   animationData={animationData}
                   loop={true}
                   autoplay={true}
                   style={{ width: '120%', height: '120%' }}
                 />
               ) : (
                 <div className="text-xl sm:text-2xl animate-bounce">🚲</div>
               )}
             </div>
             {/* Mini Dotted Path Indicator */}
             <div className="w-1 h-12 bg-gradient-to-t from-transparent via-green-400/40 to-transparent mt-[-10px] z-[-1]" />
          </div>
        </motion.div>

        {/* Map Markers */}
        {categoryData.map((category, idx) => (
          <MapMarker 
            key={category.value} 
            category={category} 
            position={markerPositions[idx]}
            isSelected={selectedCategory?.value === category.value}
            onClick={() => setSelectedCategory(category)}
          />
        ))}

        {/* Dynamic Card Overlay */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="absolute inset-x-0 bottom-4 sm:bottom-8 flex justify-center z-50 px-4"
            >
              <Card className="w-full max-w-sm sm:max-w-md p-4 sm:p-6 shadow-2xl border-2 border-white bg-white/95 backdrop-blur-xl rounded-[24px] sm:rounded-[32px] relative overflow-hidden group">
                {/* Decorative Elements */}
                <div 
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 blur-3xl"
                  style={{ backgroundColor: selectedCategory.color }}
                />
                
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 mb-4">
                  <div 
                    className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-inner overflow-hidden"
                    style={{ backgroundColor: `${selectedCategory.color}15` }}
                  >
                    <selectedCategory.icon 
                      className="w-7 h-7 sm:w-10 sm:h-10" 
                      style={{ color: selectedCategory.color }} 
                      strokeWidth={2.5}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight truncate">
                      {selectedCategory.label}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {selectedCategory.emoji} Service
                       </span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-600 text-xs sm:text-sm font-semibold mb-6 leading-relaxed">
                  {selectedCategory.description}
                </p>

                <Button 
                  onClick={() => navigate('/signup')}
                  className="w-full h-12 sm:h-14 rounded-2xl text-base sm:text-lg font-black shadow-xl transition-all duration-300 active:scale-95 group"
                  style={{ 
                    backgroundColor: selectedCategory.color,
                    boxShadow: `0 10px 25px -8px ${selectedCategory.color}80`
                  }}
                >
                  Sign Up to Explore
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Call to Action */}
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-30">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/signup')}
            className="bg-[#2fbe6b] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-[0_10px_20px_-5px_rgba(47,190,107,0.4)] font-black text-xs sm:text-sm flex items-center gap-2 transition-transform border-2 border-white/20"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            Tap to explore!
          </motion.button>
        </div>
      </div>
      
      {/* Visual Instruction */}
      <p className="text-center text-slate-400 text-[10px] sm:text-xs font-bold mt-4 uppercase tracking-widest">
         Select a location pin to view details
      </p>
    </div>
  );
}
