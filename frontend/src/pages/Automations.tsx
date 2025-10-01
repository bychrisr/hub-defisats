import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Bot, 
  Activity, 
  Shield, 
  Target, 
  Zap,
  Loader2,
  RefreshCw,
  BarChart3,
  Clock,
  User,
  Play,
  Pause,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTheme } from '@/contexts/ThemeContext';

interface Automation {
  id: string;
  user_id: string;
  type: string;
  config: any;
  is_active: boolean;
  created_at: string;
  user: {
    email: string;
  };
}

export const Automations = () => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'all'>('active');
  const [formData, setFormData] = useState({
    user_id: '',
    type: 'margin_guard',
    config: '{}',
    is_active: true,
  });

  const { theme } = useTheme();

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const response = await axios.get('/api/automations');
      setAutomations(response.data);
    } catch (error) {
      console.error('Error fetching automations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para filtrar automações por status da aba
  const getFilteredAutomations = () => {
    switch (activeTab) {
      case 'active':
        return automations.filter(automation => automation.is_active === true);
      case 'inactive':
        return automations.filter(automation => automation.is_active === false);
      case 'all':
        return automations;
      default:
        return automations;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        config: JSON.parse(formData.config),
      };
      if (editingAutomation) {
        await axios.put(`/api/automations/${editingAutomation.id}`, data);
      } else {
        await axios.post('/api/automations', data);
      }
      fetchAutomations();
      setDialogOpen(false);
      setEditingAutomation(null);
      setFormData({
        user_id: '',
        type: 'margin_guard',
        config: '{}',
        is_active: true,
      });
    } catch (error) {
      console.error('Error saving automation:', error);
    }
  };

  const handleEdit = (automation: Automation) => {
    setEditingAutomation(automation);
    setFormData({
      user_id: automation.user_id,
      type: automation.type,
      config: JSON.stringify(automation.config, null, 2),
      is_active: automation.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this automation?')) {
      try {
        await axios.delete(`/api/automations/${id}`);
        fetchAutomations();
      } catch (error) {
        console.error('Error deleting automation:', error);
      }
    }
  };

  const openCreateDialog = () => {
    setEditingAutomation(null);
    setFormData({
      user_id: '',
      type: 'margin_guard',
      config: '{}',
      is_active: true,
    });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="backdrop-blur-xl bg-card/50 border-border/50 shadow-2xl profile-sidebar-glow">
              <CardContent className="p-8">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-xl"></div>
                    <Loader2 className="h-8 w-8 animate-spin text-primary relative z-10" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-text-primary">Loading Automations</h3>
                    <p className="text-sm text-text-secondary">Fetching automation data...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-2xl blur-3xl"></div>
            <Card className="relative backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                        <Bot className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                          Automations
                        </h1>
                        <p className="text-text-secondary">Manage trading automations and bots</p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={openCreateDialog}
                    className="backdrop-blur-sm bg-primary/90 hover:bg-primary text-white shadow-lg shadow-primary/25"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Automation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Automations */}
            <Card className="gradient-card-blue backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl profile-sidebar-glow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bot className="h-4 w-4 text-blue-500" />
                  Total Automations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">{automations.length}</div>
                <p className="text-xs text-text-secondary mt-1">
                  Configured automations
                </p>
              </CardContent>
            </Card>
            
            {/* Active Automations */}
            <Card className="gradient-card-green backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl profile-sidebar-glow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {automations.filter(a => a.is_active).length}
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  Currently running
                </p>
              </CardContent>
            </Card>
            
            {/* Margin Guard */}
            <Card className="gradient-card-purple backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl profile-sidebar-glow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-500" />
                  Margin Guard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {automations.filter(a => a.type === 'margin_guard').length}
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  Risk management bots
                </p>
              </CardContent>
            </Card>
            
            {/* TP/SL */}
            <Card className="gradient-card-yellow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl profile-sidebar-glow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-yellow-500" />
                  TP/SL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {automations.filter(a => a.type === 'tp_sl').length}
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  Take profit / Stop loss
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Automations Table */}
          <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">Automations List</CardTitle>
                  <CardDescription className="text-text-secondary">
                    All configured automations and their status
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Tabs */}
              <div className="mb-6">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'inactive' | 'all')} className="w-full">
                  <TabsList className={cn(
                    "grid w-full grid-cols-3 h-12",
                    theme === 'dark' ? 'profile-tabs-glow' : 'profile-tabs-glow-light'
                  )}>
                    <TabsTrigger 
                      value="active" 
                      className="profile-tab-trigger text-sm font-medium"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Active
                    </TabsTrigger>
                    <TabsTrigger 
                      value="inactive" 
                      className="profile-tab-trigger text-sm font-medium"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Inactive
                    </TabsTrigger>
                    <TabsTrigger 
                      value="all" 
                      className="profile-tab-trigger text-sm font-medium"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      All
                    </TabsTrigger>
                  </TabsList>

                  {/* Active Automations Tab Content */}
                  <TabsContent value="active" className="space-y-6">
                    <div className="overflow-x-auto rounded-lg border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm">
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          User
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Type
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Status
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Created
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Actions
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredAutomations().map((automation, index) => (
                      <TableRow 
                        key={automation.id}
                        className={cn(
                          "hover:bg-background/50 transition-colors duration-200",
                          index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                        )}
                      >
                        <TableCell className="font-medium text-text-primary">
                          {automation.user.email}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "font-semibold px-3 py-1 rounded-full border-0",
                              automation.type === 'margin_guard' 
                                ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/25'
                                : automation.type === 'tp_sl'
                                  ? 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg shadow-yellow-500/25'
                                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25'
                            )}
                          >
                            {automation.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={automation.is_active ? 'default' : 'secondary'}
                            className={cn(
                              "font-semibold px-3 py-1 rounded-full border-0",
                              automation.is_active 
                                ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25'
                                : 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25'
                            )}
                          >
                            {automation.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-text-primary">
                          {new Date(automation.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(automation)}
                              className="hover:bg-primary/20 hover:text-primary transition-colors duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(automation.id)}
                              className="hover:bg-red-500/20 hover:text-red-500 transition-colors duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                    </div>
                  </TabsContent>

                  {/* Inactive Automations Tab Content */}
                  <TabsContent value="inactive" className="space-y-6">
                    <div className="overflow-x-auto rounded-lg border border-border/50">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm">
                            <TableHead className="font-semibold text-text-primary">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                User
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold text-text-primary">
                              <div className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Type
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold text-text-primary">
                              <div className="flex items-center gap-2">
                                <Pause className="h-4 w-4" />
                                Status
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold text-text-primary">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Created
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold text-text-primary">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Actions
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredAutomations().map((automation, index) => (
                            <TableRow 
                              key={automation.id}
                              className={cn(
                                "hover:bg-background/50 transition-colors duration-200",
                                index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                              )}
                            >
                              <TableCell className="font-medium text-text-primary">
                                {automation.user.email}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="bg-orange-500/20 text-orange-600 border-orange-500/30">
                                  {automation.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="bg-red-500/20 text-red-600 border-red-500/30">
                                  <Pause className="h-3 w-3 mr-1" />
                                  Inactive
                                </Badge>
                              </TableCell>
                              <TableCell className="text-text-secondary">
                                {new Date(automation.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(automation)}
                                    className="hover:bg-primary/10 hover:border-primary/30"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(automation.id)}
                                    className="hover:bg-red-500/10 hover:border-red-500/30 text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* All Automations Tab Content */}
                  <TabsContent value="all" className="space-y-6">
                    <div className="overflow-x-auto rounded-lg border border-border/50">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm">
                            <TableHead className="font-semibold text-text-primary">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                User
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold text-text-primary">
                              <div className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Type
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold text-text-primary">
                              <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                Status
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold text-text-primary">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Created
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold text-text-primary">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Actions
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredAutomations().map((automation, index) => (
                            <TableRow 
                              key={automation.id}
                              className={cn(
                                "hover:bg-background/50 transition-colors duration-200",
                                index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                              )}
                            >
                              <TableCell className="font-medium text-text-primary">
                                {automation.user.email}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                                  {automation.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="secondary" 
                                  className={cn(
                                    automation.is_active 
                                      ? "bg-green-500/20 text-green-600 border-green-500/30"
                                      : "bg-red-500/20 text-red-600 border-red-500/30"
                                  )}
                                >
                                  {automation.is_active ? (
                                    <>
                                      <Play className="h-3 w-3 mr-1" />
                                      Active
                                    </>
                                  ) : (
                                    <>
                                      <Pause className="h-3 w-3 mr-1" />
                                      Inactive
                                    </>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-text-secondary">
                                {new Date(automation.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(automation)}
                                    className="hover:bg-primary/10 hover:border-primary/30"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(automation.id)}
                                    className="hover:bg-red-500/10 hover:border-red-500/30 text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl backdrop-blur-xl bg-card/50 border-border/50 shadow-2xl profile-sidebar-glow">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-semibold">
                      {editingAutomation ? 'Edit Automation' : 'Add Automation'}
                    </DialogTitle>
                    <DialogDescription className="text-text-secondary">
                      {editingAutomation
                        ? 'Update automation settings and configuration'
                        : 'Create a new automation bot for trading'}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user_id" className="text-sm font-medium text-text-primary">
                      User ID
                    </Label>
                    <Input
                      id="user_id"
                      value={formData.user_id}
                      onChange={e =>
                        setFormData({ ...formData, user_id: e.target.value })
                      }
                      required
                      className="backdrop-blur-sm bg-background/50 border-border/50"
                      placeholder="Enter user ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium text-text-primary">
                      Automation Type
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={value =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger className="backdrop-blur-sm bg-background/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="margin_guard">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Margin Guard
                          </div>
                        </SelectItem>
                        <SelectItem value="tp_sl">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Take Profit / Stop Loss
                          </div>
                        </SelectItem>
                        <SelectItem value="auto_entry">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Auto Entry
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="config" className="text-sm font-medium text-text-primary">
                    Configuration (JSON)
                  </Label>
                  <Textarea
                    id="config"
                    value={formData.config}
                    onChange={e =>
                      setFormData({ ...formData, config: e.target.value })
                    }
                    rows={6}
                    required
                    className="backdrop-blur-sm bg-background/50 border-border/50 font-mono text-sm"
                    placeholder='{"threshold": 0.8, "action": "close_position"}'
                  />
                </div>
                
                <div className="flex items-center space-x-3 p-4 rounded-lg bg-background/20 backdrop-blur-sm">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={e =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                  />
                  <Label htmlFor="is_active" className="text-sm font-medium text-text-primary">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Active (Start automation immediately)
                    </div>
                  </Label>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="backdrop-blur-sm bg-background/50 border-border/50 hover:bg-background/80"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="backdrop-blur-sm bg-primary/90 hover:bg-primary text-white shadow-lg shadow-primary/25"
                  >
                    <Bot className="mr-2 h-4 w-4" />
                    {editingAutomation ? 'Update Automation' : 'Create Automation'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};
