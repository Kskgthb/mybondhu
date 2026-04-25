import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface InstallAppButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function InstallAppButton({ className, variant = 'outline', size = 'sm' }: InstallAppButtonProps) {
  const { isInstallable, promptInstall } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={`gap-2 ${className || ''}`}
      onClick={promptInstall}
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Install App</span>
      <span className="inline sm:hidden">Install</span>
    </Button>
  );
}
