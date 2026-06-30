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
    default: 'LaVerdi — Your Personal AI Agent',
    template: '%s | LaVerdi',
  },
  description: 'Host your own AI agent. Connect Telegram, Discord, Slack. Your data, your rules.',
  metadataBase: new URL('https://laverdi.tech'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://laverdi.tech',
    siteName: 'LaVerdi',
    title: 'LaVerdi — Your Personal AI Agent',
    description: 'Host your own AI agent. Connect Telegram, Discord, Slack. Your data, your rules.',
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
    title: 'LaVerdi — Your Personal AI Agent',
    description: 'Host your own AI agent. Connect Telegram, Discord, Slack.',
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
