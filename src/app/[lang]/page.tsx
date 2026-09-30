import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Experience } from '@/components/Experience'
import { getPageCopy } from '@/content/copy'
import { isLocale, localizedPath } from '@/i18n/locales'

export async function generateMetadata({ params }: PageProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return {
    alternates: {
      canonical: localizedPath(lang, '/'),
      languages: { en: localizedPath('en', '/'), ru: localizedPath('ru', '/'), 'x-default': '/' },
    },
  }
}

export default async function Home({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return <Experience copy={getPageCopy(lang)} locale={lang} />
}
