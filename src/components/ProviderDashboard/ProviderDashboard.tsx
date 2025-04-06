import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useEthereum } from '@/contexts/EthereumContext';
import UserRegistryABI from '../../../artifacts/contracts/UserRegistry.sol/UserRegistry.json';
import CertificateNFTABI from '../../../artifacts/contracts/CertificateNFT.sol/CertificateNFT.json';

const certificateNFTAddress = process.env.NEXT_PUBLIC_CERTIFICATE_NFT_ADDRESS!;
const userRegistryAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

type CertificateRequest = {
  student: string;
  name: string;
  message: string;
  approved: boolean;
  id: number;
};

type RequestInput = {
  certificateType: string;
  tokenURI: string;
};

type ProviderMetadata = {
  role: string;
  institutionName: string;
  accreditationNumber: string;
  documentCid: string;
};

const ProviderDashboard = () => {
  const { account, provider } = useEthereum();
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [inputData, setInputData] = useState<{ [key: number]: RequestInput }>({});
  const [providerMetadata, setProviderMetadata] = useState<ProviderMetadata | null>(null);

  // ✅ MOVED fetchRequests OUTSIDE useEffect
  const fetchRequests = async () => {
    if (!provider || !account) return;
    const signer = await provider.getSigner();
    const certContract = new ethers.Contract(certificateNFTAddress, CertificateNFTABI.abi, signer);

    try {
      const requestCount = await certContract.requestCounter();
      const allRequests: CertificateRequest[] = [];
      for (let i = 1; i <= requestCount; i++) {
        const req = await certContract.certificateRequests(i);
        if (!req.approved) {
          allRequests.push({ ...req, id: i });
        }
      }
      setRequests(allRequests);
    } catch (err) {
      console.error('Error fetching requests:', err);
    }
  };

  const fetchProviderDetails = async () => {
    if (!provider || !account) return;
    const signer = await provider.getSigner();
    const registryContract = new ethers.Contract(userRegistryAddress, UserRegistryABI.abi, signer);

    try {
      const [, metadataHash] = await registryContract.getUser(account);
      if (!metadataHash) return;
      console.log('Metadata Hash:', metadataHash);
      const res = await fetch(`https://ipfs.io/ipfs/${metadataHash}`);
      if (!res.ok) throw new Error('Failed to fetch IPFS metadata');
      const metadata: ProviderMetadata = await res.json();
      setProviderMetadata(metadata);
    } catch (err) {
      console.error('Error fetching provider metadata:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchProviderDetails();
  }, [provider, account]);

  const handleInputChange = (requestId: number, field: string, value: string) => {
    setInputData((prev) => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        [field]: value,
      },
    }));
  };

  const handleApprove = async (requestId: number) => {
    const data = inputData[requestId];
    if (!data?.certificateType || !data?.tokenURI || !providerMetadata?.institutionName) {
      alert('Please fill all fields');
      return;
    }

    try {
      if (!provider || !account) return;
      const signer = await provider.getSigner();
      const certContract = new ethers.Contract(certificateNFTAddress, CertificateNFTABI.abi, signer);

      const tx = await certContract.approveCertificateRequest(
        requestId,
        data.certificateType,
        data.tokenURI,
        providerMetadata.institutionName
      );
      await tx.wait();

      alert('Certificate Approved!');
      fetchRequests(); // ✅ Refresh list after approval
    } catch (err) {
      console.error('Error approving request:', err);
    }
  };

  return (
    <div>
      <h1>Provider Dashboard</h1>

      {providerMetadata && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h2>Provider Info</h2>
          <p><strong>Institution Name:</strong> {providerMetadata.institutionName}</p>
          <p><strong>Accreditation Number:</strong> {providerMetadata.accreditationNumber}</p>
        </div>
      )}

      {account ? (
        <>
          <h2>Pending Certificate Requests</h2>
          {requests.map((req) => (
            <div key={req.id} style={{ marginBottom: '20px', border: '1px solid #ddd', padding: '10px' }}>
              <p><strong>Student:</strong> {req.student}</p>
              <p><strong>Name:</strong> {req.name}</p>
              <p><strong>Message:</strong> {req.message}</p>

              <input
                type="text"
                placeholder="Certificate Type"
                onChange={(e) => handleInputChange(req.id, 'certificateType', e.target.value)}
              />
              <input
                type="text"
                placeholder="Token URI"
                onChange={(e) => handleInputChange(req.id, 'tokenURI', e.target.value)}
              />
              <input
                type="text"
                placeholder="Institute Name"
                value={providerMetadata?.institutionName || ''}
                readOnly
              />
              <button onClick={() => handleApprove(req.id)}>Approve</button>
            </div>
          ))}
        </>
      ) : (
        <p>Please connect your wallet.</p>
      )}
    </div>
  );
};

export default ProviderDashboard;
