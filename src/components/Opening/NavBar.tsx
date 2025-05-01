import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Fingerprint, Building2, Menu, X } from 'lucide-react';
import ConnectButton from '../ConnectButton';
import CertificateSearch from '../CertificateSearch/CertificateSearch';
import InstitutionVerifier from '../InstitutionVerifier/InstitutionVerifier';

interface NavbarProps {
  className?: string;
}

function Navbar({ 
  className = 'bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200'
}: NavbarProps) {
  const [showCertificateSearch, setShowCertificateSearch] = useState(false);
  const [showProviderVerifier, setShowProviderVerifier] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeAllModals = () => {
    setShowCertificateSearch(false);
    setShowProviderVerifier(false);
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className={className}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo & Branding */}
            <div className="flex items-center space-x-3">
              <Link 
                href="/" 
                className="flex items-center group"
                onClick={closeAllModals}
              >
                <span className="text-xl font-bold bg-gradient-to-r from-[#8A2BE2] to-[#4B0082] bg-clip-text text-transparent">
                  ANTI-FAKE
                </span>
                <ShieldCheck className="ml-2 h-5 w-5 text-[#8A2BE2] group-hover:text-[#4B0082] transition-colors" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => setShowProviderVerifier(true)}
                className="flex items-center text-sm font-medium text-gray-700 hover:text-[#8A2BE2] transition-colors"
              >
                <Building2 className="mr-2 h-4 w-4" />
                Verify Providers
              </button>
              <button 
                onClick={() => setShowCertificateSearch(true)}
                className="flex items-center text-sm font-medium text-gray-700 hover:text-[#8A2BE2] transition-colors"
              >
                <Fingerprint className="mr-2 h-4 w-4" />
                Verify Certificates
              </button>
              <div className="ml-4">
                <ConnectButton />
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-[#8A2BE2] hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute w-full bg-white border-b border-gray-200">
            <div className="px-4 py-4 space-y-4">
              <button
                onClick={() => {
                  setShowProviderVerifier(true);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-2 text-gray-700 hover:text-[#8A2BE2] hover:bg-gray-50 rounded-lg"
              >
                <Building2 className="mr-3 h-5 w-5" />
                Verify Providers
              </button>
              <button
                onClick={() => {
                  setShowCertificateSearch(true);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-2 text-gray-700 hover:text-[#8A2BE2] hover:bg-gray-50 rounded-lg"
              >
                <Fingerprint className="mr-3 h-5 w-5" />
                Verify Certificates
              </button>
              <div className="px-4 pt-4 border-t border-gray-100">
                <ConnectButton />
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Certificate Search Modal */}
      {(showCertificateSearch || showProviderVerifier) && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeAllModals}
        >
          <div 
            className="bg-white rounded-xl p-6 w-full max-w-6xl mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[90vh] overflow-y-auto">
              {showCertificateSearch && <CertificateSearch />}
              {showProviderVerifier && <InstitutionVerifier />}
            </div>
            <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-100">
              <button
                onClick={closeAllModals}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#8A2BE2] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;