import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CategoryData } from '@/lib/categoryData';

interface CategoryCardProps {
  category: CategoryData;
  onClick?: () => void;
  className?: string;
}

export default function CategoryCard({ category, onClick, className }: CategoryCardProps) {
  const Icon = category.icon;

  return (
    <Card
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] sm:hover:scale-110 hover:shadow-2xl border-3 border-border hover:border-primary/40 bg-white flex flex-row sm:flex-col h-28 sm:h-full',
        className
      )}
    >
      {/* Image Background with Enhanced Sharpness */}
      <div className="relative w-32 sm:w-full h-full sm:h-48 overflow-hidden flex-shrink-0">
        <img
          src={category.image}
          alt={category.label}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 brightness-105 contrast-110 saturate-110"
          style={{ imageRendering: 'crisp-edges' }}
        />
        {/* Stronger Gradient Overlay */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent sm:block hidden"
        />
        
        {/* Enhanced Icon Badge with Stronger Shadow */}
        <div 
          className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12 border-2 border-white/30"
          style={{ backgroundColor: category.color }}
        >
          <Icon className="w-4 h-4 sm:w-7 sm:h-7 text-white drop-shadow-lg" strokeWidth={2.5} />
        </div>
      </div>

      {/* Enhanced Content with Better Contrast */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-center space-y-1 sm:space-y-2 bg-white min-w-0">
        <h3 className="font-bold text-base sm:text-xl text-foreground group-hover:text-primary transition-colors drop-shadow-sm truncate">
          {category.label}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 font-medium">
          {category.description}
        </p>
      </div>

      {/* Stronger Hover Effect Border */}
      <div 
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border-2 sm:block hidden"
        style={{ 
          borderColor: `${category.color}60`,
          boxShadow: `inset 0 0 0 2px ${category.color}40, 0 0 20px ${category.color}30` 
        }}
      />
      
      {/* Shine Effect on Hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
    </Card>
  );
}
