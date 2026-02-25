import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Revenue Friction Snapshot | ARPI',
  description:
    'Identify conversion friction across speed, funnel flow, and tracking before scaling paid traffic.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Revenue Friction Snapshot | ARPI',
    description:
      'Identify conversion friction across speed, funnel flow, and tracking.',
    siteName: 'ARPI',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-background text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
