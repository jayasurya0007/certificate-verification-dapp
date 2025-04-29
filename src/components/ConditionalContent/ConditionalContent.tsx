import React, { useEffect, useState } from 'react';
import { useEthereum } from '@/contexts/EthereumContext';
import { useContractContext } from '@/contexts/ContractContext';
import StudentDashboard from '@/components/StudentDashboard/StudentDashboard';
import ProviderDashboard from '@/components/ProviderDashboard/ProviderDashboard';
import OwnerDashboard from '../ProviderDashboard/OwnerDashboard';
import SplitRegistrationForm from '@/components/Registeration/SplitRegistrationForm';
import Home from '../Opening/Home';

const ConditionalContent = () => {
  const { account } = useEthereum();
  const { userData, loading, checkIsOwner } = useContractContext();
  const [isOwner, setIsOwner] = useState(false);
  const [checkingOwnership, setCheckingOwnership] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!account) {
        setCheckingOwnership(false);
        return;
      }
      setCheckingOwnership(true);
      const ownerStatus = await checkIsOwner(account);
      setIsOwner(ownerStatus);
      setCheckingOwnership(false);
    };
    check();
  }, [account, checkIsOwner]);

  if (loading || checkingOwnership) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!account) {
    return <Home />;
  }

  if (isOwner) {
    return <OwnerDashboard />;
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

  return <SplitRegistrationForm />;
};

export default ConditionalContent;
