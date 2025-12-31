import type { Metadata } from "next";
import ErrorBoundary from "../components/ErrorBoundary";
import { StorageInitializer } from "../components/StorageInitializer";

export const metadata: Metadata = {
  title: "Teamly - Team Communication",
  description: "Professional team communication platform",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <StorageInitializer />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
