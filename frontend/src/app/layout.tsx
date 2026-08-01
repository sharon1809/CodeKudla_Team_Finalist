import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/Providers';

export const metadata: Metadata = {
  title: 'MedSynexa — AI Clinical Decision Support Copilot',
  description: 'Sub-10-second real-time AI reasoning, differential diagnosis, ICMR/NHP localized treatment, and OCR lab report analysis for Indian hospitals.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#03080f] text-[#f0f6ff] selection:bg-teal-500/30 selection:text-teal-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
