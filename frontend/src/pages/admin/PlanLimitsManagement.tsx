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

  // Log state changes
  useEffect(() => {
    console.log('🔍 PlanLimitsManagement - State changed:', {
      planLimits: planLimits,
      planLimitsLength: planLimits.length,
      planLimitsStringified: JSON.stringify(planLimits, null, 2)
    });
  }, [planLimits]);

  const loadPlanLimits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await planLimitsService.getAllPlanLimits();
      
      console.log('🔍 PlanLimitsManagement - Loaded plan limits:', data);
      console.log('🔍 PlanLimitsManagement - Loaded plan limits type:', typeof data);
      console.log('🔍 PlanLimitsManagement - Loaded plan limits length:', data.length);
      console.log('🔍 PlanLimitsManagement - Loaded plan limits stringified:', JSON.stringify(data, null, 2));
      
      data.forEach((pl, index) => {
        console.log(`🔍 PlanLimitsManagement - Loaded plan limit ${index + 1}:`, {
          id: pl.id,
          planId: pl.planId,
          plan: pl.plan,
          planName: pl.plan?.name,
          planSlug: pl.plan?.slug,
          allKeys: Object.keys(pl)
        });
      });
      
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
      
      console.log('🔍 PlanLimitsManagement - Updated plan limits received:', updatedPlanLimits);
      console.log('🔍 PlanLimitsManagement - Updated plan limits type:', typeof updatedPlanLimits);
      console.log('🔍 PlanLimitsService - Updated plan limits keys:', Object.keys(updatedPlanLimits || {}));
      console.log('🔍 PlanLimitsManagement - Updated plan limits plan:', updatedPlanLimits?.plan);
      console.log('🔍 PlanLimitsManagement - Updated plan limits plan name:', updatedPlanLimits?.plan?.name);
      
      setPlanLimits(prev => {
        console.log('🔍 PlanLimitsManagement - Previous state:', prev);
        const newState = prev.map(pl => {
          if (pl.id === id) {
            const merged = { ...pl, ...updatedPlanLimits };
            console.log('🔍 PlanLimitsManagement - Merging plan limit:', {
              original: pl,
              updated: updatedPlanLimits,
              merged: merged
            });
            return merged;
          }
          return pl;
        });
        console.log('🔍 PlanLimitsManagement - New state:', newState);
        return newState;
      });
      
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
    setEditingPlan(planLimits.plan_id);
    setFormData({
      planId: planLimits.plan_id,
      maxExchangeAccounts: planLimits.max_exchange_accounts,
      maxAutomations: planLimits.max_automations,
      maxIndicators: planLimits.max_indicators,
      maxSimulations: planLimits.max_simulations,
      maxBacktests: planLimits.max_backtests
    });
    setShowEditDialog(true);
  };

  const getLimitColor = (current: number, max: number | undefined) => {
    if (max === undefined || max === null) return 'text-gray-500';
    if (max === -1) return 'text-blue-600'; // Unlimited
    const percentage = (current / max) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-gray-600'; // Neutral color for display
  };

  const formatLimit = (limit: number | undefined) => {
    if (limit === undefined || limit === null) return 'N/A';
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
                    {availablePlans.map((plan, index) => (
                      <SelectItem key={plan.id || `plan-${index}`} value={plan.id}>
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
              <div className="text-2xl font-bold">{statistics.totalPlans || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plans with Limits</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.plansWithLimits || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Exchange Accounts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(statistics.averageLimits?.exchangeAccounts || 0)}
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
                {Math.round(statistics.averageLimits?.automations || 0)}
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
              {planLimits.map((planLimit, index) => (
                <TableRow key={planLimit.plan_id || `plan-limit-${index}`}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {(() => {
                          console.log('🔍 PlanLimitsManagement - Rendering plan limit:', {
                            plan_id: planLimit.plan_id,
                            plan_type: planLimit.plan_type,
                            plan_name: planLimit.plan_name,
                            allKeys: Object.keys(planLimit),
                            planLimitStringified: JSON.stringify(planLimit, null, 2)
                          });
                          return planLimit.plan_name || 'Unknown Plan';
                        })()}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={getLimitColor(0, planLimit.max_exchange_accounts)}>
                      {formatLimit(planLimit.max_exchange_accounts)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={getLimitColor(0, planLimit.max_automations)}>
                      {formatLimit(planLimit.max_automations)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={getLimitColor(0, planLimit.max_indicators)}>
                      {formatLimit(planLimit.max_indicators)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={getLimitColor(0, planLimit.max_simulations)}>
                      {formatLimit(planLimit.max_simulations)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={getLimitColor(0, planLimit.max_backtests)}>
                      {formatLimit(planLimit.max_backtests)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => planLimit.plan_id && openEditDialog(planLimit)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => planLimit.plan_id && handleDeletePlanLimits(planLimit.plan_id)}
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
