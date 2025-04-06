import React, { useState, useEffect } from 'react';
import { AppProps } from 'next/app';
import { useEthereum } from '@/contexts/EthereumContext';
import '@/app/globals.css';
import RootLayout from '@/app/layout';
import { EthereumProvider } from '@/contexts/EthereumContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import NavBar from '@/components/NavBar';
import ConditionalContent from '../components/ConditionalContent/ConditionalContent';
import { ContractContextProvider } from '@/contexts/ContractContext';


function LUKSOproject({ Component, pageProps }: AppProps) {
  return (
    <EthereumProvider>
      <NetworkProvider>
        <ProfileProvider>
          <ContractContextProvider>
            <RootLayout>
              <NavBar />
              <ConditionalContent />
            </RootLayout>
          </ContractContextProvider>
        </ProfileProvider>
      </NetworkProvider>
    </EthereumProvider>
  );
}

export default LUKSOproject;
