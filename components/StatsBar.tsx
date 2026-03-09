"use client";

interface StatsBarProps {
  total: number;
  remaining: number;
  done: number;
}

export default function StatsBar({ total, remaining, done }: StatsBarProps) {
  const stats = [
    { num: total,     label: "Total" },
    { num: remaining, label: "Remaining" },
    { num: done,      label: "Done" },
  ];

  return (
    <div className="flex gap-5 mb-8 flex-wrap" style={{ animationDelay: "0.1s" }}>
      {stats.map(({ num, label }) => (
        <div
          key={label}
          className="bg-surface border border-border rounded-[10px] px-5 py-3 flex-1 min-w-[90px] text-center animate-fadeDown"
        >
          <div className="font-syne text-[1.8rem] font-bold text-accent leading-none">{num}</div>
          <div className="text-[10px] tracking-[0.1em] uppercase text-muted mt-1 font-dm">{label}</div>
        </div>
      ))}
    </div>
  );
}
