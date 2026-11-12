import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { BookOpen } from 'lucide-react';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <span>Save State</span>
        </>
      ),
      url: '/',
    },
    links: [
      {
        text: 'Overview',
        url: '/',
        icon: <BookOpen />,
      },
    ],
  };
}
