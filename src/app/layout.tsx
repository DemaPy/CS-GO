import type { Metadata } from 'next'
import { Archivo } from 'next/font/google'
import './globals.css'

// One family, two widths. The `wdth` axis is what lets headings run at
// expanded 125% while body text stays normal — a deliberate pairing rather
// than the default serif-plus-sans.
const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
  axes: ['wdth'],
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
    <html lang="en" className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
