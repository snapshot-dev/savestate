import './globals.css';
import type { Metadata } from 'next';
import '@checkpoint-dev/savestate/styles.css';
import { Theme } from '@radix-ui/themes';
import { RootProvider } from 'fumadocs-ui/provider/next';
import StaticSearchDialog from '@/components/StaticSearchDialog';

export const metadata: Metadata = {
  title: {
    default: 'Save State — Save-state components for React',
    template: '%s — Save State',
  },
  description: 'A focused React component kit for unsaved, saving, saved, offline, and error states.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootProvider search={{ SearchDialog: StaticSearchDialog }}>
          <Theme accentColor="indigo" grayColor="slate" radius="medium">
            {children}
          </Theme>
        </RootProvider>
      </body>
    </html>
  );
}
