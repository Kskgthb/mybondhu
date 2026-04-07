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
        'group relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-2xl border-3 border-border hover:border-primary/40 bg-white',
        className
      )}
    >
      {/* Image Background with Enhanced Sharpness */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={category.image}
          alt={category.label}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 brightness-105 contrast-110 saturate-110"
          style={{ imageRendering: 'crisp-edges' }}
        />
        {/* Stronger Gradient Overlay */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
        />
        
        {/* Enhanced Icon Badge with Stronger Shadow */}
        <div 
          className="absolute top-3 right-3 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12 border-2 border-white/30"
          style={{ backgroundColor: category.color }}
        >
          <Icon className="w-7 h-7 text-white drop-shadow-lg" strokeWidth={2.5} />
        </div>
      </div>

      {/* Enhanced Content with Better Contrast */}
      <div className="p-5 space-y-2 bg-white">
        <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors drop-shadow-sm">
          {category.label}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 font-medium">
          {category.description}
        </p>
      </div>

      {/* Stronger Hover Effect Border */}
      <div 
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border-2"
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
