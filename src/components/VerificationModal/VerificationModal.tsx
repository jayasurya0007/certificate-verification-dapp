import { useState, useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import { Certificate } from '@/contexts/ContractContext';
import { useContractContext } from '@/contexts/ContractContext';

const VerificationModal = ({ certificate, onClose }: { certificate: Certificate, onClose: () => void }) => {
  const { checkInstituteAuthorization } = useContractContext();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loadingVerification, setLoadingVerification] = useState(true);

  useEffect(() => {
    const verifyInstitute = async () => {
      try {
        const instituteAddress = certificate.metadata?.institution?.address;
        if (!instituteAddress) {
          setIsVerified(false);
          return;
        }

        const verified = await checkInstituteAuthorization(instituteAddress);
        setIsVerified(verified);
      } catch (error) {
        console.error('Verification error:', error);
        setIsVerified(false);
      } finally {
        setLoadingVerification(false);
      }
    };

    verifyInstitute();
  }, [certificate]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        {isVerified === true ? (
          <div className="text-center mb-6">
            <FiCheckCircle className="text-4xl text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">Certificate Verified</h3>
            <p className="text-gray-600 mt-2">This certificate has been successfully verified on the blockchain</p>
          </div>
        ) : (
          <div className="text-center mb-6">
            {loadingVerification ? (
              <>
                <FiClock className="text-4xl text-yellow-500 mx-auto mb-4 animate-pulse" />
                <h3 className="text-2xl font-bold text-gray-900">Verifying Certificate</h3>
                <p className="text-gray-600 mt-2">Checking institute authorization status...</p>
              </>
            ) : (
              <>
                <FiXCircle className="text-4xl text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">Verification Failed</h3>
                <p className="text-gray-600 mt-2">Issuing institute is not authorized</p>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Certificate Name</label>
              <p className="text-gray-900">{certificate.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Issuing Institute</label>
              <div className="mt-1">
                <p className="text-gray-900">{certificate.institute}</p>
                {certificate.metadata?.institution?.address && (
                  <div className="mt-2 flex items-center gap-2">
                    {loadingVerification ? (
                      <>
                        <FiClock className="text-yellow-500 animate-pulse" />
                        <span className="text-sm text-yellow-600">Verifying institution...</span>
                      </>
                    ) : isVerified ? (
                      <>
                        <FiCheckCircle className="text-green-500" />
                        <span className="text-sm text-green-600">Verified Institution</span>
                      </>
                    ) : (
                      <>
                        <FiXCircle className="text-red-500" />
                        <span className="text-sm text-red-600">Unverified Institution</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Issue Date</label>
              <p className="text-gray-900">
                {new Date(certificate.issueDate * 1000).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Certificate Type</label>
              <p className="text-gray-900">{certificate.certificateType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Institute Address</label>
              <p className="text-gray-900 break-all">
                  {certificate.metadata?.institution?.address || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Certificate ID</label>
              <p className="text-gray-900">{certificate.id}</p>
            </div>
          </div>
        </div>

        {certificate.metadata?.image && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <label className="text-sm font-medium text-gray-500 block mb-4">Certificate Preview</label>
            <img
              src={certificate.metadata.image.startsWith('ipfs://') 
                ? `https://gateway.pinata.cloud/ipfs/${certificate.metadata.image.split('ipfs://')[1]}`
                : certificate.metadata.image}
              alt="Certificate preview"
              className="rounded-lg border border-gray-200 mx-auto max-h-48"
            />
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full bg-[#8A2BE2] text-white py-2 px-4 rounded-lg hover:bg-[#6A1EBA] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default VerificationModal;