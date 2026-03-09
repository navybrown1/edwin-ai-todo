"use client";

interface ProgressBarProps {
  pct: number;
}

export default function ProgressBar({ pct }: ProgressBarProps) {
  return (
    <div className="bg-surface border border-border rounded-[10px] px-5 py-4 mb-8 animate-fadeDown">
      <div className="flex justify-between text-[11px] text-muted uppercase tracking-[0.1em] font-dm mb-2.5">
        <span>Progress</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #f0c040, #e87040)",
          }}
        />
      </div>
    </div>
  );
}
