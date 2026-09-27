import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { SITE_TITLE } from '@/content/site'
import { metadataBaseFrom } from '@/lib/site-url'
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
  metadataBase: metadataBaseFrom(process.env.CAPTURE_SITE_URL),
  // The template applies to child routes: /subscribed renders
  // "Address confirmed · Five stages to armed" (C9). Formatting, not copy.
  title: { default: SITE_TITLE, template: `%s · ${SITE_TITLE}` },
  description:
    'A machined field device, assembled as you scroll. Five stages, then it is yours.',
}

// themeColor tints mobile browser chrome and in-app toolbars to the page
// ground. viewportFit=cover lets the safe-area insets in Overlay and Credits
// take effect. No interactive-widget: it does not reach Android in-app
// webviews (D2); the keyboard is handled in code (scroll-freeze).
export const viewport: Viewport = {
  themeColor: '#F5F5F2',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
