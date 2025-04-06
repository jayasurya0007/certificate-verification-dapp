import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useEthereum } from '@/contexts/EthereumContext';
import UserRegistryABI from '../../../artifacts/contracts/UserRegistry.sol/UserRegistry.json';
import CertificateNFTABI from '../../../artifacts/contracts/CertificateNFT.sol/CertificateNFT.json';
import CertificateSearch from '../CertificateSearch/CertificateSearch';

interface Certificate {
  id: string;
  name: string;
  institute: string;
  issueDate: number;
  certificateType: string;
  student: string;
  tokenURI: string;
  image?: string;
}

const StudentDashboard = () => {
  const { account, provider } = useEthereum();
  const [profile, setProfile] = useState<any>({});
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [providerAddress, setProviderAddress] = useState('');
  const [certificateName, setCertificateName] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const userRegistryAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
  const certificateNFTAddress = process.env.NEXT_PUBLIC_CERTIFICATE_NFT_ADDRESS || '';

  useEffect(() => {
    const fetchData = async () => {
      if (!account || !provider) return;

      try {
        setIsLoading(true);
        const signer = await provider.getSigner();
        const userRegistry = new ethers.Contract(userRegistryAddress, UserRegistryABI.abi, signer);
        const certificateNFT = new ethers.Contract(certificateNFTAddress, CertificateNFTABI.abi, signer);

        // Fetch student profile
        const [, ipfsHash] = await userRegistry.getUser(account);
        if (ipfsHash) {
          const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
          const data = await response.json();
          setProfile(data);
        }

        // Fetch certificates
        const certificateIds = await certificateNFT.getStudentCertificates(account);
        const certDetails = await Promise.all(
          certificateIds.map(async (id: any) => {
            const [name, institute, issueDate, certificateType, student] =
              await certificateNFT.getCertificateDetails(id);
            const tokenURI = await certificateNFT.tokenURI(id);

            let image;
            try {
              const metadataCID = tokenURI.replace('ipfs://', '');
              const metadataRes = await fetch(`https://ipfs.io/ipfs/${metadataCID}`);
              const metadata = await metadataRes.json();
              image = metadata.image?.replace('ipfs://', 'https://ipfs.io/ipfs/');
            } catch (e) {
              console.warn('Failed to load image metadata for token:', id);
            }

            return {
              id: id.toString(),
              name,
              institute,
              issueDate,
              certificateType,
              student,
              tokenURI,
              image,
            };
          })
        );
        setCertificates(certDetails);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [account, provider]);

  const handleRequestCertificate = async () => {
    if (!account || !provider) return;

    try {
      const signer = await provider.getSigner();
      const userRegistry = new ethers.Contract(userRegistryAddress, UserRegistryABI.abi, signer);
      const certificateNFT = new ethers.Contract(certificateNFTAddress, CertificateNFTABI.abi, signer);

      const [, metadataHash] = await userRegistry.getUser(account);

      const tx = await certificateNFT.requestCertificate(
        providerAddress,
        certificateName,
        message,
        metadataHash
      );
      await tx.wait();
      alert('Certificate request sent successfully!');

      setProviderAddress('');
      setCertificateName('');
      setMessage('');
    } catch (error) {
      console.error('Certificate request error:', error);
      alert('Failed to send certificate request');
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading your dashboard...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>

      {account ? (
        <>
          {/* Profile Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Name: {profile.name || 'Not available'}</p>
                <p className="font-medium">Email: {profile.email || 'Not available'}</p>
                <p className="font-medium">Student ID: {profile.studentId || 'Not available'}</p>
              </div>
              <div>
                <p className="font-medium">Wallet Address:</p>
                <p className="text-sm text-gray-600 break-all">{account}</p>
              </div>
            </div>
          </div>

          {/* Certificate List */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Certificates</h2>
            {certificates.length > 0 ? (
              <div className="space-y-4">
                {certificates.map((cert) => (
                  <div key={cert.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <h3 className="font-bold text-lg">{cert.name}</h3>
                    <p>Issued by: {cert.institute}</p>
                    <p>Type: {cert.certificateType}</p>
                    <p>Issued on: {new Date(Number(cert.issueDate) * 1000).toLocaleDateString()}</p>

                    {cert.image && (
                      <img
                        src={cert.image}
                        alt="Certificate"
                        className="mt-2 rounded-lg max-w-xs"
                      />
                    )}

                    <a
                      href={`https://ipfs.io/ipfs/${cert.tokenURI.split('ipfs://')[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-block mt-2"
                    >
                      View Metadata
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p>No certificates issued yet.</p>
            )}
          </div>

          {/* Certificate Request Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Request New Certificate</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider Wallet Address
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={providerAddress}
                  onChange={(e) => setProviderAddress(e.target.value)}
                  placeholder="0x..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certificate Name
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={certificateName}
                  onChange={(e) => setCertificateName(e.target.value)}
                  placeholder="e.g., Bachelor of Science in Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Message
                </label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Any additional information for the provider..."
                />
              </div>

              <button
                onClick={handleRequestCertificate}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                disabled={!providerAddress || !certificateName}
              >
                Submit Request
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p>Please connect your wallet to view your dashboard</p>
        </div>
      )}

      {/* 🔍 Certificate Search Component */}
      <CertificateSearch />
    </div>
  );
};

export default StudentDashboard;
