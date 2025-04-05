// components/SplitRegistrationForm.tsx
import { useState } from 'react';
import { FiUser, FiHome, FiUpload, FiArrowLeft } from 'react-icons/fi';

type UserRole = 'student' | 'provider' | null;
type FormData = {
  name: string;
  email: string;
  dob: string;
  uniqueIdentifier: string;
  institutionName: string;
  accreditationNumber: string;
  proofOfAuthority: File | null;
};

export default function SplitRegistrationForm() {
  const [role, setRole] = useState<UserRole>('student');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    dob: '',
    uniqueIdentifier: '',
    institutionName: '',
    accreditationNumber: '',
    proofOfAuthority: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, proofOfAuthority: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Submitted:', { role, ...formData });
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Registration Successful!</h2>
        <p className="mb-6">You're registered as a {role}.</p>
        <button 
          onClick={() => setIsSuccess(false)}
          className="flex items-center justify-center mx-auto bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition"
        >
          <FiArrowLeft className="mr-2" />
          Back to Registration
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Left Side - Role Selection */}
      <div className="w-full md:w-1/3 bg-blue-700 text-white p-8">
        <h1 className="text-2xl font-bold mb-8">Join as...</h1>
        
        <div className="space-y-6">
          <div 
            onClick={() => setRole('student')}
            className={`p-6 rounded-lg cursor-pointer transition-all flex items-center ${role === 'student' ? 'bg-blue-600 shadow-md' : 'bg-blue-800 hover:bg-blue-600'}`}
          >
            <FiUser className="text-2xl mr-4" />
            <div>
              <h2 className="font-bold text-lg">Student</h2>
              <p className="text-blue-100 text-sm mt-1">
                Register to receive and manage your certificates
              </p>
            </div>
          </div>

          <div 
            onClick={() => setRole('provider')}
            className={`p-6 rounded-lg cursor-pointer transition-all flex items-center ${role === 'provider' ? 'bg-blue-600 shadow-md' : 'bg-blue-800 hover:bg-blue-600'}`}
          >
            <FiHome className="text-2xl mr-4" />
            <div>
              <h2 className="font-bold text-lg">Certificate Provider</h2>
              <p className="text-blue-100 text-sm mt-1">
                Register your institution to issue certificates
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full md:w-2/3 p-8 bg-white">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {role === 'student' ? 'Student Registration' : 'Provider Registration'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Common Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address*
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Student Specific Fields */}
          {role === 'student' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth*
                </label>
                <input
                  type="date"
                  id="dob"
                  name="dob"
                  required
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="uniqueIdentifier" className="block text-sm font-medium text-gray-700 mb-1">
                  Student ID/Unique Identifier*
                </label>
                <input
                  type="text"
                  id="uniqueIdentifier"
                  name="uniqueIdentifier"
                  required
                  value={formData.uniqueIdentifier}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          ) : (
            /* Provider Specific Fields */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="institutionName" className="block text-sm font-medium text-gray-700 mb-1">
                    Institution Name*
                  </label>
                  <input
                    type="text"
                    id="institutionName"
                    name="institutionName"
                    required
                    value={formData.institutionName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="accreditationNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Accreditation Number*
                  </label>
                  <input
                    type="text"
                    id="accreditationNumber"
                    name="accreditationNumber"
                    required
                    value={formData.accreditationNumber}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="proofOfAuthority" className="block text-sm font-medium text-gray-700 mb-1">
                  Proof of Authority (PDF/JPG)*
                </label>
                <div className="mt-1 flex items-center">
                  <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <FiUpload className="inline mr-2" />
                    Upload File
                    <input
                      type="file"
                      id="proofOfAuthority"
                      name="proofOfAuthority"
                      required
                      accept=".pdf,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <span className="ml-3 text-sm text-gray-500">
                    {formData.proofOfAuthority ? formData.proofOfAuthority.name : 'No file chosen'}
                  </span>
                </div>
              </div>
            </>
          )}

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
                  Processing...
                </span>
              ) : (
                'Complete Registration'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}