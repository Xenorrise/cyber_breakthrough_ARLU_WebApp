import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'LONG LIVE MODELS // God Panel',
  description: 'Наблюдайте и управляйте автономными AI-агентами в реальном времени',
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} font-mono antialiased overflow-hidden`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
