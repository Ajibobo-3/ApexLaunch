import type { Metadata } from "next";
import "./tailwind.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ApexLaunch | Next-Gen Token Launchpad Engine",
  description:
    "Next-gen decentralized token launchpad platform featuring continuous bonding curves, decaying anti-snipe protection, and automated DEX liquidity graduation with permanent LP burn.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
    >
      <body className="min-h-full flex flex-col selection:bg-emerald-500 selection:text-black font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
