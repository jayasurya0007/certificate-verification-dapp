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
  studentMetadataHash: string;
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

type StudentMetadata = {
  name: string;
  email: string;
  studentId: string;
  dateOfBirth?: string;
  program?: string;
};

const ProviderDashboard = () => {
  const { account, provider } = useEthereum();
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [inputData, setInputData] = useState<{ [key: number]: RequestInput }>({});
  const [providerMetadata, setProviderMetadata] = useState<ProviderMetadata | null>(null);
  const [studentMetadata, setStudentMetadata] = useState<{ [key: string]: StudentMetadata }>({});

  const fetchStudentMetadata = async (studentAddress: string, metadataHash: string) => {
    try {
      const res = await fetch(`https://ipfs.io/ipfs/${metadataHash}`);
      if (!res.ok) throw new Error('Failed to fetch IPFS metadata');
      return await res.json();
    } catch (err) {
      console.error(`Error fetching metadata for student ${studentAddress}:`, err);
      return null;
    }
  };

  const fetchRequests = async () => {
    if (!provider || !account) return;
    const signer = await provider.getSigner();
    const certContract = new ethers.Contract(certificateNFTAddress, CertificateNFTABI.abi, signer);

    try {
      const requestCount = await certContract.requestCounter();
      const allRequests: CertificateRequest[] = [];
      const metadataMap: { [key: string]: StudentMetadata } = {};

      for (let i = 1; i <= requestCount; i++) {
        const req = await certContract.certificateRequests(i);
        if (!req.approved) {
          allRequests.push({ ...req, id: i });
          if (req.studentMetadataHash) {
            const metadata = await fetchStudentMetadata(req.student, req.studentMetadataHash);
            if (metadata) {
              metadataMap[req.student] = metadata;
            }
          }
        }
      }
      
      setRequests(allRequests);
      setStudentMetadata(metadataMap);
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
      fetchRequests();
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
          {requests.length > 0 ? (
            requests.map((req) => {
              const studentInfo = studentMetadata[req.student] || {};
              return (
                <div key={req.id} style={{ marginBottom: '20px', border: '1px solid #ddd', padding: '10px' }}>
                  <h3>Student Information</h3>
                  <p><strong>Name:</strong> {studentInfo.name || 'Not available'}</p>
                  <p><strong>Email:</strong> {studentInfo.email || 'Not available'}</p>
                  <p><strong>Student ID:</strong> {studentInfo.studentId || 'Not available'}</p>
                  <p><strong>Wallet Address:</strong> {req.student}</p>
                  
                  <h4>Certificate Request Details</h4>
                  <p><strong>Requested Certificate:</strong> {req.name}</p>
                  <p><strong>Message:</strong> {req.message}</p>

                  <div style={{ marginTop: '15px' }}>
                    <h4>Certificate Details</h4>
                    <input
                      type="text"
                      placeholder="Certificate Type"
                      onChange={(e) => handleInputChange(req.id, 'certificateType', e.target.value)}
                      style={{ marginBottom: '10px', width: '100%' }}
                    />
                    <input
                      type="text"
                      placeholder="Token URI (IPFS Hash)"
                      onChange={(e) => handleInputChange(req.id, 'tokenURI', e.target.value)}
                      style={{ marginBottom: '10px', width: '100%' }}
                    />
                    <button 
                      onClick={() => handleApprove(req.id)}
                      style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}
                    >
                      Approve Certificate
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p>No pending certificate requests.</p>
          )}
        </>
      ) : (
        <p>Please connect your wallet.</p>
      )}
    </div>
  );
};

export default ProviderDashboard;