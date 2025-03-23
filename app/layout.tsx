import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import Nav from "../components/Nav";

import { Noto_Sans_SC } from "next/font/google";

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${notoSansSC.className} antialiased`}>
        <Nav />
        <div className="container mx-auto">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
