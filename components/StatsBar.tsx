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
      borderGlow: "rgb(var(--text-rgb) / 0.12)",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
          <path d="M6 8H14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.25" />
          <path d="M6 11H11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.2" />
        </svg>
      ),
      iconColor: "text-textPrimary/25",
    },
    {
      num: remaining,
      label: "Remaining",
      numColor: "text-accent",
      borderGlow: "rgb(var(--accent-rgb) / 0.30)",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
          <path d="M10 6V10L13 12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.25" />
        </svg>
      ),
      iconColor: "text-accent/35",
    },
    {
      num: done,
      label: "Done",
      numColor: done > 0 ? "text-emerald-400" : "text-muted",
      borderGlow: done > 0 ? "rgba(52,211,153,0.28)" : "rgb(var(--text-rgb) / 0.05)",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
          <path d="M7 10L9.5 12.5L13.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
        </svg>
      ),
      iconColor: done > 0 ? "text-emerald-400/35" : "text-muted/25",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3" style={{ animationDelay: "0.1s" }}>
      {stats.map(({ num, label, numColor, borderGlow, icon, iconColor }) => (
        <div
          key={label}
          className="glass rounded-2xl px-4 py-3.5 text-center animate-fadeDown relative overflow-hidden"
          style={{ borderTopColor: borderGlow, borderTopWidth: "1px", borderTopStyle: "solid" }}
        >
          {/* Subtle top glow */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: `linear-gradient(90deg, transparent, ${borderGlow}, transparent)` }}
          />
          {/* Background icon */}
          <div className={`absolute top-2 right-2.5 ${iconColor}`}>
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
