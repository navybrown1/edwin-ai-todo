"use client";

import { useEffect, useState } from "react";

export default function Header() {
  const [monthLabel, setMonthLabel] = useState("");

  useEffect(() => {
    const now = new Date();
    setMonthLabel(now.toLocaleString("en-US", { month: "long", year: "numeric" }));
  }, []);

  return (
    <header className="mb-10 animate-fadeDown">
      <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-accent font-dm mb-2">
        {monthLabel}
      </div>
      <h1 className="font-syne text-[clamp(2rem,6vw,3.2rem)] font-extrabold leading-none tracking-tight text-textPrimary">
        {"Edwin's "}
        <span className="text-accent">To-Do</span>
      </h1>
      <p className="text-[13px] text-muted mt-2.5 font-light font-dm">
        Stay on top of everything that matters.
      </p>
    </header>
  );
}
