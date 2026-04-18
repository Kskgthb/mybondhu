import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryData } from '@/lib/categoryData';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function CategoryExplorer() {
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (value: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [value]: !prev[value]
    }));
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-16 animate-fade-in">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 flex items-center justify-center gap-3">
          <Sparkles className="text-primary w-8 h-8" />
          Browse Services by Category
        </h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          From academic help to personal errands, find the perfect Bondhu for any task you need help with.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {categoryData.map((category) => {
          const isExpanded = expandedCategories[category.value];
          // Show 8 items initially as requested (6-8)
          const displayItems = isExpanded ? category.subcategories : category.subcategories.slice(0, 8);
          
          return (
            <div 
              key={category.value} 
              className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-2xl ${category.bgColor} flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                  {category.emoji}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">{category.label}</h3>
                  <p className="text-xs text-slate-400 font-medium">{category.subcategories.length} Services available</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 min-h-[100px]">
                {displayItems.map((sub, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate('/signup')}
                    className="px-4 py-2 rounded-xl bg-white/80 border border-slate-100 text-sm font-semibold text-slate-600 hover:bg-primary hover:text-white hover:border-primary hover:scale-105 transition-all duration-200 shadow-sm"
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {category.subcategories.length > 8 && (
                <button
                  onClick={() => toggleCategory(category.value)}
                  className="mt-6 w-full py-2 rounded-xl text-primary text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors border border-dashed border-primary/20 hover:border-primary/40"
                >
                  {isExpanded ? (
                    <>Show Less <ChevronUp className="w-4 h-4" /></>
                  ) : (
                    <>View More <ChevronDown className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Pro Tip section as requested */}
      <div className="mt-20 p-8 rounded-3xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-white/50 backdrop-blur-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="text-primary w-5 h-5" />
          <span className="text-sm font-bold text-primary uppercase tracking-widest">Pro Tip</span>
        </div>
        <p className="text-slate-700 font-medium text-lg">
          Click on any service chip to get started and find your perfect Bondhu instantly!
        </p>
      </div>
    </div>
  );
}
