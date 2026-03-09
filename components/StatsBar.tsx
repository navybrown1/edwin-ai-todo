"use client";

interface StatsBarProps {
  total: number;
  remaining: number;
  done: number;
}

export default function StatsBar({ total, remaining, done }: StatsBarProps) {
  const stats = [
    {
      num: total,
      label: "Total",
      numColor: "text-textPrimary/90",
      borderGlow: "rgba(240,239,232,0.12)",
      icon: "◈",
      iconColor: "text-textPrimary/30",
    },
    {
      num: remaining,
      label: "Remaining",
      numColor: "text-accent",
      borderGlow: "rgba(240,192,64,0.30)",
      icon: "◉",
      iconColor: "text-accent/40",
    },
    {
      num: done,
      label: "Done",
      numColor: done > 0 ? "text-emerald-400" : "text-muted",
      borderGlow: done > 0 ? "rgba(52,211,153,0.28)" : "rgba(255,255,255,0.05)",
      icon: "✓",
      iconColor: done > 0 ? "text-emerald-400/40" : "text-muted/30",
    },
  ];

  return (
    <div className="flex gap-4 mb-8 flex-wrap" style={{ animationDelay: "0.1s" }}>
      {stats.map(({ num, label, numColor, borderGlow, icon, iconColor }) => (
        <div
          key={label}
          className="glass rounded-2xl px-4 py-3.5 flex-1 min-w-[90px] text-center animate-fadeDown relative overflow-hidden"
          style={{ borderTopColor: borderGlow, borderTopWidth: "1px", borderTopStyle: "solid" }}
        >
          {/* Subtle top glow */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: `linear-gradient(90deg, transparent, ${borderGlow}, transparent)` }}
          />
          {/* Background icon */}
          <div className={`absolute top-1.5 right-2.5 text-[1.5rem] font-bold leading-none select-none pointer-events-none ${iconColor}`}>
            {icon}
          </div>
          <div className={`font-syne text-[1.75rem] font-extrabold leading-none ${numColor} relative z-10`}>
            {num}
          </div>
          <div className="text-[10px] tracking-[0.12em] uppercase text-muted mt-1.5 font-dm relative z-10">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
