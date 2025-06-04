
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Menu, X, User, LogOut } from 'lucide-react';

interface NavigationProps {
  isAuthenticated?: boolean;
  userRole?: 'creator' | 'executor' | 'beneficiary';
  onLogout?: () => void;
}

const Navigation = ({ isAuthenticated = false, userRole, onLogout }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/');
  };

  return (
    <nav className="bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-emerald-400" />
              <span className="text-xl font-bold">WillChain</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {!isAuthenticated ? (
              <>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
                <Link to="/features" className="text-gray-300 hover:text-white transition-colors">
                  Features
                </Link>
                <Link to="/security" className="text-gray-300 hover:text-white transition-colors">
                  Security
                </Link>
                <div className="flex items-center space-x-4">
                  <Link to="/auth">
                    <Button variant="ghost" className="text-white hover:bg-slate-800">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link to="/beneficiaries" className="text-gray-300 hover:text-white transition-colors">
                  Beneficiaries
                </Link>
                <Link to="/assets" className="text-gray-300 hover:text-white transition-colors">
                  Assets
                </Link>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <User className="h-4 w-4" />
                    <span className="capitalize">{userRole || 'User'}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-300 hover:text-white hover:bg-slate-800"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-slate-800">
              {!isAuthenticated ? (
                <>
                  <Link to="/" className="block px-3 py-2 text-gray-300 hover:text-white">
                    Home
                  </Link>
                  <Link to="/features" className="block px-3 py-2 text-gray-300 hover:text-white">
                    Features
                  </Link>
                  <Link to="/security" className="block px-3 py-2 text-gray-300 hover:text-white">
                    Security
                  </Link>
                  <div className="px-3 py-2 space-y-2">
                    <Link to="/auth">
                      <Button variant="ghost" className="w-full text-white hover:bg-slate-800">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/auth">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="block px-3 py-2 text-gray-300 hover:text-white">
                    Dashboard
                  </Link>
                  <Link to="/beneficiaries" className="block px-3 py-2 text-gray-300 hover:text-white">
                    Beneficiaries
                  </Link>
                  <Link to="/assets" className="block px-3 py-2 text-gray-300 hover:text-white">
                    Assets
                  </Link>
                  <div className="px-3 py-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-300 mb-2">
                      <User className="h-4 w-4" />
                      <span className="capitalize">{userRole || 'User'}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleLogout}
                      className="w-full text-gray-300 hover:text-white hover:bg-slate-800"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
