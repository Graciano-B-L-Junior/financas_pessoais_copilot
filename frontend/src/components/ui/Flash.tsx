"use client";

import { useEffect, useRef } from "react";
import { clearFlashAction } from "@/app/actions/flash";

interface Props {
  flash: { type: string; message: string } | null;
}

export function Flash({ flash }: Props) {
  const didClear = useRef(false);

  useEffect(() => {
    if (!flash || didClear.current) return;
    didClear.current = true;
    void clearFlashAction();
  }, [flash]);

  if (!flash) return null;

  const typeClass =
    flash.type === "success"
      ? "flash--success"
      : flash.type === "warning"
        ? "flash--warning"
        : flash.type === "danger"
          ? "flash--danger"
          : "flash--info";

  return (
    <div className={`flash ${typeClass}`} role="status">
      {flash.message}
    </div>
  );
}
