import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
import { Providers } from "../src/components/providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "EscrowKit — Smart Escrow Engine",
  description: "Trustless milestone-based payments for the future of work. Built on Ethereum.",
  icons: {
    icon: "/escrowkit-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
