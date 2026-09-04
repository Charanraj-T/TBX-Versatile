import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TBX FinOps Assistant',
  description: 'AI-Powered Financial Operations Assistant with Google MCP Toolbox & Spring AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

