import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

interface CampusToggleProps {
  onModeChange?: (isCampus: boolean, campus: string | null) => void;
  className?: string;
}

const CAMPUSES = [
  'TECHNO MAIN SALT LAKE (TMSL)',
  'TECHNO INDIA UNIVERSITY (TIU)',
  'SCHOOL OF FUTURE (SOF)',
];

export default function CampusToggle({ onModeChange, className }: CampusToggleProps) {
  const [isCampusMode, setIsCampusMode] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const [tempCampus, setTempCampus] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleToggle = (checked: boolean) => {
    if (checked) {
      setTempCampus(selectedCampus);
      setShowModal(true);
    } else {
      setIsCampusMode(false);
      onModeChange?.(false, null);
    }
  };

  const handleApply = () => {
    if (tempCampus) {
      setSelectedCampus(tempCampus);
      setIsCampusMode(true);
      setShowModal(false);
      onModeChange?.(true, tempCampus);
    }
  };

  const handleClose = () => {
    if (!isCampusMode) {
      // If we cancel the modal and weren't in campus mode, keep switch off
      setIsCampusMode(false);
    }
    setShowModal(false);
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-2 bg-secondary/10 px-3 py-1.5 rounded-full border border-secondary/20 transition-all">
        <Label className="text-xs font-semibold cursor-pointer text-muted-foreground whitespace-nowrap" htmlFor="campus-mode-switch">
          OUTSIDE
        </Label>
        
        <Switch
          id="campus-mode-switch"
          checked={isCampusMode || showModal}
          onCheckedChange={handleToggle}
          className="scale-75 data-[state=checked]:bg-[#2fbe6b]"
        />
        
        <Label className="text-xs font-semibold cursor-pointer whitespace-nowrap flex items-center gap-1.5" htmlFor="campus-mode-switch">
          <span className={isCampusMode ? "text-[#2fbe6b]" : "text-muted-foreground"}>CAMPUS</span>
          {isCampusMode && selectedCampus && (
            <span className="flex items-center gap-1.5 ml-2 text-[10px] bg-[#2fbe6b]/10 text-[#2fbe6b] px-2 py-0.5 rounded-full border border-[#2fbe6b]/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2fbe6b] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2fbe6b]"></span>
              </span>
              LIVE • {selectedCampus}
            </span>
          )}
        </Label>
      </div>

      <Dialog open={showModal} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-[#1c1c1e] text-white">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-bold text-white text-center">Select your campus</DialogTitle>
            </DialogHeader>
            
            <RadioGroup value={tempCampus || ''} onValueChange={setTempCampus} className="space-y-3">
              {CAMPUSES.map((campus) => (
                <div 
                  key={campus} 
                  className={cn(
                    "flex items-center space-x-3 rounded-xl border p-4 transition-colors cursor-pointer",
                    tempCampus === campus ? "border-[#2fbe6b] bg-[#2fbe6b]/10" : "border-white/10 hover:bg-white/5"
                  )}
                  onClick={() => setTempCampus(campus)}
                >
                  <RadioGroupItem 
                    value={campus} 
                    id={campus} 
                    className="border-white/30 text-[#2fbe6b] data-[state=checked]:border-[#2fbe6b] data-[state=checked]:text-[#2fbe6b]"
                  />
                  <Label htmlFor={campus} className="text-sm font-medium leading-none cursor-pointer text-white">
                    {campus}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="p-4 bg-black/20 border-t border-white/5">
            <Button 
              className="w-full bg-[#2fbe6b] hover:bg-[#26a25b] text-white font-semibold rounded-xl py-6 text-base"
              disabled={!tempCampus}
              onClick={handleApply}
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
