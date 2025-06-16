import type { Metadata } from "next";
import { DotGothic16 } from "next/font/google";
import "./globals.css";
import Nav from "@/components/nav";

const dotGothic = DotGothic16({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap"
}) 

export const metadata: Metadata = {
  title: "xsj3n",
  description: "muh blog",
};




export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="en">
      <body className={`${dotGothic.className} antialiased h-screen w-screen`}>
        <Nav/>
        {children}
      </body>
    </html>
  );
}
