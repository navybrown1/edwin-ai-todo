"use client";

type Filter = "all" | "active" | "done";

interface FilterTabsProps {
  active: Filter;
  onChange: (f: Filter) => void;
}

export default function FilterTabs({ active, onChange }: FilterTabsProps) {
  const tabs: { value: Filter; label: string }[] = [
    { value: "all",    label: "All" },
    { value: "active", label: "Active" },
    { value: "done",   label: "Done" },
  ];

  return (
    <div className="flex gap-2 mb-6 flex-wrap animate-fadeDown">
      {tabs.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`border rounded-full px-4 py-1.5 text-xs font-dm tracking-[0.03em] transition-all duration-200
            ${active === value
              ? "bg-accent text-bg border-accent font-semibold"
              : "bg-surface border-border text-muted hover:bg-accent hover:text-bg hover:border-accent"
            }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
