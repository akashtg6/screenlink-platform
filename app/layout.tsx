import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ScreenLink.ai — Professional Display Engineering Platform',
    template: '%s · ScreenLink.ai',
  },
  description:
    'ScreenLink.ai helps display manufacturers, AV consultants and system integrators design professional LED and LCD projects — from customer requirements to BOQ and proposals.',
  applicationName: 'ScreenLink.ai',
  authors: [{ name: 'ScreenLink.ai' }],
  keywords: ['LED', 'LCD', 'display engineering', 'AV', 'video wall', 'pixel pitch', 'BOQ', 'proposal'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
