import type { Metadata, Viewport } from "next";
import { Big_Shoulders, JetBrains_Mono, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

const body = Schibsted_Grotesk({ variable: "--font-body", subsets: ["latin"] });
const display = Big_Shoulders({ variable: "--font-display", subsets: ["latin"], axes: ["opsz"] });
const board = JetBrains_Mono({ variable: "--font-board", subsets: ["latin"] });

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "TasteTrip: travel by taste", template: "%s · TasteTrip" },
  description:
    "Tell TasteTrip the artists, films, shows, books and brands you love. It asks Qloo's taste graph where their fans go in your next city and plans the days around it.",
  openGraph: { title: "TasteTrip: travel by taste", description: "City days planned from what you love, powered by Qloo's taste graph.", type: "website", siteName: "TasteTrip" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#2f3cff", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${body.variable} ${display.variable} ${board.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
