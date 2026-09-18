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

export const metadata: Metadata = {
  title: {
    default: 'LaVerdi — Your AI Agent, Always On.',
    template: '%s | LaVerdi',
  },
  description: 'Provision a hosted AI agent in minutes and connect it to Telegram, Discord, or Slack. Pair the optional Companion app when your agent needs to reach your own machine.',
  metadataBase: new URL('https://laverdi.tech'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://laverdi.tech',
    siteName: 'LaVerdi',
    title: 'LaVerdi — Your AI Agent, Always On.',
    description: 'Provision a hosted AI agent in minutes and connect it to Telegram, Discord, or Slack. Pair the optional Companion app when your agent needs to reach your own machine.',
    images: [
      {
        url: 'https://laverdi.tech/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LaVerdi',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LaVerdi — Your AI Agent, Always On.',
    description: 'Provision a hosted AI agent in minutes and connect it to Telegram, Discord, or Slack.',
    images: ['https://laverdi.tech/og-image.png'],
  },
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
