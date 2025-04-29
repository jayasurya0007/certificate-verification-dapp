import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import UserRegistryABI from '../../artifacts/contracts/UserRegistry.sol/UserRegistry.json';
import CertificateNFTABI from '../../artifacts/contracts/CertificateNFT.sol/CertificateNFT.json';
import { useEthereum } from '@/contexts/EthereumContext';

interface UserData {
  role: string;
  registered: boolean;
}

export interface Certificate {
  id: string;
  name: string;
  institute: string;
  issueDate: number;
  certificateType: string;
  student: string;
  tokenURI: string;
  metadata?: any;
}

interface ContractContextType {
  getContract: (provider: any) => any;
  userData: UserData | null;
  loading: boolean;
  refetchUserData: () => void;
  getCertificatesByAddress: (address: string) => Promise<Certificate[]>;
  checkIsOwner: (address: string) => Promise<boolean>;
}

interface ContractContextProviderProps {
  children: ReactNode;
}

const ContractContext = createContext<ContractContextType | null>(null);

export const ContractContextProvider = ({ children }: ContractContextProviderProps) => {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const certificateNFTAddress = process.env.NEXT_PUBLIC_CERTIFICATE_NFT_ADDRESS || '';
  const { account, provider } = useEthereum();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const getContract = (provider: any) => {
    if (!provider || !contractAddress) return null;
    return new ethers.Contract(contractAddress, UserRegistryABI.abi, provider);
  };

  const fetchUserData = async () => {
    if (account && provider) {
      setLoading(true);
      try {
        const contract = getContract(provider);
        if (!contract) {
          setUserData(null);
          return;
        }
        const [role] = await contract.getUser(account);
        const registered = await contract.isUserRegistered(account);
        setUserData({ role: role.toLowerCase(), registered });
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [account, provider]);

  const refetchUserData = () => {
    fetchUserData();
  };

  // --- NEW: Certificate Search Logic ---
  const getCertificatesByAddress = async (searchAddress: string): Promise<Certificate[]> => {
    if (!provider || !certificateNFTAddress) {
      throw new Error('Provider or contract address not available');
    }

    const signer = await provider.getSigner();
    const contract = new ethers.Contract(certificateNFTAddress, CertificateNFTABI.abi, signer);

    const certificateIds: bigint[] = await contract.getStudentCertificates(searchAddress);

    if (certificateIds.length === 0) {
      return [];
    }

    const certificatesData: Certificate[] = await Promise.all(
      certificateIds.map(async (id: bigint) => {
        const [name, institute, issueDate, certificateType, student] = await contract.getCertificateDetails(id);
        const tokenURI = await contract.tokenURI(id);

        let metadata = null;
        try {
          const metadataHash = tokenURI.replace('ipfs://', '');
          const response = await fetch(`https://ipfs.io/ipfs/${metadataHash}`);
          metadata = await response.json();
        } catch (err) {
          console.error('Metadata fetch error:', err);
        }

        return {
          id: id.toString(),
          name,
          institute,
          issueDate: Number(issueDate),
          certificateType,
          student,
          tokenURI,
          metadata,
        };
      })
    );

    return certificatesData;
  };

  // --- NEW: Owner Check Logic ---
  const checkIsOwner = async (address: string): Promise<boolean> => {
    if (!provider || !certificateNFTAddress || !address) return false;
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(certificateNFTAddress, CertificateNFTABI.abi, signer);
      const owner = await contract.owner();
      return owner.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Error checking ownership:', error);
      return false;
    }
  };

  return (
    <ContractContext.Provider
      value={{
        getContract,
        userData,
        loading,
        refetchUserData,
        getCertificatesByAddress,
        checkIsOwner,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContractContext = () => {
  const ctx = useContext(ContractContext);
  if (!ctx) throw new Error('useContractContext must be used within ContractContextProvider');
  return ctx;
};
