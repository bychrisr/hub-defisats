import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Eye,
  EyeOff,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Key,
  Settings,
  Users,
  Activity,
  Building2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ExchangeService, Exchange, ExchangeCredentialType } from '@/services/exchange.service';

interface ExchangeFormData {
  name: string;
  slug: string;
  description: string;
  website: string;
  logo_url: string;
  api_version: string;
  is_active: boolean;
  credential_types: Array<{
    name: string;
    field_name: string;
    field_type: 'text' | 'password' | 'email' | 'url';
    is_required: boolean;
    description: string;
    order: number;
  }>;
}

export function ExchangesManagement() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExchange, setEditingExchange] = useState<Exchange | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExchangeFormData>({
    name: '',
    slug: '',
    description: '',
    website: '',
    logo_url: '',
    api_version: 'v1',
    is_active: true,
    credential_types: []
  });

  useEffect(() => {
    loadExchanges();
  }, []);

  const loadExchanges = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get token from localStorage
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/exchanges', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load exchanges');
      }

      const result = await response.json();
      setExchanges(result.data);
    } catch (error: any) {
      console.error('❌ EXCHANGES MANAGEMENT - Error loading exchanges:', error);
      setError(error.message || 'Failed to load exchanges');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Exchange name is required');
      return false;
    }
    if (!formData.slug.trim()) {
      toast.error('Exchange slug is required');
      return false;
    }
    if (formData.website && !formData.website.startsWith('http')) {
      toast.error('Website must be a valid URL starting with http:// or https://');
      return false;
    }
    if (formData.logo_url && !formData.logo_url.startsWith('http')) {
      toast.error('Logo URL must be a valid URL starting with http:// or https://');
      return false;
    }
    return true;
  };

  const handleCreateExchange = async () => {
    if (!validateForm()) return;
    
    try {
      setIsCreating(true);
      setError(null);
      console.log('🔄 EXCHANGES MANAGEMENT - Creating exchange:', formData.name);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/exchanges', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create exchange');
      }

      const result = await response.json();
      console.log('✅ EXCHANGES MANAGEMENT - Exchange created successfully:', result.data.name);
      
      toast.success(`Exchange "${result.data.name}" created successfully!`);
      setIsCreateDialogOpen(false);
      resetForm();
      await loadExchanges();
    } catch (error: any) {
      console.error('❌ EXCHANGES MANAGEMENT - Error creating exchange:', error);
      setError(error.message || 'Failed to create exchange');
      toast.error(error.message || 'Failed to create exchange');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditExchange = async () => {
    if (!editingExchange) return;
    if (!validateForm()) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      console.log('🔄 EXCHANGES MANAGEMENT - Updating exchange:', editingExchange.id);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/admin/exchanges/${editingExchange.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update exchange');
      }

      const result = await response.json();
      console.log('✅ EXCHANGES MANAGEMENT - Exchange updated successfully:', result.data.name);
      
      toast.success(`Exchange "${result.data.name}" updated successfully!`);
      setIsEditDialogOpen(false);
      setEditingExchange(null);
      resetForm();
      await loadExchanges();
    } catch (error: any) {
      console.error('❌ EXCHANGES MANAGEMENT - Error updating exchange:', error);
      setError(error.message || 'Failed to update exchange');
      toast.error(error.message || 'Failed to update exchange');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteExchange = async (exchangeId: string) => {
    try {
      setIsDeleting(exchangeId);
      setError(null);
      console.log('🗑️ EXCHANGES MANAGEMENT - Deleting exchange:', exchangeId);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/admin/exchanges/${exchangeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete exchange');
      }

      console.log('✅ EXCHANGES MANAGEMENT - Exchange deleted successfully');
      toast.success('Exchange deleted successfully!');
      
      await loadExchanges();
    } catch (error: any) {
      console.error('❌ EXCHANGES MANAGEMENT - Error deleting exchange:', error);
      setError(error.message || 'Failed to delete exchange');
      toast.error(error.message || 'Failed to delete exchange');
    } finally {
      setIsDeleting(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      website: '',
      logo_url: '',
      api_version: 'v1',
      is_active: true,
      credential_types: []
    });
  };

  const openEditDialog = (exchange: Exchange) => {
    setEditingExchange(exchange);
    setFormData({
      name: exchange.name,
      slug: exchange.slug,
      description: exchange.description,
      website: exchange.website,
      logo_url: exchange.logo_url,
      api_version: exchange.api_version,
      is_active: exchange.is_active,
      credential_types: exchange.credential_types.map(ct => ({
        name: ct.name,
        field_name: ct.field_name,
        field_type: ct.field_type,
        is_required: ct.is_required,
        description: ct.description,
        order: ct.order
      }))
    });
    setIsEditDialogOpen(true);
  };

  const addCredentialType = () => {
    setFormData(prev => ({
      ...prev,
      credential_types: [
        ...prev.credential_types,
        {
          name: '',
          field_name: '',
          field_type: 'text',
          is_required: true,
          description: '',
          order: prev.credential_types.length + 1
        }
      ]
    }));
  };

  const removeCredentialType = (index: number) => {
    setFormData(prev => ({
      ...prev,
      credential_types: prev.credential_types.filter((_, i) => i !== index)
    }));
  };

  const updateCredentialType = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      credential_types: prev.credential_types.map((ct, i) => 
        i === index ? { ...ct, [field]: value } : ct
      )
    }));
  };

  const handleToggleStatus = async (exchangeId: string) => {
    try {
      setIsToggling(exchangeId);
      setError(null);
      console.log('🔄 EXCHANGES MANAGEMENT - Toggling status for exchange:', exchangeId);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/admin/exchanges/${exchangeId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle exchange status');
      }

      const result = await response.json();
      console.log('✅ EXCHANGES MANAGEMENT - Exchange status toggled successfully');
      toast.success(result.message || 'Exchange status updated successfully!');
      
      await loadExchanges();
    } catch (error: any) {
      console.error('❌ EXCHANGES MANAGEMENT - Error toggling exchange status:', error);
      setError(error.message || 'Failed to toggle exchange status');
      toast.error(error.message || 'Failed to toggle exchange status');
    } finally {
      setIsToggling(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span className="text-muted-foreground">Loading exchanges...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Exchange Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage available exchanges and their credential requirements
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Exchange
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Exchange</DialogTitle>
              <DialogDescription>
                Configure a new exchange with its credential requirements
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Exchange Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Binance"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g., binance"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the exchange"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://binance.com"
                  />
                </div>
                <div>
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                    placeholder="https://binance.com/favicon.ico"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="api_version">API Version</Label>
                  <Input
                    id="api_version"
                    value={formData.api_version}
                    onChange={(e) => setFormData(prev => ({ ...prev, api_version: e.target.value }))}
                    placeholder="v3"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Credential Types</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCredentialType}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Credential Type
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {formData.credential_types.map((credType, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Credential Type {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCredentialType(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={credType.name}
                              onChange={(e) => updateCredentialType(index, 'name', e.target.value)}
                              placeholder="e.g., API Key"
                            />
                          </div>
                          <div>
                            <Label>Field Name</Label>
                            <Input
                              value={credType.field_name}
                              onChange={(e) => updateCredentialType(index, 'field_name', e.target.value)}
                              placeholder="e.g., api_key"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <Label>Field Type</Label>
                            <Select
                              value={credType.field_type}
                              onValueChange={(value) => updateCredentialType(index, 'field_type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="password">Password</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="url">URL</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={credType.is_required}
                              onChange={(e) => updateCredentialType(index, 'is_required', e.target.checked)}
                            />
                            <Label>Required</Label>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <Label>Description</Label>
                          <Input
                            value={credType.description}
                            onChange={(e) => updateCredentialType(index, 'description', e.target.value)}
                            placeholder="Description for this credential type"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button onClick={handleCreateExchange} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Exchange'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Exchange</DialogTitle>
            <DialogDescription>
              Update exchange configuration and credential requirements
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Exchange Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Binance"
                />
              </div>
              <div>
                <Label htmlFor="edit-slug">Slug</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="e.g., binance"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the exchange"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://binance.com"
                />
              </div>
              <div>
                <Label htmlFor="edit-logo_url">Logo URL</Label>
                <Input
                  id="edit-logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="https://binance.com/favicon.ico"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-api_version">API Version</Label>
                <Input
                  id="edit-api_version"
                  value={formData.api_version}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_version: e.target.value }))}
                  placeholder="v3"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <Label htmlFor="edit-is_active">Active</Label>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Credential Types</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCredentialType}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Credential Type
                </Button>
              </div>
              
              <div className="space-y-4">
                {formData.credential_types.map((credType, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Credential Type {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCredentialType(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={credType.name}
                            onChange={(e) => updateCredentialType(index, 'name', e.target.value)}
                            placeholder="e.g., API Key"
                          />
                        </div>
                        <div>
                          <Label>Field Name</Label>
                          <Input
                            value={credType.field_name}
                            onChange={(e) => updateCredentialType(index, 'field_name', e.target.value)}
                            placeholder="e.g., api_key"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label>Field Type</Label>
                          <Select
                            value={credType.field_type}
                            onValueChange={(value) => updateCredentialType(index, 'field_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="password">Password</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="url">URL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={credType.is_required}
                            onChange={(e) => updateCredentialType(index, 'is_required', e.target.checked)}
                          />
                          <Label>Required</Label>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Label>Description</Label>
                        <Input
                          value={credType.description}
                          onChange={(e) => updateCredentialType(index, 'description', e.target.value)}
                          placeholder="Description for this credential type"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleEditExchange} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Exchange'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Exchanges</p>
                <p className="text-2xl font-bold">{exchanges.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {exchanges.filter(e => e.is_active).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold text-red-600">
                  {exchanges.filter(e => !e.is_active).length}
                </p>
              </div>
              <EyeOff className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">
                  {exchanges.reduce((sum, e) => sum + (e._count?.user_accounts || 0), 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Exchanges Table */}
      <Card>
        <CardHeader>
          <CardTitle>Available Exchanges</CardTitle>
          <CardDescription>
            Manage exchanges and their credential requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exchange</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>API Version</TableHead>
                <TableHead>Credential Types</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exchanges.map((exchange) => (
                <TableRow key={exchange.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <Key className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">{exchange.name}</div>
                        <div className="text-sm text-muted-foreground">{exchange.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={exchange.is_active ? "default" : "secondary"}>
                      {exchange.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{exchange.api_version}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {exchange.credential_types.map((ct) => (
                        <Badge key={ct.id} variant="outline" className="text-xs">
                          {ct.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(exchange)}
                        title="Edit Exchange"
                        disabled={isUpdating || isDeleting === exchange.id || isToggling === exchange.id}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(exchange.id)}
                        title={exchange.is_active ? "Deactivate" : "Activate"}
                        disabled={isUpdating || isDeleting === exchange.id || isToggling === exchange.id}
                      >
                        {isToggling === exchange.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : exchange.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete Exchange"
                            disabled={isUpdating || isDeleting === exchange.id || isToggling === exchange.id}
                          >
                            {isDeleting === exchange.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Exchange</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{exchange.name}"? This action cannot be undone.
                              {exchange._count?.user_accounts > 0 && (
                                <span className="block mt-2 text-red-600 font-medium">
                                  ⚠️ This exchange has {exchange._count.user_accounts} user account(s) and cannot be deleted.
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteExchange(exchange.id)}
                              disabled={exchange._count?.user_accounts > 0}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Exchange
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExchangesManagement;
