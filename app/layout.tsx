import "./globals.css";

import type { ReactNode } from "react";

export const metadata = {
  title: {
    template: "%s | Store",
    default: "Store",
  },
  description: "Documentation for Store — a Kotlin Multiplatform library for reading and writing data.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
