import type { Metadata } from "next";
import "./globals.css";
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
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
