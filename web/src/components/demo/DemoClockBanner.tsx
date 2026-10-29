import React from 'react';
import { useDemo } from '../../context/DemoContext';
import { Clock, RotateCcw } from 'lucide-react';

export const DemoClockBanner: React.FC = () => {
  const { isShifted, offsetDays, simulatedDate, resetClock } = useDemo();

  if (!isShifted) return null;

  const dateObj = new Date(simulatedDate);
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-amber-500 text-gov-navy-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-sm sticky top-[77px] z-30 border-b border-amber-600">
      <div className="flex items-center space-x-2">
        <Clock className="w-4 h-4 shrink-0 animate-pulse text-gov-navy-900" />
        <span>
          DEMO CLOCK ACTIVE: Simulated System Date is <span className="underline decoration-2">{formattedDate}</span> (+{offsetDays} Days Shifted)
        </span>
        <span className="hidden md:inline font-normal text-gov-navy-800">
          — All maturity triggers, reminders, overdue flags & escalations calculated from this date.
        </span>
      </div>

      <button
        onClick={resetClock}
        className="flex items-center space-x-1 bg-gov-navy-900 hover:bg-gov-navy-800 text-amber-400 px-2.5 py-1 rounded shadow-xs text-xs font-bold transition shrink-0 ml-2"
        title="Reset clock to actual system date"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset Clock</span>
      </button>
    </div>
  );
};
