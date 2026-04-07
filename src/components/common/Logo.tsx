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

  return (
    <div className={containerClass}>
      <div className={cn(textClass, 'flex items-center gap-1')}>
        <span style={{ color: '#641acc' }}>Bondhu</span>
        <span style={{ color: '#2fbe6b' }}>App</span>
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="inline-block"
          style={{ marginLeft: '0.15em' }}
        >
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
            fill="#641acc"
            stroke="none"
          />
        </svg>
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
