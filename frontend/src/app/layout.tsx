import type { Metadata } from "next";
import Script from "next/script";
import { env } from "@/config/env";
import "./globals.css";

export const metadata: Metadata = {
  description: `${env.appName} - módulo web para finanças pessoais.`,
  title: { default: env.appName, template: `%s · ${env.appName}` },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <Script
          src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        {children}
        <Script src="/js/app.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
