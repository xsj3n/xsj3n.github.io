import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/nav";
import { sfMono } from "@/components/fonts";

export const metadata: Metadata = {
  title: "xsj3n",
  icons: {
    icon: [{ url: "/favicon.png"}]
  },
  description: "muh blog",
};


export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {

  return (
    <html lang="en" className="dark min-h-screen m-0 p-0">
      <body className={`${sfMono.className} bg-background dark:bg-dark-background antialiased flex min-h-screen w-full m-0 p-0`}>
        <Nav>{children}</Nav>
      </body>
    </html>
  );
}

