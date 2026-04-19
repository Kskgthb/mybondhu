import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, ChevronRight, Map as MapIcon, Compass } from 'lucide-react';
import { categoryData, type CategoryData } from '@/lib/categoryData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Custom Map Pin Component
const MapMarker = ({ 
  category, 
  onClick, 
  isSelected 
}: { 
  category: CategoryData; 
  onClick: () => void; 
  isSelected: boolean;
}) => {
  const Icon = category.icon;
  
  // Random position for simulation within the map area
  // We'll use stable random positions based on category value
  const position = useMemo(() => {
    const hash = category.value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      top: 20 + (hash % 60) + '%',
      left: 10 + ((hash * 13) % 80) + '%'
    };
  }, [category.value]);

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
      <div className="relative group">
        {/* Shadow/Ring Effect */}
        <div 
          className={`absolute -inset-2 rounded-full blur-sm transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}
          style={{ backgroundColor: category.color }}
        />
        
        {/* Marker Body */}
        <div 
          className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-all duration-300 ${isSelected ? 'scale-110' : ''}`}
          style={{ backgroundColor: category.color }}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
          
          {/* Bottom Pointer */}
          <div 
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r-2 border-b-2 border-white shadow-md"
            style={{ backgroundColor: category.color }}
          />
        </div>

        {/* Label (Mobile optimization: only show on hover or if selected) */}
        <div className={`absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap text-[10px] font-bold text-slate-700 pointer-events-none transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {category.label}
        </div>
      </div>
    </motion.div>
  );
};

export default function CategoryMapExplorer() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);

  // Background map SVG pattern or illustration
  // Using a simplified stylized city map SVG
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 animate-fade-in mb-16 overflow-hidden">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-bold mb-3 border border-green-100">
          <Compass className="w-4 h-4 animate-spin-slow" />
          Live Bondhu Map
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
          Find Help Across Campus
        </h2>
        <p className="text-slate-500 mt-2 font-medium">
          Explore categories through our interactive city map
        </p>
      </div>

      <div className="relative aspect-[16/9] min-h-[400px] sm:min-h-[500px] w-full bg-[#f8fafc] rounded-[40px] border-8 border-white shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing">
        {/* Stylized City Map Illustration Layer */}
        <div className="absolute inset-0 z-0 opacity-40">
          <svg width="100%" height="100%" viewBox="0 0 1000 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Roads */}
            <path d="M0 300 H1000 M300 0 V600 M700 0 V600 M0 150 H1000 M0 450 H1000" stroke="#e2e8f0" strokeWidth="40" />
            {/* Circular Path for Bicycle */}
            <circle cx="500" cy="300" r="150" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 8" />
            
            {/* Building Blocks */}
            <rect x="50" y="50" width="200" height="80" rx="20" fill="#f1f5f9" />
            <rect x="750" y="50" width="200" height="200" rx="40" fill="#f1f5f9" />
            <rect x="50" y="350" width="200" height="200" rx="30" fill="#f1f5f9" />
            <rect x="750" y="450" width="200" height="100" rx="20" fill="#f1f5f9" />
            <circle cx="500" cy="300" r="80" fill="#f1f5f9" />
          </svg>
        </div>

        {/* Bicycle Animation Component */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-full h-full relative"
            >
              <motion.div 
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg border border-slate-100"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="text-2xl">🚲</div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Map Pins */}
        {categoryData.map((category) => (
          <MapMarker 
            key={category.value} 
            category={category} 
            isSelected={selectedCategory?.value === category.value}
            onClick={() => setSelectedCategory(category)}
          />
        ))}

        {/* Floating Card Popup */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.9 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm"
            >
              <Card className="p-4 sm:p-5 shadow-2xl border-2 border-white bg-white/90 backdrop-blur-xl rounded-3xl relative overflow-hidden group">
                {/* Background Decor */}
                <div 
                  className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 blur-2xl"
                  style={{ backgroundColor: selectedCategory.color }}
                />
                
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 mb-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: `${selectedCategory.color}20` }}
                  >
                    <selectedCategory.icon 
                      className="w-8 h-8" 
                      style={{ color: selectedCategory.color }} 
                      strokeWidth={2.5}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 leading-tight">
                      {selectedCategory.label}
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-wider mt-0.5" style={{ color: selectedCategory.color }}>
                      {selectedCategory.emoji} Category
                    </p>
                  </div>
                </div>

                <p className="text-slate-600 text-sm font-medium mb-5 line-clamp-2">
                  {selectedCategory.description}
                </p>

                <Button 
                  onClick={() => navigate('/signup')}
                  className="w-full h-12 rounded-2xl text-base font-bold shadow-lg transition-all duration-300 active:scale-95 group"
                  style={{ 
                    backgroundColor: selectedCategory.color,
                    boxShadow: `0 8px 20px -6px ${selectedCategory.color}`
                  }}
                >
                  Explore {selectedCategory.label}
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map UI Elements */}
        <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
          <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-white flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
               <MapIcon className="w-4 h-4 text-white" />
             </div>
             <span className="text-xs font-bold text-slate-700 pr-2">Interactive Campus</span>
          </div>
        </div>

        {/* Tap to Explore CTA */}
        <div className="absolute top-6 right-6 z-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/signup')}
            className="bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg border-2 border-white text-slate-800 font-bold text-sm flex items-center gap-2 hover:bg-white transition-all"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Tap to explore
          </motion.button>
        </div>
      </div>
      
      {/* Scroll Hint */}
      <div className="flex justify-center mt-6">
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
          <div className="w-8 h-1 rounded-full bg-slate-200" />
          Interactive Experience
          <div className="w-8 h-1 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
