"use client";

type Filter = "all" | "active" | "done";

interface FilterTabsProps {
  active: Filter;
  onChange: (f: Filter) => void;
}

export default function FilterTabs({ active, onChange }: FilterTabsProps) {
  const tabs: { value: Filter; label: string; dot?: string }[] = [
    { value: "all",    label: "All" },
    { value: "active", label: "Active", dot: "#f0c040" },
    { value: "done",   label: "Done",   dot: "#34d399" },
  ];

  return (
    <div className="flex gap-2 mb-6 flex-wrap animate-fadeDown" style={{ animationDelay: "0.15s" }}>
      {tabs.map(({ value, label, dot }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`border rounded-full px-4 py-1.5 text-xs font-dm tracking-[0.04em]
            transition-all duration-200 flex items-center gap-1.5
            ${active === value
              ? "bg-accent text-bg border-accent font-semibold shadow-glowSm"
              : "glass-subtle text-muted hover:text-textPrimary hover:border-[rgba(255,255,255,0.15)] hover:-translate-y-[1px]"
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
