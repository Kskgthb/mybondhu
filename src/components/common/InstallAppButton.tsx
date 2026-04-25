import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface InstallAppButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function InstallAppButton({ className, variant = 'ghost', size = 'sm' }: InstallAppButtonProps) {
  const { isInstallable, promptInstall } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={`gap-1.5 sm:gap-2 px-2 sm:px-3 ${className || ''}`}
      onClick={promptInstall}
      title="Install App"
    >
      <span className="text-xl sm:text-lg leading-none">🫆</span>
      <span className="hidden sm:inline">Install App</span>
    </Button>
  );
}
