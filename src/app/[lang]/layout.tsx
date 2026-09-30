import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { notFound } from 'next/navigation'

import { getCopy } from '@/content/copy'
import { isLocale, LOCALES } from '@/i18n/locales'
import { metadataBaseFrom } from '@/lib/site-url'
import '../globals.css'

// Geist for everything, Geist Mono for the stage label and credits. Normal
// width only: the old 125% `wdth` stretch is what read as military. Cyrillic
// for Russian; next/font serves subsets by unicode-range, so English visitors
// never download it.
const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
})

/** Every page exists once per locale; anything else under [lang] is a 404. */
export const dynamicParams = false

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const { meta } = getCopy(lang)
  return {
    metadataBase: metadataBaseFrom(process.env.CAPTURE_SITE_URL),
    // The template applies to child routes: /subscribed renders
    // "Address confirmed · Plant it. Defuse it. Wake up." (C9).
    title: { default: meta.title, template: `%s · ${meta.title}` },
    description: meta.description,
  }
}

// themeColor tints mobile browser chrome and in-app toolbars to the page
// ground. viewportFit=cover lets the safe-area insets in Overlay and Credits
// take effect. No interactive-widget: it does not reach Android in-app
// webviews (D2); the keyboard is handled in code (scroll-freeze).
export const viewport: Viewport = {
  themeColor: '#F5F5F2',
  viewportFit: 'cover',
}

/**
 * The root layout, one per locale. Public URLs are mapped onto `[lang]` by
 * `src/proxy.ts`: English is served unprefixed, Russian under /ru.
 */
export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return (
    <html lang={lang} className={`${geist.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
