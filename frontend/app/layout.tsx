import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Versatile FinOps',
  description: 'Versatile FinOps - Grounded AI queries, verified financial evidence, and data export powered by the Versatile FinOps backend (Spring AI + MCP Toolbox + PostgreSQL).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}