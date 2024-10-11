import { ThemeProvider } from 'next-themes';
import { Inter } from 'next/font/google';
import { type ReactNode } from 'react';
import { getLocale, getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { GoogleAnalytics } from '@next/third-parties/google';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Lines from '@/components/Lines';
import ScrollToTop from '@/components/ScrollToTop';
import '../globals.css';
import CookiesConsent from '@/components/cookies-consent';
import RB2B from '@/components/rb2b';
import { env } from '@/env.mjs';
import ToasterContext from '../context/toast-context';

const inter = Inter({ subsets: ['latin'] });

export default async function RootLayout({ children }: { children: React.ReactNode }): Promise<ReactNode> {
  const locale = await getLocale();

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <GoogleAnalytics gaId={env.NEXT_PUBLIC_MEASUREMENT_ID} />
      <CookiesConsent />
      <RB2B />
      <body className={`dark:bg-black ${inter.className}`}>
        <ThemeProvider enableSystem attribute="class">
          <NextIntlClientProvider messages={messages}>
            <Lines />
            <Header />
            <ToasterContext />
            {children}
            <Footer />
            <ScrollToTop />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
