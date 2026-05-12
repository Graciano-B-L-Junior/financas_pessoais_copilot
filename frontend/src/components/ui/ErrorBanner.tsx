import type { FormErrors } from "@/types";

interface Props {
  errors: FormErrors;
}

export function ErrorBanner({ errors }: Props) {
  const general = errors?.general || [];
  if (!general.length) return null;

  return (
    <div className="error-banner" role="alert">
      {general.map((msg, i) => (
        <p key={i}>{msg}</p>
      ))}
    </div>
  );
}
