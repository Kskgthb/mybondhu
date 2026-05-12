import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
  showTagline?: boolean;
}

const imgHeightMap = {
  sm: 36,
  md: 48,
  lg: 64,
  xl: 96,
};

const taglineSizeClasses = {
  sm: 'text-[0.65rem]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-lg',
};

export default function Logo({ size = 'md', className, showBorder = false, showTagline = false }: LogoProps) {
  const containerClass = cn(
    'flex flex-col items-center justify-center transition-all duration-300',
    showBorder && 'rounded-xl border-2 border-primary/20 p-4 shadow-lg hover:shadow-xl hover:border-primary/30',
    className
  );

  const taglineClass = cn('font-semibold tracking-wider', taglineSizeClasses[size]);

  const imgHeight = imgHeightMap[size];

  return (
    <div className={containerClass}>
      <img
        src="/logo.png"
        alt="BondhuApp"
        height={imgHeight}
        style={{ height: imgHeight, width: 'auto', objectFit: 'contain' }}
        draggable={false}
      />
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
