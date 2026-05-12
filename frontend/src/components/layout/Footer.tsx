import { env } from "@/config/env";

export function Footer() {
  return (
    <p className="footer-note container">
      &copy; {new Date().getFullYear()} {env.appName}
    </p>
  );
}
