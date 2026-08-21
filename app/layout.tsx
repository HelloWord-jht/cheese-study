import type { Metadata } from "next";
import "./globals.css";
import PwaRegister from "./pwa-register";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  applicationName: "小满的小世界",
  title: "小满的小世界｜三岁语数英启蒙乐园",
  description: "为三岁孩子设计的语文、数学、英语亲子启蒙网站。每天三个小任务，轻松玩，慢慢长大。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "小满的小世界",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "小满的小世界",
    description: "每天三个语数英小任务，轻松玩，慢慢长大",
    type: "website",
    locale: "zh_CN",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "小满的小世界早教乐园" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "小满的小世界",
    description: "每天三个语数英小任务，轻松玩，慢慢长大",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
