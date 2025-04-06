// components/StudentDashboard.tsx
import { useState } from 'react';
import { FiUser, FiBook, FiSend, FiClock, FiCheckCircle } from 'react-icons/fi';

type NFT = {
  id: string;
  name: string;
  image: string;
  institute: string;
  issueDate: string;
  type: string;
};

type Profile = {
  name: string;
  email: string;
  dob: string;
  studentId: string;
  upAddress: string;
};

export default function StudentDashboard() {
  // Sample data - replace with actual data from your contract/backend
  const [profile] = useState<Profile>({
    name: "Alex Johnson",
    email: "alex.j@example.com",
    dob: "2000-05-15",
    studentId: "STU2023001",
    upAddress: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7"
  });

  const [nfts] = useState<NFT[]>([
    {
      id: "1",
      name: "Bachelor of Science",
      image: "/images/cert1.png",
      institute: "Tech University",
      issueDate: "2023-06-20",
      type: "Degree"
    },
    {
      id: "2",
      name: "Machine Learning Certificate",
      image: "/images/cert2.png",
      institute: "Data Science Institute",
      issueDate: "2023-03-10",
      type: "Course"
    }
  ]);

  const [requestForm, setRequestForm] = useState({
    certificateName: "",
    instituteName: "",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRequestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRequestForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate request submission
    setTimeout(() => {
      console.log('Request submitted:', {
        ...requestForm,
        studentName: profile.name,
        studentId: profile.studentId,
        dob: profile.dob
      });
      setIsSubmitting(false);
      setIsSuccess(true);
      setRequestForm({ certificateName: "", instituteName: "", message: "" });
    }, 1500);
  };

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
            <p className="text-sm font-medium">UP Address: <span className="text-blue-600">{profile.upAddress.slice(0, 6)}...{profile.upAddress.slice(-4)}</span></p>
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
                <p className="font-medium">{profile.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium">{profile.dob}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Student ID</p>
                <p className="font-medium">{profile.studentId}</p>
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

            {nfts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nfts.map(nft => (
                  <div key={nft.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="h-40 bg-gray-100 rounded-md mb-3 overflow-hidden">
                      <img 
                        src={nft.image} 
                        alt={nft.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <h3 className="font-semibold">{nft.name}</h3>
                    <p className="text-sm text-gray-600">{nft.institute}</p>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <FiClock className="mr-1" />
                      <span>Issued: {new Date(nft.issueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{nft.type}</span>
                      <button className="text-sm text-blue-600 hover:underline">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No certificates found</p>
                <p className="text-sm text-gray-400 mt-1">Request your first certificate from an institution</p>
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

            {isSuccess ? (
              <div className="text-center py-8">
                <FiCheckCircle className="mx-auto text-green-500 text-4xl mb-3" />
                <h3 className="text-lg font-medium mb-1">Request Submitted!</h3>
                <p className="text-gray-600 mb-4">The institution will review your request</p>
                <button 
                  onClick={() => setIsSuccess(false)}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  New Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="space-y-6">
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
                      value={requestForm.certificateName}
                      onChange={handleRequestChange}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Bachelor of Computer Science"
                    />
                  </div>

                  <div>
                    <label htmlFor="instituteName" className="block text-sm font-medium text-gray-700 mb-1">
                      Institute Name*
                    </label>
                    <input
                      type="text"
                      id="instituteName"
                      name="instituteName"
                      required
                      value={requestForm.instituteName}
                      onChange={handleRequestChange}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Tech University"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    value={requestForm.message}
                    onChange={handleRequestChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any special instructions or notes"
                  />
                </div>

                <div className="pt-2">
                  <p className="text-sm text-gray-500 mb-3">
                    The following information will be automatically included: 
                    <span className="block mt-1">
                      Your Name: <span className="font-medium">{profile.name}</span>, 
                      Student ID: <span className="font-medium">{profile.studentId}</span>, 
                      DoB: <span className="font-medium">{profile.dob}</span>
                    </span>
                  </p>

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
                        Sending Request...
                      </span>
                    ) : (
                      'Send Request to Institute'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}