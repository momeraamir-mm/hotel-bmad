import type { Metadata } from "next";
import { Inter, Noto_Naskh_Arabic, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], variable: "--font-naskh", display: "swap" });
const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-nastaliq",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Elite Tour House Makkah — AI Reservation Assistant",
  description:
    "AI quotation assistant for Umrah hotel bookings: supplier rates → comparison → multilingual quotations with human approval.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${naskh.variable} ${nastaliq.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
