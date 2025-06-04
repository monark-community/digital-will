
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Wallet, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  Plus,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [lastActivity] = useState(new Date().toLocaleDateString());

  // Mock data for demonstration
  const mockWills = [
    {
      id: '1',
      name: 'Primary Digital Will',
      status: 'active',
      beneficiaries: 3,
      assets: 5,
      lastUpdated: '2024-06-01',
      inactivityPeriod: 365,
      daysRemaining: 290
    }
  ];

  const mockAssets = [
    { symbol: 'BTC', amount: '2.5', value: '$125,000' },
    { symbol: 'ETH', amount: '15.8', value: '$48,500' },
    { symbol: 'USDC', amount: '25,000', value: '$25,000' }
  ];

  const totalValue = '$198,500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}
          </h1>
          <p className="text-gray-600">
            Manage your digital inheritance and secure your legacy
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Asset Value</p>
                  <p className="text-2xl font-bold text-gray-900">{totalValue}</p>
                </div>
                <Wallet className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Wills</p>
                  <p className="text-2xl font-bold text-gray-900">{mockWills.length}</p>
                </div>
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Beneficiaries</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Activity</p>
                  <p className="text-lg font-semibold text-gray-900">{lastActivity}</p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Wills */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Digital Wills</CardTitle>
                    <CardDescription>Your active inheritance plans</CardDescription>
                  </div>
                  <Link to="/create-will">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Will
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {mockWills.map((will) => (
                  <div key={will.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{will.name}</h3>
                      <Badge variant={will.status === 'active' ? 'default' : 'secondary'}>
                        {will.status === 'active' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          'Inactive'
                        )}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Beneficiaries</p>
                        <p className="font-medium">{will.beneficiaries} people</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Assets</p>
                        <p className="font-medium">{will.assets} types</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">Inactivity Timer</p>
                        <p className="text-sm font-medium">{will.daysRemaining} days remaining</p>
                      </div>
                      <Progress 
                        value={(will.daysRemaining / will.inactivityPeriod) * 100} 
                        className="h-2"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Asset Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Overview</CardTitle>
                <CardDescription>Your protected digital assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAssets.map((asset) => (
                    <div key={asset.symbol} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {asset.symbol.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium">{asset.symbol}</p>
                          <p className="text-sm text-gray-600">{asset.amount}</p>
                        </div>
                      </div>
                      <p className="font-semibold">{asset.value}</p>
                    </div>
                  ))}
                </div>
                <Link to="/assets">
                  <Button variant="outline" className="w-full mt-4">
                    Manage Assets
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Security Status */}
            <Card>
              <CardHeader>
                <CardTitle>Security Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Multi-sig enabled</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Backup created</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Update beneficiaries</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/beneficiaries">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Beneficiaries
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Update Conditions
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
