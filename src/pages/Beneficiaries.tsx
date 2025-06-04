
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, User, Wallet, Percent } from 'lucide-react';

interface Beneficiary {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
  relationship: string;
  allocation: number;
  assetTypes: string[];
  status: 'verified' | 'pending';
}

const Beneficiaries = () => {
  const { toast } = useToast();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      walletAddress: '0x742d35Cc6634C0532925a3b8D4065cF8e8b8a42d',
      relationship: 'Spouse',
      allocation: 60,
      assetTypes: ['BTC', 'ETH'],
      status: 'verified'
    },
    {
      id: '2',
      name: 'Michael Johnson',
      email: 'michael@example.com',
      walletAddress: '0x123d35Cc6634C0532925a3b8D4065cF8e8b8a123',
      relationship: 'Child',
      allocation: 30,
      assetTypes: ['ETH', 'USDC'],
      status: 'verified'
    },
    {
      id: '3',
      name: 'Emily Chen',
      email: 'emily@example.com',
      walletAddress: '0x456d35Cc6634C0532925a3b8D4065cF8e8b8a456',
      relationship: 'Friend',
      allocation: 10,
      assetTypes: ['USDC'],
      status: 'pending'
    }
  ]);

  const [newBeneficiary, setNewBeneficiary] = useState({
    name: '',
    email: '',
    walletAddress: '',
    relationship: '',
    allocation: 0,
    assetTypes: [] as string[]
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const totalAllocation = beneficiaries.reduce((sum, b) => sum + b.allocation, 0);

  const handleAddBeneficiary = () => {
    if (!newBeneficiary.name || !newBeneficiary.email || !newBeneficiary.walletAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (totalAllocation + newBeneficiary.allocation > 100) {
      toast({
        title: "Allocation Error",
        description: "Total allocation cannot exceed 100%.",
        variant: "destructive"
      });
      return;
    }

    const beneficiary: Beneficiary = {
      ...newBeneficiary,
      id: Date.now().toString(),
      status: 'pending'
    };

    setBeneficiaries([...beneficiaries, beneficiary]);
    setNewBeneficiary({
      name: '',
      email: '',
      walletAddress: '',
      relationship: '',
      allocation: 0,
      assetTypes: []
    });
    setIsDialogOpen(false);

    toast({
      title: "Beneficiary Added",
      description: "New beneficiary has been successfully added.",
    });
  };

  const handleRemoveBeneficiary = (id: string) => {
    setBeneficiaries(beneficiaries.filter(b => b.id !== id));
    toast({
      title: "Beneficiary Removed",
      description: "Beneficiary has been removed from your will.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Beneficiaries</h1>
          <p className="text-gray-600">Manage who will inherit your digital assets</p>
        </div>

        {/* Allocation Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Allocated</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAllocation}%</p>
                </div>
                <Percent className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Beneficiaries</p>
                  <p className="text-2xl font-bold text-gray-900">{beneficiaries.length}</p>
                </div>
                <User className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Remaining</p>
                  <p className="text-2xl font-bold text-gray-900">{100 - totalAllocation}%</p>
                </div>
                <Wallet className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Beneficiaries List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Beneficiaries List</CardTitle>
                <CardDescription>Manage your digital asset beneficiaries</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Beneficiary
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Beneficiary</DialogTitle>
                    <DialogDescription>
                      Add a new person to inherit your digital assets.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={newBeneficiary.name}
                        onChange={(e) => setNewBeneficiary({...newBeneficiary, name: e.target.value})}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newBeneficiary.email}
                        onChange={(e) => setNewBeneficiary({...newBeneficiary, email: e.target.value})}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="wallet">Wallet Address</Label>
                      <Input
                        id="wallet"
                        value={newBeneficiary.walletAddress}
                        onChange={(e) => setNewBeneficiary({...newBeneficiary, walletAddress: e.target.value})}
                        placeholder="0x..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="relationship">Relationship</Label>
                      <Select
                        value={newBeneficiary.relationship}
                        onValueChange={(value) => setNewBeneficiary({...newBeneficiary, relationship: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="charity">Charity</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="allocation">Allocation Percentage</Label>
                      <Input
                        id="allocation"
                        type="number"
                        min="0"
                        max={100 - totalAllocation}
                        value={newBeneficiary.allocation}
                        onChange={(e) => setNewBeneficiary({...newBeneficiary, allocation: parseInt(e.target.value) || 0})}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddBeneficiary}>Add Beneficiary</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {beneficiaries.map((beneficiary) => (
                <div key={beneficiary.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">{beneficiary.name}</h3>
                        <Badge variant={beneficiary.status === 'verified' ? 'default' : 'secondary'}>
                          {beneficiary.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Email</p>
                          <p className="font-medium">{beneficiary.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Relationship</p>
                          <p className="font-medium capitalize">{beneficiary.relationship}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Allocation</p>
                          <p className="font-medium">{beneficiary.allocation}%</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-gray-600 text-sm">Wallet Address</p>
                        <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                          {beneficiary.walletAddress}
                        </p>
                      </div>
                      <div className="mt-2">
                        <p className="text-gray-600 text-sm">Asset Types</p>
                        <div className="flex space-x-1 mt-1">
                          {beneficiary.assetTypes.map((asset) => (
                            <Badge key={asset} variant="outline">{asset}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemoveBeneficiary(beneficiary.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Beneficiaries;
