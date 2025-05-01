import React, { useState, useEffect } from 'react';
import { useContractContext } from '@/contexts/ContractContext';
import { useEthereum } from '@/contexts/EthereumContext';
import { RegisteredUser } from '@/contexts/ContractContext';
import { ethers } from 'ethers';
import { FiFile, FiExternalLink, FiSearch, FiShield, FiCheck, FiX } from 'react-icons/fi';

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
    checkIsOwner
  } = useContractContext();
  
  const [isOwner, setIsOwner] = useState(false);
  const [pendingProviders, setPendingProviders] = useState<RegisteredUser[]>([]);
  const [authorizedProviders, setAuthorizedProviders] = useState<RegisteredUser[]>([]);
  const [providerMetadata, setProviderMetadata] = useState<{ [key: string]: any }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [currentProcessingAddress, setCurrentProcessingAddress] = useState<string | null>(null);
  const [searchPending, setSearchPending] = useState('');
  const [searchAuthorized, setSearchAuthorized] = useState('');

  useEffect(() => {
    const verifyOwnership = async () => {
      if (account) {
        const ownerStatus = await checkIsOwner(account);
        setIsOwner(ownerStatus);
        if (!ownerStatus) setIsLoading(false);
      }
    };
    verifyOwnership();
  }, [account]);

  useEffect(() => {
    const loadData = async () => {
      if (!isOwner) return;
      
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
      } finally {
        setIsLoading(false);
      }
    };

    if (isOwner) loadData();
  }, [account, message, isOwner]);

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-md text-center p-8 bg-white rounded-2xl shadow-xl border border-purple-100">
          <FiShield className="h-16 w-16 text-purple-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Restricted Access
          </h1>
          <p className="text-gray-600 mb-6">
            This dashboard is only accessible to the contract owner. 
            Please connect with the owner's wallet to continue.
          </p>
          <div className="text-sm text-gray-500 font-mono bg-gray-50 p-3 rounded-lg">
            Connected Address: {account || 'Not connected'}
          </div>
        </div>
      </div>
    );
  }

  const handleAuthorization = async (providerAddress: string, action: 'authorize' | 'revoke') => {
    if (!providerAddress || !ethers.isAddress(providerAddress)) {
      setMessage('Invalid provider address');
      return;
    }

    try {
      setIsLoading(true);
      setCurrentProcessingAddress(providerAddress);
      setMessage('');

      const isAuthorized = await checkInstituteAuthorization(providerAddress);
      
      if (action === 'authorize' && isAuthorized) {
        throw new Error('Provider is already authorized');
      }
      if (action === 'revoke' && !isAuthorized) {
        throw new Error('Provider is not authorized');
      }

      if (action === 'authorize') {
        await authorizeInstitute(providerAddress);
      } else {
        await revokeInstitute(providerAddress);
      }

      setMessage(`${providerAddress} successfully ${action === 'authorize' ? 'authorized' : 'revoked'}`);
      
      // Refresh both lists
      const [pending, authorized] = await Promise.all([
        fetchPendingProviders(),
        fetchAuthorizedProviders()
      ]);
      setPendingProviders(pending);
      setAuthorizedProviders(authorized);
    } catch (error) {
      console.error('Authorization error:', error);
      setMessage(error instanceof Error ? error.message : 'Operation failed');
    } finally {
      setIsLoading(false);
      setCurrentProcessingAddress(null);
    }
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
      <div key={provider.address} className="group p-5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 border-purple-600 mb-4">
        <div className="flex flex-col sm:flex-row items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FiShield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {metadata.institutionName || 'Unknown Institution'}
                </h3>
                <p className="text-sm text-gray-500 mt-1 break-all">
                  {provider.address}
                </p>
              </div>
            </div>
            
            <div className="ml-2 pl-8 border-l-2 border-purple-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                <div>
                  <p className="text-sm">
                    <span className="font-medium text-purple-600">Accreditation #:</span><br />
                    {metadata.accreditationNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  {metadata.documentCid && (
                    <a
                      href={`https://ipfs.io/ipfs/${metadata.documentCid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-purple-600 hover:text-purple-800 transition-colors"
                    >
                      <FiFile className="mr-2" />
                      View Accreditation
                      <FiExternalLink className="ml-2 text-sm" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 sm:mt-0 sm:ml-4 flex sm:flex-col gap-2">
            {isAuthorized ? (
              <button
                onClick={() => handleAuthorization(provider.address, 'revoke')}
                disabled={isLoading}
                className="px-4 py-2 flex items-center gap-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
              >
                <FiX className="h-5 w-5" />
                Revoke Access
              </button>
            ) : (
              <button
                onClick={() => handleAuthorization(provider.address, 'authorize')}
                disabled={isLoading}
                className="px-4 py-2 flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
              >
                <FiCheck className="h-5 w-5" />
                Authorize
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-4 bg-white px-8 py-4 rounded-full shadow-sm border border-gray-100">
            <FiShield className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Owner Control Panel
            </h1>
          </div>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Manage authorized institutions and monitor certificate issuance activities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pending Requests</p>
                <div className="text-3xl font-bold text-gray-900">
                  {pendingProviders.length}
                </div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <FiFile className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Authorized Institutions</p>
                <div className="text-3xl font-bold text-gray-900">
                  {authorizedProviders.length}
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <FiCheck className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Authorizations Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-xl font-semibold flex items-center gap-3">
              <span className="bg-orange-100 text-orange-600 p-2 rounded-lg">
                <FiFile className="h-5 w-5" />
              </span>
              Pending Institution Requests
            </h2>
            {renderSearchInput(searchPending, setSearchPending)}
          </div>
          <div className="px-6 py-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Securely loading institution data...</p>
              </div>
            ) : filterProviders(pendingProviders, searchPending).length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-400">
                  {searchPending ? 'No matching requests found' : 'All clear - no pending requests'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filterProviders(pendingProviders, searchPending).map(provider => 
                  renderProviderCard(provider, false)
                )}
              </div>
            )}
          </div>
        </div>

        {/* Authorized Institutions Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-xl font-semibold flex items-center gap-3">
              <span className="bg-green-100 text-green-600 p-2 rounded-lg">
                <FiCheck className="h-5 w-5" />
              </span>
              Authorized Institutions
            </h2>
            {renderSearchInput(searchAuthorized, setSearchAuthorized)}
          </div>
          <div className="px-6 py-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Loading authorized institutions...</p>
              </div>
            ) : filterProviders(authorizedProviders, searchAuthorized).length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-400">
                  {searchAuthorized ? 'No matching institutions found' : 'No institutions authorized yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filterProviders(authorizedProviders, searchAuthorized).map(provider => 
                  renderProviderCard(provider, true)
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contract Info Section */}
        <div className="bg-gray-900 text-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-5 bg-gray-800">
            <h2 className="text-lg font-semibold flex items-center gap-3">
              <FiShield className="h-5 w-5 text-purple-400" />
              Contract Details
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-purple-200 mb-1">Contract Address</p>
              <p className="font-mono text-sm break-all text-gray-100">
                {certificateNFTAddress}
              </p>
            </div>
            <div>
              <p className="text-sm text-purple-200 mb-1">Network</p>
              <p className="text-sm text-gray-100">Ethereum Mainnet</p>
            </div>
            <div>
              <p className="text-sm text-purple-200 mb-1">Current Owner</p>
              <p className="font-mono text-sm break-all text-gray-100">
                {account}
              </p>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {message && (
          <div className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-lg border ${
            message.includes('successfully') 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <div className="flex items-center gap-3">
              {message.includes('successfully') ? (
                <FiCheck className="h-5 w-5" />
              ) : (
                <FiX className="h-5 w-5" />
              )}
              <p className="text-sm">{message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;