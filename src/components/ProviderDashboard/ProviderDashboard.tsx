import React, { useEffect, useState } from 'react';
import { useEthereum } from '@/contexts/EthereumContext';
import { useContractContext,CertificateRequest,StudentMetadata,ProviderMetadata } from '@/contexts/ContractContext';
import { uploadJSONToIPFS, uploadFileToIPFS } from '../../../utils/ipfs';
import { FiUser, FiHome, FiFileText, FiCheckCircle, FiXCircle, FiUpload, FiShield, FiAward } from 'react-icons/fi';


interface CertificateInput {
  certificateType: string;
  name: string;
  description: string;
  imageFile: File | null;
}

const ProviderDashboard = () => {
  const { account } = useEthereum();
  const {
    fetchProviderCertificateRequests,
    fetchStudentMetadata,
    fetchProviderMetadata,
    approveCertificateRequest,
    cancelCertificateRequest,
    checkInstituteAuthorization
  } = useContractContext();

  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [studentMetadata, setStudentMetadata] = useState<{ [key: string]: StudentMetadata }>({});
  const [providerMetadata, setProviderMetadata] = useState<ProviderMetadata | null>(null);
  const [certificateInputs, setCertificateInputs] = useState<{ [key: number]: CertificateInput }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      if (!account) return;
      setIsLoading(true);
      try {
        const [requests, providerMeta, authorized] = await Promise.all([
          fetchProviderCertificateRequests(),
          fetchProviderMetadata(account),
          checkInstituteAuthorization(account)
        ]);
        setRequests(requests);
        setProviderMetadata(providerMeta);
        setIsAuthorized(authorized);

        const metadataMap: { [key: string]: StudentMetadata } = {};
        await Promise.all(
          requests.map(async (req) => {
            if (req.studentMetadataHash) {
              const meta = await fetchStudentMetadata(req.student, req.studentMetadataHash);
              if (meta) metadataMap[req.student] = meta;
            }
          })
        );
        setStudentMetadata(metadataMap);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [account]);

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
    if (!account || !providerMetadata) return;
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
      const { cid: imageCid } = await uploadFileToIPFS(input.imageFile);
      const imageURI = `ipfs://${imageCid}`;
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
      const { cid: metadataCid } = await uploadJSONToIPFS(metadata);
      const tokenURI = `ipfs://${metadataCid}`;
      await approveCertificateRequest(
        requestId,
        input.certificateType,
        tokenURI,
        providerMetadata.institutionName
      );
      alert('Certificate approved successfully!');
      const updatedRequests = await fetchProviderCertificateRequests();
      setRequests(updatedRequests);
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Failed to approve certificate request');
    }
  };

  const handleCancel = async (requestId: number) => {
    if (!account) return;
    
    try {
      // Double-check authorization
      const isAuthorized = await checkInstituteAuthorization(account);
      if (!isAuthorized) {
        alert('Authorization revoked - please reconnect');
        return;
      }
  
      // Execute cancellation
      await cancelCertificateRequest(requestId);
      
      // Optimistic UI update
      setRequests(prev => prev.filter(r => r.id !== requestId));
      
      alert('Request cancelled successfully!');
  
    } catch (err) {
      console.error('Cancellation failed:', err);
      alert(`Cancellation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Refresh from blockchain
      const updatedRequests = await fetchProviderCertificateRequests();
      setRequests(updatedRequests);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#8A2BE2]/5 via-white to-white p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="animate-pulse flex flex-col items-center justify-center h-64">
            <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
            <div className="w-64 h-4 bg-gray-200 rounded mb-2"></div>
            <div className="w-48 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#8A2BE2]/5 via-white to-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#191A23]">
            Provider Dashboard
          </h1>
          <div className="bg-[#191A23] text-white px-4 py-2 rounded-full text-sm">
            {account ? `${account.substring(0, 6)}...${account.substring(38)}` : 'Not Connected'}
          </div>
        </div>
        {account ? (
          <>
            {providerMetadata && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <FiHome className="mr-2 text-[#8A2BE2]" />
                  Your Institution
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="flex items-center text-gray-700 mb-2">
                      <FiUser className="mr-2 text-[#8A2BE2]" />
                      <span className="font-medium">Name:</span> {providerMetadata.institutionName}
                    </p>
                    <p className="flex items-center text-gray-700">
                      <FiFileText className="mr-2 text-[#8A2BE2]" />
                      <span className="font-medium">Accreditation #:</span> {providerMetadata.accreditationNumber}
                    </p>
                  </div>
                  <div>
                    <p className={`flex items-center ${isAuthorized ? 'text-green-600' : 'text-red-600'}`}>
                      <FiShield className="mr-2" />
                      <span className="font-medium">Status:</span> {isAuthorized ? 'Authorized' : 'Not Authorized'}
                    </p>
                    {!isAuthorized && (
                      <p className="text-sm text-gray-600 mt-2">
                        Contact the certificate system administrator to get authorized.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <FiAward className="mr-2 text-[#8A2BE2]" />
                Pending Certificate Requests
              </h2>
              {requests.length > 0 ? (
                <div className="space-y-6">
                  {requests.map(request => {
                    const studentInfo = studentMetadata[request.student] || {};
                    return (
                      <div key={request.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="mb-6">
                          <h3 className="font-bold text-lg mb-4 flex items-center">
                            <FiUser className="mr-2 text-[#8A2BE2]" />
                            Student Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <p className="flex items-center">
                                <span className="font-medium w-24">Name:</span>
                                <span>{studentInfo.name || 'Not available'}</span>
                              </p>
                              <p className="flex items-center">
                                <span className="font-medium w-24">Email:</span>
                                <span>{studentInfo.email || 'Not available'}</span>
                              </p>
                              <p className="flex items-center">
                                <span className="font-medium w-24">Student ID:</span>
                                <span>{studentInfo.studentId || 'Not available'}</span>
                              </p>
                            </div>
                            <div>
                              <p className="font-medium mb-1">Wallet Address:</p>
                              <p className="text-sm text-gray-600 break-all bg-gray-50 p-2 rounded">
                                {request.student}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mb-6">
                          <h3 className="font-bold text-lg mb-4 flex items-center">
                            <FiFileText className="mr-2 text-[#8A2BE2]" />
                            Request Details
                          </h3>
                          <div className="space-y-2">
                            <p className="flex items-center">
                              <span className="font-medium w-24">Certificate:</span>
                              <span>{request.name}</span>
                            </p>
                            <p className="flex">
                              <span className="font-medium w-24">Message:</span>
                              <span>{request.message || 'No message provided'}</span>
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Certificate Type
                            </label>
                            <input
                              type="text"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A2BE2] focus:border-transparent"
                              placeholder="e.g., Degree, Diploma"
                              onChange={(e) => handleInputChange(request.id, 'certificateType', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Certificate Name
                            </label>
                            <input
                              type="text"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A2BE2] focus:border-transparent"
                              placeholder="Certificate Name"
                              onChange={(e) => handleInputChange(request.id, 'name', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description
                            </label>
                            <textarea
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A2BE2] focus:border-transparent"
                              placeholder="Certificate description"
                              rows={3}
                              onChange={(e) => handleInputChange(request.id, 'description', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Certificate Image
                            </label>
                            <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#8A2BE2] transition-colors bg-gray-50">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleInputChange(request.id, 'imageFile', file);
                                  }
                                }}
                                className="hidden"
                              />
                              {certificateInputs[request.id]?.imageFile ? (
                                <div className="flex flex-col items-center text-center">
                                  <FiFileText className="text-3xl text-[#8A2BE2] mb-2" />
                                  <span className="font-medium text-[#191A23]">
                                    {certificateInputs[request.id]?.imageFile?.name}
                                  </span>
                                  <span className="text-sm text-gray-500 mt-1">Click to change file</span>
                                </div>
                              ) : (
                                <>
                                  <FiUpload className="text-3xl text-[#8A2BE2] mb-3" />
                                  <span className="text-sm text-[#191A23]/80 text-center">
                                    Drag and drop your certificate image here<br />
                                    or click to browse files
                                  </span>
                                  <span className="text-xs text-gray-500 mt-2">Supports: JPG, PNG (max 5MB)</span>
                                </>
                              )}
                            </label>
                          </div>
                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={() => handleApprove(request.id)}
                              disabled={!certificateInputs[request.id]?.certificateType ||
                                !certificateInputs[request.id]?.name ||
                                !certificateInputs[request.id]?.description ||
                                !certificateInputs[request.id]?.imageFile}
                              className="flex-1 bg-gradient-to-r from-[#8A2BE2] to-[#4B0082] text-white py-3 px-6 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              <FiCheckCircle className="mr-2" />
                              Approve & Issue
                            </button>
                            <button
                              onClick={() => handleCancel(request.id)}
                              className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center"
                            >
                              <FiXCircle className="mr-2" />
                              Cancel Request
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FiAward className="text-3xl text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No pending requests</h3>
                  <p className="mt-1 text-gray-500">When students request certificates, they'll appear here.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <FiUser className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Wallet not connected</h3>
            <p className="text-gray-500">Please connect your wallet to view the provider dashboard</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;
