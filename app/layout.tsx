import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "小满的小世界｜温柔的专属早教乐园",
  description: "为 2–3 岁宝宝设计的亲子早教互动网站。每天三个小发现，轻松玩，慢慢长大。",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "小满的小世界",
    description: "每天三个小发现，轻松玩，慢慢长大",
    type: "website",
    locale: "zh_CN",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "小满的小世界早教乐园" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "小满的小世界",
    description: "每天三个小发现，轻松玩，慢慢长大",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
