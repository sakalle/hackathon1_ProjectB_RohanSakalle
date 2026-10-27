import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import { Assistant } from "@/components/Assistant";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "A Una Milla — same trip, much less money",
  description: "Check a trip, see the normal price against the hacked price, and book it or follow the steps.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} font-sans antialiased`}>
        <Header />
        {children}
        <Footer />
        <Assistant />
      </body>
    </html>
  );
}
