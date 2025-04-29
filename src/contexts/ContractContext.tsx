import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ethers } from 'ethers';
import UserRegistryABI from '../../artifacts/contracts/UserRegistry.sol/UserRegistry.json';
import CertificateNFTABI from '../../artifacts/contracts/CertificateNFT.sol/CertificateNFT.json';
import { useEthereum } from '@/contexts/EthereumContext';

// Interface Definitions
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

export interface RegisteredUser {
  address: string;
  role: string;
  metadataHash: string;
}

interface UserData {
  role: string;
  registered: boolean;
}

interface ContractContextType {
  // User Registry Functions
  getContract: (provider: any) => ethers.Contract | null;
  userData: UserData | null;
  loading: boolean;
  refetchUserData: () => void;
  getAllRegisteredUsers: () => Promise<RegisteredUser[]>;
  getRegisteredUser: (address: string) => Promise<RegisteredUser>;

  // Certificate NFT Functions
  getCertificatesByAddress: (address: string) => Promise<Certificate[]>;
  checkIsOwner: (address: string) => Promise<boolean>;
  authorizeInstitute: (address: string) => Promise<void>;
  certificateNFTAddress: string;
}

interface ContractContextProviderProps {
  children: ReactNode;
}

const ContractContext = createContext<ContractContextType | null>(null);

export const ContractContextProvider = ({ children }: ContractContextProviderProps) => {
  const userRegistryAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const certificateNFTAddress = process.env.NEXT_PUBLIC_CERTIFICATE_NFT_ADDRESS || '';
  const { account, provider } = useEthereum();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // User Registry contract instance getter
  const getContract = (provider: any): ethers.Contract | null => {
    if (!provider || !userRegistryAddress) return null;
    return new ethers.Contract(userRegistryAddress, UserRegistryABI.abi, provider);
  };

  // CertificateNFT contract instance getter
  const getCertificateContract = (provider: any): ethers.Contract | null => {
    if (!provider || !certificateNFTAddress) return null;
    return new ethers.Contract(certificateNFTAddress, CertificateNFTABI.abi, provider);
  };

  // Fetch user data (role, registration)
  const fetchUserData = useCallback(async () => {
    if (account && provider) {
      setLoading(true);
      try {
        const contract = getContract(provider);
        if (!contract) throw new Error('User Registry contract not initialized');

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
  }, [account, provider]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Get all registered users
  const getAllRegisteredUsers = async (): Promise<RegisteredUser[]> => {
    if (!provider) throw new Error('Provider not available');
    const contract = getContract(provider);
    if (!contract) throw new Error('User Registry contract not initialized');

    const addresses: string[] = await contract.getAllUsers();
    return Promise.all(
      addresses.map(async (address) => {
        const [role, metadataHash] = await contract.getUser(address);
        return { address, role, metadataHash };
      })
    );
  };

  // Get a registered user by address
  const getRegisteredUser = async (address: string): Promise<RegisteredUser> => {
    if (!provider) throw new Error('Provider not available');
    const contract = getContract(provider);
    if (!contract) throw new Error('User Registry contract not initialized');

    const [role, metadataHash] = await contract.getUser(address);
    return { address, role, metadataHash };
  };

  // Get certificates by wallet address
  const getCertificatesByAddress = async (searchAddress: string): Promise<Certificate[]> => {
    if (!provider) throw new Error('Provider not available');
    const contract = getCertificateContract(provider);
    if (!contract) throw new Error('CertificateNFT contract not initialized');

    const certificateIds: bigint[] = await contract.getStudentCertificates(searchAddress);

    return Promise.all(
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
  };

  // Check if address is contract owner
  const checkIsOwner = async (address: string): Promise<boolean> => {
    if (!provider) return false;
    const contract = getCertificateContract(provider);
    if (!contract) return false;

    try {
      const owner = await contract.owner();
      return owner.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Error checking ownership:', error);
      return false;
    }
  };

  // Authorize a new institute (only owner can call)
  const authorizeInstitute = async (instituteAddress: string): Promise<void> => {
    if (!provider || !account) throw new Error('Wallet not connected');
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(certificateNFTAddress, CertificateNFTABI.abi, signer);

    // Verify ownership before proceeding
    const owner = await contract.owner();
    if (owner.toLowerCase() !== account.toLowerCase()) {
      throw new Error('You are not the contract owner');
    }

    const tx = await contract.authorizeInstitute(instituteAddress);
    await tx.wait();
  };

  return (
    <ContractContext.Provider
      value={{
        getContract,
        userData,
        loading,
        refetchUserData: fetchUserData,
        getAllRegisteredUsers,
        getRegisteredUser,
        getCertificatesByAddress,
        checkIsOwner,
        authorizeInstitute,
        certificateNFTAddress,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContractContext = (): ContractContextType => {
  const ctx = useContext(ContractContext);
  if (!ctx) throw new Error('useContractContext must be used within ContractContextProvider');
  return ctx;
};
