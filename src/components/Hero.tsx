
import { Button } from '@/components/ui/button';
import { Shield, Clock, Users, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.05\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
            Secure Your Digital Legacy with
            <span className="text-emerald-400 block mt-2">Blockchain Technology</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            WillChain revolutionizes digital inheritance by providing secure, automated transfer of crypto assets and digital wealth to your beneficiaries.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Link to="/auth">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg">
                Create Your Digital Will
              </Button>
            </Link>
            <Link to="/features">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-slate-900 px-8 py-3 text-lg">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all duration-300 animate-scale-in" style={{ animationDelay: '0.6s' }}>
            <Shield className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Secure & Immutable</h3>
            <p className="text-gray-300">Blockchain-based smart contracts ensure your digital assets are protected and tamper-proof.</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all duration-300 animate-scale-in" style={{ animationDelay: '0.8s' }}>
            <Clock className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Automated Transfer</h3>
            <p className="text-gray-300">Set conditions for asset transfer based on inactivity, time delays, or multi-sig validation.</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all duration-300 animate-scale-in" style={{ animationDelay: '1.0s' }}>
            <Users className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Multiple Beneficiaries</h3>
            <p className="text-gray-300">Easily designate and manage multiple beneficiaries with customizable asset allocation.</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all duration-300 animate-scale-in" style={{ animationDelay: '1.2s' }}>
            <FileText className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Document Storage</h3>
            <p className="text-gray-300">Store important documents and instructions securely using IPFS technology.</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 text-center">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="animate-fade-in" style={{ animationDelay: '1.4s' }}>
              <div className="text-4xl font-bold text-emerald-400 mb-2">$3.8B+</div>
              <div className="text-gray-300">Lost crypto annually due to poor estate planning</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '1.6s' }}>
              <div className="text-4xl font-bold text-emerald-400 mb-2">20%</div>
              <div className="text-gray-300">Of Bitcoin is estimated to be lost forever</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '1.8s' }}>
              <div className="text-4xl font-bold text-emerald-400 mb-2">100%</div>
              <div className="text-gray-300">Secure and automated with WillChain</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
