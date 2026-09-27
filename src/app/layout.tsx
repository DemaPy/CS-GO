import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

// Geist for everything, Geist Mono for the stage label and credits. Normal
// width only: the old 125% `wdth` stretch is what read as military.
const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  // TODO(copy): replace once product name and price are confirmed.
  title: 'Five stages to armed',
  description:
    'A machined field device, assembled as you scroll. Five stages, then it is yours.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
