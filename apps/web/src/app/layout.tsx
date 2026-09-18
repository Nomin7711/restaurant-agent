import type { Metadata } from "next";
import { Bebas_Neue, Instrument_Sans } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const instrument = Instrument_Sans({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-instrument" });

export const metadata: Metadata = {
  title: "Solane Concierge — MARGOT",
  description: "Late-night neon bistro concierge",
};

const themeInit = `(function(){try{var t=localStorage.getItem("solane-theme");document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark")}catch(e){document.documentElement.setAttribute("data-theme","dark")}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`${bebas.variable} ${instrument.variable}`}>{children}</body>
    </html>
  );
}
