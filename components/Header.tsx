"use client";

import { useEffect, useState } from "react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning, Edwin";
  if (h < 18) return "Good afternoon, Edwin";
  return "Good evening, Edwin";
}

export default function Header() {
  const [monthLabel, setMonthLabel] = useState("");
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const now = new Date();
    setMonthLabel(now.toLocaleString("en-US", { month: "long", year: "numeric" }));
    setGreeting(getGreeting());
  }, []);

  return (
    <header className="mb-10 animate-fadeDown">
      <div className="text-[10px] font-medium tracking-[0.28em] uppercase text-accent/60 font-dm mb-3">
        {monthLabel}
      </div>
      <h1 className="font-syne text-[clamp(2rem,6vw,3.2rem)] font-extrabold leading-none tracking-tight text-textPrimary">
        {"Edwin's "}
        <span className="gradient-text">To-Do</span>
      </h1>
      <p className="text-[13px] mt-3.5 font-dm leading-relaxed">
        {greeting && (
          <span className="text-textPrimary/55">{greeting}.</span>
        )}{" "}
        <span className="text-muted">Here&apos;s what needs your attention.</span>
      </p>
    </header>
  );
}
