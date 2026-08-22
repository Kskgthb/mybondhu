import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
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
  const [tempCampus, setTempCampus] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!isCampusMode) {
      // Turning ON — show campus picker popup
      setTempCampus(selectedCampus);
      setShowPopup(true);
    } else {
      // Turning OFF — go back to Outside
      setIsCampusMode(false);
      setShowPopup(false);
      onModeChange?.(false, null);
    }
  };

  const handleApply = () => {
    if (tempCampus) {
      setSelectedCampus(tempCampus);
      setIsCampusMode(true);
      setShowPopup(false);
      onModeChange?.(true, tempCampus);
    }
  };

  const handleClose = () => {
    setShowPopup(false);
    // If user closes without selecting, keep toggle off
    if (!isCampusMode) {
      setIsCampusMode(false);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative flex flex-col items-end', className)}>

      {/* ── CAMPUS label + toggle pill ── */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex flex-col items-center gap-0.5 focus:outline-none"
        aria-label="Campus mode toggle"
      >
        {/* "CAMPUS" label — exactly like "VEG" in reference */}
        <span
          className="text-[11px] font-extrabold tracking-widest"
          style={{ color: isCampusMode ? '#2fbe6b' : '#64748b' }}
        >
          CAMPUS
        </span>

        {/* Pill toggle switch */}
        <div
          className="relative w-12 h-6 rounded-full transition-colors duration-300 flex items-center"
          style={{
            background: isCampusMode
              ? '#2fbe6b'
              : '#94a3b8',
          }}
        >
          {/* Thumb */}
          <div
            className="absolute w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300"
            style={{
              left: isCampusMode ? 'calc(100% - 22px)' : '2px',
            }}
          />
        </div>
      </button>

      {/* ── Popup card (appears below toggle) ── */}
      {showPopup && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleClose}
          />

          {/* The dark popup card */}
          <div
            className="absolute top-[calc(100%+10px)] right-0 z-50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              background: '#1c1c1e',
              width: 'min(320px, calc(100vw - 32px))',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
              <p className="text-white text-[17px] font-bold">Select your campus</p>
            </div>

            {/* Campus options */}
            <div className="px-5 pb-3">
              <RadioGroup
                value={tempCampus || ''}
                onValueChange={setTempCampus}
                className="space-y-2"
              >
                {CAMPUSES.map((campus) => (
                  <div
                    key={campus.id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all duration-150',
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
                      className="text-[13px] font-medium text-white cursor-pointer leading-snug"
                    >
                      {campus.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Apply button */}
            <div className="px-5 pb-5 pt-2">
              <Button
                className="w-full rounded-xl py-5 text-[15px] font-bold text-white transition-opacity"
                style={{
                  background: '#2fbe6b',
                  opacity: tempCampus ? 1 : 0.45,
                  cursor: tempCampus ? 'pointer' : 'not-allowed',
                }}
                disabled={!tempCampus}
                onClick={handleApply}
              >
                Apply
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
