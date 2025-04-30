import React, { useState, useEffect } from 'react';
import { useEthereum } from '@/contexts/EthereumContext';
import { useContractContext,StudentMetadata,ProviderMetadata } from '@/contexts/ContractContext';
import CertificateSearch from '../CertificateSearch/CertificateSearch';
import { FiUser, FiMail, FiBook, FiChevronDown } from 'react-icons/fi';

interface ProviderInfo {
  address: string;
  name: string;
  institution: string;
}

const StudentDashboard = () => {
  const { account } = useEthereum();
  const {
    fetchStudentProfile,
    getCertificatesByAddress,
    requestCertificateIssuance,
    getAllRegisteredUsers,
    checkInstituteAuthorization,
    fetchProviderMetadata,
  } = useContractContext();

  const [profile, setProfile] = useState<StudentMetadata>({ 
    name: '', 
    email: '', 
    studentId: '' 
  });
  const [certificates, setCertificates] = useState<any[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [certificateName, setCertificateName] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!account) return;
      setIsLoading(true);
      
      try {
        // Fetch student data
        const [profileData, certs] = await Promise.all([
          fetchStudentProfile(account),
          getCertificatesByAddress(account)
        ]);
        
        if (profileData) setProfile(profileData);
        setCertificates(certs);

        // Fetch and process providers
        const allUsers = await getAllRegisteredUsers();
        const authorizedProviders = await Promise.all(
          allUsers
            .filter(user => user.role.toLowerCase() === 'provider')
            .map(async (provider) => {
              try {
                const [isAuthorized, metadata] = await Promise.all([
                  checkInstituteAuthorization(provider.address),
                  fetchProviderMetadata(provider.address) as Promise<ProviderMetadata>
                ]);
                
                return {
                  ...provider,
                  isAuthorized,
                  metadata: metadata || {
                    institutionName: '',
                    accreditationNumber: '',
                    documentCid: ''
                  }
                };
              } catch (error) {
                console.error(`Error processing provider ${provider.address}:`, error);
                return {
                  ...provider,
                  isAuthorized: false,
                  metadata: {
                    institutionName: '',
                    accreditationNumber: '',
                    documentCid: ''
                  }
                };
              }
            })
        );

        // Format authorized providers
        const validProviders = authorizedProviders
          .filter(p => p.isAuthorized)
          .map(p => ({
            address: p.address,
            name: p.metadata.institutionName || 'Unknown Institution',
            institution: p.metadata.accreditationNumber || 'N/A'
          }));

        setProviders(validProviders);
        setLoadingProviders(false);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [account]);

  const handleRequestCertificate = async () => {
    if (!selectedProvider || !certificateName) {
      alert('Please select a provider and enter certificate name');
      return;
    }
    
    setRequesting(true);
    try {
      await requestCertificateIssuance(selectedProvider, certificateName, message);
      alert('Certificate request submitted successfully!');
      setSelectedProvider('');
      setCertificateName('');
      setMessage('');
    } catch (error) {
      console.error('Error requesting certificate:', error);
      alert('Failed to submit certificate request. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center text-blue-700 mb-8">Student Dashboard</h2>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <span className="text-gray-500">Loading Dashboard...</span>
        </div>
      ) : (
        <>
          {/* Profile Section */}
          <section className="mb-8 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-blue-600 mb-4 pl-2 border-l-4 border-blue-300">Profile</h3>
            <div className="space-y-2 pl-2">
              <div className="flex items-center gap-2 text-gray-700">
                <FiUser className="text-blue-500" />
                <span>Name:</span>
                <span className="font-medium">{profile.name || 'Not available'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <FiMail className="text-blue-500" />
                <span>Email:</span>
                <span className="font-medium">{profile.email || 'Not available'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <FiBook className="text-blue-500" />
                <span>Student ID:</span>
                <span className="font-medium">{profile.studentId || 'Not available'}</span>
              </div>
            </div>
          </section>

          {/* Certificates Section */}
          <section className="mb-8 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-blue-600 mb-4 pl-2 border-l-4 border-blue-300">Your Certificates</h3>
            {certificates.length === 0 ? (
              <p className="text-gray-500 pl-2">No certificates issued yet</p>
            ) : (
              <ul className="space-y-3 pl-2">
                {certificates.map((cert) => (
                  <li 
                    key={cert.id} 
                    className="bg-blue-50 hover:bg-blue-100 transition rounded-md px-4 py-2 border-l-4 border-blue-400 shadow-sm"
                  >
                    <div className="font-semibold">{cert.name}</div>
                    <div className="text-sm text-gray-600">
                      Issued by <span className="font-medium">{cert.institute}</span>
                      {' '}on {new Date(cert.issueDate * 1000).toLocaleDateString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Certificate Request Section */}
          <section className="mb-8 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-blue-600 mb-4 pl-2 border-l-4 border-blue-300">Request New Certificate</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Select Institution:</label>
                <div className="relative">
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                    disabled={loadingProviders || requesting}
                  >
                    <option value="">Select an institution</option>
                    {providers.map((provider) => (
                      <option 
                        key={provider.address} 
                        value={provider.address}
                        className="py-2"
                      >
                        {provider.name} ({provider.institution})
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
                {loadingProviders && (
                  <p className="text-sm text-gray-500 mt-1">Loading institutions...</p>
                )}
                {!loadingProviders && providers.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">No authorized institutions available</p>
                )}
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Certificate Title:</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={certificateName}
                  onChange={(e) => setCertificateName(e.target.value)}
                  placeholder="Enter certificate title"
                  disabled={requesting}
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Additional Notes:</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[100px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Include any additional information (optional)"
                  disabled={requesting}
                />
              </div>

              <button
                onClick={handleRequestCertificate}
                disabled={requesting || !selectedProvider || !certificateName}
                className={`w-full bg-blue-600 text-white font-semibold px-6 py-2 rounded-md shadow hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed ${
                  requesting ? 'opacity-75' : ''
                }`}
              >
                {requesting ? (
                  <span className="flex items-center justify-center">
                    <svg 
                      className="animate-spin h-5 w-5 mr-3 text-white" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Request...
                  </span>
                ) : (
                  'Submit Certificate Request'
                )}
              </button>
            </div>
          </section>

          {/* Certificate Search Section */}
          <section className="mt-8">
            <h3 className="text-lg font-semibold text-blue-600 mb-4 pl-2 border-l-4 border-blue-300">Verify Certificates</h3>
            <CertificateSearch />
          </section>
        </>
      )}
    </div>
  );
};

export default StudentDashboard;