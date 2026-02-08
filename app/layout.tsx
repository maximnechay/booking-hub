import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bookinghub.de";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "BookingHub - Online-Terminbuchung für Dienstleister",
    template: "%s | BookingHub",
  },
  description:
    "Das moderne Buchungssystem für Dienstleister. Lassen Sie Ihre Kunden Termine online buchen und sparen Sie Zeit.",
  keywords: [
    "Online-Terminbuchung",
    "Buchungssystem",
    "Terminplaner",
    "Dienstleister",
    "Friseur",
    "Kosmetik",
    "Salon",
    "Booking",
  ],
  authors: [{ name: "BookingHub" }],
  creator: "BookingHub",
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "BookingHub",
    title: "BookingHub - Online-Terminbuchung für Dienstleister",
    description:
      "Das moderne Buchungssystem für Dienstleister. Lassen Sie Ihre Kunden Termine online buchen und sparen Sie Zeit.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BookingHub - Online-Terminbuchung",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BookingHub - Online-Terminbuchung für Dienstleister",
    description:
      "Das moderne Buchungssystem für Dienstleister. Lassen Sie Ihre Kunden Termine online buchen und sparen Sie Zeit.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    title: "Booking",
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
