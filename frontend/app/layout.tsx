import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "llm-selector",
  description: "Find the best LLM runtime and model for your local machine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
