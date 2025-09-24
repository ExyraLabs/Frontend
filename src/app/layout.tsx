import FloatingGainButton from "@/components/FloatingGainButton";
import { Toaster } from "react-hot-toast";
import Header from "@/components/Header";
import WalletProvider from "@/components/providers/WalletProvider";
import Sidebar from "@/components/Sidebar";
import ReduxProviders from "@/components/ReduxProviders";
import VConsole from "@/components/VConsole";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cerebrum.exyra.ai"),

  title: "The Engine Behind Autonomous Execution",
  description:
    "Build powerful AI agents visually with Fraktia's no-code flow builder",
  openGraph: {
    title: "The Engine Behind Autonomous Execution",
    description:
      "Exyra is a modular AI-native protocol designed to decode and automate Web3 finance. By leveraging autonomous logic layers called Insight Nodes, Exyra helps users identify, customize and act on blockchain-based financial strategies in real time.",
    images: "https://cerebrum.exyra.ai/opengraph-image.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie");
  return (
    <html lang="en">
      <body style={inter.style} className={` antialiased`}>
        <ReduxProviders>
          <WalletProvider cookies={cookies}>
            <div className="w-full gap-[20px] flex h-screen ">
              <div className="hidden lg:flex  lg:w-[20%] flex-col">
                <Sidebar />
              </div>
              <div className="flex overflow-y-clip  flex-col flex-1">
                <Header />
                {children}
              </div>
              <FloatingGainButton />
            </div>
          </WalletProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#262727",
                color: "#fff",
                fontSize: "14px",
                borderRadius: "10px",
                border: "1px solid #3A3B3B",
              },
              success: { iconTheme: { primary: "#10B981", secondary: "#fff" } },
              error: { iconTheme: { primary: "#EF4444", secondary: "#fff" } },
            }}
          />
          <VConsole />
        </ReduxProviders>
      </body>
    </html>
  );
}
