// components/ProviderDashboard.tsx
import { useState } from 'react';
import { 
    FiInbox, 
    FiAward, 
    FiUser, 
    FiCheck, 
    FiX, 
    FiSend, 
    FiFilePlus,
    FiClock,    // Add this
    FiUpload    // Add this
  } from 'react-icons/fi';

type CertificateRequest = {
  id: string;
  studentName: string;
  studentUP: string;
  certificateName: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  dob: string;
  studentId: string;
  message?: string;
};

type NFTForm = {
  certificateName: string;
  studentUP: string;
  issueDate: string;
  description: string;
  image: File | null;
};

export default function ProviderDashboard() {
  // Sample data - replace with actual data from your contract/backend
  const [requests, setRequests] = useState<CertificateRequest[]>([
    {
      id: "1",
      studentName: "Alex Johnson",
      studentUP: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
      certificateName: "Bachelor of Science",
      requestDate: "2023-08-15",
      status: "pending",
      dob: "2000-05-15",
      studentId: "STU2023001",
      message: "Please include my specialization in Computer Science"
    },
    {
      id: "2",
      studentName: "Maria Garcia",
      studentUP: "0x7a3b2A69De6D89205A3Abf7f01ED13B2108B2c43",
      certificateName: "Machine Learning Certificate",
      requestDate: "2023-08-10",
      status: "pending",
      dob: "1999-11-22",
      studentId: "STU2023002"
    }
  ]);

  const [nftForm, setNftForm] = useState<NFTForm>({
    certificateName: "",
    studentUP: "",
    issueDate: new Date().toISOString().split('T')[0],
    description: "",
    image: null
  });

  const [activeTab, setActiveTab] = useState<'requests' | 'create'>('requests');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleApprove = (requestId: string) => {
    setRequests(requests.map(req => 
      req.id === requestId ? { ...req, status: 'approved' } : req
    ));
    // Auto-fill the NFT form if switching to create tab
    const approvedRequest = requests.find(req => req.id === requestId);
    if (approvedRequest) {
      setNftForm({
        ...nftForm,
        certificateName: approvedRequest.certificateName,
        studentUP: approvedRequest.studentUP
      });
    }
  };

  const handleReject = (requestId: string) => {
    setRequests(requests.map(req => 
      req.id === requestId ? { ...req, status: 'rejected' } : req
    ));
  };

  const handleNftFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNftForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNftForm(prev => ({ ...prev, image: e.target.files![0] }));
    }
  };

  const handleMintNFT = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate NFT minting
    console.log('Minting NFT with:', nftForm);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      // Reset form after successful mint
      setNftForm({
        certificateName: "",
        studentUP: "",
        issueDate: new Date().toISOString().split('T')[0],
        description: "",
        image: null
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Institution Dashboard</h1>
            <p className="text-gray-600">Manage certificate requests and issue NFTs</p>
          </div>
          <div className="mt-4 md:mt-0 bg-white p-3 rounded-lg shadow-sm">
            <p className="text-sm font-medium">Logged in as: <span className="text-blue-600">Tech University</span></p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-3 px-6 font-medium text-sm flex items-center ${activeTab === 'requests' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FiInbox className="mr-2" />
            Certificate Requests
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {requests.filter(r => r.status === 'pending').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-3 px-6 font-medium text-sm flex items-center ${activeTab === 'create' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FiFilePlus className="mr-2" />
            Create Certificate NFT
          </button>
        </div>

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center p-6 border-b">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FiInbox className="text-blue-600 text-xl" />
              </div>
              <h2 className="text-xl font-semibold">Pending Requests</h2>
            </div>

            {requests.filter(r => r.status === 'pending').length > 0 ? (
              <div className="divide-y">
                {requests.filter(r => r.status === 'pending').map(request => (
                  <div key={request.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="mb-4 md:mb-0">
                        <h3 className="font-medium">{request.certificateName}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <FiUser className="mr-1" />
                          <span>{request.studentName}</span>
                          <span className="mx-2">•</span>
                          <span>ID: {request.studentId}</span>
                          <span className="mx-2">•</span>
                          <span>DoB: {request.dob}</span>
                        </div>
                        {request.message && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Note:</span> {request.message}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="flex items-center px-4 py-2 border border-green-500 text-green-600 rounded-md hover:bg-green-50 transition"
                        >
                          <FiCheck className="mr-2" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="flex items-center px-4 py-2 border border-red-500 text-red-600 rounded-md hover:bg-red-50 transition"
                        >
                          <FiX className="mr-2" />
                          Reject
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-400 flex items-center">
                      <FiClock className="mr-1" />
                      Requested on {new Date(request.requestDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">No pending requests</p>
                <p className="text-sm text-gray-400 mt-1">Students' requests will appear here</p>
              </div>
            )}

            {/* Approved/Rejected Section */}
            <div className="p-6 border-t">
              <h3 className="font-medium mb-4">Request History</h3>
              <div className="space-y-3">
                {requests.filter(r => r.status !== 'pending').map(request => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{request.certificateName}</p>
                      <p className="text-sm text-gray-600">{request.studentName}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      request.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Create NFT Tab */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-6">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <FiAward className="text-purple-600 text-xl" />
              </div>
              <h2 className="text-xl font-semibold">Create Certificate NFT</h2>
            </div>

            {isSuccess ? (
              <div className="text-center py-8">
                <FiCheck className="mx-auto text-green-500 text-4xl mb-3" />
                <h3 className="text-lg font-medium mb-1">Certificate NFT Created!</h3>
                <p className="text-gray-600 mb-4">The NFT has been sent to the student's Universal Profile</p>
                <button 
                  onClick={() => setIsSuccess(false)}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Create Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleMintNFT} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="certificateName" className="block text-sm font-medium text-gray-700 mb-1">
                      Certificate Name*
                    </label>
                    <input
                      type="text"
                      id="certificateName"
                      name="certificateName"
                      required
                      value={nftForm.certificateName}
                      onChange={handleNftFormChange}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Bachelor of Computer Science"
                    />
                  </div>

                  <div>
                    <label htmlFor="studentUP" className="block text-sm font-medium text-gray-700 mb-1">
                      Student UP Address*
                    </label>
                    <input
                      type="text"
                      id="studentUP"
                      name="studentUP"
                      required
                      value={nftForm.studentUP}
                      onChange={handleNftFormChange}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0x..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Issue Date*
                    </label>
                    <input
                      type="date"
                      id="issueDate"
                      name="issueDate"
                      required
                      value={nftForm.issueDate}
                      onChange={handleNftFormChange}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                      Certificate Image*
                    </label>
                    <div className="mt-1 flex items-center">
                      <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <FiUpload className="inline mr-2" />
                        Upload File
                        <input
                          type="file"
                          id="image"
                          name="image"
                          required
                          accept=".png,.jpg,.jpeg"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <span className="ml-3 text-sm text-gray-500">
                        {nftForm.image ? nftForm.image.name : 'No file chosen'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={nftForm.description}
                    onChange={handleNftFormChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Details about the certificate..."
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition flex justify-center items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Minting NFT...
                      </span>
                    ) : (
                      <>
                        <FiSend className="mr-2" />
                        Mint and Send Certificate NFT
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}