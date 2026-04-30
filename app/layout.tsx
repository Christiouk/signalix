import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignalIX | Market Scan Intelligence",
  description:
    "SignalIX scans stocks, indices, commodities and crypto, then compares each scan with the first market read of the day.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
