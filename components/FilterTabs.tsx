"use client";

type Filter = "all" | "active" | "done";

interface FilterTabsProps {
  active: Filter;
  onChange: (f: Filter) => void;
}

export default function FilterTabs({ active, onChange }: FilterTabsProps) {
  const tabs: { value: Filter; label: string; dot?: string }[] = [
    { value: "all",    label: "All" },
    { value: "active", label: "Active", dot: "rgb(var(--accent-rgb))" },
    { value: "done",   label: "Done",   dot: "#34d399" },
  ];

  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full border border-border bg-surface2/60 p-1 animate-fadeDown" style={{ animationDelay: "0.15s" }}>
      {tabs.map(({ value, label, dot }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`rounded-full px-4 py-2 text-xs font-dm tracking-[0.04em]
            transition-all duration-200 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35
            ${active === value
              ? "bg-accent text-bg font-semibold shadow-glowSm"
              : "text-muted hover:bg-surface hover:text-textPrimary"
            }`}
        >
          {dot && active !== value && (
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: dot, opacity: 0.6 }}
            />
          )}
          {label}
        </button>
      ))}
    </div>
  );
}
