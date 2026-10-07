import React from 'react';
import { Wifi, Battery, Signal, Sparkles } from 'lucide-react';

interface MobileBezelWrapperProps {
  isMobileFrame: boolean;
  children: React.ReactNode;
}

export const MobileBezelWrapper: React.FC<MobileBezelWrapperProps> = ({
  isMobileFrame,
  children,
}) => {
  if (!isMobileFrame) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4 flex flex-col items-center justify-center">
      {/* Device Label */}
      <div className="mb-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>React Native Mobile Viewport (iPhone 16 Pro Max Simulation)</span>
        </div>
      </div>

      {/* Phone Hardware Shell */}
      <div className="relative w-full max-w-[430px] h-[890px] rounded-[52px] bg-black p-3.5 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_0_12px_#18181b,0_0_0_14px_#27272a] border border-white/10 flex flex-col overflow-hidden">
        {/* Top Native Status Bar & Dynamic Island */}
        <div className="relative w-full h-11 shrink-0 bg-transparent flex items-center justify-between px-6 z-50 text-white text-[12px] font-semibold select-none pointer-events-none">
          {/* Time */}
          <span>9:41</span>

          {/* Dynamic Island */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2 w-28 h-6 bg-black rounded-full flex items-center justify-between px-2.5 shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-mono text-amber-400 tracking-wider font-bold">HLS PRO</span>
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-white/20" />
          </div>

          {/* Native Icons */}
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 fill-white" />
          </div>
        </div>

        {/* Scrollable Screen Content */}
        <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar relative rounded-[38px] bg-[#08080a]">
          {children}
        </div>

        {/* Home Bar Indicator at Bottom */}
        <div className="w-full h-4 shrink-0 flex items-center justify-center pointer-events-none bg-transparent pt-1 z-50">
          <div className="w-32 h-1 bg-white/40 rounded-full" />
        </div>
      </div>
    </div>
  );
};
