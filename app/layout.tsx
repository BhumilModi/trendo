import type { Metadata, Viewport } from "next";
import "./globals.css";
import Desk from "@/components/Desk";

export const metadata: Metadata = {
  title: "Trendo · tech news, caught up daily",
  description: "Five tech stories a day in plain English. Read them, keep your streak, climb the board.",
};

export const viewport: Viewport = {
  themeColor: "#f1e7b4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Desk />
        {children}
      </body>
    </html>
  );
}
