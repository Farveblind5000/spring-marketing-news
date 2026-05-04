import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Spring Marketing News',
  description: 'AI & marketing intelligence — kurateret hver morgen.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="da" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
