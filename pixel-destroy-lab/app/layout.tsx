import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "摧毁任意网页 · Pixel Lab",
  description: "像素风网页破坏沙盒：十种武器、飞行、手雷与多人对战。输入公开网址，把整个网页砸个粉碎。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
