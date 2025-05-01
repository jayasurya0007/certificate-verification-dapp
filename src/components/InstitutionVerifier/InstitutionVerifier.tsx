import { useState, useEffect } from 'react';
import { FiCheckCircle, FiFile, FiInfo, FiSearch } from 'react-icons/fi';
import { useContractContext } from '@/contexts/ContractContext';

const InstitutionVerifier = () => {
  const { getAllRegisteredUsers, checkInstituteAuthorization, fetchProviderMetadata } = useContractContext();
  const [providers, setProviders] = useState<any[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProviders = async () => {
      try {
        setLoading(true);
        setError('');
        
        const allUsers = await getAllRegisteredUsers();
        const authorizedProviders = await Promise.all(
          allUsers
            .filter(user => user.role.toLowerCase() === 'provider')
            .map(async (provider) => {
              const [isAuthorized, metadata] = await Promise.all([
                checkInstituteAuthorization(provider.address),
                fetchProviderMetadata(provider.address)
              ]);
              
              return {
                ...provider,
                isAuthorized,
                metadata: metadata || {}
              };
            })
        );

        const validProviders = authorizedProviders.filter(p => p.isAuthorized);
        setProviders(validProviders);
        setFilteredProviders(validProviders);
      } catch (err) {
        console.error('Failed to load institutions:', err);
        setError('Failed to load institution data');
      } finally {
        setLoading(false);
      }
    };

    loadProviders();
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const lowerTerm = term.toLowerCase();
    
    const filtered = providers.filter(provider => {
      return (
        provider.metadata.institutionName?.toLowerCase().includes(lowerTerm) ||
        provider.address.toLowerCase().includes(lowerTerm) ||
        provider.metadata.accreditationNumber?.toLowerCase().includes(lowerTerm)
      );
    });

    setFilteredProviders(filtered);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-blue-600">
        <FiCheckCircle className="text-green-500" />
        Verified Institutions
      </h2>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <div className="absolute left-3 top-3.5 text-gray-400">
          <FiSearch className="h-5 w-5" />
        </div>
        <input
          type="text"
          placeholder="Search by name, address, or accreditation number..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <span className="text-gray-500">Loading institutions...</span>
        </div>
      ) : error ? (
        <div className="text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>
      ) : filteredProviders.length === 0 ? (
        <div className="text-gray-500 p-4">
          {searchTerm ? 'No matching institutions found' : 'No verified institutions found'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProviders.map((provider) => (
            <div 
              key={provider.address}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">
                  {provider.metadata.institutionName || 'Unknown Institution'}
                </h3>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                  <FiCheckCircle />
                  Verified
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                <div>
                  <p className="flex items-center gap-2">
                    <FiInfo className="text-blue-500" />
                    <span>Accreditation #: {provider.metadata.accreditationNumber || 'N/A'}</span>
                  </p>
                  <p className="mt-2 text-sm">
                    Blockchain Address: {' '}
                    <span className="font-mono break-all">{provider.address}</span>
                  </p>
                </div>
                
                {provider.metadata.documentCid && (
                  <div>
                    <a
                      href={`https://ipfs.io/ipfs/${provider.metadata.documentCid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <FiFile />
                      View Accreditation Document
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstitutionVerifier;