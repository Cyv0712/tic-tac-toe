import type { Metadata, Viewport } from "next";
import { Caveat, Chakra_Petch, Tilt_Neon } from "next/font/google";
import { THEME_BOOT_SCRIPT } from "@/lib/boot";
import "./globals.css";

// Tilt Neon only appears in the title and the status line, so it stays special.
const display = Tilt_Neon({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Chakra_Petch({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// The Notebook theme swaps the display face for handwriting.
const hand = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tic-Tac-Toe: the neon edition",
  description:
    "Tic-tac-toe on a neon sign. Play a friend or an unbeatable computer, keep score, and switch between neon, notebook and cats-and-dogs looks.",
};

export const viewport: Viewport = {
  themeColor: "#0d0a1e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The boot script sets data-theme before first paint, which React can't
    // know about on the server, so the attribute mismatch is expected.
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${hand.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
