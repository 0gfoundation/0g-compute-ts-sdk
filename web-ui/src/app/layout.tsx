import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "../../Providers";
import { Navbar } from "../shared/components/layout/Navbar";
import { Sidebar } from "../shared/components/layout/Sidebar";
import { LayoutContent } from "../shared/components/layout/LayoutContent";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "0G Compute Network Example",
  description: "Web example for 0G Compute Network SDK",
  icons: {
    icon: "/favicon.svg",
  },
};

const LayoutLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  </div>
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen w-full flex-col bg-gray-50">
            <Sidebar />
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
              <Navbar />
              <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <Suspense fallback={<LayoutLoader />}>
                  <LayoutContent>{children}</LayoutContent>
                </Suspense>
              </main>
            </div>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
