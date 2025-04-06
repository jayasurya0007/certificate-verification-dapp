import React from 'react';
import { useEthereum } from '@/contexts/EthereumContext';
import { useContractContext } from '@/contexts/ContractContext';
import StudentDashboard from '@/components/StudentDashboard/StudentDashboard';
import ProviderDashboard from '@/components/ProviderDashboard/ProviderDashboard';
import SplitRegistrationForm from '@/components/Registeration/SplitRegistrationForm';

const ConditionalContent = () => {
  const { account } = useEthereum();
  const { userData, loading } = useContractContext()!;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Please connect your wallet</h2>
        </div>
      </div>
    );
  }

  if (userData) {
    if (userData.registered) {
      if (userData.role === 'student') return <StudentDashboard />;
      if (userData.role === 'provider') return <ProviderDashboard />;
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-red-500">Error: Unknown user role detected</div>
        </div>
      );
    }
    return <SplitRegistrationForm />;
  }

  // Fallback in case userData is null (not registered)
  return <SplitRegistrationForm />;
};

export default ConditionalContent;
