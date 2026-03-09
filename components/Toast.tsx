"use client";

interface ToastProps {
  message: string;
  show: boolean;
  type?: "success" | "error" | "ai";
}

export default function Toast({ message, show, type = "success" }: ToastProps) {
  const styles = {
    success: {
      bg:     "rgba(16,24,16,0.95)",
      border: "rgba(52,211,153,0.35)",
      text:   "#34d399",
      glow:   "0 0 20px rgba(52,211,153,0.15)",
      icon:   "✓",
    },
    error: {
      bg:     "rgba(24,12,12,0.95)",
      border: "rgba(239,68,68,0.35)",
      text:   "#f87171",
      glow:   "0 0 20px rgba(239,68,68,0.12)",
      icon:   "✕",
    },
    ai: {
      bg:     "rgba(16,14,8,0.95)",
      border: "rgba(var(--accent-rgb),0.35)",
      text:   "rgb(var(--accent-rgb))",
      glow:   "0 0 20px rgba(var(--accent-rgb),0.15)",
      icon:   "✦",
    },
  };

  const s = styles[type];

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-2.5 text-xs font-dm
        flex items-center gap-2 pointer-events-none backdrop-blur-xl
        transition-all duration-300
        ${show ? "opacity-100 translate-x-0 translate-y-0 toast-enter" : "opacity-0 translate-x-3 translate-y-1"}
      `}
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        boxShadow: `${s.glow}, 0 4px 20px rgba(0,0,0,0.5)`,
      }}
    >
      <span style={{ color: s.text }}>{s.icon}</span>
      <span style={{ color: s.text }}>{message}</span>
    </div>
  );
}
