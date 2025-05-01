import React, { useState, useEffect } from 'react';
import { useContractContext } from '@/contexts/ContractContext';
import { useEthereum } from '@/contexts/EthereumContext';
import { RegisteredUser } from '@/contexts/ContractContext';
import { ethers } from 'ethers';
import { FiFile, FiExternalLink, FiSearch } from 'react-icons/fi';

const OwnerDashboard = () => {
  const { account } = useEthereum();
  const {
    authorizeInstitute,
    revokeInstitute,
    certificateNFTAddress,
    fetchPendingProviders,
    fetchAuthorizedProviders,
    fetchProviderMetadata,
    checkInstituteAuthorization,
  } = useContractContext();
  
  const [pendingProviders, setPendingProviders] = useState<RegisteredUser[]>([]);
  const [authorizedProviders, setAuthorizedProviders] = useState<RegisteredUser[]>([]);
  const [providerMetadata, setProviderMetadata] = useState<{ [key: string]: any }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentProcessingAddress, setCurrentProcessingAddress] = useState<string | null>(null);
  const [searchPending, setSearchPending] = useState('');
  const [searchAuthorized, setSearchAuthorized] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!account) return;
      
      setIsLoading(true);
      try {
        const [pending, authorized] = await Promise.all([
          fetchPendingProviders(),
          fetchAuthorizedProviders()
        ]);

        setPendingProviders(pending);
        setAuthorizedProviders(authorized);

        const allProviders = [...pending, ...authorized];
        const metadata: { [key: string]: any } = {};
        
        await Promise.all(
          allProviders.map(async (provider) => {
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

  const handleAuthorization = async (providerAddress: string, action: 'authorize' | 'revoke') => {
    // ... existing handleAuthorization implementation ... 
  };

  const filterProviders = (providers: RegisteredUser[], searchTerm: string) => {
    const lowerTerm = searchTerm.toLowerCase();
    return providers.filter(provider => {
      const metadata = providerMetadata[provider.address] || {};
      return (
        metadata.institutionName?.toLowerCase().includes(lowerTerm) ||
        provider.address.toLowerCase().includes(lowerTerm)
      );
    });
  };

  const renderSearchInput = (value: string, onChange: (val: string) => void) => (
    <div className="mb-4 relative">
      <div className="absolute left-3 top-3.5 text-gray-400">
        <FiSearch className="h-5 w-5" />
      </div>
      <input
        type="text"
        placeholder="Search by name or address..."
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );

  const renderProviderCard = (provider: RegisteredUser, isAuthorized: boolean) => {
    const metadata = providerMetadata[provider.address] || {};
    return (
      <div key={provider.address} className="py-4 flex flex-col sm:flex-row items-start justify-between border-b last:border-0">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900">
            {metadata.institutionName || 'Unknown Institution'}
          </h3>
          <p className="text-sm text-gray-500 break-all mt-1">
            {provider.address}
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">
              Accreditation #: {metadata.accreditationNumber || 'N/A'}
            </p>
            {metadata.documentCid && (
              <a
                href={`https://ipfs.io/ipfs/${metadata.documentCid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:underline text-sm"
              >
                <FiFile className="mr-1" />
                View Accreditation Document
                <FiExternalLink className="ml-1 text-xs" />
              </a>
            )}
          </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4 flex flex-col gap-2">
          {isAuthorized ? (
            <button
              onClick={() => handleAuthorization(provider.address, 'revoke')}
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {currentProcessingAddress === provider.address ? 'Processing...' : 'Revoke'}
            </button>
          ) : (
            <button
              onClick={() => handleAuthorization(provider.address, 'authorize')}
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {currentProcessingAddress === provider.address ? 'Processing...' : 'Authorize'}
            </button>
          )}
        </div>
      </div>
    );
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
              {renderSearchInput(searchPending, setSearchPending)}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading institution requests...</p>
                </div>
              ) : filterProviders(pendingProviders, searchPending).length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">
                    {searchPending ? 'No matching requests found' : 'No pending authorization requests'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filterProviders(pendingProviders, searchPending).map(provider => 
                    renderProviderCard(provider, false)
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Authorized Providers Card */}
          <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800">
                Authorized Institutions
              </h2>
            </div>
            <div className="px-6 py-4">
              {renderSearchInput(searchAuthorized, setSearchAuthorized)}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading authorized institutions...</p>
                </div>
              ) : filterProviders(authorizedProviders, searchAuthorized).length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">
                    {searchAuthorized ? 'No matching institutions found' : 'No authorized institutions'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filterProviders(authorizedProviders, searchAuthorized).map(provider => 
                    renderProviderCard(provider, true)
                  )}
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

          {/* Message display */}
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
    </div>
  );
};

export default OwnerDashboard;