import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useEthereum } from '@/contexts/EthereumContext';
import CertificateNFTABI from '../../../artifacts/contracts/CertificateNFT.sol/CertificateNFT.json';

const OwnerDashboard = () => {
  const { account, provider } = useEthereum();
  const [instituteAddress, setInstituteAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const certificateNFTAddress = process.env.NEXT_PUBLIC_CERTIFICATE_NFT_ADDRESS || '';

  const authorizeInstitute = async () => {
    if (!provider || !account) return;
    
    try {
      setIsLoading(true);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        certificateNFTAddress,
        CertificateNFTABI.abi,
        signer
      );

      // Verify ownership
      const owner = await contract.owner();
      if (owner.toLowerCase() !== account.toLowerCase()) {
        throw new Error("You are not the contract owner");
      }

      const tx = await contract.authorizeInstitute(instituteAddress);
      await tx.wait();
      setMessage(`Successfully authorized ${instituteAddress}`);
      setInstituteAddress('');
    } catch (error) {
      console.error("Authorization error:", error);
      setMessage(error instanceof Error ? error.message : "Authorization failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Owner Dashboard</h1>
      
      <div className="bg-white rounded-lg shadow p-6 max-w-md">
        <h2 className="text-xl font-semibold mb-4">Authorize New Provider</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider Wallet Address
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={instituteAddress}
              onChange={(e) => setInstituteAddress(e.target.value)}
              placeholder="0x..."
            />
          </div>
          
          <button
            onClick={authorizeInstitute}
            disabled={!instituteAddress || isLoading}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isLoading ? "Authorizing..." : "Authorize Provider"}
          </button>
          
          {message && (
            <div className={`p-3 rounded ${
              message.includes("Success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;