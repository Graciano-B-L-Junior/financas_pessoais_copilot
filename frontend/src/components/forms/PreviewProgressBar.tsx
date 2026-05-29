"use client";

import { useEffect, useRef, useState } from "react";

export function PreviewProgressBar({ label = "Analisando arquivo..." }: { label?: string }) {
  const [percent, setPercent] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Simula progresso até 90% enquanto a análise ocorre
    intervalRef.current = window.setInterval(() => {
      setPercent((p) => Math.min(90, p + Math.floor(Math.random() * 6) + 1));
    }, 300);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="progress-container" role="status" aria-live="polite">
      <div className="progress-header">
        <span className="progress-title">{label}</span>
        <span className="progress-percent">{percent}%</span>
      </div>

      <div className="progress-track" aria-hidden="true">
        <div
          className={`progress-fill`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
