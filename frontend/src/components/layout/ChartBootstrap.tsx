"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    __initAppCharts?: () => void;
  }
}

export function ChartBootstrap() {
  const pathname = usePathname();

  useEffect(() => {
    window.__initAppCharts?.();
  }, [pathname]);

  return null;
}