import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useEthereum } from '@/contexts/EthereumContext';
import UserRegistryABI from '../../../artifacts/contracts/UserRegistry.sol/UserRegistry.json';
import CertificateNFTABI from '../../../artifacts/contracts/CertificateNFT.sol/CertificateNFT.json';
import { uploadJSONToIPFS, uploadFileToIPFS } from '../../../utils/ipfs';

interface CertificateRequest {
  id: number;
  student: string;
  name: string;
  message: string;
  studentMetadataHash: string;
  approved: boolean;
  institute: string;
}

interface StudentMetadata {
  name: string;
  email: string;
  studentId: string;
  [key: string]: any;
}

interface ProviderMetadata {
  institutionName: string;
  accreditationNumber: string;
  documentCid: string;
}

interface CertificateInput {
  certificateType: string;
  name: string;
  description: string;
  imageFile: File | null;
}

const ProviderDashboard = () => {
  const { account, provider } = useEthereum();
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [studentMetadata, setStudentMetadata] = useState<{[key: string]: StudentMetadata}>({});
  const [providerMetadata, setProviderMetadata] = useState<ProviderMetadata | null>(null);
  const [certificateInputs, setCertificateInputs] = useState<{[key: number]: CertificateInput}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const certificateNFTAddress = process.env.NEXT_PUBLIC_CERTIFICATE_NFT_ADDRESS || '';
  const userRegistryAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

  useEffect(() => {
    const checkAuthorization = async () => {
      if (!provider || !account) return;
      
      try {
        const signer = await provider.getSigner();
        const certContract = new ethers.Contract(
          certificateNFTAddress, 
          CertificateNFTABI.abi, 
          signer
        );
        
        const authorized = await certContract.authorizedInstitutes(account);
        setIsAuthorized(authorized);
      } catch (err) {
        console.error('Error checking authorization:', err);
      }
    };
  
    checkAuthorization();
  }, [provider, account]);
  const fetchRequests = async () => {
    if (!provider || !account) return;
    
    try {
      setIsLoading(true);
      const signer = await provider.getSigner();
      const certContract = new ethers.Contract(
        certificateNFTAddress, 
        CertificateNFTABI.abi, 
        signer
      );

      const requestCount = await certContract.requestCounter();
      const pendingRequests: CertificateRequest[] = [];
      const metadataMap: {[key: string]: StudentMetadata} = {};

      for (let i = 1; i <= requestCount; i++) {
        const req = await certContract.certificateRequests(i);
        if (!req.approved && req.institute.toLowerCase() === account.toLowerCase()) {
          const request: CertificateRequest = {
            id: i,
            student: req.student,
            institute: req.institute,
            name: req.name,
            message: req.message,
            studentMetadataHash: req.studentMetadataHash,
            approved: req.approved
          };
          pendingRequests.push(request);

          // Fetch student metadata if hash exists
          if (req.studentMetadataHash) {
            try {
              const response = await fetch(`https://ipfs.io/ipfs/${req.studentMetadataHash}`);
              const metadata = await response.json();
              metadataMap[req.student] = metadata;
            } catch (err) {
              console.error(`Failed to fetch metadata for student ${req.student}:`, err);
            }
          }
        }
      }

      setRequests(pendingRequests);
      setStudentMetadata(metadataMap);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProviderDetails = async () => {
    if (!provider || !account) return;
    
    try {
      const signer = await provider.getSigner();
      const registryContract = new ethers.Contract(
        userRegistryAddress, 
        UserRegistryABI.abi, 
        signer
      );

      const [, metadataHash] = await registryContract.getUser(account);
      if (metadataHash) {
        const response = await fetch(`https://ipfs.io/ipfs/${metadataHash}`);
        const metadata: ProviderMetadata = await response.json();
        setProviderMetadata(metadata);
      }
    } catch (err) {
      console.error('Error fetching provider details:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchProviderDetails();
  }, [provider, account]);

  const handleInputChange = (
    requestId: number,
    field: keyof CertificateInput,
    value: string | File
  ) => {
    setCertificateInputs(prev => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        [field]: value
      }
    }));
  };

  const handleApprove = async (requestId: number) => {
    if (!provider || !account || !providerMetadata) return;
    
    if (!isAuthorized) {
      alert('Your account is not authorized to approve certificates.');
      return;
    }
  
    const input = certificateInputs[requestId];
    if (!input?.certificateType || !input?.name || !input?.description || !input?.imageFile) {
      alert('Please fill in all certificate details');
      return;
    }
  
    try {
      // Upload image to IPFS
      const { cid: imageCid } = await uploadFileToIPFS(input.imageFile);
      const imageURI = `ipfs://${imageCid}`;

      // Prepare metadata
      const metadata = {
        name: input.name,
        description: input.description,
        image: imageURI,
        certificateType: input.certificateType,
        institution: {
          name: providerMetadata.institutionName,
          accreditationNumber: providerMetadata.accreditationNumber,
          documentCid: providerMetadata.documentCid
        }
      };

      // Upload metadata to IPFS
      const { cid: metadataCid } = await uploadJSONToIPFS(metadata);
      const tokenURI = `ipfs://${metadataCid}`;

      const signer = await provider.getSigner();
      const certContract = new ethers.Contract(
        certificateNFTAddress, 
        CertificateNFTABI.abi, 
        signer
      );

      const tx = await certContract.approveCertificateRequest(
        requestId,
        input.certificateType,
        tokenURI,
        providerMetadata.institutionName
      );
      await tx.wait();
      
      alert('Certificate approved successfully!');
      fetchRequests();
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Failed to approve certificate request');
    }
  };

  const handleCancel = async (requestId: number) => {
    if (!provider || !account) return;

    try {
      const signer = await provider.getSigner();
      const certContract = new ethers.Contract(
        certificateNFTAddress, 
        CertificateNFTABI.abi, 
        signer
      );

      const tx = await certContract.cancelCertificateRequest(requestId);
      await tx.wait();
      alert('Request cancelled successfully!');
      fetchRequests();
    } catch (err) {
      console.error('Error cancelling request:', err);
      alert('Failed to cancel request');
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading dashboard...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Provider Dashboard</h1>
      
      {account ? (
        <>
          {providerMetadata && (
  <div className="bg-white rounded-lg shadow p-6 mb-6">
    <h2 className="text-xl font-semibold mb-4">Your Institution</h2>
    <p className="font-medium">Name: {providerMetadata.institutionName}</p>
    <p className="font-medium">Accreditation #: {providerMetadata.accreditationNumber}</p>
    <p className={`font-medium ${isAuthorized ? 'text-green-600' : 'text-red-600'}`}>
      Status: {isAuthorized ? 'Authorized' : 'Not Authorized'}
    </p>
    {!isAuthorized && (
      <p className="text-sm text-gray-600 mt-2">
        Contact the certificate system administrator to get authorized.
      </p>
    )}
  </div>
)}

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Pending Certificate Requests</h2>
            
            {requests.length > 0 ? (
              <div className="space-y-6">
                {requests.map(request => {
                  const studentInfo = studentMetadata[request.student] || {};
                  return (
                    <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="mb-4">
                        <h3 className="font-bold text-lg mb-2">Student Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p><span className="font-medium">Name:</span> {studentInfo.name || 'Not available'}</p>
                            <p><span className="font-medium">Email:</span> {studentInfo.email || 'Not available'}</p>
                            <p><span className="font-medium">Student ID:</span> {studentInfo.studentId || 'Not available'}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">Wallet Address:</span></p>
                            <p className="text-sm text-gray-600 break-all">{request.student}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h3 className="font-bold text-lg mb-2">Request Details</h3>
                        <p><span className="font-medium">Certificate Name:</span> {request.name}</p>
                        <p><span className="font-medium">Message:</span> {request.message || 'No message provided'}</p>
                      </div>

                      <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Certificate Type
        </label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          placeholder="e.g., Degree, Diploma"
          onChange={(e) => handleInputChange(request.id, 'certificateType', e.target.value)}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Certificate Name
        </label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          placeholder="Certificate Name"
          onChange={(e) => handleInputChange(request.id, 'name', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          className="w-full p-2 border rounded"
          placeholder="Certificate description"
          onChange={(e) => handleInputChange(request.id, 'description', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Certificate Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleInputChange(request.id, 'imageFile', file);
            }
          }}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => handleApprove(request.id)}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
          disabled={!certificateInputs[request.id]?.certificateType || 
                   !certificateInputs[request.id]?.name ||
                   !certificateInputs[request.id]?.description ||
                   !certificateInputs[request.id]?.imageFile}
        >
          Approve & Issue
        </button>
        
        <button
          onClick={() => handleCancel(request.id)}
          className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition"
        >
          Cancel Request
        </button>
      </div>
    </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No pending certificate requests.</p>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p>Please connect your wallet to view the provider dashboard</p>
        </div>
      )}
    </div>
  );
};

export default ProviderDashboard;