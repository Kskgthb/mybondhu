import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CampusToggleProps {
  onModeChange?: (isCampus: boolean, campus: string | null) => void;
  className?: string;
}

const CAMPUSES = [
  { id: 'tmsl', label: 'TECHNO MAIN SALT LAKE (TMSL)' },
  { id: 'tiu',  label: 'TECHNO INDIA UNIVERSITY (TIU)' },
  { id: 'sof',  label: 'SCHOOL OF FUTURE (SOF)' },
];

export default function CampusToggle({ onModeChange, className }: CampusToggleProps) {
  const [isCampusMode, setIsCampusMode] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const [tempCampus, setTempCampus]     = useState<string | null>(null);
  const [showModal, setShowModal]       = useState(false);

  const handleSegmentClick = (campus: boolean) => {
    if (campus && !isCampusMode) {
      setTempCampus(selectedCampus);
      setShowModal(true);
    } else if (!campus && isCampusMode) {
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
    setShowModal(false);
  };

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>

      {/* Floating label above toggle */}
      <span
        className="text-[10px] font-bold tracking-widest uppercase transition-colors duration-300"
        style={{ color: isCampusMode ? '#2fbe6b' : '#641acc' }}
      >
        {isCampusMode ? 'Campus' : 'Outside'}
      </span>

      {/* Segmented pill control */}
      <div
        className="flex rounded-full p-[3px] shadow-sm"
        style={{ background: '#f1f5f9', border: '1.5px solid #e2e8f0' }}
      >
        {/* OUTSIDE segment */}
        <button
          type="button"
          onClick={() => handleSegmentClick(false)}
          className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all duration-250 focus:outline-none"
          style={
            !isCampusMode
              ? {
                  background: 'white',
                  color: '#641acc',
                  boxShadow: '0 1px 6px rgba(100,26,204,0.15)',
                }
              : {
                  background: 'transparent',
                  color: '#94a3b8',
                }
          }
        >
          {/* active indicator dot */}
          {!isCampusMode && (
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#641acc' }} />
          )}
          Outside
        </button>

        {/* CAMPUS segment */}
        <button
          type="button"
          onClick={() => handleSegmentClick(true)}
          className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all duration-250 focus:outline-none"
          style={
            isCampusMode
              ? {
                  background: 'white',
                  color: '#2fbe6b',
                  boxShadow: '0 1px 6px rgba(47,190,107,0.18)',
                }
              : {
                  background: 'transparent',
                  color: '#94a3b8',
                }
          }
        >
          {isCampusMode && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2fbe6b] opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#2fbe6b]" />
            </span>
          )}
          Campus
        </button>
      </div>

      {/* Selected campus LIVE label */}
      {isCampusMode && selectedCampus && (
        <span
          className="text-[9px] font-semibold tracking-wider text-center leading-tight px-2 py-0.5 rounded-full"
          style={{
            color: '#2fbe6b',
            background: 'rgba(47,190,107,0.08)',
            border: '1px solid rgba(47,190,107,0.2)',
            maxWidth: '180px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {selectedCampus}
        </span>
      )}

      {/* Campus selection modal */}
      <Dialog open={showModal} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-sm rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-[#1c1c1e] text-white">
          <div className="p-6">
            <DialogHeader className="mb-5">
              <DialogTitle className="text-xl font-bold text-white text-center">
                Select your campus
              </DialogTitle>
            </DialogHeader>

            <RadioGroup
              value={tempCampus || ''}
              onValueChange={setTempCampus}
              className="space-y-2.5"
            >
              {CAMPUSES.map((campus) => (
                <div
                  key={campus.id}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3.5 transition-all cursor-pointer',
                    tempCampus === campus.label
                      ? 'border-[#2fbe6b] bg-[#2fbe6b]/10'
                      : 'border-white/10 hover:bg-white/5',
                  )}
                  onClick={() => setTempCampus(campus.label)}
                >
                  <RadioGroupItem
                    value={campus.label}
                    id={campus.id}
                    className="border-white/30 text-[#2fbe6b] data-[state=checked]:border-[#2fbe6b]"
                  />
                  <Label
                    htmlFor={campus.id}
                    className="text-sm font-medium cursor-pointer text-white leading-snug"
                  >
                    {campus.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="px-6 pb-6">
            <Button
              className="w-full font-semibold rounded-xl text-white text-base py-6 transition-all"
              style={{
                background: tempCampus ? '#2fbe6b' : '#3a3a3c',
                opacity: tempCampus ? 1 : 0.5,
                cursor: tempCampus ? 'pointer' : 'not-allowed',
              }}
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
