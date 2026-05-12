interface Props {
  flash: { type: string; message: string } | null;
}

export function Flash({ flash }: Props) {
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
