import React, { useState, useEffect } from 'react';
import { useEthereum } from '@/contexts/EthereumContext';
import { useContractContext } from '@/contexts/ContractContext';
import CertificateSearch from '../CertificateSearch/CertificateSearch';
import { FiUser, FiMail, FiBook } from 'react-icons/fi';

const StudentDashboard = () => {
  const { account } = useEthereum();
  const {
    fetchStudentProfile,
    getCertificatesByAddress,
    requestCertificateIssuance,
  } = useContractContext();

  const [profile, setProfile] = useState<any>({});
  const [certificates, setCertificates] = useState<any[]>([]);
  const [providerAddress, setProviderAddress] = useState('');
  const [certificateName, setCertificateName] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!account) return;
      setIsLoading(true);
      try {
        const profileData = await fetchStudentProfile(account);
        if (profileData) setProfile(profileData);
        const certs = await getCertificatesByAddress(account);
        setCertificates(certs);
      } catch (error) {
        console.error('Error loading student dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [account, fetchStudentProfile, getCertificatesByAddress]);

  const handleRequestCertificate = async () => {
    if (!providerAddress || !certificateName) {
      alert('Please fill in all required fields.');
      return;
    }
    setRequesting(true);
    try {
      await requestCertificateIssuance(providerAddress, certificateName, message);
      alert('Certificate request submitted successfully!');
      setProviderAddress('');
      setCertificateName('');
      setMessage('');
    } catch (error) {
      console.error('Error requesting certificate:', error);
      alert('Failed to submit certificate request.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center text-blue-700 mb-8">Student Dashboard</h2>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <span className="text-gray-500">Loading...</span>
        </div>
      ) : (
        <>
          {/* Profile Section */}
          <section className="mb-8 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-blue-600 mb-4 pl-2 border-l-4 border-blue-300">Profile</h3>
            <div className="space-y-2 pl-2">
              <div className="flex items-center gap-2 text-gray-700">
                <FiUser className="text-blue-500" /> <span>Name:</span> <span className="font-medium">{profile.name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <FiMail className="text-blue-500" /> <span>Email:</span> <span className="font-medium">{profile.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <FiBook className="text-blue-500" /> <span>Student ID:</span> <span className="font-medium">{profile.studentId || 'N/A'}</span>
              </div>
            </div>
          </section>

          {/* Certificates Section */}
          <section className="mb-8 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-blue-600 mb-4 pl-2 border-l-4 border-blue-300">Your Certificates</h3>
            {certificates.length === 0 ? (
              <p className="text-gray-500 pl-2">No certificates found.</p>
            ) : (
              <ul className="space-y-3 pl-2">
                {certificates.map((cert) => (
                  <li key={cert.id} className="bg-blue-50 hover:bg-blue-100 transition rounded-md px-4 py-2 border-l-4 border-blue-400 shadow-sm">
                    <div className="font-semibold">{cert.name}</div>
                    <div className="text-sm text-gray-600">
                      from <span className="font-medium">{cert.institute}</span>
                      {' '}({new Date(cert.issueDate * 1000).toLocaleDateString()})
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Request Certificate Section */}
          <section className="mb-8 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-blue-600 mb-4 pl-2 border-l-4 border-blue-300">Request Certificate Issuance</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Provider Address:</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={providerAddress}
                  onChange={(e) => setProviderAddress(e.target.value)}
                  placeholder="Enter provider's wallet address"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Certificate Name:</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={certificateName}
                  onChange={(e) => setCertificateName(e.target.value)}
                  placeholder="Enter certificate name"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Message (optional):</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[80px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter a message (optional)"
                />
              </div>
              <button
                onClick={handleRequestCertificate}
                disabled={requesting}
                className={`w-full md:w-auto bg-blue-600 text-white font-semibold px-6 py-2 rounded-md shadow hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed`}
              >
                {requesting ? 'Requesting...' : 'Request Certificate'}
              </button>
            </div>
          </section>

          {/* Certificate Search Section */}
          <section className="mt-8">
            <h3 className="text-lg font-semibold text-blue-600 mb-4 pl-2 border-l-4 border-blue-300">Search Certificates</h3>
            <CertificateSearch />
          </section>
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
