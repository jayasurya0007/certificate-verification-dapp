import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useEthereum } from '@/contexts/EthereumContext';
import { FiUser, FiBook, FiSend, FiClock, FiCheckCircle } from 'react-icons/fi';
import UserRegistryABI from '../../../artifacts/contracts/UserRegistry.sol/UserRegistry.json';
import CertificateNFTABI from '../../../artifacts/contracts/CertificateNFT.sol/CertificateNFT.json';

const StudentDashboard = () => {
  const { account, provider } = useEthereum();

  const [profile, setProfile] = useState<any>({});
  const [certificates, setCertificates] = useState<any[]>([]);
  const [providerAddress, setProviderAddress] = useState('');
  const [certificateName, setCertificateName] = useState('');
  const [message, setMessage] = useState('');
  const [isRequestSubmitted, setIsRequestSubmitted] = useState(false);

  const userRegistryAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
  const certificateNFTAddress = process.env.NEXT_PUBLIC_CERTIFICATE_NFT_ADDRESS || '';

  useEffect(() => {
    const fetchData = async () => {
      if (!account || !provider) return;

      try {
        const signer = await provider.getSigner();
        const userRegistry = new ethers.Contract(userRegistryAddress, UserRegistryABI.abi, signer);
        const certificateNFT = new ethers.Contract(certificateNFTAddress, CertificateNFTABI.abi, provider);

        // Fetch metadata IPFS hash
        const [role, ipfsHash] = await userRegistry.getUser(account);
        console.log('Role:', role);
        console.log('IPFS Hash:', ipfsHash);
        if (!ipfsHash) {
          console.warn('Invalid IPFS hash received.');
          return;
        }       
        const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
        const data = await response.json();
        setProfile(data);

        // Fetch student certificates
        const certificateIds = await certificateNFT.getStudentCertificates(account);
        const certDetails = await Promise.all(
          certificateIds.map(async (id: string | number) => {
            const details = await certificateNFT.getCertificateDetails(id);
            return { id, ...details };
          })
        );
        setCertificates(certDetails);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [account, provider]);

  const handleRequestCertificate = async () => {
    if (!account || !provider) return;

    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(certificateNFTAddress, CertificateNFTABI.abi, signer);
      const tx = await contract.requestCertificate(providerAddress, certificateName, message);
      await tx.wait();
      setIsRequestSubmitted(true);
      setProviderAddress('');
      setCertificateName('');
      setMessage('');
    } catch (error) {
      console.error('Certificate request error:', error);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Student Dashboard</h1>
          <p className="text-gray-600 mb-6">Please connect your wallet to access the dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-gray-600">Manage your certificates and requests</p>
          </div>
          <div className="mt-4 md:mt-0 bg-white p-3 rounded-lg shadow-sm">
            <p className="text-sm font-medium">Wallet Address: 
              <span className="text-blue-600 ml-1">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FiUser className="text-blue-600 text-xl" />
              </div>
              <h2 className="text-xl font-semibold">Profile Details</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{profile.name || 'Not available'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{profile.email || 'Not available'}</p>
              </div>
            </div>
          </div>

          {/* Middle Column - NFT Certificates */}
          <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
            <div className="flex items-center mb-6">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <FiBook className="text-purple-600 text-xl" />
              </div>
              <h2 className="text-xl font-semibold">My Certificates</h2>
            </div>

            {certificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map((cert, idx) => (
                  <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="h-40 bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                      <FiBook className="text-gray-400 text-4xl" />
                    </div>
                    <h3 className="font-semibold">{cert.name}</h3>
                    <p className="text-sm text-gray-600">{cert.institute}</p>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <FiClock className="mr-1" />
                      <span>Issued: {new Date(cert.issueDate * 1000).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-3">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{cert.certificateType}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No certificates issued yet</p>
                <p className="text-sm text-gray-400 mt-1">Request your first certificate below</p>
              </div>
            )}
          </div>

          {/* Bottom Full Width - Request Form */}
          <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-3">
            <div className="flex items-center mb-6">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <FiSend className="text-green-600 text-xl" />
              </div>
              <h2 className="text-xl font-semibold">Request New Certificate</h2>
            </div>

            {isRequestSubmitted ? (
              <div className="text-center py-8">
                <FiCheckCircle className="mx-auto text-green-500 text-4xl mb-3" />
                <h3 className="text-lg font-medium mb-1">Request Submitted!</h3>
                <p className="text-gray-600 mb-4">The institution will review your request</p>
                <button 
                  onClick={() => setIsRequestSubmitted(false)}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  New Request
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provider Address*
                    </label>
                    <input
                      type="text"
                      placeholder="Provider Address"
                      value={providerAddress}
                      onChange={(e) => setProviderAddress(e.target.value)}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certificate Name*
                    </label>
                    <input
                      type="text"
                      placeholder="Certificate Name"
                      value={certificateName}
                      onChange={(e) => setCertificateName(e.target.value)}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    placeholder="Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleRequestCertificate}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition"
                  >
                    Request Certificate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;