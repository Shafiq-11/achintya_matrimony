import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Achintya Matrimony | Personalized Matchmaking Services',
  description:
    'Professional, confidential, and personalized matrimony matchmaking services. Register with us today.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
