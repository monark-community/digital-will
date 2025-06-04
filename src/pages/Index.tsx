
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import { useAuth } from '@/components/AuthContext';

const Index = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <Navigation 
        isAuthenticated={isAuthenticated} 
        userRole={user?.role} 
        onLogout={logout}
      />
      <Hero />
    </div>
  );
};

export default Index;
