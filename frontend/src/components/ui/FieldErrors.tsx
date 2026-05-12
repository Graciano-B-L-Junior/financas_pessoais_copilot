import type { FormErrors } from "@/types";

interface Props {
  errors: FormErrors;
  field: string;
}

export function FieldErrors({ errors, field }: Props) {
  const messages = errors?.[field] || [];
  if (!messages.length) return null;

  return (
    <ul className="field-errors" role="alert">
      {messages.map((msg, i) => (
        <li key={i} className="field-error">
          {msg}
        </li>
      ))}
    </ul>
  );
}
