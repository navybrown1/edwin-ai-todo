"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  show: boolean;
  type?: "success" | "error" | "ai";
}

export default function Toast({ message, show, type = "success" }: ToastProps) {
  const colors = {
    success: "bg-[#1e2e1e] border-[#3a7a3a] text-[#7adc7a]",
    error: "bg-[#2e1e1e] border-[#7a3a3a] text-[#dc7a7a]",
    ai: "bg-[#1e1a0e] border-[#7a6020] text-[#f0c040]",
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 border rounded-lg px-4 py-2.5 text-xs font-dm
        transition-all duration-300 pointer-events-none
        ${colors[type]}
        ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
    >
      {message}
    </div>
  );
}
