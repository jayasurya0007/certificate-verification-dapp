import React from 'react';
import { AppProps } from 'next/app';

import '@/app/globals.css';
import RootLayout from '@/app/layout';
import { EthereumProvider } from '@/contexts/EthereumContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import NavBar from '@/components/NavBar';
import ProfilePreview from '@/components/ProfilePreview';
import ProviderSwitcher from '@/components/ProviderSwitcher';
import ConnectButton from '@/components/ConnectButton';
import { useEthereum } from '@/contexts/EthereumContext';
import AccountDisplay from '@/components/AccountDisplay';
// app/register/page.tsx
import RoleSelection from '@/components/Registeration/RForm';

export function RegisterPage() {
  return <RoleSelection />;
}
/**
 * The root component of this application. It wraps all pages
 * with the context providers and a consistent layout.

 * @param { Component, pageProps } - Current page and its properties.
 */
function LUKSOproject({ Component, pageProps }: AppProps) {
  const { account } = useEthereum();
  return (
    <EthereumProvider>
      {/* <NetworkProvider>
        <ProfileProvider>
          <RootLayout>
            <NavBar />
            <Component {...pageProps} />
          </RootLayout>
        </ProfileProvider>
      </NetworkProvider>  */}
      <NavBar />
      <RegisterPage />
    </EthereumProvider>
     
  );
}

export default LUKSOproject;
