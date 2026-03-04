import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Space_Grotesk({ subsets: ["latin"], variable: "--font-outfit" });
import { Providers } from "../src/components/providers";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "EscrowKit — Smart Escrow Engine",
  description: "Trustless milestone-based payments for the future of work. Built on Ethereum.",
  icons: {
    icon: process.env.NEXT_PUBLIC_DEPLOY_TARGET === "gh-pages" ? "/EscrowKit/escrowkit-logo.png" : "/escrowkit-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cspHeader = `
    default-src 'self' wss: https:;
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline' https:;
    img-src 'self' blob: data: https:;
    font-src 'self' data: https:;
    connect-src 'self' wss: https:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  return (
    <html lang="en" className="dark">
      <head>
        <meta httpEquiv="Content-Security-Policy" content={cspHeader} />
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <TooltipProvider>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </TooltipProvider>
      </body>
    </html>
  );
}
