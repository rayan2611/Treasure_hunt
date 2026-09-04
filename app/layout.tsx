import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Janmashtami Treasure Hunt",
  description: "A live campus treasure hunt experience."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
