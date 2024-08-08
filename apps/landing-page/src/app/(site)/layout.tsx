import { ThemeProvider } from 'next-themes';
import { Inter } from 'next/font/google';
import { type ReactNode } from 'react';
import { getLocale, getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Lines from '@/components/Lines';
import ScrollToTop from '@/components/ScrollToTop';
import '../globals.css';
import ToasterContext from '../context/toast-context';

const inter = Inter({ subsets: ['latin'] });

export default async function RootLayout({ children }: { children: React.ReactNode }): Promise<ReactNode> {
  const locale = await getLocale();

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`dark:bg-black ${inter.className}`}>
        <ThemeProvider enableSystem={false} attribute="class" defaultTheme="light">
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
