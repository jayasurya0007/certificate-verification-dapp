import { useEffect, useState } from 'react';
import { useContractContext } from '@/contexts/ContractContext';
import { FiExternalLink, FiX,FiSearch,FiArrowLeft } from 'react-icons/fi';

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
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [metadataContent, setMetadataContent] = useState<any>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);

  // Add mobile view check
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const fetchUserData = async (address: string) => {
    try {
      setFetchingUser(true);
      setError(null);
      const user = await getRegisteredUser(address);
      setSelectedUser(user);
    } catch (err) {
      handleError(err, 'User not found');
    } finally {
      setFetchingUser(false);
    }
  };

  const handleError = (error: unknown, defaultMessage: string) => {
    console.error(error);
    setError(error instanceof Error ? error.message : defaultMessage);
  };

  const fetchMetadata = async (metadataHash: string) => {
    try {
      setMetadataLoading(true);
      setMetadataError(null);
      const response = await fetch(`https://ipfs.io/ipfs/${metadataHash}`);
      if (!response.ok) throw new Error('Failed to fetch metadata');
      const data = await response.json();
      setMetadataContent(data);
      setShowMetadataDialog(true);
    } catch (err) {
      setMetadataError(err instanceof Error ? err.message : 'Failed to load metadata');
    } finally {
      setMetadataLoading(false);
    }
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
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
    {/* Metadata Dialog - Update for mobile */}
    {showMetadataDialog && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Metadata Details</h3>
              <button
                onClick={() => setShowMetadataDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {metadataLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : metadataError ? (
              <div className="p-4 bg-red-100 text-red-700 rounded-lg">
                Error: {metadataError}
              </div>
            ) : (
              <div className="space-y-4">
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(metadataContent, null, 2)}
                </pre>
                <a
                  href={`https://ipfs.io/ipfs/${selectedUser?.metadataHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <FiExternalLink className="mr-2" />
                  View on IPFS
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Section - Made responsive */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Enter LUKSO address (0x...)"
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm sm:text-base"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
            />
          </div>
          <button
            onClick={() => fetchUserData(searchAddress)}
            className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base"
          >
            Search
          </button>
        </div>

        {/* User Details Section - Improved mobile layout */}
        {selectedUser && (
          <div className="mt-4 sm:mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg sm:text-xl font-semibold">User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="sm:hidden text-blue-600"
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
            </div>
            {fetchingUser ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                <p className="text-sm sm:text-base break-all">
                  <span className="font-medium">Address:</span> {selectedUser.address}
                </p>
                <p className="text-sm sm:text-base mt-2">
                  <span className="font-medium">Role:</span> {selectedUser.role}
                </p>
                <div className="mt-3 flex items-start">
                  <span className="font-medium text-sm sm:text-base">Metadata:</span>
                  <div className="ml-2 flex items-center">
                    <button
                      onClick={() => fetchMetadata(selectedUser.metadataHash)}
                      className="text-blue-600 hover:underline text-sm sm:text-base break-all text-left"
                    >
                      {selectedUser.metadataHash}
                    </button>
                    <a
                      href={`https://ipfs.io/ipfs/${selectedUser.metadataHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <FiExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Users List - Improved mobile layout */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-4">
          All Registered Users ({allUsers.length})
        </h2>
        <div className="space-y-2 sm:space-y-3">
          {allUsers.length === 0 ? (
            <div className="text-gray-500 text-sm sm:text-base">
              No users registered yet
            </div>
          ) : (
            allUsers.map((user) => (
              <div
                key={user.address}
                className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors"
                onClick={() => {
                  setSearchAddress(user.address);
                  fetchUserData(user.address);
                }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">
                      {user.address}
                    </p>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1">
                      Role: {user.role}
                    </p>
                  </div>
                  <span className="mt-2 sm:mt-0 bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
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