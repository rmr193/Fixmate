import type { Metadata } from 'next';
import {
  Plus_Jakarta_Sans,
  Inter,
  JetBrains_Mono,
} from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers/AppProviders';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FixMate — Smart Device & Home Appliance Repair Service Platform',
  description:
    'Book verified technicians for smartphone, laptop, AC, refrigerator, TV, washing machine, and electrical repairs. Track your job live and pay via Stripe only after completion.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
