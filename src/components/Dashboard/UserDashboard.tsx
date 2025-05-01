import { useEffect, useState } from 'react';
import { useContractContext } from '@/contexts/ContractContext';

interface RegisteredUser {
  address: string;
  role: string;
  metadataHash: string;
}

export default function UserDashboard() {
  const { getAllRegisteredUsers, getRegisteredUser } = useContractContext();
  const [allUsers, setAllUsers] = useState<RegisteredUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const users = await getAllRegisteredUsers();
        setAllUsers(users);
      } catch (err) {
        handleError(err, 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [getAllRegisteredUsers]);

  // Fetch individual user data
  const fetchUserData = async (address: string) => {
    try {
      setLoading(true);
      setError(null);
      const user = await getRegisteredUser(address);
      setSelectedUser(user);
    } catch (err) {
      handleError(err, 'User not found');
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error: unknown, defaultMessage: string) => {
    console.error(error);
    setError(error instanceof Error ? error.message : defaultMessage);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Search Individual User */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Search User</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter LUKSO address (0x...)"
            className="flex-1 p-2 border rounded-lg"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
          />
          <button
            onClick={() => fetchUserData(searchAddress)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </div>
        
        {selectedUser && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">User Details</h3>
            <p><span className="font-medium">Address:</span> {selectedUser.address}</p>
            <p><span className="font-medium">Role:</span> {selectedUser.role}</p>
            <p className="break-all">
              <span className="font-medium">Metadata:</span>{' '}
              <a
                href={`https://gateway.pinata.cloud/ipfs/${selectedUser.metadataHash}` || `https://ipfs.io/ipfs/${selectedUser.metadataHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {selectedUser.metadataHash}
              </a>
            </p>
          </div>
        )}
      </div>

      {/* All Users List */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-4">All Registered Users ({allUsers.length})</h2>
        <div className="space-y-3">
          {allUsers.length === 0 ? (
            <div className="text-gray-500">No users registered yet</div>
          ) : (
            allUsers.map((user) => (
              <div 
                key={user.address}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSearchAddress(user.address);
                  fetchUserData(user.address);
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{user.address}</p>
                    <p className="text-sm text-gray-600">Role: {user.role}</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {user.role.toUpperCase()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}