import React from 'react';
import Head from 'next/head';

import { config } from '@/app/config';

/**
 * Defines the basic layout for the application. It includes the
 * global font styling and a consistent layout for all pages.
 *
 * @param children - The pages to be rendered within the layout and header.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <Head>
        <title>ANTI-FAKE</title>
        <meta name="description" content="AntiFake-Certification Verification Platform" />
        <link rel="icon" href="/images/anti_fake.png" sizes="any" />
      </Head>
      <div>{children}</div>
    </div>
  );
}
