import React, { useState, useEffect } from 'react';
import { AppProps } from 'next/app';
import { useEthereum } from '@/contexts/EthereumContext';
import '@/app/globals.css';
import RootLayout from '@/app/layout';
import { EthereumProvider } from '@/contexts/EthereumContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import NavBar from '@/components/NavBar';
import SplitRegistrationForm from '@/components/Registeration/SplitRegistrationForm';
import UserDashboard from '@/components/Dashboard/UserDashboard';
import UserRegistryABI from '../../artifacts/contracts/UserRegistry.sol/UserRegistry.json';
import { ethers } from 'ethers';

const ConditionalContent = () => {
  const { account, provider } = useEthereum();
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ role: '', metadataHash: '' });

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (account && provider) {
        try {
          const contract = new ethers.Contract(
            process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
            UserRegistryABI.abi,
            provider
          );
          
          // Use the getUser method from your contract
          const [role, metadataHash] = await contract.getUser(account);
          
          // If role exists/not empty, user is registered
          const userRegistered = role && role.length > 0;
          
          console.log('User role:', role);
          console.log('Registered:', userRegistered);
          
          setIsRegistered(userRegistered);
          setUserData({ role, metadataHash });
        } catch (error) {
          console.error('Registration check error:', error);
          setIsRegistered(false);
        }
      }
      setLoading(false);
    };
    
    checkRegistrationStatus();
  }, [account, provider]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not connected, show a message
  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Please connect your wallet</h2>
          {/* You could add your ConnectButton component here */}
        </div>
      </div>
    );
  }

  // Render based on registration status
  return isRegistered ? <UserDashboard  /> : <SplitRegistrationForm />;
};

/**
 * The root component of this application. It wraps all pages
 * with the context providers and a consistent layout.
 * @param { Component, pageProps } - Current page and its properties.
 */
function LUKSOproject({ Component, pageProps }: AppProps) {
  return (
    <EthereumProvider>
      <NetworkProvider>
        <ProfileProvider>
          <RootLayout>
            <NavBar />
            <ConditionalContent />
          </RootLayout>
        </ProfileProvider>
      </NetworkProvider>
    </EthereumProvider>
  );
}

export default LUKSOproject;


