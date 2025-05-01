import React, { useState, useEffect } from 'react';
import { useEthereum } from '@/contexts/EthereumContext';
import { useContractContext,StudentMetadata,ProviderMetadata,Certificate} from '@/contexts/ContractContext';
// import CertificateSearch from '../CertificateSearch/CertificateSearch';
import { FiUser, FiMail, FiBook, FiChevronDown,FiSend,FiAward,FiX,FiCalendar} from 'react-icons/fi';
import { FiExternalLink } from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';



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
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  // Modify the certificate click handler
  const handleCertificateClick = (cert: Certificate) => {
    setSelectedCertificate(cert);
  };

  // Add close detail view handler
  const handleCloseDetail = () => {
    setSelectedCertificate(null);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Student Dashboard
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Manage your academic credentials and certificates</p>
        </div>
  
        {isLoading ? (
          <div className="space-y-6 sm:space-y-8">
            <Skeleton height={120} className="rounded-xl" count={3} />
          </div>
        ) : (
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            {/* Left Column - Profile and Quick Actions */}
            <div className="lg:col-span-1 space-y-6 sm:space-y-8">
              {/* Profile Card */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md sm:shadow-lg border border-gray-100">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 mb-3 sm:mb-4 text-blue-600">
                  <FiUser className="w-4 h-4 sm:w-5 sm:h-5" />
                  Student Profile
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-xs sm:text-sm text-gray-500">Full Name</label>
                    <p className="font-medium text-sm sm:text-base text-gray-900">{profile.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm text-gray-500">Email Address</label>
                    <p className="font-medium text-sm sm:text-base text-gray-900 break-all">{profile.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm text-gray-500">Student ID</label>
                    <p className="font-medium text-sm sm:text-base text-gray-900">{profile.studentId || 'N/A'}</p>
                  </div>
                </div>
              </div>
  
              {/* Quick Stats Card */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md sm:shadow-lg border border-gray-100">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 mb-3 sm:mb-4 text-purple-600">
                  <FiAward className="w-4 h-4 sm:w-5 sm:h-5" />
                  Academic Stats
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">{certificates.length}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Certificates</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">{providers.length}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Institutions</div>
                  </div>
                </div>
              </div>
            </div>
  
            {/* Right Column - Certificates and Request Form */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              {/* Certificates Card */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md sm:shadow-lg border border-gray-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-green-600 mb-2 sm:mb-0">
                    <FiBook className="w-4 h-4 sm:w-5 sm:h-5" />
                    My Certificates
                  </h3>
                  <span className="bg-green-100 text-green-800 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm">
                    {certificates.length} issued
                  </span>
                </div>

                {selectedCertificate ? (
                  <CertificateDetail 
                    certificate={selectedCertificate} 
                    onClose={handleCloseDetail} 
                  />
                ) : certificates.length === 0 ? (
                  <div className="text-center py-4 sm:py-6">
                    <div className="text-gray-400 mb-1 sm:mb-2 text-sm sm:text-base">No certificates found</div>
                    <p className="text-xs sm:text-sm text-gray-500">Request your first certificate below</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:gap-4">
                    {certificates.map((cert) => (
                      <div
                        key={cert.id}
                        onClick={() => handleCertificateClick(cert)}
                        className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-all border border-gray-200 cursor-pointer"
                      >
                        <div className="mb-2 sm:mb-0">
                          <div className="font-semibold text-sm sm:text-base text-gray-900">{cert.name}</div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            Issued by {cert.institute} •{' '}
                            {new Date(cert.issueDate * 1000).toLocaleDateString()}
                          </div>
                        </div>
                        <a
                          href={`https://explorer.execution.testnet.lukso.network/token/${process.env.NEXT_PUBLIC_CERTIFICATE_NFT_ADDRESS}/instance/${cert.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto flex items-center justify-center gap-1 sm:gap-2 text-blue-600 hover:text-blue-800 px-3 py-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-all text-xs sm:text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FiExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>View on Explorer</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
                
              {/* Request Form Card */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md sm:shadow-lg border border-gray-100">
                <h3 className="text-base sm:text-lg font-semibold flex items-center justify-center gap-2 mb-4 sm:mb-6 text-orange-600">
                  <FiSend className="w-4 h-4 sm:w-5 sm:h-5" />
                  New Certificate Request
                </h3>

                <div className="space-y-4 sm:space-y-6 max-w-md mx-auto">
                  {/* Institution Selection */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Select Institution
                    </label>
                    <div className="relative">
                      <select
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="w-full pl-3 pr-8 sm:pl-4 sm:pr-10 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all"
                        disabled={loadingProviders || requesting}
                      >
                        <option value="">Choose an institution...</option>
                        {providers.map((provider) => (
                          <option
                            key={provider.address}
                            value={provider.address}
                            className="py-1 sm:py-2 text-xs sm:text-sm"
                          >
                            {provider.name} ({provider.institution})
                          </option>
                        ))}
                      </select>
                      <FiChevronDown className="absolute right-2 sm:right-3 top-2 sm:top-3 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    {loadingProviders && (
                      <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500 text-center">
                        Loading institutions...
                      </div>
                    )}
                  </div>

                  {/* Certificate Title */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Certificate Title
                    </label>
                    <input
                      type="text"
                      value={certificateName}
                      onChange={(e) => setCertificateName(e.target.value)}
                      placeholder="e.g., Bachelor of Science in Computer Science"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={requesting}
                    />
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Add any special instructions or comments..."
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 sm:h-32 transition-all"
                      disabled={requesting}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleRequestCertificate}
                      disabled={requesting || !selectedProvider || !certificateName}
                      className="w-full sm:w-auto px-8 sm:px-12 py-2 sm:py-3 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg sm:rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {requesting ? (
                        <div className="flex items-center justify-center gap-2">
                          <svg
                            className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Submitting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <FiSend className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Submit Request</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
        
              </div>
            </div>
        )}
      </div>
    </div>
  );
}
  export default StudentDashboard;

  const CertificateDetail = ({ certificate, onClose }: { certificate: Certificate, onClose: () => void }) =>{
    const ipfsUrl = certificate.metadata?.image?.replace('ipfs://', 'https://ipfs.io/ipfs/');
    return (
    <div className="relative bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      >
        <FiX className="w-6 h-6" />
      </button>
      
      <h3 className="text-2xl font-bold mb-6 text-blue-600">{certificate.name}</h3>
      
      {ipfsUrl && (
        <div className="mb-6 text-center">
          <img 
            src={ipfsUrl} 
            alt="Certificate" 
            className="mx-auto max-w-full h-auto rounded-lg shadow-md border border-gray-200"
            style={{ maxHeight: '250px' }}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3">
          <FiBook className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Institution</p>
            <p className="font-medium">{certificate.institute}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <FiCalendar className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Issued Date</p>
            <p className="font-medium">
              {new Date(certificate.issueDate * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <FiAward className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Certificate Type</p>
            <p className="font-medium">{certificate.certificateType}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <FiUser className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Student Address</p>
            <p className="font-medium break-all">{certificate.student}</p>
          </div>
        </div>
      </div>
      
      {certificate.metadata && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-lg font-semibold mb-3 text-center">Additional Metadata</h4>
          <div className="space-y-2">
            <p className="text-sm"><strong>Certificate Type:</strong> {certificate.metadata.certificateType}</p>
            <p className="text-sm"><strong>Institution Name:</strong> {certificate.metadata.institution?.name}</p>
            <p className="text-sm"><strong>Accreditation Number:</strong> {certificate.metadata.institution?.accreditationNumber}</p>
          </div>
        </div>
      )}
      
    </div>
  );
}
  