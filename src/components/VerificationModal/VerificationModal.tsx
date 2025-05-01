import {FiCheckCircle } from 'react-icons/fi';
import { Certificate } from '@/contexts/ContractContext';

const VerificationModal = ({ certificate, onClose }: { certificate: Certificate, onClose: () => void }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
          
          <div className="text-center mb-6">
            <FiCheckCircle className="text-4xl text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">Certificate Verified</h3>
            <p className="text-gray-600 mt-2">This certificate has been successfully verified on the blockchain</p>
          </div>
  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Certificate Name</label>
                <p className="text-gray-900">{certificate.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Issuing Institute</label>
                <p className="text-gray-900">{certificate.institute}</p>
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