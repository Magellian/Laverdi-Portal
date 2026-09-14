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
    default: 'LaVerdi — Your AI Agent. Your Computer.',
    template: '%s | LaVerdi',
  },
  description: 'Do what ChatGPT can\'t — clean your files, build apps, automate your desktop. Free desktop AI agent + cloud hosting. No signup required for the desktop app.',
  metadataBase: new URL('https://laverdi.tech'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://laverdi.tech',
    siteName: 'LaVerdi',
    title: 'LaVerdi — Your AI Agent. Your Computer.',
    description: 'Do what ChatGPT can\'t — clean your files, build apps, automate your desktop. Free desktop AI agent + cloud hosting.',
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
    title: 'LaVerdi — Your AI Agent. Your Computer.',
    description: 'Do what ChatGPT can\'t — clean your files, build apps, automate your desktop. Free desktop app.',
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
