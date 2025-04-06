import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useEthereum } from '@/contexts/EthereumContext';
import UserRegistryABI from '../../../artifacts/contracts/UserRegistry.sol/UserRegistry.json';
import CertificateNFTABI from '../../../artifacts/contracts/CertificateNFT.sol/CertificateNFT.json';

const StudentDashboard = () => {
  const { account, provider } = useEthereum();

  const [profile, setProfile] = useState<any>({});
  const [certificates, setCertificates] = useState<any[]>([]);
  const [providerAddress, setProviderAddress] = useState('');
  const [certificateName, setCertificateName] = useState('');
  const [message, setMessage] = useState('');

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
      const userRegistry = new ethers.Contract(userRegistryAddress, UserRegistryABI.abi, signer);
      const certificateNFT = new ethers.Contract(certificateNFTAddress, CertificateNFTABI.abi, signer);
      
      // Get student's IPFS metadata hash
      const [, metadataHash] = await userRegistry.getUser(account);
      
      const tx = await certificateNFT.requestCertificate(
        providerAddress, 
        certificateName, 
        message,
        metadataHash
      );
      await tx.wait();
      alert('Certificate request sent successfully.');
    } catch (error) {
      console.error('Certificate request error:', error);
    }
  };

  return (
    <div>
      <h1>Student Dashboard</h1>
      {account ? (
        <>
          <h2>Profile</h2>
          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Email:</strong> {profile.email}</p>

          <h2>Certificates</h2>
          {certificates.length > 0 ? (
            certificates.map((cert, idx) => (
              <div key={idx}>
                <p><strong>Name:</strong> {cert.name}</p>
                <p><strong>Institute:</strong> {cert.institute}</p>
                <p><strong>Issue Date:</strong> {new Date(cert.issueDate * 1000).toLocaleDateString()}</p>
                <p><strong>Type:</strong> {cert.certificateType}</p>
                <hr />
              </div>
            ))
          ) : (
            <p>No certificates issued yet.</p>
          )}

          <h2>Request Certificate</h2>
          <input
            type="text"
            placeholder="Provider Address"
            value={providerAddress}
            onChange={(e) => setProviderAddress(e.target.value)}
          />
          <input
            type="text"
            placeholder="Certificate Name"
            value={certificateName}
            onChange={(e) => setCertificateName(e.target.value)}
          />
          <textarea
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={handleRequestCertificate}>Request Certificate</button>
        </>
      ) : (
        <p>Please connect your wallet.</p>
      )}
    </div>
  );
};

export default StudentDashboard;