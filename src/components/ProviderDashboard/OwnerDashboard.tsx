import React, { useState, useEffect } from 'react';
import { useContractContext } from '@/contexts/ContractContext';
import { useEthereum } from '@/contexts/EthereumContext';
import { RegisteredUser } from '@/contexts/ContractContext';
import { ethers } from 'ethers';

const OwnerDashboard = () => {
  const { account } = useEthereum();
  const {
    authorizeInstitute,
    certificateNFTAddress,
    fetchPendingProviders,
    fetchProviderMetadata,
    checkInstituteAuthorization,
  } = useContractContext();
  
  const [pendingProviders, setPendingProviders] = useState<RegisteredUser[]>([]);
  const [providerMetadata, setProviderMetadata] = useState<{ [key: string]: any }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentProcessingAddress, setCurrentProcessingAddress] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!account) return;
      
      setIsLoading(true);
      try {
        const providers = await fetchPendingProviders();
        setPendingProviders(providers);

        const metadata: { [key: string]: any } = {};
        await Promise.all(
          providers.map(async (provider) => {
            try {
              metadata[provider.address] = await fetchProviderMetadata(provider.address);
            } catch (error) {
              console.error(`Error loading metadata for ${provider.address}:`, error);
              metadata[provider.address] = null;
            }
          })
        );
        setProviderMetadata(metadata);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setMessage('Failed to load dashboard data');
      }
      setIsLoading(false);
    };

    loadData();
  }, [account, message]);

  const handleAuthorize = async (providerAddress: string) => {
    if (!providerAddress || !ethers.isAddress(providerAddress)) {
      setMessage('Invalid provider address');
      return;
    }

    try {
      setIsLoading(true);
      setCurrentProcessingAddress(providerAddress);
      setMessage('');

      const isAuthorized = await checkInstituteAuthorization(providerAddress);
      if (isAuthorized) {
        throw new Error('Provider is already authorized');
      }

      await authorizeInstitute(providerAddress);
      setMessage(`${providerAddress} successfully authorized`);
      
      // Refresh the list after successful authorization
      const updatedProviders = await fetchPendingProviders();
      setPendingProviders(updatedProviders);
    } catch (error) {
      console.error('Authorization error:', error);
      setMessage(error instanceof Error ? error.message : 'Authorization failed');
    } finally {
      setIsLoading(false);
      setCurrentProcessingAddress(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Certification Management Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Manage institution authorizations and system configurations
            </p>
          </div>

          {/* Pending Authorizations Card */}
          <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800">
                Pending Institution Requests
              </h2>
            </div>

            <div className="px-6 py-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading institution requests...</p>
                </div>
              ) : pendingProviders.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">No pending authorization requests</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {pendingProviders.map((provider) => {
                    const metadata = providerMetadata[provider.address];
                    return (
                      <div key={provider.address} className="py-4 flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900">
                            {metadata?.institutionName || 'Unknown Institution'}
                          </h3>
                          <p className="text-sm text-gray-500 break-all mt-1">
                            {provider.address}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            {metadata?.accreditationNumber || 'No accreditation number provided'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAuthorize(provider.address)}
                          disabled={isLoading}
                          className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {currentProcessingAddress === provider.address ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                {/* ... spinner SVG ... */}
                              </svg>
                              Processing...
                            </>
                          ) : (
                            'Authorize'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {message && (
                <div className={`mt-4 p-4 rounded-lg ${
                  message.includes('successfully') ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <p className={`text-sm ${
                    message.includes('successfully') ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {message}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Contract Info Section */}
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800">Contract Information</h2>
            </div>
            <div className="px-6 py-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-600">Contract Address</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono break-all">
                  {certificateNFTAddress}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Network</dt>
                <dd className="mt-1 text-sm text-gray-900">Ethereum Mainnet</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Contract Owner</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono break-all">
                  {account || 'Not connected'}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;