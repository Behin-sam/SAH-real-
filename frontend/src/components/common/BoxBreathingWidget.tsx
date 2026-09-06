import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Wind, Heart } from 'lucide-react';

interface BoxBreathingWidgetProps {
  onComplete?: () => void;
  compact?: boolean;
}

type Phase = 'Inhale' | 'Hold (Full)' | 'Exhale' | 'Hold (Empty)';

const PHASES: { name: Phase; duration: number; instruction: string; scale: string; color: string }[] = [
  { name: 'Inhale', duration: 4, instruction: 'Breathe in slowly through your nose...', scale: 'scale-125', color: '#D96B27' },
  { name: 'Hold (Full)', duration: 4, instruction: 'Keep lungs full. Stay relaxed and steady...', scale: 'scale-125', color: '#8C4A1E' },
  { name: 'Exhale', duration: 4, instruction: 'Release breath gently through your mouth...', scale: 'scale-90', color: '#2A5C43' },
  { name: 'Hold (Empty)', duration: 4, instruction: 'Rest empty. Feel your feet on the ground...', scale: 'scale-90', color: '#1C1917' },
];

export const BoxBreathingWidget: React.FC<BoxBreathingWidgetProps> = ({ onComplete, compact = false }) => {
  const [isActive, setIsActive] = useState<boolean>(true);
  const [phaseIndex, setPhaseIndex] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(4);
  const [completedCycles, setCompletedCycles] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentPhase = PHASES[phaseIndex];

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Advance phase
          setPhaseIndex((currIdx) => {
            const nextIdx = (currIdx + 1) % PHASES.length;
            if (nextIdx === 0) {
              setCompletedCycles((c) => {
                const nextC = c + 1;
                if (nextC >= 4 && onComplete) {
                  onComplete();
                }
                return nextC;
              });
            }
            return nextIdx;
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, onComplete]);

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setPhaseIndex(0);
    setSecondsRemaining(4);
    setCompletedCycles(0);
  };

  return (
    <div className={`flex flex-col items-center justify-center ${compact ? 'p-3' : 'p-6'} bg-[#FDF6EE] border border-[#E8DCCE] rounded-3xl text-center space-y-4 shadow-sm w-full select-none`}>
      {/* Header Info */}
      <div className="flex items-center justify-between w-full px-2">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-[#D96B27] animate-pulse" />
          <span className="text-xs font-bold text-[#1C1917] tracking-wider uppercase">
            Box Breathing 4×4×4×4
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-[#E8DCCE] text-[11px] font-semibold text-[#786F68]">
          <Heart className="w-3.5 h-3.5 text-[#D96B27]" />
          <span>Cycles: <strong className="text-[#1C1917]">{completedCycles}</strong></span>
        </div>
      </div>

      {/* Visual Guided Circle Animation */}
      <div className="relative flex items-center justify-center my-2 w-48 h-48">
        {/* Outer ring */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-dashed border-[#D96B27]/40 transition-transform duration-[4000ms] ease-in-out ${
            isActive && (phaseIndex === 0 || phaseIndex === 1) ? 'scale-110 opacity-100' : 'scale-90 opacity-40'
          }`}
        />

        {/* Dynamic expanding / contracting central breathing sphere */}
        <div
          style={{ backgroundColor: currentPhase.color }}
          className={`w-36 h-36 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all duration-[3800ms] ease-in-out ${
            isActive ? currentPhase.scale : 'scale-100'
          }`}
        >
          <span className="text-3xl font-black font-mono tracking-tight">{secondsRemaining}</span>
          <span className="text-xs font-bold tracking-wide uppercase mt-1 px-2 py-0.5 bg-black/20 rounded-full">
            {currentPhase.name}
          </span>
        </div>
      </div>

      {/* Instructions cue */}
      <div className="space-y-1 max-w-sm">
        <p className="text-xs font-bold text-[#1C1917] transition-all min-h-[20px]">
          {currentPhase.instruction}
        </p>
        <p className="text-[11px] text-[#786F68]">
          Square breathing reduces nervous tension, balances heart-rate variability, and restores operational focus.
        </p>
      </div>

      {/* Control buttons */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleToggle}
          type="button"
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] text-white text-xs font-bold transition-all shadow-rust hover:scale-[1.02]"
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4" /> Pause Guide
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Resume Guide
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          type="button"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#F5EBE1] border border-[#E8DCCE] text-[#786F68] hover:text-[#1C1917] text-xs font-semibold transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>
    </div>
  );
};
