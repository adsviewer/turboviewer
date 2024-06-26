import './globals.scss';

export const metadata = {
  title: 'Main',
  description: 'I have followed setup instructions carefully',
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <html lang="en-gb">
      <body>{children}</body>
    </html>
  );
}
