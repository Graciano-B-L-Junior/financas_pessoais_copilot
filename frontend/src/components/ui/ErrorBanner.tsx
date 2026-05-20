import type { FormErrors } from "@/types";

interface Props {
  errors: FormErrors;
}

export function ErrorBanner({ errors }: Props) {
  const general = errors?.general || [];
  if (!general.length) return null;

  return (
    <div className="error-banner" role="alert" aria-live="assertive">
      <strong style={{ display: "block", marginBottom: "0.5rem" }}>
        Erros encontrados:
      </strong>
      {general.map((msg, i) => (
        <p key={i} style={{ margin: "0.25rem 0" }}>
          {msg}
        </p>
      ))}
    </div>
  );
}
