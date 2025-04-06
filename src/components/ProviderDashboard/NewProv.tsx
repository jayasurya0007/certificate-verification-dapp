import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useEthereum } from '@/contexts/EthereumContext';
import { FiInbox, FiAward, FiUser, FiCheck, FiFileText, FiInfo, FiUpload } from 'react-icons/fi';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState<number | null>(null);

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
    } finally {
      setIsLoading(false);
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
      alert('Please fill all required fields');
      return;
    }

    try {
      setIsApproving(requestId);
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
    } finally {
      setIsApproving(null);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Provider Dashboard</h1>
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
            <h1 className="text-3xl font-bold text-gray-900">Institution Dashboard</h1>
            <p className="text-gray-600">Review and approve certificate requests</p>
          </div>
          {providerMetadata && (
            <div className="mt-4 md:mt-0 bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm font-medium">
                Logged in as: <span className="text-blue-600">{providerMetadata.institutionName}</span>
              </p>
            </div>
          )}
        </div>

        {/* Provider Info */}
        {providerMetadata && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FiInfo className="text-blue-600 text-xl" />
              </div>
              <h2 className="text-xl font-semibold">Institution Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Institution Name</p>
                <p className="font-medium">{providerMetadata.institutionName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Accreditation Number</p>
                <p className="font-medium">{providerMetadata.accreditationNumber}</p>
              </div>
            </div>
          </div>
        )}

        {/* Requests Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center p-6 border-b">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <FiInbox className="text-purple-600 text-xl" />
            </div>
            <h2 className="text-xl font-semibold">Pending Certificate Requests</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading requests...</p>
            </div>
          ) : requests.length > 0 ? (
            <div className="divide-y">
              {requests.map((req) => (
                <div key={req.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="mb-4 md:mb-0">
                      <h3 className="font-medium">{req.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <FiUser className="mr-1" />
                        
                      </div>
                      {req.message && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Note:</span> {req.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Certificate Type*
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Bachelor's Degree"
                        onChange={(e) => handleInputChange(req.id, 'certificateType', e.target.value)}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Token URI*
                      </label>
                      <input
                        type="text"
                        placeholder="IPFS URI for metadata"
                        onChange={(e) => handleInputChange(req.id, 'tokenURI', e.target.value)}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Institute Name
                      </label>
                      <input
                        type="text"
                        value={providerMetadata?.institutionName || ''}
                        readOnly
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={isApproving === req.id}
                      className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition ${
                        isApproving === req.id ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {isApproving === req.id ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Approving...
                        </>
                      ) : (
                        <>
                          <FiCheck className="mr-2" />
                          Approve Request
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">No pending requests</p>
              <p className="text-sm text-gray-400 mt-1">Student requests will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;