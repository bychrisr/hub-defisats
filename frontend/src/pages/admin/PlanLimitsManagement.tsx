import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Settings,
  Users,
  Activity,
  BarChart3,
  Shield,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';
import { planLimitsService, PlanLimits, CreatePlanLimitsRequest, UpdatePlanLimitsRequest } from '@/services/plan-limits.service';
import { toast } from 'sonner';

export default function PlanLimitsManagement() {
  const [planLimits, setPlanLimits] = useState<PlanLimits[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState<CreatePlanLimitsRequest>({
    planId: '',
    maxExchangeAccounts: 1,
    maxAutomations: 5,
    maxIndicators: 10,
    maxSimulations: 3,
    maxBacktests: 5
  });

  // Available plans (mock data - should be fetched from API)
  const availablePlans = [
    { id: '1', name: 'Free', slug: 'free' },
    { id: '2', name: 'Pro', slug: 'pro' },
    { id: '3', name: 'Enterprise', slug: 'enterprise' },
    { id: '4', name: 'Lifetime', slug: 'lifetime' }
  ];

  useEffect(() => {
    loadPlanLimits();
    loadStatistics();
  }, []);

  const loadPlanLimits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await planLimitsService.getAllPlanLimits();
      setPlanLimits(data);
      
      console.log('✅ Loaded plan limits:', data.length);
    } catch (err: any) {
      console.error('❌ Error loading plan limits:', err);
      setError(err.message);
      toast.error('Failed to load plan limits');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await planLimitsService.getUsageStatistics();
      setStatistics(stats);
      console.log('✅ Loaded statistics:', stats);
    } catch (err: any) {
      console.error('❌ Error loading statistics:', err);
    }
  };

  const handleCreatePlanLimits = async () => {
    try {
      setLoading(true);
      
      const newPlanLimits = await planLimitsService.createPlanLimits(formData);
      setPlanLimits(prev => [...prev, newPlanLimits]);
      
      setShowCreateDialog(false);
      setFormData({
        planId: '',
        maxExchangeAccounts: 1,
        maxAutomations: 5,
        maxIndicators: 10,
        maxSimulations: 3,
        maxBacktests: 5
      });
      
      toast.success('Plan limits created successfully');
      console.log('✅ Created plan limits:', newPlanLimits);
    } catch (err: any) {
      console.error('❌ Error creating plan limits:', err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlanLimits = async (id: string, data: UpdatePlanLimitsRequest) => {
    try {
      setLoading(true);
      
      const updatedPlanLimits = await planLimitsService.updatePlanLimits({ id, ...data });
      setPlanLimits(prev => prev.map(pl => pl.id === id ? updatedPlanLimits : pl));
      
      setShowEditDialog(false);
      setEditingPlan(null);
      
      toast.success('Plan limits updated successfully');
      console.log('✅ Updated plan limits:', updatedPlanLimits);
    } catch (err: any) {
      console.error('❌ Error updating plan limits:', err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlanLimits = async (id: string) => {
    if (!confirm('Are you sure you want to delete these plan limits?')) {
      return;
    }

    try {
      setLoading(true);
      
      await planLimitsService.deletePlanLimits(id);
      setPlanLimits(prev => prev.filter(pl => pl.id !== id));
      
      toast.success('Plan limits deleted successfully');
      console.log('✅ Deleted plan limits:', id);
    } catch (err: any) {
      console.error('❌ Error deleting plan limits:', err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (planLimits: PlanLimits) => {
    setEditingPlan(planLimits.id);
    setFormData({
      planId: planLimits.planId,
      maxExchangeAccounts: planLimits.maxExchangeAccounts,
      maxAutomations: planLimits.maxAutomations,
      maxIndicators: planLimits.maxIndicators,
      maxSimulations: planLimits.maxSimulations,
      maxBacktests: planLimits.maxBacktests
    });
    setShowEditDialog(true);
  };

  const getLimitColor = (current: number, max: number) => {
    if (max === -1) return 'text-green-600'; // Unlimited
    const percentage = (current / max) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Unlimited' : limit.toString();
  };

  if (loading && planLimits.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading plan limits...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plan Limits Management</h1>
          <p className="text-muted-foreground">
            Manage subscription plan limits and restrictions
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan Limits
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Plan Limits</DialogTitle>
              <DialogDescription>
                Set limits for a subscription plan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="planId">Plan</Label>
                <Select
                  value={formData.planId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, planId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxExchangeAccounts">Max Exchange Accounts</Label>
                  <Input
                    id="maxExchangeAccounts"
                    type="number"
                    min="0"
                    value={formData.maxExchangeAccounts}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxExchangeAccounts: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxAutomations">Max Automations</Label>
                  <Input
                    id="maxAutomations"
                    type="number"
                    min="0"
                    value={formData.maxAutomations}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxAutomations: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxIndicators">Max Indicators</Label>
                  <Input
                    id="maxIndicators"
                    type="number"
                    min="0"
                    value={formData.maxIndicators}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxIndicators: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxSimulations">Max Simulations</Label>
                  <Input
                    id="maxSimulations"
                    type="number"
                    min="0"
                    value={formData.maxSimulations}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxSimulations: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxBacktests">Max Backtests</Label>
                  <Input
                    id="maxBacktests"
                    type="number"
                    min="0"
                    value={formData.maxBacktests}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxBacktests: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePlanLimits} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalPlans}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plans with Limits</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.plansWithLimits}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Exchange Accounts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(statistics.averageLimits.exchangeAccounts)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Automations</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(statistics.averageLimits.automations)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Plan Limits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Limits</CardTitle>
          <CardDescription>
            Manage limits for each subscription plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Exchange Accounts</TableHead>
                <TableHead>Automations</TableHead>
                <TableHead>Indicators</TableHead>
                <TableHead>Simulations</TableHead>
                <TableHead>Backtests</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planLimits.map((planLimit) => (
                <TableRow key={planLimit.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{planLimit.plan.name}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={getLimitColor(0, planLimit.maxExchangeAccounts)}>
                      {formatLimit(planLimit.maxExchangeAccounts)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={getLimitColor(0, planLimit.maxAutomations)}>
                      {formatLimit(planLimit.maxAutomations)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={getLimitColor(0, planLimit.maxIndicators)}>
                      {formatLimit(planLimit.maxIndicators)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={getLimitColor(0, planLimit.maxSimulations)}>
                      {formatLimit(planLimit.maxSimulations)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={getLimitColor(0, planLimit.maxBacktests)}>
                      {formatLimit(planLimit.maxBacktests)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(planLimit)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePlanLimits(planLimit.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Plan Limits</DialogTitle>
            <DialogDescription>
              Update limits for this subscription plan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-maxExchangeAccounts">Max Exchange Accounts</Label>
                <Input
                  id="edit-maxExchangeAccounts"
                  type="number"
                  min="0"
                  value={formData.maxExchangeAccounts}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    maxExchangeAccounts: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-maxAutomations">Max Automations</Label>
                <Input
                  id="edit-maxAutomations"
                  type="number"
                  min="0"
                  value={formData.maxAutomations}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    maxAutomations: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-maxIndicators">Max Indicators</Label>
                <Input
                  id="edit-maxIndicators"
                  type="number"
                  min="0"
                  value={formData.maxIndicators}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    maxIndicators: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-maxSimulations">Max Simulations</Label>
                <Input
                  id="edit-maxSimulations"
                  type="number"
                  min="0"
                  value={formData.maxSimulations}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    maxSimulations: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-maxBacktests">Max Backtests</Label>
                <Input
                  id="edit-maxBacktests"
                  type="number"
                  min="0"
                  value={formData.maxBacktests}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    maxBacktests: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => editingPlan && handleUpdatePlanLimits(editingPlan, formData)} 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
