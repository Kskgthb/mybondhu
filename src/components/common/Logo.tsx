import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
  showTagline?: boolean;
}

const textSizeClasses = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-4xl',
  xl: 'text-6xl'
};

const taglineSizeClasses = {
  sm: 'text-[0.65rem]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-lg'
};

const iconSizeMap = {
  sm: 20,
  md: 32,
  lg: 40,
  xl: 56
};

export default function Logo({ size = 'md', className, showBorder = false, showTagline = false }: LogoProps) {
  const containerClass = cn(
    'flex flex-col items-center justify-center transition-all duration-300',
    showBorder && 'rounded-xl border-2 border-primary/20 p-4 shadow-lg hover:shadow-xl hover:border-primary/30',
    className
  );

  const textClass = cn(
    'font-bold tracking-tight',
    textSizeClasses[size]
  );

  const taglineClass = cn(
    'font-semibold tracking-wider',
    taglineSizeClasses[size]
  );

  const iconSize = iconSizeMap[size];

  const logoHeight = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24'
  }[size];

  return (
    <div className={containerClass}>
      <div className={cn(textClass, 'flex items-center gap-1')}>
        <img 
          src="/logo.png" 
          alt="BondhuApp" 
          className={cn(logoHeight, "w-auto object-contain")}
          style={{ mixBlendMode: 'multiply' }}
        />
      </div>
      {showTagline && (
        <div className="flex flex-col items-center mt-2 gap-0.5">
          <div className={taglineClass}>
            <span style={{ color: '#641acc' }}>TASK DONE</span>
            <span className="text-muted-foreground mx-1">,</span>
            <span style={{ color: '#2fbe6b' }}>TRUST DELIVERED</span>
          </div>
        </div>
      )}
    </div>
  );
}
