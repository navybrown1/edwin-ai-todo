"use client";

function getMotivation(pct: number): string {
  if (pct === 0)   return "Start.";
  if (pct < 20)   return "Keep going.";
  if (pct < 40)   return "You're making real progress.";
  if (pct < 60)   return "Hold the line.";
  if (pct < 80)   return "Finish strong.";
  if (pct < 100)  return "Almost there.";
  return "Clear.";
}

interface ProgressBarProps {
  pct: number;
}

export default function ProgressBar({ pct }: ProgressBarProps) {
  const motivation = getMotivation(pct);

  return (
    <div
      className="glass rounded-2xl px-5 py-3.5 mb-8 animate-fadeDown"
      style={{ animationDelay: "0.12s" }}
    >
      <div className="flex justify-between items-baseline mb-3">
        <span className="text-[11px] tracking-[0.12em] uppercase text-muted font-dm">Progress</span>
        <span className="text-[11px] text-muted font-dm">{motivation}</span>
      </div>

      {/* Bar track */}
      <div className="h-3 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full progress-fill"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, rgb(var(--accent-deep-rgb)), rgb(var(--accent-rgb)), rgb(var(--accent2-rgb)))",
            transition: "width 0.7s cubic-bezier(0.34,1.3,0.64,1)",
            boxShadow: pct > 0 ? "0 0 12px rgba(var(--accent-rgb),0.4)" : "none",
          }}
        />
      </div>

      {/* Percentage label */}
      <div className="flex justify-end mt-2">
        <span
          className="text-[13px] font-syne font-bold"
          style={{
            color: pct === 100 ? "#34d399" : "#f0c040",
            textShadow: pct === 100 ? "0 0 12px rgba(52,211,153,0.5)" : "0 0 10px rgba(var(--accent-rgb),0.4)",
          }}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
}
