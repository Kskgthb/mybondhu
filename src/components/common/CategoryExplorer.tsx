import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryData } from '@/lib/categoryData';

export default function CategoryExplorer() {
  const navigate = useNavigate();
  // Default to the first category (Academic)
  const [selectedCategoryValue, setSelectedCategoryValue] = useState(categoryData[0].value);

  const selectedCategory = categoryData.find(cat => cat.value === selectedCategoryValue) || categoryData[0];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      
      {/* Horizontal Scrollable Category Selector (Tabs) */}
      <div className="relative mb-8">
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-4 snap-x">
          {categoryData.map((category) => {
            const isSelected = category.value === selectedCategoryValue;
            const Icon = category.icon;
            
            return (
              <button
                key={category.value}
                onClick={() => setSelectedCategoryValue(category.value)}
                className={`flex flex-col items-center justify-center min-w-[80px] sm:min-w-[100px] py-3 px-2 snap-center transition-all duration-300 relative group
                  ${isSelected ? 'text-green-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {/* Icon Background Blob */}
                <div 
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-3xl flex items-center justify-center mb-2 transition-all duration-300
                    ${isSelected ? 'bg-green-100/80 scale-110 shadow-sm' : 'bg-transparent group-hover:bg-slate-100'}`}
                  style={isSelected ? {} : { borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }}
                >
                  <Icon 
                    className={`w-6 h-6 sm:w-7 sm:h-7 transition-all duration-300 ${isSelected ? 'text-green-600 drop-shadow-sm' : 'text-slate-500 group-hover:text-slate-800'}`} 
                    strokeWidth={isSelected ? 2.5 : 2}
                  />
                </div>
                
                {/* Category Text */}
                <span className={`text-xs sm:text-sm font-semibold text-center whitespace-nowrap ${isSelected ? 'font-bold' : ''}`}>
                  {category.label}
                </span>

                {/* Active Indicator Underline */}
                {isSelected && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-green-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Subtle bottom border for the tabs area */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-slate-200 -z-10" />
      </div>

      {/* Sub-services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6">
        {selectedCategory.subcategories.map((sub, idx) => (
          <button
            key={idx}
            onClick={() => navigate('/signup')}
            className="flex items-center justify-center text-center px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-full text-sm sm:text-base font-medium text-slate-700 hover:bg-green-50 hover:border-green-200 hover:text-green-700 hover:shadow-md transition-all duration-200 shadow-sm w-full touch-manipulation"
          >
            {sub.label}
          </button>
        ))}
      </div>
      
    </div>
  );
}
